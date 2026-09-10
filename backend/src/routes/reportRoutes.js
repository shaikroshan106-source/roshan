import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Require authentication for accessing agricultural reports and filings
router.use(verifyAuth);

router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.post('/', reportController.createReport);

export default router;
