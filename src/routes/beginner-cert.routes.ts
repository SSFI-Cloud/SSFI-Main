import { Router } from 'express';
import * as ctrl from '../controllers/beginner-cert.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { uploadFields } from '../middleware/upload.middleware';
import { optimizeUploadedImages } from '../middleware/imageOptimize.middleware';
import { UserRole } from '@prisma/client';
import { cacheMiddleware } from '../utils/cache.util';

const router = Router();

const beginnerUpload = uploadFields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
]);

// ────────── PUBLIC ROUTES ──────────

router.get('/programs/active', cacheMiddleware(300), ctrl.getActivePrograms);
router.get('/lookup-student', ctrl.lookupStudent);
router.post('/register', beginnerUpload, optimizeUploadedImages, ctrl.registerBeginner);
router.post('/initiate', beginnerUpload, optimizeUploadedImages, ctrl.initiateRegistration);
router.post('/verify-payment', ctrl.verifyPayment);

// ────────── ADMIN ROUTES ──────────

router.use(authenticate);
router.use(requireRole(UserRole.GLOBAL_ADMIN));

// Programs CRUD
router.post('/programs', ctrl.createProgram);
router.get('/programs', ctrl.listPrograms);
router.get('/programs/:id', ctrl.getProgram);
router.put('/programs/:id', ctrl.updateProgram);
router.delete('/programs/:id', ctrl.deleteProgram);

// Program Registrations
router.get('/programs/:id/registrations', ctrl.getProgramRegistrations);
router.get('/programs/:id/registrations/export', ctrl.exportRegistrations);

// Registration Actions
router.put('/registrations/:id/mark-complete', ctrl.markComplete);
router.put('/registrations/:id/status', ctrl.updateRegistrationStatus);

export default router;
