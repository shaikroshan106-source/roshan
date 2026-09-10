import express from 'express';
import { buyerController } from '../controllers/buyerController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// Current authenticated buyer profile and activities
router.get('/me', verifyAuth, requireRole('buyer', 'admin'), buyerController.getMe);
router.patch('/me', verifyAuth, requireRole('buyer', 'admin'), buyerController.updateMe);
router.get('/me/bids', verifyAuth, requireRole('buyer', 'admin'), buyerController.getMyBids);
router.get('/me/orders', verifyAuth, requireRole('buyer', 'admin'), buyerController.getMyOrders);

// Public / directory buyer listing & lookup
router.get('/', buyerController.getBuyers);
router.get('/:id', buyerController.getBuyerById);
router.patch('/:id', verifyAuth, buyerController.updateBuyerProfile);

export default router;
