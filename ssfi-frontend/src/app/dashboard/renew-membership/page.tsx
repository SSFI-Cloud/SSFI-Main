'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, CreditCard, Loader2, AlertTriangle, ExternalLink, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useKYC } from '@/lib/hooks/useKYC';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePayment } from '@/hooks/usePayment';

type Step = 'kyc' | 'kyc_verifying' | 'payment' | 'success';

export default function RenewMembershipPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { step: kycStep, result: kycResult, error: kycError, isLoading: kycLoading, initializeDigilocker, reopenDigilocker, reset: resetKyc } = useKYC();
  const { initiatePayment, isLoading: payLoading } = usePayment({
    onSuccess: () => handlePaymentSuccess(),
  });

  const [step, setStep] = useState<Step>('kyc');
  const [error, setError] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [renewalResult, setRenewalResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // Check if already KYC verified (within 24h)
  useEffect(() => {
    api.get('/renewal/status').then(res => {
      const data = res.data?.data;
      if (data && !data.needsRenewal && data.accountStatus === 'ACTIVE') {
        // Already active, redirect to dashboard
        router.push('/dashboard');
      }
    }).catch(() => {});
  }, [router]);

  // When KYC completes, verify with backend
  useEffect(() => {
    if (kycStep === 'verified' && kycResult && !kycVerified) {
      verifyKycWithBackend();
    }
  }, [kycStep, kycResult]);

  const verifyKycWithBackend = async () => {
    if (!kycResult) return;
    setStep('kyc_verifying');
    setError(null);

    try {
      await api.post('/renewal/verify-kyc', {
        maskedAadhaar: kycResult.maskedAadhaar,
        fullName: kycResult.fullName,
        dob: kycResult.dob,
      });
      setKycVerified(true);
      setStep('payment');
    } catch (err: any) {
      setError(err.response?.data?.message || 'KYC verification failed. Please try again.');
      setStep('kyc');
      resetKyc();
    }
  };

  const handlePayment = async () => {
    setError(null);
    try {
      await initiatePayment(
        {
          amount: 500, // Renewal fee — will be overridden by backend if configured
          payment_type: 'MEMBERSHIP_RENEWAL',
          entity_id: Number(user?.id) || 0,
          entity_type: 'USER',
          notes: { purpose: 'Membership Renewal' },
        },
        { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
      );
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Payment failed');
    }
  };

  const handlePaymentSuccess = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await api.post('/renewal/self-renew', { paymentId: 'razorpay_confirmed' });
      setRenewalResult(res.data?.data);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Renewal failed after payment. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" /> Renew Membership
          </h1>
          <p className="text-teal-100 text-sm mt-1">Complete identity verification and payment to renew your SSFI membership</p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            {(['kyc', 'payment', 'success'] as const).map((s, i) => {
              const labels = ['Identity Verification', 'Payment', 'Complete'];
              const isActive = step === s || (s === 'kyc' && step === 'kyc_verifying');
              const isDone = (s === 'kyc' && (step === 'payment' || step === 'success')) ||
                             (s === 'payment' && step === 'success');
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-8 h-0.5 ${isDone ? 'bg-teal-500' : 'bg-gray-200'}`} />}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-teal-500 text-white' : isActive ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-500' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${isActive || isDone ? 'text-gray-900' : 'text-gray-400'}`}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: KYC Verification */}
          {(step === 'kyc' || step === 'kyc_verifying') && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Aadhaar Verification Required</h3>
                <p className="text-sm text-blue-700">
                  To renew your membership, you must verify your identity through Digilocker.
                  Your Aadhaar details will be compared with our records.
                </p>
              </div>

              {kycStep === 'verified' && kycResult ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Identity Verified</span>
                  </div>
                  <p className="text-sm text-green-700">Name: {kycResult.fullName}</p>
                  <p className="text-sm text-green-700">Aadhaar: {kycResult.maskedAadhaar}</p>
                  {step === 'kyc_verifying' && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying with SSFI records...
                    </div>
                  )}
                </div>
              ) : kycStep === 'waiting_for_user' || kycStep === 'polling' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                    <span className="font-semibold text-yellow-900">Waiting for Digilocker...</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">Complete the verification in the Digilocker popup window.</p>
                  <button onClick={reopenDigilocker} className="text-sm text-yellow-800 underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Reopen Digilocker window
                  </button>
                </div>
              ) : (
                <button
                  onClick={initializeDigilocker}
                  disabled={kycLoading}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {kycLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  Verify with Digilocker
                </button>
              )}

              {kycError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{kycError}</p>
                  <button onClick={resetKyc} className="text-sm text-red-800 underline mt-1">Try Again</button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-900 font-medium">Identity verified successfully</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Renewal Payment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete the payment to renew your SSFI membership for 12 months.
                </p>
                <button
                  onClick={handlePayment}
                  disabled={payLoading || processing}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payLoading || processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Pay & Renew
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Membership Renewed!</h3>
              <p className="text-gray-600">
                Your SSFI membership has been renewed successfully.
              </p>
              {renewalResult && (
                <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-1">
                  <p><span className="text-gray-500">UID:</span> <span className="font-mono font-bold">{renewalResult.uid}</span></p>
                  <p><span className="text-gray-500">Valid until:</span> <span className="font-bold text-green-700">{new Date(renewalResult.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                  <p><span className="text-gray-500">Status:</span> <span className="text-green-600 font-semibold">{renewalResult.accountStatus}</span></p>
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
