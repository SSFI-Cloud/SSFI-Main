import express from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate as protect } from '../middleware/auth.middleware';

const router = express.Router();

// All authenticated users can access reports (data is scoped by role)
router.use(protect);

router.get('/stats', reportController.getDashboardStats);
router.get('/payment-stats', reportController.getPaymentStats);
router.get('/export', reportController.exportReportsCSV);
router.get('/payments-export', reportController.exportPaymentsCSV);

export default router;
