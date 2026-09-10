import express from 'express';
import { complaintController } from '../controllers/complaintController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Get complaints (Admin sees all; users see their filed reports)
router.get('/', verifyAuth, complaintController.getComplaints);
router.get('/suspended-users', verifyAuth, complaintController.getSuspendedUsers);

// Submit complaint (Farmer or Buyer) with optional photographic evidence
router.post(
  '/',
  verifyAuth,
  uploadLimiter,
  upload.single('evidence'),
  complaintController.submitComplaint
);

// Admin only: update status or suspend counterparty
router.patch(
  '/:id/status',
  verifyAuth,
  requireRole('admin'),
  complaintController.updateStatus
);

router.post(
  '/:id/suspend-counterparty',
  verifyAuth,
  requireRole('admin'),
  complaintController.toggleSuspendCounterparty
);

export default router;
