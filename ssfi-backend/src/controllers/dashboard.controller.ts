import { Response } from 'express';
import dashboardService from '../services/dashboard.service';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types';

/**
 * @desc    Get dashboard data based on user role
 * @route   GET /api/v1/dashboard
 * @access  Private
 */
export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, stateId, districtId, clubId, studentId } = req.user!;

  let dashboardData;

  switch (role) {
    case 'GLOBAL_ADMIN':
      dashboardData = await dashboardService.getGlobalAdminDashboard();
      break;

    case 'STATE_SECRETARY':
      if (!stateId) {
        throw new AppError('State ID not found for user', 400);
      }
      dashboardData = await dashboardService.getStateSecretaryDashboard(stateId);
      break;

    case 'DISTRICT_SECRETARY':
      if (!districtId) {
        throw new AppError('District ID not found for user', 400);
      }
      dashboardData = await dashboardService.getDistrictSecretaryDashboard(districtId);
      break;

    case 'CLUB_OWNER':
      if (!clubId) {
        throw new AppError('Club ID not found for user', 400);
      }
      dashboardData = await dashboardService.getClubOwnerDashboard(clubId);
      break;

    case 'STUDENT':
      if (!studentId) {
        throw new AppError('Student ID not found for user', 400);
      }
      dashboardData = await dashboardService.getStudentDashboard(studentId);
      break;

    default:
      throw new AppError('Invalid user role', 400);
  }

  return successResponse(res, {
    message: 'Dashboard data retrieved successfully',
    data: {
      role,
      ...dashboardData,
    },
  });
});

/**
 * @desc    Get Global Admin dashboard
 * @route   GET /api/v1/dashboard/admin
 * @access  Private (Global Admin)
 */
export const getAdminDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dashboardData = await dashboardService.getGlobalAdminDashboard();

  return successResponse(res, {
    message: 'Admin dashboard data retrieved successfully',
    data: dashboardData,
  });
});

/**
 * @desc    Get State Secretary dashboard
 * @route   GET /api/v1/dashboard/state/:stateId
 * @access  Private (Global Admin, State Secretary)
 */
export const getStateDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { stateId } = req.params;

  // Verify access
  if (req.user!.role === 'STATE_SECRETARY' && req.user!.stateId !== parseInt(stateId)) {
    throw new AppError('You do not have access to this state dashboard', 403);
  }

  const dashboardData = await dashboardService.getStateSecretaryDashboard(parseInt(stateId));

  return successResponse(res, {
    message: 'State dashboard data retrieved successfully',
    data: dashboardData,
  });
});

/**
 * @desc    Get District Secretary dashboard
 * @route   GET /api/v1/dashboard/district/:districtId
 * @access  Private (Global Admin, State Secretary, District Secretary)
 */
export const getDistrictDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { districtId } = req.params;

  // Verify access
  if (req.user!.role === 'DISTRICT_SECRETARY' && req.user!.districtId !== parseInt(districtId)) {
    throw new AppError('You do not have access to this district dashboard', 403);
  }

  const dashboardData = await dashboardService.getDistrictSecretaryDashboard(parseInt(districtId));

  return successResponse(res, {
    message: 'District dashboard data retrieved successfully',
    data: dashboardData,
  });
});

/**
 * @desc    Get Club Owner dashboard
 * @route   GET /api/v1/dashboard/club/:clubId
 * @access  Private (Global Admin, State Secretary, District Secretary, Club Owner)
 */
export const getClubDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { clubId } = req.params;

  // Verify access
  if (req.user!.role === 'CLUB_OWNER' && req.user!.clubId !== parseInt(clubId)) {
    throw new AppError('You do not have access to this club dashboard', 403);
  }

  const dashboardData = await dashboardService.getClubOwnerDashboard(parseInt(clubId));

  return successResponse(res, {
    message: 'Club dashboard data retrieved successfully',
    data: dashboardData,
  });
});

/**
 * @desc    Get Student dashboard
 * @route   GET /api/v1/dashboard/student/:studentId
 * @access  Private (Student - own only, others with hierarchy access)
 */
export const getStudentDashboardById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;

  // Verify access
  if (req.user!.role === 'STUDENT' && req.user!.studentId !== parseInt(studentId)) {
    throw new AppError('You can only access your own dashboard', 403);
  }

  const dashboardData = await dashboardService.getStudentDashboard(parseInt(studentId));

  return successResponse(res, {
    message: 'Student dashboard data retrieved successfully',
    data: dashboardData,
  });
});

export default {
  getDashboard,
  getAdminDashboard,
  getStateDashboard,
  getDistrictDashboard,
  getClubDashboard,
  getStudentDashboardById,
};
