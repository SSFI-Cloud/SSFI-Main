// Payment Routes
import express from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate as protect, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// ========================================
// Public Routes (No auth required)
// ========================================

// Get checkout configuration (key_id, payment types)
router.get('/checkout-config', paymentController.getCheckoutConfig);

// Razorpay webhook (must be public, verified via signature)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// ========================================
// Protected Routes (Auth required)
// ========================================

// Apply auth middleware for protected routes
router.use(protect);

// Create a new payment order
router.post('/create-order', paymentController.createOrder);

// Verify payment after completion
router.post('/verify', paymentController.verifyPayment);

// Handle payment failure
router.post('/failure', paymentController.handleFailure);

// Get payment status by order ID
router.get('/status/:orderId', paymentController.getPaymentStatus);

// Get user's payments
router.get('/', paymentController.getPayments);

// Get payment receipt / details
router.get('/:id/receipt', paymentController.getReceipt);

// ========================================
// Admin Routes
// ========================================

// Get all payments with filters (admin)
router.get('/admin', requireRole(UserRole.GLOBAL_ADMIN), paymentController.getPaymentsAdmin);

// Initiate refund (admin)
router.post('/refund', requireRole(UserRole.GLOBAL_ADMIN), paymentController.initiateRefund);

export default router;
