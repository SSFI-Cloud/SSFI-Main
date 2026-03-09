'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle2, AlertCircle, Loader2, RotateCcw, ExternalLink, Camera, Upload } from 'lucide-react';
import { useKYC, KycResult } from '@/lib/hooks/useKYC';

interface AadhaarKYCVerificationProps {
  onVerified: (result: KycResult) => void;
  onProfilePhotoChoice?: (useAadhaarPhoto: boolean, base64?: string) => void;
  showProfilePhotoChoice?: boolean;
  colorScheme?: 'green' | 'emerald' | 'teal';
  initialResult?: KycResult | null;
}

const COLOR_MAP = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    btn: 'bg-green-600 hover:bg-green-700',
    btnOutline: 'border-green-600 text-green-600 hover:bg-green-50',
    icon: 'text-green-500',
    ring: 'focus:ring-green-500',
    badge: 'bg-green-100 text-green-800',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    btnOutline: 'border-emerald-600 text-emerald-600 hover:bg-emerald-50',
    icon: 'text-emerald-500',
    ring: 'focus:ring-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    btn: 'bg-teal-600 hover:bg-teal-700',
    btnOutline: 'border-teal-600 text-teal-600 hover:bg-teal-50',
    icon: 'text-teal-500',
    ring: 'focus:ring-teal-500',
    badge: 'bg-teal-100 text-teal-800',
  },
};

export default function AadhaarKYCVerification({
  onVerified,
  onProfilePhotoChoice,
  showProfilePhotoChoice = false,
  colorScheme = 'emerald',
  initialResult = null,
}: AadhaarKYCVerificationProps) {
  const colors = COLOR_MAP[colorScheme];
  const { step, result, error, isLoading, initializeDigilocker, reopenDigilocker, reset } = useKYC();

  // Local state
  const [profilePhotoChosen, setProfilePhotoChosen] = useState(false);
  const [preVerified, setPreVerified] = useState<KycResult | null>(initialResult);

  // Notify parent when verified
  useEffect(() => {
    if (result?.verified) {
      onVerified(result);
    }
  }, [result, onVerified]);

  const handleReset = () => {
    reset();
    setPreVerified(null);
    setProfilePhotoChosen(false);
  };

  const handleProfilePhotoChoice = useCallback((useAadhaar: boolean) => {
    setProfilePhotoChosen(true);
    const activeResult = result || preVerified;
    onProfilePhotoChoice?.(useAadhaar, useAadhaar ? activeResult?.profileImage : undefined);
  }, [result, preVerified, onProfilePhotoChoice]);

  // ── Pre-verified / Verified state ──
  const activeResult = result || preVerified;
  if (activeResult?.verified && step !== 'polling' && step !== 'initializing') {
    return (
      <div className={`rounded-xl ${colors.bg} ${colors.border} border p-5`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${colors.badge} flex items-center justify-center flex-shrink-0`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold ${colors.text}`}>Aadhaar Verified</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>KYC Complete</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{activeResult.fullName}</p>
            <p className="text-xs text-gray-500">{activeResult.maskedAadhaar}</p>
            {activeResult.dob && (
              <p className="text-xs text-gray-500 mt-0.5">
                DOB: {new Date(activeResult.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}

            {/* Profile Photo Choice */}
            {showProfilePhotoChoice && activeResult.profileImage && !profilePhotoChosen && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Profile Photo</p>
                <div className="flex items-center gap-3">
                  {activeResult.profileImage && (
                    <img
                      src={`data:image/jpeg;base64,${activeResult.profileImage}`}
                      alt="Aadhaar Photo"
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleProfilePhotoChoice(true)}
                      className={`text-xs px-3 py-1.5 rounded-lg ${colors.btn} text-white flex items-center gap-1`}
                    >
                      <Camera className="w-3 h-3" /> Use Aadhaar Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProfilePhotoChoice(false)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Upload Different
                    </button>
                  </div>
                </div>
              </div>
            )}

            {profilePhotoChosen && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Profile photo selected
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline flex-shrink-0"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (step === 'error') {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Verification failed</p>
            <p className="text-xs text-red-600 mt-1">{error || 'Something went wrong. Please try again.'}</p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-3 text-xs px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting for user / Polling state ──
  if (step === 'waiting_for_user' || step === 'polling') {
    return (
      <div className={`rounded-xl border ${colors.border} p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className={`w-4 h-4 ${colors.icon}`} />
          <span className="text-sm font-semibold text-gray-900">Digilocker Verification</span>
        </div>

        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Waiting for Digilocker authentication...
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Complete the verification in the Digilocker popup window. This page will update automatically.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="text-gray-400 hover:text-gray-600 underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={reopenDigilocker}
            className={`${colors.text} hover:underline font-medium flex items-center gap-1`}
          >
            <ExternalLink className="w-3 h-3" /> Reopen Digilocker
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / Initial state — "Verify with Digilocker" button ──
  return (
    <div className={`rounded-xl border ${colors.border} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className={`w-4 h-4 ${colors.icon}`} />
        <span className="text-sm font-semibold text-gray-900">Aadhaar KYC Verification</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Verify your identity using Digilocker. A popup will open where you can authenticate with your Aadhaar-linked mobile number.
      </p>

      <button
        type="button"
        onClick={initializeDigilocker}
        disabled={isLoading}
        className={`w-full px-5 py-3 rounded-lg text-sm font-medium text-white ${colors.btn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Shield className="w-4 h-4" />
        )}
        {isLoading ? 'Starting verification...' : 'Verify with Digilocker'}
      </button>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
