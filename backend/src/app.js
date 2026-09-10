import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { env } from './config/env.js';
import { isFirebaseConnected } from './config/firebase.js';
import { apiLimiter, aiLimiter } from './middleware/rateLimiter.js';
import { sanitizeInputs } from './middleware/sanitize.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import buyerRoutes from './routes/buyerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import marketPriceRoutes from './routes/marketPriceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import logisticsRoutes from './routes/logisticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Safely permit image asset loading by client
  contentSecurityPolicy: false, // Managed at client/CDN level
}));

// Normalize origin strings (stripping subpaths if user configured full GitHub Pages URL)
function normalizeOrigin(urlStr) {
  if (!urlStr) return '';
  try {
    return new URL(urlStr).origin;
  } catch {
    return urlStr.replace(/\/+$/, '');
  }
}

const additionalOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',').map(o => normalizeOrigin(o.trim())).filter(Boolean)
  : [];

const allowedOriginsSet = new Set([
  normalizeOrigin(env.CLIENT_URL),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  ...additionalOrigins,
].filter(Boolean));

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (curl, server-to-server, mobile app)
    if (!origin) return callback(null, true);

    // Allow local development origins
    if (env.NODE_ENV === 'development') return callback(null, true);

    // Allow explicitly whitelisted origins
    if (allowedOriginsSet.has(origin)) return callback(null, true);

    // Automatically allow GitHub Pages origins (*.github.io)
    if (/^https:\/\/[a-zA-Z0-9-]+\.github\.io$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy: Request from origin ${origin} not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Global defensive input sanitization
app.use(sanitizeInputs);

// Static files for local image uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Root index endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'AGRIDIRECT API Server',
    version: '2.0',
    documentation: '/api/health',
    frontend: env.CLIENT_URL,
    timestamp: new Date().toISOString(),
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AGRIDIRECT API Server',
    environment: env.NODE_ENV,
    firebaseConnected: isFirebaseConnected,
    storageBucket: env.FIREBASE.STORAGE_BUCKET,
    collections: [
      'users',
      'farmers',
      'buyers',
      'products',
      'bids',
      'orders',
      'reports',
      'complaints',
      'notifications',
      'market_prices',
      'transactions',
    ],
  });
});

// Rate limiting for general API requests
app.use('/api/', apiLimiter);

// Mount all 11 collection API routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/listings', listingRoutes); // Alias for products for frontend compatibility
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/logistics', logisticsRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
