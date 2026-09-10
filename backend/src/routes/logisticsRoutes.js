import express from 'express';
import { logisticsController } from '../controllers/logisticsController.js';

const router = express.Router();

router.get('/routes', logisticsController.getRoutes);

export default router;
