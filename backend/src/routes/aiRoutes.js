import express from 'express';
import { aiController } from '../controllers/aiController.js';

const router = express.Router();

// 1. Agricultural produce price prediction
router.post('/predict-price', aiController.predictPrice);

// 2. Market price insights & arbitrage
router.get('/market-insights', aiController.getMarketInsights);

// 3. Product & crop recommendation
router.post('/recommend-crops', aiController.recommendCrops);

// 4. Multilingual chatbot & voice assistant
router.post('/chat', aiController.chatAI);

// 5. Suspicious listing detection
router.post('/detect-suspicious-listing', aiController.detectSuspiciousListing);

// 6. Bid / price recommendations
router.post('/recommend-bid', aiController.recommendBid);

// 7. Demand prediction
router.get('/forecast-demand', aiController.forecastDemand);

// Supporting optimization routes
router.post('/match-buyers', aiController.matchBuyers);
router.post('/optimize-profit', aiController.optimizeProfit);
router.post('/optimize-route', aiController.recommendRoute);

export default router;
