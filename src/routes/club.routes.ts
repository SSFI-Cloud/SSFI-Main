import express from 'express';
import * as clubController from '../controllers/club.controller';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { injectScopeFilters } from '../middleware/scope.middleware';
import { UserRole } from '@prisma/client';

import { uploadFields } from '../middleware/upload.middleware';

const router = express.Router();

const clubUpload = uploadFields([
    { name: 'clubLogo', maxCount: 1 },
]);

// Public Routes - Registration
router.post('/initiate', clubUpload, clubController.initiateRegistration);
router.post('/verify', clubController.verifyPayment);

// Protected Routes
router.use(protect);

// GET all clubs - scoped by user's role
router.get('/', injectScopeFilters, clubController.getClubs);
router.get('/:id', clubController.getClub);

router.put('/:id', restrictTo(UserRole.GLOBAL_ADMIN), clubController.updateClub);
router.put('/:id/status', restrictTo(UserRole.GLOBAL_ADMIN), clubController.updateClubStatus);

export default router;

