import express from 'express';
import { marketPriceController } from '../controllers/marketPriceController.js';

const router = express.Router();

router.get('/', marketPriceController.getMarketPrices);
router.get('/:id', marketPriceController.getMarketPriceById);

export default router;
