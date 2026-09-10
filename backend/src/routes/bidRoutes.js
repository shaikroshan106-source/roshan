import express from 'express';
import { bidController } from '../controllers/bidController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', bidController.getAllBids);
router.get('/lot/:lotId', bidController.getBidsForLot);

// Buyer only: place bid
router.post(
  '/',
  verifyAuth,
  requireRole('buyer', 'admin'),
  bidController.placeBid
);

// Farmer only: accept bid
router.post(
  '/accept',
  verifyAuth,
  requireRole('farmer', 'admin'),
  bidController.acceptBid
);

// Farmer only: reject bid
router.post(
  '/reject',
  verifyAuth,
  requireRole('farmer', 'admin'),
  bidController.rejectBid
);

// Buyer: Edit/revise an existing active bid
router.patch(
  '/:id',
  verifyAuth,
  requireRole('buyer', 'admin'),
  bidController.editBid
);

// Buyer: Cancel an active bid
router.delete(
  '/:id',
  verifyAuth,
  requireRole('buyer', 'admin'),
  bidController.cancelBid
);

router.post(
  '/:id/cancel',
  verifyAuth,
  requireRole('buyer', 'admin'),
  bidController.cancelBid
);

export default router;
