'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

export type KycStep = 'idle' | 'initializing' | 'waiting_for_user' | 'polling' | 'verified' | 'error';

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 75; // 75 × 4s = 5 min max

// ── Hook ──

export function useKYC() {
  const [step, setStep] = useState<KycStep>('idle');
  const [clientId, setClientId] = useState<string | null>(null);
  const [digilockerUrl, setDigilockerUrl] = useState<string | null>(null);
  const [result, setResult] = useState<KycResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const popupRef = useRef<Window | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  /**
   * Poll the status endpoint until completed or failed
   */
  const startPolling = useCallback((cId: string) => {
    stopPolling();
    pollCountRef.current = 0;
    setStep('polling');

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setError('Verification timed out. Please try again.');
        setStep('error');
        return;
      }

      try {
        const response = await api.get(`/kyc/digilocker/status/${cId}`);
        const data = response.data?.data;

        if (data?.completed && data?.data?.verified) {
          stopPolling();
          setResult(data.data);
          setStep('verified');
          return;
        }

        if (data?.failed) {
          stopPolling();
          setError('Digilocker verification failed. Please try again.');
          setStep('error');
          return;
        }

        // Still in progress — continue polling
      } catch (err: any) {
        // Don't stop polling on transient errors, just log
        console.warn('KYC status poll error:', err.message);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  /**
   * Step 1: Initialize Digilocker session and open popup
   */
  const initializeDigilocker = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStep('initializing');

    try {
      // Build redirect URL — the page the user lands on after Digilocker auth
      const redirectUrl = `${window.location.origin}/kyc/callback`;

      const response = await api.post('/kyc/digilocker/initialize', {
        redirectUrl,
      });

      const data = response.data?.data;
      if (data?.clientId && data?.url) {
        setClientId(data.clientId);
        setDigilockerUrl(data.url);
        setStep('waiting_for_user');

        // Open Digilocker in a popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        const popup = window.open(
          data.url,
          'digilocker_kyc',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        popupRef.current = popup;

        // Start polling for completion
        startPolling(data.clientId);

        // Also detect popup close
        const checkPopupClosed = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkPopupClosed);
            // Don't stop polling immediately — user may have completed auth
            // and we're waiting for status to propagate
          }
        }, 1000);
      } else {
        throw new Error('Failed to initialize Digilocker');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to start Digilocker verification.';
      setError(msg);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [startPolling]);

  /**
   * Open the Digilocker URL again (if popup was blocked or closed)
   */
  const reopenDigilocker = useCallback(() => {
    if (digilockerUrl) {
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      popupRef.current = window.open(
        digilockerUrl,
        'digilocker_kyc',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
    }
  }, [digilockerUrl]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    stopPolling();
    setStep('idle');
    setClientId(null);
    setDigilockerUrl(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  }, [stopPolling]);

  return {
    // State
    step,
    clientId,
    digilockerUrl,
    result,
    error,
    isLoading,

    // Actions
    initializeDigilocker,
    reopenDigilocker,
    reset,
  };
}
