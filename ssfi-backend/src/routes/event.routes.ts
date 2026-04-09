import express from 'express';
import * as eventController from '../controllers/event.controller';
import { authenticate as protect, requireRole as restrictTo, optionalAuth } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { cacheMiddleware } from '../utils/cache.util';

const router = express.Router();


// Public routes (must come first or be ordered correctly)
router.get('/', optionalAuth, cacheMiddleware(300), eventController.getEvents);
router.post('/', protect, restrictTo(UserRole.GLOBAL_ADMIN), eventController.createEvent);

// Specific paths before parameterized paths
router.get('/my-events', protect, eventController.getMyEvents);
router.get('/upcoming', optionalAuth, cacheMiddleware(300), eventController.getUpcomingEvents);
router.get('/:id', cacheMiddleware(600), eventController.getEvent);
router.put('/:id', protect, restrictTo(UserRole.GLOBAL_ADMIN), eventController.updateEvent);

// Protected routes
router.put('/:id/status', protect, restrictTo(UserRole.GLOBAL_ADMIN), eventController.updateEventStatus);

// Admin-only: delete event
router.delete('/bulk/old', protect, restrictTo(UserRole.GLOBAL_ADMIN), eventController.bulkDeleteOldEvents);
router.delete('/:id', protect, restrictTo(UserRole.GLOBAL_ADMIN), eventController.deleteEvent);

export default router;
