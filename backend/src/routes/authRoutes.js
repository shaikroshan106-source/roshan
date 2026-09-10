import express from 'express';
import { authController } from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public Authentication endpoints
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/demo-login', authLimiter, authController.demoLogin);

// Authenticated session & profile endpoints
router.get('/session', verifyAuth, authController.verifySession);
router.post('/verify-session', verifyAuth, authController.verifySession);
router.get('/profile', verifyAuth, authController.getProfile);
router.patch('/profile', verifyAuth, authController.updateProfile);

export default router;
