'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, CheckCircle2, AlertCircle, Loader2, RotateCcw, Smartphone, User, Camera, Upload } from 'lucide-react';
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

const OTP_COUNTDOWN_SECONDS = 120; // 2 minutes

export default function AadhaarKYCVerification({
  onVerified,
  onProfilePhotoChoice,
  showProfilePhotoChoice = false,
  colorScheme = 'emerald',
  initialResult = null,
}: AadhaarKYCVerificationProps) {
  const colors = COLOR_MAP[colorScheme];
  const { step, result, error, isLoading, otpAttempts, generateOtp, verifyOtp, reset, resendOtp } = useKYC();

  // Local state
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [profilePhotoChosen, setProfilePhotoChosen] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // If initial result is provided (re-render), use it
  const [preVerified, setPreVerified] = useState<KycResult | null>(initialResult);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === 'otp_sent' && countdown <= 0) {
      setCountdown(OTP_COUNTDOWN_SECONDS);
    }
  }, [step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus OTP input when OTP is sent
  useEffect(() => {
    if (step === 'otp_sent' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Notify parent when verified
  useEffect(() => {
    if (result?.verified) {
      onVerified(result);
    }
  }, [result, onVerified]);

  // Aadhaar input masking: show as "XXXX XXXX 1234" while typing
  const handleAadhaarChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    setAadhaarInput(digits);
  };

  const maskedAadhaar = aadhaarInput.length === 12
    ? `XXXX XXXX ${aadhaarInput.slice(-4)}`
    : aadhaarInput.replace(/(\d{4})(?=\d)/g, '$1 ');

  const handleGenerateOtp = async () => {
    if (aadhaarInput.length !== 12) return;
    await generateOtp(aadhaarInput);
    setOtpInput('');
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) return;
    await verifyOtp(otpInput);
  };

  const handleResendOtp = async () => {
    setOtpInput('');
    setCountdown(0);
    await resendOtp();
  };

  const handleReset = () => {
    reset();
    setAadhaarInput('');
    setOtpInput('');
    setCountdown(0);
    setPreVerified(null);
    setProfilePhotoChosen(false);
  };

  const handleProfilePhotoChoice = useCallback((useAadhaar: boolean) => {
    setProfilePhotoChosen(true);
    const activeResult = result || preVerified;
    onProfilePhotoChoice?.(useAadhaar, useAadhaar ? activeResult?.profileImage : undefined);
  }, [result, preVerified, onProfilePhotoChoice]);

  // ── Pre-verified state ──
  const activeResult = result || preVerified;
  if (activeResult?.verified && step !== 'otp_sent' && step !== 'verifying') {
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

  // ── Error state (max retries exceeded) ──
  if (step === 'error' && otpAttempts >= 3) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Verification attempts exceeded</p>
            <p className="text-xs text-red-600 mt-1">{error || 'Please wait a few minutes and try again.'}</p>
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

  return (
    <div className="space-y-4">
      {/* Step 1: Aadhaar Number Input */}
      {(step === 'idle' || step === 'error' || step === 'entering_aadhaar') && (
        <div className={`rounded-xl border ${colors.border} p-5`}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-sm font-semibold text-gray-900">Aadhaar KYC Verification</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Enter your 12-digit Aadhaar number. An OTP will be sent to your Aadhaar-linked mobile number.
          </p>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 12-digit Aadhaar number"
                value={aadhaarInput.replace(/(\d{4})(?=\d)/g, '$1 ')}
                onChange={(e) => handleAadhaarChange(e.target.value)}
                maxLength={14} // 12 digits + 2 spaces
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm ${colors.ring} focus:ring-2 focus:border-transparent outline-none`}
                disabled={isLoading}
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateOtp}
              disabled={aadhaarInput.length !== 12 || isLoading}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white ${colors.btn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
              Send OTP
            </button>
          </div>

          {error && step === 'error' && otpAttempts < 3 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: OTP Entry */}
      {(step === 'otp_sent' || step === 'verifying') && (
        <div className={`rounded-xl border ${colors.border} p-5`}>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-sm font-semibold text-gray-900">Enter OTP</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            OTP sent to mobile number linked with Aadhaar {maskedAadhaar}
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={otpInput}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpInput(digits);
                }}
                maxLength={6}
                className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-center tracking-[0.3em] font-mono ${colors.ring} focus:ring-2 focus:border-transparent outline-none`}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && otpInput.length === 6) handleVerifyOtp();
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpInput.length !== 6 || isLoading}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white ${colors.btn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Verify
            </button>
          </div>

          {/* Error + retry info */}
          {error && (
            <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error} {otpAttempts < 3 && `(${3 - otpAttempts} attempt${3 - otpAttempts !== 1 ? 's' : ''} remaining)`}</span>
            </div>
          )}

          {/* Resend / Back controls */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleReset}
              className="text-gray-400 hover:text-gray-600 underline"
            >
              Change Aadhaar
            </button>
            {countdown > 0 ? (
              <span className="text-gray-400">
                Resend OTP in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className={`${colors.text} hover:underline font-medium`}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
