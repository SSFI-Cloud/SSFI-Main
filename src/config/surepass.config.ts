// SurePass KYC Configuration
// Environment variables required:
// SUREPASS_BASE_URL - SurePass API base URL (default: https://kyc-api.surepass.io/api/v1)
// SUREPASS_API_TOKEN - Your SurePass Bearer Token

const baseUrl = process.env.SUREPASS_BASE_URL || 'https://kyc-api.surepass.io/api/v1';
const apiToken = process.env.SUREPASS_API_TOKEN || '';

if (!apiToken) {
  console.warn('⚠️ SurePass API token not configured - KYC verification will be disabled');
}

export const surepassConfig = {
  baseUrl,
  apiToken,

  // Endpoints
  endpoints: {
    generateOtp: '/aadhaar-v2/generate-otp',
    submitOtp: '/aadhaar-v2/submit-otp',
  },

  // Timeouts & Limits
  requestTimeout: 30000,     // 30s timeout for SurePass API calls
  otpTtlSeconds: 300,        // 5 minute TTL for OTP sessions
  maxOtpRetries: 3,          // Max OTP submission attempts per session
  maxGenerateRetries: 2,     // Max OTP generation attempts per Aadhaar per window
};

export const isSurepassConfigured = (): boolean => {
  return !!apiToken;
};
