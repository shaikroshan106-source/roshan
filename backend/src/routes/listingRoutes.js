import express from 'express';
import { listingController } from '../controllers/listingController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public / Authenticated Browse
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);

// Farmer only: publish produce lot with optional image upload
router.post(
  '/',
  verifyAuth,
  requireRole('farmer', 'admin'),
  upload.single('image'),
  listingController.createListing
);

// Farmer or Admin: update or delete lot
router.patch('/:id', verifyAuth, listingController.updateListing);
router.delete('/:id', verifyAuth, listingController.deleteListing);

export default router;
