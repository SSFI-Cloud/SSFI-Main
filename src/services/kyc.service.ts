import axios, { AxiosError } from 'axios';
import { surepassConfig, isSurepassConfigured } from '../config/surepass.config';
import { AppError } from '../utils/errors';
import logger from '../utils/logger.util';

// ── Types ──

export interface KycVerificationResult {
  verified: boolean;
  fullName: string;
  dob: string;             // YYYY-MM-DD or DD-MM-YYYY from SurePass
  gender: string;          // M / F / T
  maskedAadhaar: string;   // "XXXX XXXX 1234"
  profileImage?: string;   // base64-encoded photo from Aadhaar
  address?: {
    house?: string;
    street?: string;
    landmark?: string;
    locality?: string;
    vtc?: string;
    district?: string;
    state?: string;
    pincode?: string;
    country?: string;
    fullAddress?: string;
  };
  careOf?: string;         // "S/O: Father Name"
}

interface OtpSession {
  aadhaarNumber: string;
  clientId: string;
  createdAt: number;
  otpAttempts: number;
}

// ── In-memory OTP session store ──

const otpSessions = new Map<string, OtpSession>();

// Cleanup expired sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  const ttl = surepassConfig.otpTtlSeconds * 1000;
  for (const [key, session] of otpSessions.entries()) {
    if (now - session.createdAt > ttl) {
      otpSessions.delete(key);
    }
  }
}, 2 * 60 * 1000);

// ── Axios instance for SurePass ──

const surepassApi = axios.create({
  baseURL: surepassConfig.baseUrl,
  timeout: surepassConfig.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${surepassConfig.apiToken}`,
  },
});

// ── Service Functions ──

/**
 * Step 1: Generate OTP for Aadhaar verification
 * Sends OTP to the mobile number linked with the Aadhaar
 */
export const generateAadhaarOtp = async (
  aadhaarNumber: string
): Promise<{ clientId: string; success: boolean }> => {
  if (!isSurepassConfigured()) {
    throw new AppError('KYC verification service is not configured', 503);
  }

  try {
    const response = await surepassApi.post(surepassConfig.endpoints.generateOtp, {
      id_number: aadhaarNumber,
    });

    const data = response.data;

    if (!data.success || !data.data?.client_id) {
      logger.warn('SurePass generate-otp failed:', data);
      throw new AppError(
        data.message || 'Failed to generate OTP. Please check your Aadhaar number.',
        400
      );
    }

    const clientId = data.data.client_id;

    // Store session for tracking
    otpSessions.set(clientId, {
      aadhaarNumber,
      clientId,
      createdAt: Date.now(),
      otpAttempts: 0,
    });

    logger.info(`KYC OTP generated for Aadhaar ending ${aadhaarNumber.slice(-4)}`);

    return { clientId, success: true };
  } catch (error) {
    if (error instanceof AppError) throw error;

    const axiosErr = error as AxiosError<{ message?: string; data?: any }>;
    const status = axiosErr.response?.status;
    const msg = axiosErr.response?.data?.message;

    if (status === 422 || status === 400) {
      throw new AppError(
        msg || 'Invalid Aadhaar number or Aadhaar not linked to mobile number.',
        400
      );
    }

    if (status === 429) {
      throw new AppError(
        'Too many verification requests. Please try again after some time.',
        429
      );
    }

    logger.error('SurePass generate-otp error:', error);
    throw new AppError(
      'KYC verification service is temporarily unavailable. Please try again later.',
      503
    );
  }
};

/**
 * Step 2: Verify OTP and get Aadhaar details
 * Returns verified identity data on success
 */
export const verifyAadhaarOtp = async (
  clientId: string,
  otp: string
): Promise<KycVerificationResult> => {
  if (!isSurepassConfigured()) {
    throw new AppError('KYC verification service is not configured', 503);
  }

  // Validate session
  const session = otpSessions.get(clientId);
  if (!session) {
    throw new AppError(
      'OTP session expired or invalid. Please generate a new OTP.',
      400
    );
  }

  // Check TTL
  const elapsed = Date.now() - session.createdAt;
  if (elapsed > surepassConfig.otpTtlSeconds * 1000) {
    otpSessions.delete(clientId);
    throw new AppError('OTP has expired. Please generate a new OTP.', 400);
  }

  // Check attempts
  if (session.otpAttempts >= surepassConfig.maxOtpRetries) {
    otpSessions.delete(clientId);
    throw new AppError(
      'Maximum OTP attempts exceeded. Please generate a new OTP.',
      429
    );
  }

  // Increment attempt counter
  session.otpAttempts += 1;

  try {
    const response = await surepassApi.post(surepassConfig.endpoints.submitOtp, {
      client_id: clientId,
      otp,
    });

    const data = response.data;

    if (!data.success || !data.data?.full_name) {
      logger.warn('SurePass submit-otp failed:', data);
      throw new AppError(
        data.message || 'OTP verification failed. Please try again.',
        400
      );
    }

    const d = data.data;

    // Parse DOB — SurePass may return DD-MM-YYYY or YYYY-MM-DD
    let dob = d.dob || '';
    if (dob && /^\d{2}-\d{2}-\d{4}$/.test(dob)) {
      // Convert DD-MM-YYYY to YYYY-MM-DD
      const [day, month, year] = dob.split('-');
      dob = `${year}-${month}-${day}`;
    }

    // Build address string
    const addrParts = [
      d.address?.house,
      d.address?.street,
      d.address?.landmark,
      d.address?.loc || d.address?.locality,
      d.address?.vtc,
      d.address?.subdist,
      d.address?.dist,
      d.address?.state,
      d.zip || d.address?.zip,
    ].filter(Boolean);

    const result: KycVerificationResult = {
      verified: true,
      fullName: d.full_name,
      dob,
      gender: d.gender || '',
      maskedAadhaar: d.aadhaar_number || `XXXX XXXX ${session.aadhaarNumber.slice(-4)}`,
      profileImage: d.profile_image || undefined,
      address: {
        house: d.address?.house || d.split_address?.house,
        street: d.address?.street || d.split_address?.street,
        landmark: d.address?.landmark || d.split_address?.landmark,
        locality: d.address?.loc || d.address?.locality || d.split_address?.loc,
        vtc: d.address?.vtc || d.split_address?.vtc,
        district: d.address?.dist || d.split_address?.dist,
        state: d.address?.state || d.split_address?.state,
        pincode: d.zip || d.address?.zip || d.split_address?.zip,
        country: d.address?.country || 'India',
        fullAddress: addrParts.join(', '),
      },
      careOf: d.care_of,
    };

    // Clean up session on success
    otpSessions.delete(clientId);

    logger.info(`KYC verified for Aadhaar ending ${session.aadhaarNumber.slice(-4)}: ${d.full_name}`);

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;

    const axiosErr = error as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    const msg = axiosErr.response?.data?.message;

    if (status === 422 || status === 400) {
      const remaining = surepassConfig.maxOtpRetries - session.otpAttempts;
      throw new AppError(
        msg || `Incorrect OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please generate a new OTP.'}`,
        400
      );
    }

    if (status === 429) {
      throw new AppError(
        'Too many verification requests. Please try again after some time.',
        429
      );
    }

    logger.error('SurePass submit-otp error:', error);
    throw new AppError(
      'KYC verification service is temporarily unavailable. Please try again later.',
      503
    );
  }
};

export default {
  generateAadhaarOtp,
  verifyAadhaarOtp,
};
