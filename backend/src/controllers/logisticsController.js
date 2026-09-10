import { aiService } from '../services/aiService.js';

export const logisticsController = {
  getRoutes(req, res) {
    try {
      const { pickup = 'Vizag', drop = 'Guntur' } = req.query;
      const routes = aiService.recommendRoute(pickup, drop);
      const waypoints = [
        { name: 'Vizag (Pickup Mandi)', lat: 17.6868, lng: 83.2185, type: 'pickup' },
        { name: 'Anakapalle Highway Toll', lat: 17.6911, lng: 82.9978, type: 'via' },
        { name: 'Rajahmundry Delta Bridge', lat: 17.0005, lng: 81.8040, type: 'via' },
        { name: 'Guntur (Destination Cold Storage)', lat: 16.3067, lng: 80.4365, type: 'drop' },
      ];

      return res.json({
        success: true,
        data: {
          routes,
          waypoints,
          liveTruck: {
            lat: 17.35,
            lng: 82.9,
            status: 'In Transit',
            speed: '58 km/h',
            eta: '1h 10m',
            driverName: 'K. Venkatesh',
            truckNumber: 'AP 31 TJ 9204',
          },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
