import { Router } from 'express';
import * as donationController from '../controllers/donation.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES (no auth required)
// ==========================================

// Create donation + Razorpay order
router.post('/donate', donationController.createDonation);

// Verify donation payment after Razorpay checkout
router.post('/donate/verify', donationController.verifyDonationPayment);

// ==========================================
// ADMIN ROUTES
// ==========================================

router.use(authenticate);

// List all donations (paginated)
router.get(
    '/admin/donations',
    requireRole('GLOBAL_ADMIN'),
    donationController.listDonations
);

// Get donation stats
router.get(
    '/admin/donations/stats',
    requireRole('GLOBAL_ADMIN'),
    donationController.getDonationStats
);

export default router;
