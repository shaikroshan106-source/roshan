import { aiService } from '../services/aiService.js';
import { firestoreService } from '../services/firestoreService.js';

export const aiController = {
  // 1. Price prediction
  predictPrice(req, res) {
    try {
      const { crop = 'Tomato', location = 'Vizag', lookaheadDays = 7 } = req.body;
      const result = aiService.predictPrice(crop, location, Number(lookaheadDays) || 7);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 2. Market price insights & arbitrage
  getMarketInsights(req, res) {
    try {
      const { crop = 'Tomato', currentLocation = 'Vizag' } = req.query;
      const insights = aiService.getMarketInsights(crop, currentLocation);
      return res.json({ success: true, data: insights });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 3. Product & crop recommendations
  recommendCrops(req, res) {
    try {
      const { location = 'Guntur', month, farmSizeAcres = 5 } = req.body;
      const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
      const recommendations = aiService.recommendCrops(location, currentMonth, Number(farmSizeAcres) || 5);
      return res.json({ success: true, data: recommendations });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4. Multilingual Farmer/Buyer AI Chatbot & Voice Assistant
  async chatAI(req, res) {
    try {
      const { message = '', lang = 'en', role = 'farmer', context = {} } = req.body;
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ success: false, message: 'Message text is required.' });
      }
      const response = await aiService.chatAI(message, lang, role, context);
      return res.json({ success: true, ...response });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 5. Suspicious listing detection
  detectSuspiciousListing(req, res) {
    try {
      const lotData = req.body;
      const analysis = aiService.detectSuspiciousListing(lotData);
      return res.json({ success: true, data: analysis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Bid/Price recommendations for buyers & farmers
  async recommendBid(req, res) {
    try {
      const { lotId, lot, currentBids = [] } = req.body;
      let targetLot = lot;
      if (!targetLot && lotId) {
        targetLot = await firestoreService.getById('listings', lotId);
      }
      if (!targetLot) {
        targetLot = { crop: 'Tomato', pricePerKg: 30, quantity: 500 };
      }

      const recommendation = aiService.recommendBid(targetLot, currentBids);
      return res.json({ success: true, data: recommendation });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 7. Basic demand prediction & supply forecasting
  forecastDemand(req, res) {
    try {
      const { crop = 'Tomato', region = 'Guntur' } = req.query;
      const forecast = aiService.forecastDemand(crop, region);
      return res.json({ success: true, data: forecast });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Supporting Buyer Match & Profit Optimization
  async matchBuyers(req, res) {
    try {
      const { lot, lotId } = req.body;
      let targetLot = lot;
      if (!targetLot && lotId) {
        targetLot = await firestoreService.getById('listings', lotId);
      }
      if (!targetLot) {
        targetLot = { crop: 'Tomato', pricePerKg: 28, quantity: 500 };
      }

      const users = await firestoreService.getAll('users');
      const buyersInDb = users.filter(u => u.role === 'buyer');
      const matches = aiService.matchBuyers(targetLot, buyersInDb);
      return res.json({ success: true, count: matches.length, data: matches });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async optimizeProfit(req, res) {
    try {
      const { lot, lotId } = req.body;
      let targetLot = lot;
      if (!targetLot && lotId) {
        targetLot = await firestoreService.getById('listings', lotId);
      }
      if (!targetLot) {
        targetLot = { crop: 'Tomato', pricePerKg: 28, quantity: 500 };
      }
      const buyers = aiService.matchBuyers(targetLot);
      const result = aiService.optimizeProfit(targetLot, buyers);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  recommendRoute(req, res) {
    try {
      const { pickup = 'Vizag', drop = 'Guntur' } = req.body;
      const routes = aiService.recommendRoute(pickup, drop);
      return res.json({ success: true, data: routes });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
