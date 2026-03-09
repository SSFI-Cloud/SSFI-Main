import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { generateOtp, verifyOtp } from '../controllers/kyc.controller';

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

router.use(kycLimiter);

// POST /api/v1/kyc/aadhaar/generate-otp
router.post('/aadhaar/generate-otp', generateOtp);

// POST /api/v1/kyc/aadhaar/verify-otp
router.post('/aadhaar/verify-otp', verifyOtp);

export default router;
