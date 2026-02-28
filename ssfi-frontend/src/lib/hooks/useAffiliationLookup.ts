import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export type RegistrationType = 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB' | 'STUDENT';

export interface MemberLookupResult {
  type: RegistrationType;
  uid: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  stateName?: string;
  districtName?: string;
  clubName?: string;
  contactPerson?: string;
  expiryDate: string | null;
  accountStatus: string | null;
  id: string | number;
}

export const useAffiliationLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MemberLookupResult | null>(null);

  const lookup = useCallback(async (type: RegistrationType, identifier: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiClient.get('/affiliations/lookup', {
        params: { type, identifier: identifier.trim() },
      });
      const member = response.data.data as MemberLookupResult;
      setResult(member);
      return member;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Member not found. Check your phone number or UID.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { lookup, result, isLoading, error, reset };
};

export interface RenewalOrderResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  userDetails: { name: string; email: string; phone: string };
  member: MemberLookupResult;
}

export const useRenewal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateRenewal = useCallback(async (
    type: RegistrationType,
    identifier: string
  ): Promise<RenewalOrderResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/affiliations/renew/initiate', { type, identifier });
      return response.data.data as RenewalOrderResult;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to initiate renewal.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyRenewal = useCallback(async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/affiliations/renew/verify', paymentData);
      return response.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to verify renewal payment.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { initiateRenewal, verifyRenewal, isLoading, error };
};
