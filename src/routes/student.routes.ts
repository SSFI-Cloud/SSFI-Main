import express from 'express';
import * as studentController from '../controllers/student.controller';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { injectScopeFilters, verifyApprovalScope } from '../middleware/scope.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.use(protect);

// GET all students - scoped by user's role
router.get('/', injectScopeFilters, studentController.getStudents);
router.post('/', restrictTo(UserRole.GLOBAL_ADMIN, UserRole.STATE_SECRETARY, UserRole.DISTRICT_SECRETARY, UserRole.CLUB_OWNER), studentController.createStudent);
router.get('/:id', studentController.getStudent);

// Update student status - with scope verification
router.put(
    '/:id/status',
    restrictTo(UserRole.GLOBAL_ADMIN, UserRole.STATE_SECRETARY, UserRole.DISTRICT_SECRETARY, UserRole.CLUB_OWNER),
    verifyApprovalScope('student'),
    studentController.updateStudentStatus
);

export default router;


