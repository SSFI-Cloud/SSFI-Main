import express from 'express';
import * as registrationWindowController from '../controllers/registrationWindow.controller';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { cacheMiddleware } from '../utils/cache.util';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

// Get all active registration windows with caching (5 minutes TTL)
router.get('/active', cacheMiddleware(300), registrationWindowController.getActiveWindows);

// Get active window for specific type with caching (5 minutes TTL)
router.get('/active/:type', cacheMiddleware(300), registrationWindowController.getActiveWindowByType);

// Check if registration is allowed for a window
router.get('/:id/can-register', registrationWindowController.canRegister);

// Check if renewal is enabled (authenticated users)
router.get('/check/renewal-status', registrationWindowController.getRenewalStatus);

// ============================================
// PROTECTED ROUTES (auth required)
// ============================================

router.use(protect);

// Get all windows (with filters) - admin
router.get('/', registrationWindowController.getAllWindows);

// Get single window by ID
router.get('/:id', registrationWindowController.getWindowById);

// ============================================
// ADMIN ONLY ROUTES (GLOBAL_ADMIN only)
// ============================================

// Create new registration window
router.post('/', restrictTo(UserRole.GLOBAL_ADMIN), registrationWindowController.createWindow);

// Update registration window
router.put('/:id', restrictTo(UserRole.GLOBAL_ADMIN), registrationWindowController.updateWindow);

// Toggle pause/resume
router.post('/:id/toggle-pause', restrictTo(UserRole.GLOBAL_ADMIN), registrationWindowController.togglePause);

// Toggle renewal enabled/disabled
router.post('/:id/toggle-renewal', restrictTo(UserRole.GLOBAL_ADMIN), registrationWindowController.toggleRenewal);

// Delete registration window
router.delete('/:id', restrictTo(UserRole.GLOBAL_ADMIN), registrationWindowController.deleteWindow);

export default router;
