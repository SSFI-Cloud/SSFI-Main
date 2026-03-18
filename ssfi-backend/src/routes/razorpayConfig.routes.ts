import { Router } from 'express';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { razorpayConfigController as controller } from '../controllers/razorpayConfig.controller';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require auth + secretary role
router.use(protect);
router.use(restrictTo(UserRole.STATE_SECRETARY, UserRole.DISTRICT_SECRETARY));

router.get('/', controller.getConfig.bind(controller));
router.put('/', controller.saveConfig.bind(controller));
router.post('/test', controller.testConfig.bind(controller));
router.delete('/', controller.deleteConfig.bind(controller));

export default router;
