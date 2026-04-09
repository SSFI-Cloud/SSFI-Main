import { z } from 'zod';
import { UserRole } from '@prisma/client';

/**
 * Phone number validation (Indian format)
 */
const phoneSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Invalid phone number. Must be a valid 10-digit Indian mobile number');

/**
 * Email validation
 */
const emailSchema = z.string()
  .email('Invalid email address')
  .optional();

/**
 * Password validation
 */
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * OTP validation
 */
const otpSchema = z.string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers');

/**
 * Registration schema
 */
export const registerSchema = z.object({
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  context: z.object({
    stateId: z.number().optional(),
    districtId: z.number().optional(),
    clubId: z.number().optional(),
    stateCode: z.string().optional(),
    districtCode: z.string().optional(),
    clubCode: z.string().optional()
  }).optional()
});

/**
 * Login schema — accepts phone number OR SSFI UID
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Phone number or UID is required'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Verify OTP schema
 */
export const verifyOTPSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema
});

/**
 * Resend OTP schema
 */
export const resendOTPSchema = z.object({
  phone: phoneSchema
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
}).refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword']
  }
);

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  phone: phoneSchema
});

/**
 * Reset password schema — uses relaxed password rules since default password is phone number
 */
export const resetPasswordSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
  newPassword: z.string().min(6, 'Password must be at least 6 characters long')
});

export default {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
