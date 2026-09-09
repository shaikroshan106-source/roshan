/**
 * mockAI.js — FarmDirect AI Mock Intelligence Layer
 *
 * All functions here simulate real AI/ML API responses.
 * REPLACE each function body with a real fetch() call to your backend.
 * Example: POST /api/ai/predict-price  |  POST /api/ai/match-buyers  etc.
 */

// ─── Historical price data (₹/kg) ─────────────────────────────────────────
const historicalPrices = {
  Tomato: [18, 20, 22, 19, 24, 26, 23, 28, 30, 27, 32, 29],
  Rice:   [28, 27, 29, 30, 28, 31, 33, 32, 34, 31, 35, 36],
  Chilli: [45, 48, 50, 52, 49, 55, 58, 54, 60, 62, 58, 65],
  Cotton: [55, 57, 60, 58, 62, 65, 63, 68, 70, 67, 72, 75],
};

const marketDemand = {
  Hyderabad: 1.2, Vizag: 1.1, Guntur: 1.3,
  Vijayawada: 1.0, Tirupati: 0.9,
  Vizianagaram: 0.8, Rajahmundry: 1.05,
};

// ─── Mock Buyers Database ──────────────────────────────────────────────────
export const mockBuyers = [
  { id:'B001', name:'Srinivas Agro Exports',   location:'Guntur',      verified:true,  rating:4.8, preferredCrops:['Chilli','Cotton'], maxBudget:100000, distance:120 },
  { id:'B002', name:'Krishna Fresh Foods',      location:'Vijayawada',  verified:true,  rating:4.5, preferredCrops:['Tomato','Rice'],   maxBudget:75000,  distance:85  },
  { id:'B003', name:'Andhra Traders Pvt Ltd',   location:'Vizag',       verified:true,  rating:4.7, preferredCrops:['Rice','Cotton'],   maxBudget:150000, distance:200 },
  { id:'B004', name:'Coastal Agri Hub',         location:'Rajahmundry', verified:false, rating:4.1, preferredCrops:['Tomato','Chilli'], maxBudget:50000,  distance:60  },
  { id:'B005', name:'Deccan Wholesale Market',  location:'Hyderabad',   verified:true,  rating:4.9, preferredCrops:['Cotton','Chilli'], maxBudget:200000, distance:350 },
];

// ─── Mock Crop Listings ────────────────────────────────────────────────────
export const mockListings = [
  {
    id: 'L001', crop: 'Tomato', quantity: 500, unit: 'kg', grade: 'A', pricePerKg: 28,
    location: 'Vizag', farmer: 'Ravi Kumar', aiConfidence: 94, postedDate: '2026-09-01',
    quality: 'Premium', moisture: 12,
    imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80',
    aiInspection: { grade: 'A', confidence: 94, freshness: '96%', blemishFree: '98.2%', defectRate: '1.8%', inspectedAt: '10:15 AM', certificateId: 'AGRI-AI-829101' }
  },
  {
    id: 'L002', crop: 'Rice', quantity: 2000, unit: 'kg', grade: 'B+', pricePerKg: 32,
    location: 'Guntur', farmer: 'Lakshmi Devi', aiConfidence: 89, postedDate: '2026-09-02',
    quality: 'Good', moisture: 14,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8c7?auto=format&fit=crop&w=600&q=80',
    aiInspection: { grade: 'B+', confidence: 89, freshness: '91%', blemishFree: '96.5%', defectRate: '3.5%', inspectedAt: '11:40 AM', certificateId: 'AGRI-AI-829102' }
  },
  {
    id: 'L003', crop: 'Chilli', quantity: 800, unit: 'kg', grade: 'A+', pricePerKg: 62,
    location: 'Vizianagaram', farmer: 'Suresh Babu', aiConfidence: 97, postedDate: '2026-09-03',
    quality: 'Export Premium', moisture: 10,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
    aiInspection: { grade: 'A+', confidence: 97, freshness: '98%', blemishFree: '99.4%', defectRate: '0.6%', inspectedAt: '09:20 AM', certificateId: 'AGRI-AI-829103' }
  },
  {
    id: 'L004', crop: 'Cotton', quantity: 1500, unit: 'kg', grade: 'A', pricePerKg: 70,
    location: 'Rajahmundry', farmer: 'Pavan Reddy', aiConfidence: 91, postedDate: '2026-08-30',
    quality: 'Good', moisture: 8,
    imageUrl: 'https://images.unsplash.com/photo-1605000797498-6f2145b1d820?auto=format&fit=crop&w=600&q=80',
    aiInspection: { grade: 'A', confidence: 91, freshness: '94%', blemishFree: '97.8%', defectRate: '2.2%', inspectedAt: '02:15 PM', certificateId: 'AGRI-AI-829104' }
  },
  {
    id: 'L005', crop: 'Tomato', quantity: 300, unit: 'kg', grade: 'B', pricePerKg: 22,
    location: 'Tirupati', farmer: 'Anand Varma', aiConfidence: 85, postedDate: '2026-09-03',
    quality: 'Standard', moisture: 15,
    imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80',
    aiInspection: { grade: 'B', confidence: 85, freshness: '88%', blemishFree: '94.0%', defectRate: '6.0%', inspectedAt: '04:30 PM', certificateId: 'AGRI-AI-829105' }
  },
  {
    id: 'L006', crop: 'Rice', quantity: 5000, unit: 'kg', grade: 'A', pricePerKg: 35,
    location: 'Vijayawada', farmer: 'Meena Kumari', aiConfidence: 93, postedDate: '2026-09-01',
    quality: 'Premium', moisture: 13,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8c7?auto=format&fit=crop&w=600&q=80',
    aiInspection: { grade: 'A', confidence: 93, freshness: '95%', blemishFree: '98.0%', defectRate: '2.0%', inspectedAt: '08:50 AM', certificateId: 'AGRI-AI-829106' }
  },
];

