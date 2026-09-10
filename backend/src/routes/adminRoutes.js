import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// Strict Admin-only Authorization Guard
router.use(verifyAuth, requireRole('admin'));

// 1. View all farmers
router.get('/farmers', adminController.getAllFarmers);

// 2. View all buyers
router.get('/buyers', adminController.getAllBuyers);

// 3. View all products
router.get('/products', adminController.getAllProducts);
router.delete('/products/:id', adminController.deleteProduct);

// 4. View all bids
router.get('/bids', adminController.getAllBids);
router.get('/bids/activity', adminController.getBiddingActivity);
router.delete('/bids/:bidId', adminController.removeFraudulentBid);

// 5. View all orders
router.get('/orders', adminController.getAllOrders);

// 6, 7, 8. View reports / complaints (all, farmer separate, buyer separate)
router.get('/complaints', adminController.getComplaints);
router.get('/reports', adminController.getComplaints);
router.get('/reports/farmer', adminController.getFarmerReports);
router.get('/reports/buyer', adminController.getBuyerReports);

// 9, 10. Suspend and unsuspend reported users
router.post('/users/:uid/suspend', adminController.suspendUser);
router.post('/users/:uid/unsuspend', adminController.unsuspendUser);
router.patch('/users/:uid/status', adminController.updateUserStatus);
router.get('/users', adminController.getUsers);

// 11. Delete inappropriate products
router.delete('/listings/:lotId', adminController.removeFraudulentListing);

// 12. Bidding activity monitor
router.get('/activity', adminController.getBiddingActivity);

// 13. Platform overview & statistics
router.get('/statistics', adminController.getPlatformStatistics);
router.get('/overview', adminController.getPlatformStatistics);

// 14. Send notifications
router.post('/notifications', adminController.sendNotification);

export default router;
