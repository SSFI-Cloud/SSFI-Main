import express from 'express';
import * as controller from '../controllers/state-secretary.controller';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

import { uploadFields } from '../middleware/upload.middleware';
import { optimizeUploadedImages } from '../middleware/imageOptimize.middleware';

const router = express.Router();

const secretaryUpload = uploadFields([
    { name: 'identityProof', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 },
]);

// Public Routes - Registration
router.post('/initiate', secretaryUpload, optimizeUploadedImages, controller.initiateRegistration);
router.post('/verify', controller.verifyPayment);

// Protected Routes - Admin Only
router.use(protect);
router.use(restrictTo(UserRole.GLOBAL_ADMIN));

router.get('/', controller.getStateSecretaries);
router.put('/:id/status', controller.updateStatus);

export default router;
