import { firestoreService } from '../services/firestoreService.js';
import { storageService } from '../services/storageService.js';

export const listingController = {
  /**
   * Get all products / listings with comprehensive filtering
   */
  async getListings(req, res) {
    try {
      const { crop, location, grade, search, sortBy, farmerId } = req.query;

      // Read from products collection, fallback to listings
      let items = await firestoreService.getAll('products');
      if (!items || items.length === 0) {
        items = await firestoreService.getAll('listings');
      }

      // Filter out admin-removed produce
      items = items.filter(l => l.status !== 'removed_by_admin');

      // Filter by farmer ID
      if (farmerId) {
        items = items.filter(l => l.farmerId === farmerId || l.farmer === farmerId);
      }

      // Filter by crop
      if (crop && crop !== 'All') {
        items = items.filter(l => l.crop && l.crop.toLowerCase() === crop.toLowerCase());
      }

      // Filter by location
      if (location && location !== 'All') {
        items = items.filter(l => l.location && l.location.toLowerCase() === location.toLowerCase());
      }

      // Filter by grade
      if (grade && grade !== 'All') {
        items = items.filter(l => l.grade === grade);
      }

      // Full text search
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        items = items.filter(l =>
          (l.crop && l.crop.toLowerCase().includes(q)) ||
          (l.farmer && l.farmer.toLowerCase().includes(q)) ||
          (l.farmerName && l.farmerName.toLowerCase().includes(q)) ||
          (l.location && l.location.toLowerCase().includes(q)) ||
          (l.variety && l.variety.toLowerCase().includes(q))
        );
      }

      // Sorting
      if (sortBy === 'price-asc') {
        items.sort((a, b) => (Number(a.pricePerKg || a.basePrice) || 0) - (Number(b.pricePerKg || b.basePrice) || 0));
      } else if (sortBy === 'price-desc') {
        items.sort((a, b) => (Number(b.pricePerKg || b.basePrice) || 0) - (Number(a.pricePerKg || a.basePrice) || 0));
      } else if (sortBy === 'ai-score') {
        items.sort((a, b) => (Number(b.aiConfidence) || 0) - (Number(a.aiConfidence) || 0));
      } else {
        // newest first
        items.sort((a, b) => new Date(b.createdAt || b.postedDate || 0) - new Date(a.createdAt || a.postedDate || 0));
      }

      return res.json({ success: true, count: items.length, data: items });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get single product / listing by ID
   */
  async getListingById(req, res) {
    try {
      const { id } = req.params;
      let listing = await firestoreService.getById('products', id);
      if (!listing) {
        listing = await firestoreService.getById('listings', id);
      }

      if (!listing || listing.status === 'removed_by_admin') {
        return res.status(404).json({ success: false, message: 'Produce lot not found or removed by admin' });
      }

      // Also get associated bids
      const allBids = await firestoreService.getAll('bids');
      const bids = allBids
        .filter(b => (b.lotId === id || b.productId === id) && b.status !== 'removed_by_admin')
        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));

      return res.json({ success: true, data: { ...listing, bids } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Add new agricultural produce
   */
  async createListing(req, res) {
    try {
      const user = req.user;
      const {
        crop,
        variety,
        quantity,
        unit = 'kg',
        grade = 'A',
        expectedPrice,
        pricePerKg,
        basePrice,
        location,
        moisture = 12,
        description,
        imageBase64,
        aiInspection,
      } = req.body;

      const numQuantity = Number(quantity);
      const prc = Number(expectedPrice || pricePerKg || basePrice);

      if (!crop || !crop.trim()) {
        return res.status(400).json({ success: false, message: 'Crop or vegetable name is required.' });
      }
      if (!numQuantity || numQuantity <= 0) {
        return res.status(400).json({ success: false, message: 'Available quantity must be a positive number.' });
      }
      if (!prc || prc <= 0) {
        return res.status(400).json({ success: false, message: 'Expected price per kg must be a positive number.' });
      }

      let imageUrl = req.body.imageUrl || null;

      // Handle file upload from multer or base64
      if (req.file) {
        imageUrl = await storageService.uploadFile(req.file, 'produce-images');
      } else if (imageBase64) {
        imageUrl = await storageService.uploadBase64(imageBase64, 'produce-images');
      }

      const lotId = `LOT_${Date.now()}`;
      const farmLocation = location && location.trim() ? location.trim() : (user.location || 'Vizag');

      const newProduct = {
        id: lotId,
        crop: crop.trim(),
        variety: variety ? variety.trim() : `${crop.trim()} Farm Fresh`,
        quantity: numQuantity,
        unit,
        grade,
        quality: grade.startsWith('A') ? 'Premium Grade' : 'Standard Wholesale',
        moisture: Number(moisture) || 12,
        basePrice: prc,
        pricePerKg: prc,
        expectedPrice: prc,
        highestBid: prc,
        farmerId: user.uid || 'farmer_ravi',
        farmer: user.name || 'Farmer Ravi',
        farmerName: user.name || 'Farmer Ravi',
        farmerPhone: user.phone || '+91 98765 43210',
        location: farmLocation,
        aiConfidence: aiInspection?.confidence || Math.floor(92 + Math.random() * 6),
        status: 'open',
        acceptedBid: null,
        totalBidsCount: 0,
        imageUrl,
        description: description ? description.trim() : `${crop} produce lot listed directly by farmer for spot purchase and auction.`,
        aiInspection: aiInspection || {
          grade,
          confidence: 94,
          freshness: '96%',
          blemishFree: '98.0%',
          defectRate: '2.0%',
          inspectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          certificateId: `AGRI-AI-${Date.now().toString().slice(-6)}`,
        },
        postedDate: new Date().toISOString().split('T')[0],
        endTime: new Date(Date.now() + 86400000 * 4).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to both products and listings collections
      await firestoreService.set('products', lotId, newProduct);
      await firestoreService.set('listings', lotId, newProduct);

      // Increment farmer's totalLotsListed in Firestore
      const farmerRecord = await firestoreService.getById('farmers', user.uid);
      if (farmerRecord) {
        await firestoreService.update('farmers', user.uid, {
          totalLotsListed: (farmerRecord.totalLotsListed || 0) + 1,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: `Produce lot ${crop} (${numQuantity} ${unit} at ₹${prc}/kg) published successfully!`,
        data: newProduct,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Edit existing produce
   */
  async updateListing(req, res) {
    try {
      const { id } = req.params;
      let listing = await firestoreService.getById('products', id);
      if (!listing) {
        listing = await firestoreService.getById('listings', id);
      }

      if (!listing) {
        return res.status(404).json({ success: false, message: 'Produce lot not found' });
      }

      // Check ownership or admin
      const isOwner = req.user.role === 'admin' ||
        listing.farmerId === req.user.uid ||
        listing.farmer === req.user.name ||
        listing.farmerName === req.user.name;

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only edit your own produce listings.' });
      }

      const {
        crop,
        variety,
        quantity,
        unit,
        grade,
        expectedPrice,
        pricePerKg,
        basePrice,
        location,
        moisture,
        description,
        imageBase64,
        imageUrl,
      } = req.body;

      const updates = {
        updatedAt: new Date().toISOString(),
      };

      if (crop) updates.crop = crop.trim();
      if (variety) updates.variety = variety.trim();
      if (quantity !== undefined) {
        const q = Number(quantity);
        if (q <= 0) return res.status(400).json({ success: false, message: 'Quantity must be positive.' });
        updates.quantity = q;
      }
      if (unit) updates.unit = unit;
      if (grade) {
        updates.grade = grade;
        updates.quality = grade.startsWith('A') ? 'Premium Grade' : 'Standard Wholesale';
      }
      if (expectedPrice !== undefined || pricePerKg !== undefined || basePrice !== undefined) {
        const prc = Number(expectedPrice || pricePerKg || basePrice);
        if (prc <= 0) return res.status(400).json({ success: false, message: 'Price must be positive.' });
        updates.pricePerKg = prc;
        updates.basePrice = prc;
        updates.expectedPrice = prc;
      }
      if (location) updates.location = location.trim();
      if (moisture !== undefined) updates.moisture = Number(moisture);
      if (description) updates.description = description.trim();

      // Handle image upload
      if (req.file) {
        updates.imageUrl = await storageService.uploadFile(req.file, 'produce-images');
      } else if (imageBase64) {
        updates.imageUrl = await storageService.uploadBase64(imageBase64, 'produce-images');
      } else if (imageUrl) {
        updates.imageUrl = imageUrl;
      }

      const updatedProduct = await firestoreService.update('products', id, updates);
      await firestoreService.update('listings', id, updates).catch(() => {});

      return res.json({
        success: true,
        message: 'Produce lot updated successfully.',
        data: updatedProduct || { ...listing, ...updates },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Delete produce
   */
  async deleteListing(req, res) {
    try {
      const { id } = req.params;
      let listing = await firestoreService.getById('products', id);
      if (!listing) {
        listing = await firestoreService.getById('listings', id);
      }

      if (!listing) {
        return res.status(404).json({ success: false, message: 'Produce lot not found' });
      }

      const isOwner = req.user.role === 'admin' ||
        listing.farmerId === req.user.uid ||
        listing.farmer === req.user.name ||
        listing.farmerName === req.user.name;

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only delete your own produce listings.' });
      }

      await firestoreService.delete('products', id);
      await firestoreService.delete('listings', id).catch(() => {});

      return res.json({
        success: true,
        message: `Produce lot ${listing.crop || id} deleted successfully.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
