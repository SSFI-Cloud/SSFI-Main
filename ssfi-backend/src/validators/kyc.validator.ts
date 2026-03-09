import { z } from 'zod';

// Aadhaar number: exactly 12 digits
const aadhaarRegex = /^\d{12}$/;

export const generateOtpSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(aadhaarRegex, 'Aadhaar number must be exactly 12 digits'),
});

export const verifyOtpSchema = z.object({
  clientId: z
    .string()
    .min(1, 'Client ID is required'),
  otp: z
    .string()
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export type GenerateOtpInput = z.infer<typeof generateOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
