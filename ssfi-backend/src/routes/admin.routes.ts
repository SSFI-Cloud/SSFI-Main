import { Router } from 'express';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require GLOBAL_ADMIN
router.use(protect);
router.use(restrictTo(UserRole.GLOBAL_ADMIN));

router.post('/bulk-expire-students', adminController.bulkExpireStudents);
router.delete('/reset-payments', adminController.resetAllPayments);

export default router;
