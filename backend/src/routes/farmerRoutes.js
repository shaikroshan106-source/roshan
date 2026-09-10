import express from 'express';
import { farmerController } from '../controllers/farmerController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// Authenticated Farmer endpoints
router.get('/me', verifyAuth, requireRole('farmer', 'admin'), farmerController.getMe);
router.patch('/me', verifyAuth, requireRole('farmer', 'admin'), farmerController.updateMe);
router.get('/me/products', verifyAuth, requireRole('farmer', 'admin'), farmerController.getMyProducts);
router.get('/me/bids', verifyAuth, requireRole('farmer', 'admin'), farmerController.getMyBids);

// Public / ID endpoints
router.get('/', farmerController.getFarmers);
router.get('/:id', farmerController.getFarmerById);
router.patch('/:id', verifyAuth, farmerController.updateFarmerProfile);

export default router;
