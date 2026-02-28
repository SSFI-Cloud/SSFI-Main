import express from 'express';
import * as eventController from '../controllers/event.controller';
import { authenticate as protect, requireRole as restrictTo, optionalAuth } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();


// Public routes (must come first or be ordered correctly)
router.get('/', optionalAuth, eventController.getEvents);
router.post('/', protect, eventController.createEvent);

// Specific paths before parameterized paths
router.get('/my-events', protect, eventController.getMyEvents);
router.get('/upcoming', optionalAuth, eventController.getUpcomingEvents); // Added specific route
router.get('/:id', eventController.getEvent);
router.put('/:id', protect, eventController.updateEvent); // Added update route

// Protected routes
router.put('/:id/status', protect, restrictTo(UserRole.GLOBAL_ADMIN), eventController.updateEventStatus);

export default router;
