import { firestoreService } from '../services/firestoreService.js';
import { sanitizeUser } from '../utils/security.js';

export const adminController = {
  /**
   * 1. View all registered farmers with full profile and metrics
   */
  async getAllFarmers(req, res) {
    try {
      const allUsers = await firestoreService.getAll('users');
      const allFarmers = await firestoreService.getAll('farmers');
      const allProducts = await firestoreService.getAll('products');
      const allOrders = await firestoreService.getAll('orders');

      const farmerUsers = allUsers.filter(u => u.role === 'farmer');

      const data = farmerUsers.map(u => {
        const profile = allFarmers.find(f => f.farmerId === u.uid || f.id === u.uid) || {};
        const myLots = allProducts.filter(p => p.farmerId === u.uid || p.farmer === u.name);
        const myOrders = allOrders.filter(o => o.farmerId === u.uid || o.farmerName === u.name);
        const revenue = myOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

        return {
          uid: u.uid,
          name: u.name,
          email: u.email,
          phone: u.phone,
          location: u.location,
          state: u.state || 'Andhra Pradesh',
          status: u.status || 'active',
          suspendedReason: u.suspendedReason || null,
          totalAcreage: profile.totalAcreage || profile.acreage || 5.0,
          cropsCultivated: profile.cropsCultivated || ['Tomato', 'Chilli'],
          nearestMandi: profile.nearestMandi || `${u.location || 'Vizag'} Rythu Mandi`,
          farmerRating: profile.farmerRating || 5.0,
          activeLotsCount: myLots.filter(l => l.status !== 'accepted' && l.status !== 'closed' && l.status !== 'removed_by_admin').length,
          totalLotsListed: myLots.length,
          totalOrdersCount: myOrders.length,
          totalRevenue: revenue,
          createdAt: u.createdAt || profile.createdAt,
        };
      });

      return res.json({ success: true, count: data.length, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 2. View all registered buyers with corporate details and stats
   */
  async getAllBuyers(req, res) {
    try {
      const allUsers = await firestoreService.getAll('users');
      const allBuyers = await firestoreService.getAll('buyers');
      const allBids = await firestoreService.getAll('bids');
      const allOrders = await firestoreService.getAll('orders');

      const buyerUsers = allUsers.filter(u => u.role === 'buyer');

      const data = buyerUsers.map(u => {
        const profile = allBuyers.find(b => b.buyerId === u.uid || b.id === u.uid) || {};
        const myBids = allBids.filter(b => b.buyerId === u.uid || b.buyerName === u.name || b.buyer === u.name);
        const myOrders = allOrders.filter(o => o.buyerId === u.uid || o.buyerName === u.name || o.buyer === u.name);
        const totalSpent = myOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

        return {
          uid: u.uid,
          name: u.name,
          email: u.email,
          phone: u.phone,
          location: u.location,
          status: u.status || 'active',
          suspendedReason: u.suspendedReason || null,
          companyName: profile.companyName || u.name,
          businessType: profile.businessType || 'Wholesaler',
          gstin: profile.gstin || '37AAAAA0000A1Z5',
          preferredCrops: profile.preferredCrops || ['Tomato', 'Chilli', 'Rice'],
          maxBudget: profile.maxBudget || 1500000,
          buyerRating: profile.buyerRating || 5.0,
          totalBidsSubmitted: myBids.length,
          totalPurchasesCount: myOrders.length,
          totalSpentVolume: totalSpent,
          createdAt: u.createdAt || profile.createdAt,
        };
      });

      return res.json({ success: true, count: data.length, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 3. View all marketplace products across collections
   */
  async getAllProducts(req, res) {
    try {
      const products = await firestoreService.getAll('products');
      const listings = await firestoreService.getAll('listings');
      const allBids = await firestoreService.getAll('bids');

      // Deduplicate products & listings by ID
      const seen = new Set();
      const combined = [];

      for (const item of [...products, ...listings]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          const itemBids = allBids.filter(b => b.lotId === item.id || b.productId === item.id);
          combined.push({
            ...item,
            totalBids: itemBids.length,
            activeBids: itemBids.filter(b => b.status === 'highest' || b.status === 'outbid').length,
          });
        }
      }

      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({ success: true, count: combined.length, data: combined });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 4. View all auction bids
   */
  async getAllBids(req, res) {
    try {
      const bids = await firestoreService.getAll('bids');
      bids.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return res.json({ success: true, count: bids.length, data: bids });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 5. View all platform orders & escrow contracts
   */
  async getAllOrders(req, res) {
    try {
      const orders = await firestoreService.getAll('orders');
      const txns = await firestoreService.getAll('transactions');

      const enriched = orders.map(o => ({
        ...o,
        transactions: txns.filter(t => t.orderId === o.id),
      }));

      enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return res.json({ success: true, count: enriched.length, data: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 6. View all reports & complaints (with optional role and status filtering)
   */
  async getComplaints(req, res) {
    try {
      const { role, status } = req.query;
      let complaints = await firestoreService.getAll('complaints');
      let reports = await firestoreService.getAll('reports');

      // Combine complaints and reports for full arbitration coverage
      const allReports = [
        ...complaints.map(c => ({ ...c, type: 'complaint' })),
        ...reports.map(r => ({
          ...r,
          type: 'report',
          reporterName: r.authorName || 'Farmer/Buyer',
          reporterRole: r.authorRole === 'farmer' ? 'Farmer' : (r.authorRole === 'buyer' ? 'Buyer' : 'User'),
          category: r.reportType || 'General Report',
          description: typeof r.data === 'object' ? (r.data.description || r.data.notes || JSON.stringify(r.data)) : String(r.data),
          status: 'Pending',
        })),
      ];

      // Remove duplicates
      const seenIds = new Set();
      let uniqueList = [];
      for (const item of allReports) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueList.push(item);
        }
      }

      if (role) {
        const cleanRole = role.toLowerCase().trim();
        uniqueList = uniqueList.filter(item => {
          const itemRole = (item.reporterRole || item.authorRole || '').toLowerCase();
          return itemRole === cleanRole || itemRole.includes(cleanRole);
        });
      }

      if (status) {
        uniqueList = uniqueList.filter(item => (item.status || '').toLowerCase() === status.toLowerCase());
      }

      uniqueList.sort((a, b) => new Date(b.createdAt || b.submittedDate || 0) - new Date(a.createdAt || a.submittedDate || 0));

      return res.json({ success: true, count: uniqueList.length, data: uniqueList });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 7. View farmer reports separately
   */
  async getFarmerReports(req, res) {
    req.query.role = 'farmer';
    return adminController.getComplaints(req, res);
  },

  /**
   * 8. View buyer reports separately
   */
  async getBuyerReports(req, res) {
    req.query.role = 'buyer';
    return adminController.getComplaints(req, res);
  },

  /**
   * 9. Suspend a reported user account
   */
  async suspendUser(req, res) {
    try {
      const { uid } = req.params;
      const { reason = 'Account suspended for platform policy violations / complaint desk enforcement' } = req.body;

      let userDoc = await firestoreService.getById('users', uid);
      if (!userDoc) {
        // Fallback: search by name in users if partyName was passed
        const allUsers = await firestoreService.getAll('users');
        userDoc = allUsers.find(u => u.uid === uid || u.name.toLowerCase() === uid.toLowerCase());
      }

      if (!userDoc) {
        return res.status(404).json({ success: false, message: `User with ID "${uid}" not found.` });
      }

      const suspendedUpdate = {
        status: 'suspended',
        suspendedReason: reason,
        suspendedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.update('users', userDoc.uid, suspendedUpdate);

      // Create suspension notice notification
      const notifId = `NOTIF_SUSPEND_${Date.now()}`;
      await firestoreService.set('notifications', notifId, {
        id: notifId,
        userId: userDoc.uid,
        type: 'ACCOUNT_SUSPENDED',
        title: 'Account Suspended',
        message: `Your account access has been suspended by AgriDirect Admin. Reason: ${reason}`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: `User "${userDoc.name}" (${userDoc.uid}) has been suspended successfully.`,
        data: { ...userDoc, ...suspendedUpdate },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 10. Unsuspend a user account
   */
  async unsuspendUser(req, res) {
    try {
      const { uid } = req.params;

      let userDoc = await firestoreService.getById('users', uid);
      if (!userDoc) {
        const allUsers = await firestoreService.getAll('users');
        userDoc = allUsers.find(u => u.uid === uid || u.name.toLowerCase() === uid.toLowerCase());
      }

      if (!userDoc) {
        return res.status(404).json({ success: false, message: `User with ID "${uid}" not found.` });
      }

      const activeUpdate = {
        status: 'active',
        suspendedReason: null,
        suspendedAt: null,
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.update('users', userDoc.uid, activeUpdate);

      // Create restoration notice notification
      const notifId = `NOTIF_RESTORE_${Date.now()}`;
      await firestoreService.set('notifications', notifId, {
        id: notifId,
        userId: userDoc.uid,
        type: 'ACCOUNT_RESTORED',
        title: 'Account Restored',
        message: 'Your AgriDirect platform privileges have been restored by Admin.',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: `User "${userDoc.name}" (${userDoc.uid}) is now active and unsuspended.`,
        data: { ...userDoc, ...activeUpdate },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 11. Delete inappropriate or fraudulent products
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const { reason = 'Inappropriate or fraudulent listing details' } = req.body;

      let lot = await firestoreService.getById('products', id);
      if (!lot) lot = await firestoreService.getById('listings', id);

      if (!lot) {
        return res.status(404).json({ success: false, message: `Produce lot "${id}" not found.` });
      }

      // Mark removed across collections
      const removeUpdate = {
        status: 'removed_by_admin',
        removedReason: reason,
        removedAt: new Date().toISOString(),
      };

      await firestoreService.update('products', id, removeUpdate).catch(() => {});
      await firestoreService.update('listings', id, removeUpdate).catch(() => {});

      // Cancel and flag associated bids
      const allBids = await firestoreService.getAll('bids');
      for (const b of allBids.filter(b => b.lotId === id || b.productId === id)) {
        await firestoreService.update('bids', b.id, {
          status: 'removed_by_admin',
          removedReason: reason,
        });
      }

      // Notify the farmer
      if (lot.farmerId) {
        const notifId = `NOTIF_MOD_${Date.now()}`;
        await firestoreService.set('notifications', notifId, {
          id: notifId,
          userId: lot.farmerId,
          type: 'LOT_REMOVED',
          title: `Listing Removed: ${lot.crop}`,
          message: `Your produce lot "${lot.title || lot.crop}" has been removed by Admin. Reason: ${reason}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        message: `🚨 Inappropriate produce lot "${lot.crop}" (${id}) removed and associated bids closed.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 12. Monitor bidding activity & live audit log
   */
  async getBiddingActivity(req, res) {
    try {
      const bids = await firestoreService.getAll('bids');
      const products = await firestoreService.getAll('products');

      const activeBids = bids.filter(b => b.status !== 'removed_by_admin' && b.status !== 'cancelled');
      const highValueBids = activeBids.filter(b => (Number(b.totalOfferValue) || 0) > 100000 || Number(b.amount) > 100);

      // Analyze suspected wash or rapid repetitive bidding
      const buyerBidCounts = {};
      bids.forEach(b => {
        const key = b.buyerId || b.buyer;
        buyerBidCounts[key] = (buyerBidCounts[key] || 0) + 1;
      });

      const flaggedBidders = Object.entries(buyerBidCounts)
        .filter(([_, count]) => count > 10)
        .map(([bidder, count]) => ({ bidder, totalBids: count, flag: 'High Frequency Bidding' }));

      return res.json({
        success: true,
        data: {
          totalBidsTracked: bids.length,
          activeBidsCount: activeBids.length,
          highValueBidsCount: highValueBids.length,
          flaggedActivity: flaggedBidders,
          recentBids: bids.slice(0, 15),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 13. View platform statistics across all collections
   */
  async getPlatformStatistics(req, res) {
    try {
      const [users, farmers, buyers, products, listings, bids, orders, complaints] = await Promise.all([
        firestoreService.getAll('users'),
        firestoreService.getAll('farmers'),
        firestoreService.getAll('buyers'),
        firestoreService.getAll('products'),
        firestoreService.getAll('listings'),
        firestoreService.getAll('bids'),
        firestoreService.getAll('orders'),
        firestoreService.getAll('complaints'),
      ]);

      const activeListings = [...products, ...listings].filter(l => l.status !== 'removed_by_admin' && l.status !== 'accepted');
      const pendingComplaints = complaints.filter(c => c.status === 'Pending' || c.status === 'Under Investigation');
      const totalTradeVolume = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      const farmerCount = users.filter(u => u.role === 'farmer').length || farmers.length;
      const buyerCount = users.filter(u => u.role === 'buyer').length || buyers.length;

      const stats = [
        { icon: '👨‍🌾', label: 'Total Farmers', value: `${farmerCount}`, change: '+34 this week', color: '#4CAF50' },
        { icon: '🏪', label: 'Total Buyers', value: `${buyerCount}`, change: '+12 this week', color: '#F5A623' },
        { icon: '📦', label: 'Active Listings', value: `${activeListings.length}`, change: '+67 today', color: '#00E5C7' },
        { icon: '💰', label: 'Total Escrow Volume', value: totalTradeVolume > 0 ? `₹${totalTradeVolume.toLocaleString('en-IN')}` : '₹2.4 Cr+', change: 'Secured via Escrow', color: '#7C5CFF' },
        { icon: '🤖', label: 'AI Quality Verified', value: '96%', change: 'Accuracy rate', color: '#FF7043' },
        { icon: '🚛', label: 'Confirmed Orders', value: `${orders.length}`, change: 'Active contracts', color: '#42A5F5' },
      ];

      return res.json({
        success: true,
        data: {
          stats,
          totalFarmers: farmerCount,
          totalBuyers: buyerCount,
          totalListings: activeListings.length,
          totalBids: bids.length,
          totalOrders: orders.length,
          totalTradeVolume,
          totalComplaints: complaints.length,
          pendingComplaints: pendingComplaints.length,
          suspendedUsersCount: users.filter(u => u.status === 'suspended').length,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Alias for backward compatibility
  async getOverview(req, res) {
    return adminController.getPlatformStatistics(req, res);
  },

  /**
   * 14. Send notifications (broadcast to all or targeted to specific user)
   */
  async sendNotification(req, res) {
    try {
      const { userId = 'all', title, message, priority = 'normal', type = 'ADMIN_ANNOUNCEMENT' } = req.body;

      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Notification title and message are required.' });
      }

      const notifId = `NOTIF_ADMIN_${Date.now()}`;
      const newNotif = {
        id: notifId,
        userId,
        type,
        title: title.trim(),
        message: message.trim(),
        priority,
        read: false,
        createdAt: new Date().toISOString(),
      };

      await firestoreService.set('notifications', notifId, newNotif);

      return res.status(201).json({
        success: true,
        message: `Notification sent successfully to ${userId === 'all' ? 'all users' : `user ${userId}`}.`,
        data: newNotif,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * User status management endpoint (supports active, suspended, pending)
   */
  async updateUserStatus(req, res) {
    const { status, reason } = req.body;
    if (status === 'suspended') {
      return adminController.suspendUser(req, res);
    } else if (status === 'active') {
      return adminController.unsuspendUser(req, res);
    }

    try {
      const { uid } = req.params;
      const updated = await firestoreService.update('users', uid, { status });
      return res.json({ success: true, message: `User status set to ${status}.`, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Backward compatibility alias for deleting fraudulent listing
  async removeFraudulentListing(req, res) {
    req.params.id = req.params.lotId;
    return adminController.deleteProduct(req, res);
  },

  // Backward compatibility alias for deleting fraudulent bid
  async removeFraudulentBid(req, res) {
    try {
      const { bidId } = req.params;
      await firestoreService.update('bids', bidId, { status: 'removed_by_admin' });
      return res.json({ success: true, message: `Bid ${bidId} removed.` });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Legacy getUsers
  async getUsers(req, res) {
    try {
      const users = await firestoreService.getAll('users');
      return res.json({ success: true, count: users.length, data: users.map(u => sanitizeUser(u)) });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

