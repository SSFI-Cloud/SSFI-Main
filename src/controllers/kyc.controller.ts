import { Request, Response } from 'express';
import { initializeDigilockerSchema, checkStatusSchema } from '../validators/kyc.validator';
import { initializeDigilocker, getDigilockerStatus } from '../services/kyc.service';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * @desc    Initialize Digilocker session — returns URL for user to authenticate
 * @route   POST /api/v1/kyc/digilocker/initialize
 * @access  Public
 */
export const initialize = asyncHandler(async (req: Request, res: Response) => {
  const { redirectUrl } = initializeDigilockerSchema.parse(req.body);

  const result = await initializeDigilocker(redirectUrl);

  return successResponse(res, {
    statusCode: 200,
    message: 'Digilocker session initialized.',
    data: {
      clientId: result.clientId,
      url: result.url,
      expirySeconds: result.expirySeconds,
    },
  });
});

/**
 * @desc    Check Digilocker session status and get verified data
 * @route   GET /api/v1/kyc/digilocker/status/:clientId
 * @access  Public
 */
export const status = asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = checkStatusSchema.parse({ clientId: req.params.clientId });

  const result = await getDigilockerStatus(clientId);

  return successResponse(res, {
    statusCode: 200,
    message: result.completed
      ? 'Verification complete.'
      : result.failed
        ? 'Verification failed.'
        : 'Verification in progress.',
    data: result,
  });
});

export default {
  initialize,
  status,
};
