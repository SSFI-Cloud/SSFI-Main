import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/dashboard
 * @desc    Get dashboard based on user role (auto-detected)
 * @access  Private (All authenticated users)
 */
router.get('/', dashboardController.getDashboard);

/**
 * @route   GET /api/v1/dashboard/admin
 * @desc    Get Global Admin dashboard
 * @access  Private (Global Admin)
 */
router.get(
  '/admin',
  requireRole('GLOBAL_ADMIN'),
  dashboardController.getAdminDashboard
);

/**
 * @route   GET /api/v1/dashboard/state/:stateId
 * @desc    Get State Secretary dashboard
 * @access  Private (Global Admin, State Secretary)
 */
router.get(
  '/state/:stateId',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  dashboardController.getStateDashboard
);

/**
 * @route   GET /api/v1/dashboard/district/:districtId
 * @desc    Get District Secretary dashboard
 * @access  Private (Global Admin, State Secretary, District Secretary)
 */
router.get(
  '/district/:districtId',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'),
  dashboardController.getDistrictDashboard
);

/**
 * @route   GET /api/v1/dashboard/club/:clubId
 * @desc    Get Club Owner dashboard
 * @access  Private (Global Admin, State Secretary, District Secretary, Club Owner)
 */
router.get(
  '/club/:clubId',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER'),
  dashboardController.getClubDashboard
);

/**
 * @route   GET /api/v1/dashboard/student/:studentId
 * @desc    Get Student dashboard
 * @access  Private (All roles with appropriate access)
 */
router.get(
  '/student/:studentId',
  dashboardController.getStudentDashboardById
);

export default router;
