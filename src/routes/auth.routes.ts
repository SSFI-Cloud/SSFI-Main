import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth.validator';

const router = Router();

/**
 * Public Routes
 */

// Register new user
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);

// Verify phone OTP
router.post(
  '/verify-otp',
  validateRequest(verifyOTPSchema),
  authController.verifyOTP
);

// Resend OTP
router.post(
  '/resend-otp',
  validateRequest(resendOTPSchema),
  authController.resendOTP
);

// Login
router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login
);

// Refresh access token
router.post(
  '/refresh',
  authController.refreshToken
);

// Forgot password
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

/**
 * Protected Routes (Require Authentication)
 */

// Get current user
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

// Logout
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// Change password
router.post(
  '/change-password',
  authenticate,
  validateRequest(changePasswordSchema),
  authController.changePassword
);

// Update profile
router.put(
  '/profile',
  authenticate,
  authController.updateProfile
);

export default router;
