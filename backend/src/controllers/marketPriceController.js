import { firestoreService } from '../services/firestoreService.js';

export const marketPriceController = {
  async getMarketPrices(req, res) {
    try {
      const { crop, mandi, date } = req.query;
      let prices = await firestoreService.getAll('market_prices');

      if (crop) prices = prices.filter(p => p.crop.toLowerCase() === crop.toLowerCase());
      if (mandi) prices = prices.filter(p => p.mandi.toLowerCase() === mandi.toLowerCase());
      if (date) prices = prices.filter(p => p.date === date);

      return res.json({ success: true, count: prices.length, data: prices });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMarketPriceById(req, res) {
    try {
      const { id } = req.params;
      const price = await firestoreService.getById('market_prices', id);
      if (!price) {
        return res.status(404).json({ success: false, message: 'Market price record not found.' });
      }
      return res.json({ success: true, data: price });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
