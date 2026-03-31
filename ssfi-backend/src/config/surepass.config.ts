// SurePass KYC Configuration (Digilocker Via Link)
// Environment variables required:
// SUREPASS_BASE_URL - SurePass API base URL (default: https://kyc-api.surepass.io/api/v1)
// SUREPASS_API_TOKEN - Your SurePass Bearer Token

const baseUrl = process.env.SUREPASS_BASE_URL || 'https://kyc-api.surepass.app/api/v1';
const apiToken = process.env.SUREPASS_API_TOKEN || '';

if (!apiToken) {
  console.warn('⚠️ SurePass API token not configured - KYC verification will be disabled');
}

export const surepassConfig = {
  baseUrl,
  apiToken,

  // Digilocker Via Link Endpoints
  endpoints: {
    initialize: '/digilocker/initialize',
    status: '/digilocker/status',   // GET /digilocker/status/{client_id}
  },

  // Timeouts & Limits
  requestTimeout: 30000,           // 30s timeout for SurePass API calls
  sessionTtlSeconds: 600,          // 10 minute TTL for Digilocker sessions (matches SurePass expiry)
  statusPollMaxAttempts: 60,       // Max polling attempts (60 × 5s = 5 min max)
  statusPollIntervalMs: 5000,      // 5 seconds between status polls
};

export const isSurepassConfigured = (): boolean => {
  return !!apiToken;
};