// ─── Mock Bids ─────────────────────────────────────────────────────────────
export const mockBids = [
  { id:'BID001', lotId:'L001', buyer:'Krishna Fresh Foods', amount:27.5, timestamp:'10:32 AM', status:'active' },
  { id:'BID002', lotId:'L001', buyer:'Coastal Agri Hub',    amount:26.0, timestamp:'10:45 AM', status:'active' },
  { id:'BID003', lotId:'L001', buyer:'Andhra Traders',       amount:28.0, timestamp:'11:02 AM', status:'highest' },
];

// ─── AI: Price Prediction ──────────────────────────────────────────────────
/**
 * Predicts market price for a crop in a given location.
 * REPLACE with: POST /api/ai/predict-price
 * @param {string} crop
 * @param {string} location
 * @returns {{ predictedPrice, trend, confidence, weeklyForecast, recommendation }}
 */
export function predictPrice(crop, location) {
  const base   = historicalPrices[crop] || historicalPrices.Tomato;
  const mult   = marketDemand[location] || 1.0;
  const last   = base[base.length - 1];
  const avg    = base.reduce((s, v) => s + v, 0) / base.length;
  const trend  = last > avg ? 'rising' : last < avg ? 'falling' : 'stable';
  const noise  = (Math.random() - 0.5) * 2;
  const predictedPrice = +(last * mult + noise).toFixed(2);
  const confidence     = +(82 + Math.random() * 14).toFixed(0);
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  return {
    predictedPrice,
    trend,
    confidence,
    currentPrice: last,
    weeklyForecast: days.map((day, i) => ({
      day,
      price: +(base[base.length - 7 + i] * mult + (Math.random()-0.5)).toFixed(2),
    })),
    recommendation: trend === 'rising'
      ? `WAIT & SELL — price may rise ₹${(predictedPrice*0.08).toFixed(0)}–₹${(predictedPrice*0.12).toFixed(0)}/kg in 3–5 days`
      : `SELL NOW — current price is near peak; active buyers are ready`,
  };
}

// ─── AI: Buyer Matching ────────────────────────────────────────────────────
/**
 * Returns sorted buyer matches for a given lot.
 * REPLACE with: POST /api/ai/match-buyers
 */
