import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { initialize, status } from '../controllers/kyc.controller';

const router = Router();

// Stricter rate limiter for KYC endpoints (prevents abuse and controls API costs)
const kycLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 attempts per 15 min per IP
  message: {
    success: false,
    message: 'Too many KYC verification attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Status polling can be more frequent
const statusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 30,                     // 30 polls per minute
  message: {
    success: false,
    message: 'Too many status checks. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/kyc/digilocker/initialize
router.post('/digilocker/initialize', kycLimiter, initialize);

// GET /api/v1/kyc/digilocker/status/:clientId
router.get('/digilocker/status/:clientId', statusLimiter, status);

export default router;
