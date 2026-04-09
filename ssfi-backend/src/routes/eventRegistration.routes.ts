import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import eventRegistrationController from '../controllers/eventRegistration.controller';
import { authenticate as protect } from '../middleware/auth.middleware';

const router = Router();

// Rate limiter for public registration endpoints (prevent abuse)
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window per IP
  message: 'Too many registration requests from this IP, please try again later.',
});

// Public Routes (with rate limiting)
router.get('/races', eventRegistrationController.getAvailableRaces);
router.get('/event-categories/:eventId', eventRegistrationController.getEventCategories);
router.post('/register', registrationLimiter, eventRegistrationController.createRegistration);

// Lookup requires authentication (exposes student data)
router.post('/lookup', protect, eventRegistrationController.lookupStudent);

// Admin / Organizer Routes
router.use(protect); // Apply protection to all subsequent routes

router.get('/:eventId/registrations', eventRegistrationController.getRegistrations);
router.get('/:eventId/registrations/export', eventRegistrationController.exportRegistrations);
router.get('/:eventId/my-registration', eventRegistrationController.getMyRegistration); // New endpoint
router.post('/manual-register', eventRegistrationController.createManualRegistration);
router.patch('/:registrationId/payment-status', eventRegistrationController.updatePaymentStatus);

export default router;