export function matchBuyers(lot) {
  return mockBuyers.map(buyer => {
    let score = 0;
    if (buyer.preferredCrops.includes(lot.crop)) score += 35;
    if (buyer.maxBudget >= lot.pricePerKg * lot.quantity) score += 25;
    if (buyer.distance < 150) score += 20; else if (buyer.distance < 250) score += 10;
    if (buyer.verified) score += 10;
    score += (buyer.rating / 5) * 10;
    const matchScore = Math.min(98, Math.max(40, score + (Math.random()*10 - 5)));
    return {
      ...buyer,
      matchScore: +matchScore.toFixed(0),
      reasons: [
        buyer.preferredCrops.includes(lot.crop) ? '✓ Preferred crop match' : '○ Crop not preferred',
        buyer.verified ? '✓ Verified buyer' : '○ Verification pending',
        buyer.distance < 150 ? '✓ Nearby location' : '○ Moderate distance',
        buyer.maxBudget >= lot.pricePerKg * lot.quantity ? '✓ Budget sufficient' : '○ Budget may vary',
        `✓ Rating: ${buyer.rating}/5`,
      ],
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// ─── AI: Demand Forecast ───────────────────────────────────────────────────
/**
 * Returns 12-month demand curve data for Chart.js.
 * REPLACE with: GET /api/ai/forecast-demand?crop=&region=
 */
export function forecastDemand(crop, region) {
  const base  = historicalPrices[crop] || historicalPrices.Tomato;
  const mult  = marketDemand[region]   || 1.0;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return {
    labels:     months,
    demand:     base.map(v => +(v * mult * 1000 + Math.random()*500).toFixed(0)),
    supply:     base.map(v => +(v * 900       + Math.random()*400).toFixed(0)),
    priceIndex: base.map(v => +(v * mult).toFixed(2)),
  };
}

// ─── AI: Profit Optimization ───────────────────────────────────────────────
/**
 * Recommends best action to maximize farmer profit.
 * REPLACE with: POST /api/ai/optimize-profit
 */
export function optimizeProfit(lot, buyers) {
  const topBuyer         = buyers[0];
  const currentRevenue   = lot.pricePerKg * lot.quantity;
  const optimizedPrice   = +(lot.pricePerKg * 1.08).toFixed(2);
  const optimizedRevenue = +(optimizedPrice * lot.quantity).toFixed(0);
  const gain             = optimizedRevenue - currentRevenue;
  return {
    currentRevenue,
    optimizedRevenue,
    estimatedGain:  gain,
    gainPercent:    +((gain / currentRevenue) * 100).toFixed(1),
    recommendedAction: gain > 0
      ? `List at ₹${optimizedPrice}/kg — ${topBuyer?.name} is likely to bid higher`
      : 'Accept current market price — demand is stable',
    confidence: +(78 + Math.random()*18).toFixed(0),
  };
}

// ─── AI: Route Optimization ────────────────────────────────────────────────
/**
 * Returns 3 route options between pickup and drop.
 * REPLACE with: POST /api/ai/optimize-route
 */
export function recommendRoute(pickup = 'Vizag', drop = 'Guntur') {
  return [
    { id:1, name:'NH-16 Express',       distance:120, duration:'2h 30m', cost:1800, via:['Bheemunipatnam','Anakapalle'],    recommended:true,  aiReason:'Fastest route with lowest toll; high buyer-demand corridor' },
    { id:2, name:'State Highway Route', distance:145, duration:'3h 15m', cost:1500, via:['Sabbavaram','Narsipatnam'],        recommended:false, aiReason:'Lower cost but 45 min longer; suitable for non-perishables' },
    { id:3, name:'Coastal Road',        distance:130, duration:'2h 50m', cost:2000, via:['Rushikonda','Tuni'],               recommended:false, aiReason:'Good road condition but higher fuel cost' },
  ];
}

// ─── AI: Chat Assistant ────────────────────────────────────────────────────
/**
 * Rule-based chat response with Telugu/English support.
 * REPLACE with: POST /api/ai/chat (Gemini / GPT endpoint)
 */
export function chatAI(message) {
  const msg = message.toLowerCase();
  if (msg.includes('price') || msg.includes('ధర') || msg.includes('rate'))
    return `📊 నేటి ధరలు (Today's Prices):\n• Tomato: ₹28–32/kg ↑ Rising\n• Rice: ₹31–35/kg → Stable\n• Chilli: ₹58–65/kg ↑ Rising\n• Cotton: ₹68–75/kg → Stable\n\nWant a detailed forecast for a specific crop?`;
  if (msg.includes('buyer') || msg.includes('కొనుగోలు'))
    return `🤝 Top buyer match for your lot:\n\nSrinivas Agro Exports (Guntur) — 94% match ✓\n• Budget: ₹1,00,000\n• Distance: 120 km\n• Rating: 4.8★\n• Verified buyer\n\nShall I connect you?`;
  if (msg.includes('transport') || msg.includes('logistics') || msg.includes('రవాణా'))
    return `🚛 Best transport option:\nVizag → Guntur via NH-16\n• Distance: 120 km\n• Time: 2h 30m\n• Cost: ₹1,800\n\nAI saves you ₹300–500 vs standard route.`;
  if (msg.includes('sell') || msg.includes('when') || msg.includes('ఎప్పుడు'))
    return `⏰ FarmAI Recommendation:\n\n🌶️ Chilli → WAIT 3–5 days (festival demand surge expected, +₹5–8/kg)\n🍅 Tomato → SELL NOW (heavy supply arrives next week)`;
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('నమస్కారం') || msg.includes('help'))
    return `🌾 నమస్కారం! I'm FarmAI.\n\nI can help you with:\n💰 Price predictions\n🤝 Buyer matching\n🚛 Transport & logistics\n📊 Demand forecasts\n\nTry asking: "What's the tomato price?" or "Find me a buyer"`;
  if (msg.includes('profit') || msg.includes('income') || msg.includes('లాభం'))
    return `💹 Estimated profit for your lots:\n\n• Tomato 500kg @ ₹30/kg = ₹15,000\n• After transport ₹1,800 = Net ₹13,200\n\nAI optimized price (+8%) could earn you ₹1,200 more!`;
  return `🌾 I didn't quite get that. Try:\n• "price" — today's rates\n• "buyer" — find buyers\n• "transport" — logistics cost\n• "when to sell" — timing advice\n• "profit" — earnings estimate`;
}
