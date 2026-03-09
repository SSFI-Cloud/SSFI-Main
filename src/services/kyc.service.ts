import axios, { AxiosError } from 'axios';
import { surepassConfig, isSurepassConfigured } from '../config/surepass.config';
import { AppError } from '../utils/errors';
import logger from '../utils/logger.util';

// ── Types ──

export interface KycVerificationResult {
  verified: boolean;
  fullName: string;
  dob: string;             // YYYY-MM-DD
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

export interface DigilockerInitResult {
  clientId: string;
  url: string;             // URL user opens to authenticate with Digilocker
  expirySeconds: number;
}

interface DigilockerSession {
  clientId: string;
  createdAt: number;
}

// ── In-memory session store ──

const digilockerSessions = new Map<string, DigilockerSession>();

// Cleanup expired sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  const ttl = surepassConfig.sessionTtlSeconds * 1000;
  for (const [key, session] of digilockerSessions.entries()) {
    if (now - session.createdAt > ttl) {
      digilockerSessions.delete(key);
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
 * Step 1: Initialize Digilocker session
 * Returns a URL that the user opens in a popup/new tab to authenticate
 */
export const initializeDigilocker = async (
  redirectUrl: string
): Promise<DigilockerInitResult> => {
  if (!isSurepassConfigured()) {
    throw new AppError('KYC verification service is not configured', 503);
  }

  try {
    const response = await surepassApi.post(surepassConfig.endpoints.initialize, {
      data: {
        redirect_url: redirectUrl,
        expiry_minutes: 10,
        send_sms: false,
        send_email: false,
        verify_phone: false,
        verify_email: false,
        skip_main_screen: false,
        signup_flow: false,
      },
    });

    const data = response.data;

    if (!data.success || !data.data?.client_id || !data.data?.url) {
      logger.warn('SurePass digilocker/initialize failed:', data);
      throw new AppError(
        data.message || 'Failed to initialize Digilocker verification.',
        400
      );
    }

    const clientId = data.data.client_id;

    // Store session for tracking
    digilockerSessions.set(clientId, {
      clientId,
      createdAt: Date.now(),
    });

    logger.info(`Digilocker session initialized: ${clientId}`);

    return {
      clientId,
      url: data.data.url,
      expirySeconds: data.data.expiry_seconds || 600,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    const axiosErr = error as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    const msg = axiosErr.response?.data?.message;

    if (status === 401) {
      logger.error('SurePass authentication failed - check API token');
      throw new AppError('KYC verification service authentication failed.', 503);
    }

    if (status === 429) {
      throw new AppError(
        'Too many verification requests. Please try again after some time.',
        429
      );
    }

    logger.error('SurePass digilocker/initialize error:', error);
    throw new AppError(
      msg || 'KYC verification service is temporarily unavailable. Please try again later.',
      503
    );
  }
};

/**
 * Step 2: Check Digilocker session status
 * Returns the current status + verified data when completed
 */
export const getDigilockerStatus = async (
  clientId: string
): Promise<{
  completed: boolean;
  failed: boolean;
  status: string;
  aadhaarLinked: boolean;
  data?: KycVerificationResult;
}> => {
  if (!isSurepassConfigured()) {
    throw new AppError('KYC verification service is not configured', 503);
  }

  // Validate session exists (optional — SurePass tracks it anyway)
  const session = digilockerSessions.get(clientId);
  if (session) {
    const elapsed = Date.now() - session.createdAt;
    if (elapsed > surepassConfig.sessionTtlSeconds * 1000) {
      digilockerSessions.delete(clientId);
      throw new AppError('Digilocker session expired. Please start again.', 400);
    }
  }

  try {
    const response = await surepassApi.get(
      `${surepassConfig.endpoints.status}/${clientId}`
    );

    const data = response.data;

    if (!data.success) {
      logger.warn('SurePass digilocker/status failed:', data);
      throw new AppError(
        data.message || 'Failed to check verification status.',
        400
      );
    }

    const d = data.data;

    const result: {
      completed: boolean;
      failed: boolean;
      status: string;
      aadhaarLinked: boolean;
      data?: KycVerificationResult;
    } = {
      completed: !!d.completed,
      failed: !!d.failed,
      status: d.status || 'unknown',
      aadhaarLinked: !!d.aadhaar_linked,
    };

    // If completed and has aadhaar data, extract it
    if (d.completed && d.aadhaar_linked && d.aadhaar_data) {
      const ad = d.aadhaar_data;

      // Parse DOB — SurePass may return DD-MM-YYYY or YYYY-MM-DD
      let dob = ad.dob || '';
      if (dob && /^\d{2}-\d{2}-\d{4}$/.test(dob)) {
        const [day, month, year] = dob.split('-');
        dob = `${year}-${month}-${day}`;
      }

      // Build address string
      const addrParts = [
        ad.address?.house,
        ad.address?.street,
        ad.address?.landmark,
        ad.address?.loc || ad.address?.locality,
        ad.address?.vtc,
        ad.address?.subdist,
        ad.address?.dist,
        ad.address?.state,
        ad.zip || ad.address?.zip,
      ].filter(Boolean);

      result.data = {
        verified: true,
        fullName: ad.full_name || ad.name || '',
        dob,
        gender: ad.gender || '',
        maskedAadhaar: ad.aadhaar_number || ad.masked_aadhaar || '',
        profileImage: ad.profile_image || ad.photo || undefined,
        address: {
          house: ad.address?.house || ad.split_address?.house,
          street: ad.address?.street || ad.split_address?.street,
          landmark: ad.address?.landmark || ad.split_address?.landmark,
          locality: ad.address?.loc || ad.address?.locality || ad.split_address?.loc,
          vtc: ad.address?.vtc || ad.split_address?.vtc,
          district: ad.address?.dist || ad.split_address?.dist,
          state: ad.address?.state || ad.split_address?.state,
          pincode: ad.zip || ad.address?.zip || ad.split_address?.zip,
          country: ad.address?.country || 'India',
          fullAddress: addrParts.join(', '),
        },
        careOf: ad.care_of,
      };

      // Clean up session on success
      digilockerSessions.delete(clientId);
      logger.info(`Digilocker KYC verified: ${result.data.fullName}`);
    }

    // If completed but no aadhaar data, check for flat fields
    if (d.completed && !result.data && (d.full_name || d.name)) {
      let dob = d.dob || '';
      if (dob && /^\d{2}-\d{2}-\d{4}$/.test(dob)) {
        const [day, month, year] = dob.split('-');
        dob = `${year}-${month}-${day}`;
      }

      result.data = {
        verified: true,
        fullName: d.full_name || d.name || '',
        dob,
        gender: d.gender || '',
        maskedAadhaar: d.aadhaar_number || d.masked_aadhaar || '',
        profileImage: d.profile_image || d.photo || undefined,
        address: d.address ? {
          house: d.address?.house,
          street: d.address?.street,
          district: d.address?.dist,
          state: d.address?.state,
          pincode: d.zip || d.address?.zip,
          country: 'India',
        } : undefined,
        careOf: d.care_of,
      };

      digilockerSessions.delete(clientId);
      logger.info(`Digilocker KYC verified (flat): ${result.data.fullName}`);
    }

    if (d.failed) {
      digilockerSessions.delete(clientId);
      logger.warn(`Digilocker verification failed for ${clientId}: ${d.error_description || 'unknown'}`);
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;

    const axiosErr = error as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;

    if (status === 401) {
      throw new AppError('KYC verification service authentication failed.', 503);
    }

    if (status === 429) {
      throw new AppError('Too many requests. Please try again later.', 429);
    }

    logger.error('SurePass digilocker/status error:', error);
    throw new AppError(
      'KYC verification service is temporarily unavailable.',
      503
    );
  }
};

export default {
  initializeDigilocker,
  getDigilockerStatus,
};
