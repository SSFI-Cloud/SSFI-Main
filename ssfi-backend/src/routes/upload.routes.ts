import { Router } from 'express';
import { uploadImageMiddleware, uploadImage, deleteImage } from '../controllers/upload.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All upload routes require admin auth
router.use(authenticate, requireRole(UserRole.GLOBAL_ADMIN));

// POST /api/v1/upload/image?type=hero|team|news
router.post('/image', uploadImageMiddleware, uploadImage);

// DELETE /api/v1/upload/image  — body: { url }
router.delete('/image', deleteImage);

export default router;
