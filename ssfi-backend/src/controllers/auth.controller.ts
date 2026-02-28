import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import authService from '../services/auth.service';
import otpService from '../services/otp.service';
import { sendSuccess } from '../utils/response.util';

class AuthController {
  /**
   * @route   POST /api/v1/auth/register
   * @desc    Register new user (initial registration only)
   * @access  Public
   */
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { phone, email, password, role, context } = req.body;

    const result = await authService.register({
      phone,
      email,
      password,
      role,
      context
    });

    sendSuccess(res, 201, 'Registration successful. Please verify your phone number.', {
      userId: result.userId,
      uid: result.uid,
      phone
    });
  });

  /**
   * @route   POST /api/v1/auth/verify-otp
   * @desc    Verify phone OTP
   * @access  Public
   */
  verifyOTP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { phone, otp } = req.body;

    await authService.verifyOTP(phone, otp);

    sendSuccess(res, 200, 'Phone number verified successfully. You can now login.');
  });

  /**
   * @route   POST /api/v1/auth/resend-otp
   * @desc    Resend OTP
   * @access  Public
   */
  resendOTP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { phone } = req.body;

    await otpService.checkRateLimit(phone);
    await authService.resendOTP(phone);

    sendSuccess(res, 200, 'OTP sent successfully');
  });

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Login user
   * @access  Public
   */
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, password } = req.body;

    const result = await authService.login(identifier, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    sendSuccess(res, 200, 'Login successful', {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken
    });
  });

  /**
   * @route   POST /api/v1/auth/refresh
   * @desc    Refresh access token
   * @access  Public
   */
  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    sendSuccess(res, 200, 'Token refreshed successfully', {
      accessToken: result.accessToken
    });
  });

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Logout user
   * @access  Private
   */
  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    await authService.logout(req.user.id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    sendSuccess(res, 200, 'Logout successful');
  });

  /**
   * @route   POST /api/v1/auth/change-password
   * @desc    Change password
   * @access  Private
   */
  changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(req.user.id, oldPassword, newPassword);

    sendSuccess(res, 200, 'Password changed successfully');
  });

  /**
   * @route   POST /api/v1/auth/forgot-password
   * @desc    Request password reset
   * @access  Public
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { phone } = req.body;

    await otpService.checkRateLimit(phone);
    await authService.requestPasswordReset(phone);

    sendSuccess(res, 200, 'Password reset OTP sent to your phone');
  });

  /**
   * @route   POST /api/v1/auth/reset-password
   * @desc    Reset password with OTP
   * @access  Public
   */
  resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { phone, otp, newPassword } = req.body;

    await authService.resetPassword(phone, otp, newPassword);

    sendSuccess(res, 200, 'Password reset successful. You can now login with your new password.');
  });

  /**
   * @route   GET /api/v1/auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // User info is already in req.user from middleware
    sendSuccess(res, 200, 'User profile retrieved', {
      user: req.user
    });
  });

  /**
   * @route   PUT /api/v1/auth/profile
   * @desc    Update user profile
   * @access  Private
   */
  updateProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { phone, email } = req.body;

    const updatedUser = await authService.updateProfile(req.user.id, { phone, email });

    sendSuccess(res, 200, 'Profile updated successfully', {
      user: updatedUser
    });
  });
}

export default new AuthController();
