import { Request, Response } from 'express';
import { generateOtpSchema, verifyOtpSchema } from '../validators/kyc.validator';
import { generateAadhaarOtp, verifyAadhaarOtp } from '../services/kyc.service';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * @desc    Generate OTP for Aadhaar verification
 * @route   POST /api/v1/kyc/aadhaar/generate-otp
 * @access  Public
 */
export const generateOtp = asyncHandler(async (req: Request, res: Response) => {
  const { aadhaarNumber } = generateOtpSchema.parse(req.body);

  const result = await generateAadhaarOtp(aadhaarNumber);

  return successResponse(res, {
    statusCode: 200,
    message: 'OTP sent to Aadhaar-linked mobile number.',
    data: {
      clientId: result.clientId,
      otpSent: result.success,
    },
  });
});

/**
 * @desc    Verify OTP and get Aadhaar details
 * @route   POST /api/v1/kyc/aadhaar/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, otp } = verifyOtpSchema.parse(req.body);

  const result = await verifyAadhaarOtp(clientId, otp);

  return successResponse(res, {
    statusCode: 200,
    message: 'Aadhaar verified successfully.',
    data: result,
  });
});

export default {
  generateOtp,
  verifyOtp,
};
