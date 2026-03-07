import { api } from '@/lib/api/client';

export interface RenewalStatus {
    expiryDate: Date | null;
    daysUntilExpiry: number | null;
    needsRenewal: boolean;
    isExpired: boolean;
    showNotification: boolean;
    accountStatus: string;
    lastRenewalDate?: Date;
    registrationDate?: Date;
    message?: string;
}

export interface RenewalHistory {
    registrationDate: Date;
    lastRenewalDate: Date | null;
    expiryDate: Date | null;
    renewalPeriodMonths: number;
    accountStatus: string;
}

export interface ExpiringAccount {
    id: number;
    uid: string;
    name: string;
    email: string | null;
    phone: string;
    role: string;
    expiryDate: Date | null;
    daysUntilExpiry: number | null;
    lastRenewalDate: Date | null;
    accountStatus: string;
}

// User Endpoints

/**
 * Get current user's renewal status
 */
export const getRenewalStatus = async (): Promise<RenewalStatus> => {
    const response = await api.get<RenewalStatus>('/renewal/status');
    return response.data.data;
};

/**
 * Get current user's renewal history
 */
export const getRenewalHistory = async (): Promise<RenewalHistory> => {
    const response = await api.get<RenewalHistory>('/renewal/history');
    return response.data.data;
};

// Admin Endpoints

/**
 * Get expiring accounts (Admin only)
 * @param role Optional role filter
 * @param days Days until expiry (default: 30)
 */
export const getExpiringAccounts = async (
    role?: string,
    days: number = 30
): Promise<ExpiringAccount[]> => {
    const params: Record<string, string> = { days: days.toString() };
    if (role) params.role = role;

    const response = await api.get<ExpiringAccount[]>('/renewal/expiring', { params });
    return response.data.data;
};

/**
 * Get expired/locked accounts (Admin only)
 * @param role Optional role filter
 */
export const getExpiredAccounts = async (role?: string): Promise<ExpiringAccount[]> => {
    const params: Record<string, string> = {};
    if (role) params.role = role;

    const response = await api.get<ExpiringAccount[]>('/renewal/expired', { params });
    return response.data.data;
};

/**
 * Renew a user account (Admin only)
 * @param userId User ID to renew
 * @param paymentConfirmed Whether payment is confirmed
 * @param renewalMonths Number of months (optional, defaults to user's renewalPeriodMonths)
 */
export const renewAccount = async (
    userId: number,
    paymentConfirmed: boolean,
    renewalMonths?: number
): Promise<{ uid: string; expiryDate: Date; accountStatus: string }> => {
    const response = await api.post(`/renewal/${userId}/renew`, {
        renewalMonths,
        paymentConfirmed,
    });
    return response.data.data;
};

/**
 * Unlock a locked account (Admin only)
 * @param userId User ID to unlock
 * @param reason Reason for unlocking
 */
export const unlockAccount = async (
    userId: number,
    reason: string
): Promise<{ uid: string; accountStatus: string }> => {
    const response = await api.post(`/renewal/${userId}/unlock`, { reason });
    return response.data.data;
};

/**
 * Set expiry date manually (Admin only)
 * @param userId User ID
 * @param expiryDate New expiry date
 */
export const setExpiryDate = async (
    userId: number,
    expiryDate: Date | string
): Promise<{ uid: string; expiryDate: Date; accountStatus: string }> => {
    const response = await api.post(`/renewal/${userId}/set-expiry`, { expiryDate });
    return response.data.data;
};

/**
 * Manually trigger locking of expired accounts (Admin only)
 */
export const lockExpiredAccounts = async (): Promise<number> => {
    const response = await api.post<any>('/renewal/lock-expired', {});
    return (response.data as any).count;
};

export const renewalService = {
    getRenewalStatus,
    getRenewalHistory,
    getExpiringAccounts,
    getExpiredAccounts,
    renewAccount,
    unlockAccount,
    setExpiryDate,
    lockExpiredAccounts
};

export default renewalService;
