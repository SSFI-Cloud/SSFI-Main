import { Router } from 'express';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require GLOBAL_ADMIN
router.use(protect);
router.use(restrictTo(UserRole.GLOBAL_ADMIN));

router.post('/bulk-expire-students', adminController.bulkExpireStudents);
router.delete('/reset-districts-clubs', adminController.resetDistrictsAndClubs);
router.delete('/reset-payments', adminController.resetAllPayments);
router.delete('/reset-donations', adminController.resetAllDonations);
router.post('/seed-districts', adminController.seedDistricts);
router.post('/flush-cache', adminController.flushCache);
router.post('/cleanup-orphans', adminController.cleanupOrphans);
router.post('/sync-schema', adminController.syncSchema);
router.post('/cleanup-test-data', adminController.cleanupTestData);
router.post('/extend-membership', adminController.extendMembership);

export default router;
