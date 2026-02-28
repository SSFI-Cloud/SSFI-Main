import { Router } from 'express';
import eventRegistrationController from '../controllers/eventRegistration.controller';
import { authenticate as protect } from '../middleware/auth.middleware';

const router = Router();

// Public Routes
router.post('/lookup', eventRegistrationController.lookupStudent);
router.get('/races', eventRegistrationController.getAvailableRaces);
router.post('/register', eventRegistrationController.createRegistration);

// Admin / Organizer Routes
router.use(protect); // Apply protection to all subsequent routes

router.get('/:eventId/registrations', eventRegistrationController.getRegistrations);
router.get('/:eventId/registrations/export', eventRegistrationController.exportRegistrations);
router.get('/:eventId/my-registration', eventRegistrationController.getMyRegistration); // New endpoint
router.post('/manual-register', eventRegistrationController.createManualRegistration);

export default router;
