'use client';

import { useState, useCallback } from 'react';
import { api } from '../api/client';

// ── Types ──

export interface KycResult {
  verified: boolean;
  fullName: string;
  dob: string;           // YYYY-MM-DD
  gender: string;        // M / F / T
  maskedAadhaar: string; // "XXXX XXXX 1234"
  profileImage?: string; // base64-encoded photo from Aadhaar
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
  careOf?: string;       // "S/O: Father Name"
}

export type KycStep = 'idle' | 'entering_aadhaar' | 'otp_sent' | 'verifying' | 'verified' | 'error';

// ── Hook ──

export function useKYC() {
  const [step, setStep] = useState<KycStep>('idle');
  const [clientId, setClientId] = useState<string | null>(null);
  const [result, setResult] = useState<KycResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [aadhaarNumber, setAadhaarNumber] = useState('');

  /**
   * Step 1: Send OTP to Aadhaar-linked mobile
   */
  const generateOtp = useCallback(async (aadhaar: string) => {
    setIsLoading(true);
    setError(null);
    setAadhaarNumber(aadhaar);

    try {
      const response = await api.post('/kyc/aadhaar/generate-otp', {
        aadhaarNumber: aadhaar,
      });

      const data = response.data?.data;
      if (data?.clientId) {
        setClientId(data.clientId);
        setStep('otp_sent');
        setOtpAttempts(0);
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to send OTP. Please check your Aadhaar number.';
      setError(msg);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Step 2: Verify OTP and get Aadhaar details
   */
  const verifyOtp = useCallback(
    async (otp: string) => {
      if (!clientId) {
        setError('No OTP session. Please generate OTP first.');
        return;
      }

      setIsLoading(true);
      setError(null);
      setStep('verifying');

      try {
        const response = await api.post('/kyc/aadhaar/verify-otp', {
          clientId,
          otp,
        });

        const data = response.data?.data;
        if (data?.verified) {
          setResult(data);
          setStep('verified');
        } else {
          throw new Error('Verification failed');
        }
      } catch (err: any) {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);

        const msg =
          err.response?.data?.message ||
          err.message ||
          'OTP verification failed.';
        setError(msg);

        // If max attempts reached, go to error state
        if (newAttempts >= 3) {
          setStep('error');
        } else {
          setStep('otp_sent'); // Stay on OTP entry for retry
        }
      } finally {
        setIsLoading(false);
      }
    },
    [clientId, otpAttempts]
  );

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setStep('idle');
    setClientId(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    setOtpAttempts(0);
    setAadhaarNumber('');
  }, []);

  /**
   * Resend OTP (generate new OTP for same Aadhaar)
   */
  const resendOtp = useCallback(async () => {
    if (aadhaarNumber) {
      await generateOtp(aadhaarNumber);
    }
  }, [aadhaarNumber, generateOtp]);

  return {
    // State
    step,
    clientId,
    result,
    error,
    isLoading,
    otpAttempts,
    aadhaarNumber,

    // Actions
    generateOtp,
    verifyOtp,
    reset,
    resendOtp,
  };
}
