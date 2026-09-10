import { firestoreService } from '../services/firestoreService.js';

export const buyerController = {
  /**
   * Get all registered buyers (with optional filters)
   */
  async getBuyers(req, res) {
    try {
      const { crop, businessType } = req.query;
      let buyers = await firestoreService.getAll('buyers');

      if (crop) {
        buyers = buyers.filter(b => Array.isArray(b.preferredCrops) && b.preferredCrops.some(c => c.toLowerCase() === crop.toLowerCase()));
      }
      if (businessType) {
        buyers = buyers.filter(b => b.businessType && b.businessType.toLowerCase() === businessType.toLowerCase());
      }

      return res.json({ success: true, count: buyers.length, data: buyers });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get current authenticated buyer's profile + aggregated metrics
   */
  async getMe(req, res) {
    try {
      const user = req.user;
      const buyerId = user.uid;

      // 1. Fetch from 'buyers' collection
      let buyer = await firestoreService.getById('buyers', buyerId);

      // Fallback: check demo_buyer_1 if not found directly
      if (!buyer) {
        const allBuyers = await firestoreService.getAll('buyers');
        buyer = allBuyers.find(b => b.buyerId === buyerId || b.id === buyerId) || {
          buyerId,
          companyName: user.name || 'Verified Buyer Agribusiness',
          businessType: 'Wholesaler',
          gstin: '37AAAAA0000A1Z5',
          verifiedBuyer: true,
          preferredCrops: ['Tomato', 'Chilli', 'Rice', 'Cotton'],
          maxBudget: 1500000,
          deliveryWarehouses: [{ hubName: `${user.location || 'Vijayawada'} Central Hub`, district: user.location || 'Krishna' }],
          totalPurchases: 0,
          totalSpent: 0,
          buyerRating: 5.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await firestoreService.set('buyers', buyerId, buyer).catch(() => {});
      }

      // 2. Fetch from 'users' collection
      let userDoc = await firestoreService.getById('users', buyerId);
      if (!userDoc) {
        userDoc = {
          uid: buyerId,
          name: user.name || buyer.companyName || 'Verified Buyer',
          email: user.email || 'buyer@agridirect.in',
          role: 'buyer',
          location: user.location || 'Vijayawada',
          phone: user.phone || '+91 98765 00000',
        };
      }

      // 3. Compute live buyer metrics from 'bids' and 'orders' collections
      const allBids = await firestoreService.getAll('bids');
      const myBids = allBids.filter(b =>
        (b.buyerId === buyerId || b.buyerName === user.name || b.buyer === user.name) &&
        b.status !== 'removed_by_admin'
      );

      const activeBids = myBids.filter(b => b.status === 'highest' || b.status === 'outbid');
      const acceptedBids = myBids.filter(b => b.status === 'accepted');

      const allOrders = await firestoreService.getAll('orders');
      const myOrders = allOrders.filter(o =>
        o.buyerId === buyerId || o.buyerName === user.name || o.buyer === user.name
      );
      const totalSpent = myOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      return res.json({
        success: true,
        data: {
          ...buyer,
          user: userDoc,
          stats: {
            totalBidsSubmitted: myBids.length,
            activeBidsCount: activeBids.length,
            acceptedBidsCount: acceptedBids.length,
            totalPurchases: myOrders.length,
            totalSpent: buyer.totalSpent || totalSpent,
          },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update current authenticated buyer's profile
   */
  async updateMe(req, res) {
    try {
      const user = req.user;
      const buyerId = user.uid;
      const {
        name,
        phone,
        location,
        companyName,
        businessType,
        gstin,
        preferredCrops,
        maxBudget,
        deliveryWarehouses,
        bio,
      } = req.body;

      // Update `users` collection for basic credentials
      const userUpdates = {};
      if (name) userUpdates.name = name.trim();
      if (phone) userUpdates.phone = phone.trim();
      if (location) userUpdates.location = location.trim();
      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updatedAt = new Date().toISOString();
        await firestoreService.update('users', buyerId, userUpdates).catch(() => {});
      }

      // Update `buyers` collection for business data
      const buyerUpdates = {
        updatedAt: new Date().toISOString(),
      };
      if (companyName) buyerUpdates.companyName = companyName.trim();
      if (businessType) buyerUpdates.businessType = businessType.trim();
      if (gstin !== undefined) buyerUpdates.gstin = gstin.trim();
      if (maxBudget !== undefined) buyerUpdates.maxBudget = Number(maxBudget);
      if (preferredCrops) {
        buyerUpdates.preferredCrops = Array.isArray(preferredCrops)
          ? preferredCrops
          : preferredCrops.split(',').map(c => c.trim()).filter(Boolean);
      }
      if (deliveryWarehouses) buyerUpdates.deliveryWarehouses = deliveryWarehouses;
      if (bio !== undefined) buyerUpdates.bio = bio;

      let updatedBuyer = await firestoreService.update('buyers', buyerId, buyerUpdates);
      if (!updatedBuyer) {
        const initialBuyer = {
          buyerId,
          companyName: companyName || name || 'AgriDirect Buyer',
          businessType: businessType || 'Wholesaler',
          gstin: gstin || '',
          verifiedBuyer: true,
          preferredCrops: Array.isArray(preferredCrops) ? preferredCrops : ['Tomato', 'Chilli'],
          maxBudget: Number(maxBudget) || 1000000,
          deliveryWarehouses: deliveryWarehouses || [{ hubName: `${location || 'Central'} Hub`, district: location || 'AP' }],
          totalPurchases: 0,
          totalSpent: 0,
          buyerRating: 5.0,
          createdAt: new Date().toISOString(),
          ...buyerUpdates,
        };
        await firestoreService.set('buyers', buyerId, initialBuyer);
        updatedBuyer = initialBuyer;
      }

      const refreshedUser = await firestoreService.getById('users', buyerId);

      return res.json({
        success: true,
        message: 'Buyer profile updated successfully.',
        data: {
          ...updatedBuyer,
          user: refreshedUser,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get all bids submitted by the current authenticated buyer
   */
  async getMyBids(req, res) {
    try {
      const user = req.user;
      const { status } = req.query;
      const allBids = await firestoreService.getAll('bids');
      const allLots = await firestoreService.getAll('products');

      let myBids = allBids.filter(b =>
        (b.buyerId === user.uid || b.buyerName === user.name || b.buyer === user.name) &&
        b.status !== 'removed_by_admin'
      );

      if (status) {
        myBids = myBids.filter(b => b.status === status);
      }

      // Enrich with lot information
      const enrichedBids = myBids.map(b => {
        const targetLot = allLots.find(l => l.id === b.lotId || l.id === b.productId) || {};
        return {
          ...b,
          lotCrop: targetLot.crop || b.crop || 'Agricultural Produce',
          lotQuantity: targetLot.quantity || b.quantity || 100,
          lotUnit: targetLot.unit || 'kg',
          lotFarmer: targetLot.farmer || targetLot.farmerName || 'Farmer',
          lotFarmerId: targetLot.farmerId || '',
          lotLocation: targetLot.location || 'Andhra Pradesh',
          lotStatus: targetLot.status || 'active',
          lotHighestBid: targetLot.highestBid || targetLot.pricePerKg || b.amount,
          isWinning: b.status === 'accepted',
          isLeading: b.status === 'highest' && targetLot.status !== 'accepted',
        };
      });

      enrichedBids.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({
        success: true,
        count: enrichedBids.length,
        data: enrichedBids,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get all purchase orders for the current authenticated buyer
   */
  async getMyOrders(req, res) {
    try {
      const user = req.user;
      const allOrders = await firestoreService.getAll('orders');
      const myOrders = allOrders.filter(o =>
        o.buyerId === user.uid || o.buyerName === user.name || o.buyer === user.name
      );

      myOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({
        success: true,
        count: myOrders.length,
        data: myOrders,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get specific buyer by ID
   */
  async getBuyerById(req, res) {
    try {
      const { id } = req.params;
      const buyer = await firestoreService.getById('buyers', id);
      if (!buyer) {
        return res.status(404).json({ success: false, message: 'Buyer profile not found.' });
      }

      const user = await firestoreService.getById('users', id);
      const allBids = await firestoreService.getAll('bids');
      const buyerBids = allBids.filter(b => b.buyerId === id && b.status !== 'removed_by_admin');

      return res.json({
        success: true,
        data: {
          ...buyer,
          userProfile: user,
          recentBids: buyerBids,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update specific buyer profile by ID (admin or self)
   */
  async updateBuyerProfile(req, res) {
    try {
      const { id } = req.params;
      if (req.user.role !== 'admin' && req.user.uid !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this profile.' });
      }

      const updated = await firestoreService.update('buyers', id, req.body);
      return res.json({ success: true, message: 'Buyer profile updated.', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
