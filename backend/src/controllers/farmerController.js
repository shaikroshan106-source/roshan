import { firestoreService } from '../services/firestoreService.js';

export const farmerController = {
  /**
   * Get current authenticated farmer's complete profile
   */
  async getMe(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const farmerId = user.uid;
      let farmer = await firestoreService.getById('farmers', farmerId);
      const userDoc = await firestoreService.getById('users', farmerId) || user;

      // If farmer record not yet initialized, create default record
      if (!farmer) {
        farmer = {
          farmerId,
          farmAddress: { village: userDoc.location || 'Vizag', district: userDoc.location || 'Vizag', state: 'Andhra Pradesh' },
          nearestMandi: `${userDoc.location || 'Vizag'} Rythu Mandi`,
          totalAcreage: 5.0,
          cropsCultivated: ['Tomato', 'Chilli'],
          totalLotsListed: 0,
          totalVolumeSold: 0,
          totalRevenue: 0,
          farmerRating: 5.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await firestoreService.set('farmers', farmerId, farmer);
      }

      // Fetch active lots
      const allProducts = await firestoreService.getAll('products');
      const myProducts = allProducts.filter(p =>
        (p.farmerId === farmerId || p.farmer === user.name) && p.status !== 'removed_by_admin'
      );

      // Fetch bids received
      const allBids = await firestoreService.getAll('bids');
      const myLotIds = myProducts.map(p => p.id);
      const myBids = allBids.filter(b => myLotIds.includes(b.lotId) && b.status !== 'removed_by_admin');

      // Fetch orders
      const allOrders = await firestoreService.getAll('orders');
      const myOrders = allOrders.filter(o => o.farmerId === farmerId);

      return res.json({
        success: true,
        data: {
          ...farmer,
          user: userDoc,
          stats: {
            activeLotsCount: myProducts.length,
            totalBidsReceived: myBids.length,
            totalOrders: myOrders.length,
            totalRevenue: farmer.totalRevenue || (myOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)),
          },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update current authenticated farmer's profile
   */
  async updateMe(req, res) {
    try {
      const user = req.user;
      const farmerId = user.uid;
      const {
        name,
        phone,
        location,
        totalAcreage,
        acreage,
        cropsCultivated,
        nearestMandi,
        farmAddress,
        bio,
      } = req.body;

      const finalAcreage = totalAcreage !== undefined ? totalAcreage : acreage;

      // Update `users` collection for common fields
      const userUpdates = {};
      if (name) userUpdates.name = name.trim();
      if (phone) userUpdates.phone = phone.trim();
      if (location) userUpdates.location = location.trim();
      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updatedAt = new Date().toISOString();
        await firestoreService.update('users', farmerId, userUpdates).catch(() => {});
      }

      // Update `farmers` collection
      const farmerUpdates = {
        updatedAt: new Date().toISOString(),
      };
      if (finalAcreage !== undefined) {
        farmerUpdates.totalAcreage = Number(finalAcreage);
        farmerUpdates.acreage = Number(finalAcreage);
      }
      if (cropsCultivated) {
        farmerUpdates.cropsCultivated = Array.isArray(cropsCultivated)
          ? cropsCultivated
          : cropsCultivated.split(',').map(c => c.trim()).filter(Boolean);
      }
      if (nearestMandi) farmerUpdates.nearestMandi = nearestMandi.trim();
      if (farmAddress) farmerUpdates.farmAddress = farmAddress;
      if (bio !== undefined) farmerUpdates.bio = bio;

      let updatedFarmer = await firestoreService.update('farmers', farmerId, farmerUpdates);
      if (!updatedFarmer) {
        // Create if didn't exist
        const initial = {
          farmerId,
          totalAcreage: Number(totalAcreage) || 5.0,
          cropsCultivated: Array.isArray(cropsCultivated) ? cropsCultivated : ['Tomato', 'Chilli'],
          nearestMandi: nearestMandi || `${location || 'Vizag'} Mandi`,
          createdAt: new Date().toISOString(),
          ...farmerUpdates,
        };
        await firestoreService.set('farmers', farmerId, initial);
        updatedFarmer = initial;
      }

      const updatedUser = await firestoreService.getById('users', farmerId);

      return res.json({
        success: true,
        message: 'Farmer profile updated successfully.',
        data: {
          ...updatedFarmer,
          user: updatedUser,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get products/lots belonging strictly to the authenticated farmer
   */
  async getMyProducts(req, res) {
    try {
      const user = req.user;
      const allProducts = await firestoreService.getAll('products');
      const myProducts = allProducts
        .filter(p => (p.farmerId === user.uid || p.farmer === user.name) && p.status !== 'removed_by_admin')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({
        success: true,
        count: myProducts.length,
        data: myProducts,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get bids received on all produce lots owned by this farmer
   */
  async getMyBids(req, res) {
    try {
      const user = req.user;
      const allProducts = await firestoreService.getAll('products');
      const myLotIds = allProducts
        .filter(p => (p.farmerId === user.uid || p.farmer === user.name) && p.status !== 'removed_by_admin')
        .map(p => p.id);

      const allBids = await firestoreService.getAll('bids');
      const myBids = allBids
        .filter(b => myLotIds.includes(b.lotId) && b.status !== 'removed_by_admin')
        .map(b => {
          const lot = allProducts.find(p => p.id === b.lotId);
          return {
            ...b,
            lotDetails: lot ? { crop: lot.crop, quantity: lot.quantity, grade: lot.grade, location: lot.location } : null,
          };
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({
        success: true,
        count: myBids.length,
        data: myBids,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Public: List farmers with filters
   */
  async getFarmers(req, res) {
    try {
      const { crop, mandi } = req.query;
      let farmers = await firestoreService.getAll('farmers');

      if (crop) {
        farmers = farmers.filter(f => Array.isArray(f.cropsCultivated) && f.cropsCultivated.some(c => c.toLowerCase() === crop.toLowerCase()));
      }
      if (mandi) {
        farmers = farmers.filter(f => f.nearestMandi && f.nearestMandi.toLowerCase().includes(mandi.toLowerCase()));
      }

      return res.json({ success: true, count: farmers.length, data: farmers });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Public: Get farmer profile by ID
   */
  async getFarmerById(req, res) {
    try {
      const { id } = req.params;
      const farmer = await firestoreService.getById('farmers', id);
      const user = await firestoreService.getById('users', id);

      if (!farmer && !user) {
        return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
      }

      const allProducts = await firestoreService.getAll('products');
      const activeProducts = allProducts.filter(p =>
        (p.farmerId === id || (user && p.farmer === user.name)) && p.status !== 'removed_by_admin'
      );

      return res.json({
        success: true,
        data: {
          ...(farmer || {}),
          userProfile: user,
          activeProducts,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update farmer by ID (admin or self)
   */
  async updateFarmerProfile(req, res) {
    try {
      const { id } = req.params;
      if (req.user.role !== 'admin' && req.user.uid !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this profile.' });
      }

      const updated = await firestoreService.update('farmers', id, req.body);
      return res.json({ success: true, message: 'Farmer profile updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
