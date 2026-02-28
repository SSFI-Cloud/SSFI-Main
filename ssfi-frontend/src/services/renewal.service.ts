import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

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
    const response = await axios.get<{ success: boolean; data: RenewalStatus }>(
        `${API_URL}/renewal/status`,
        { headers: getAuthHeaders() }
    );
    return response.data.data;
};

/**
 * Get current user's renewal history
 */
export const getRenewalHistory = async (): Promise<RenewalHistory> => {
    const response = await axios.get<{ success: boolean; data: RenewalHistory }>(
        `${API_URL}/renewal/history`,
        { headers: getAuthHeaders() }
    );
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
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    params.append('days', days.toString());

    const response = await axios.get<{ success: boolean; data: ExpiringAccount[]; count: number }>(
        `${API_URL}/renewal/expiring?${params.toString()}`,
        { headers: getAuthHeaders() }
    );
    return response.data.data;
};

/**
 * Get expired/locked accounts (Admin only)
 * @param role Optional role filter
 */
export const getExpiredAccounts = async (role?: string): Promise<ExpiringAccount[]> => {
    const params = role ? `?role=${role}` : '';
    const response = await axios.get<{ success: boolean; data: ExpiringAccount[]; count: number }>(
        `${API_URL}/renewal/expired${params}`,
        { headers: getAuthHeaders() }
    );
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
    const response = await axios.post<{ success: boolean; message: string; data: any }>(
        `${API_URL}/renewal/${userId}/renew`,
        { renewalMonths, paymentConfirmed },
        { headers: getAuthHeaders() }
    );
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
    const response = await axios.post<{ success: boolean; message: string; data: any }>(
        `${API_URL}/renewal/${userId}/unlock`,
        { reason },
        { headers: getAuthHeaders() }
    );
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
    const response = await axios.post<{ success: boolean; message: string; data: any }>(
        `${API_URL}/renewal/${userId}/set-expiry`,
        { expiryDate },
        { headers: getAuthHeaders() }
    );
    return response.data.data;
};

/**
 * Manually trigger locking of expired accounts (Admin only)
 */
export const lockExpiredAccounts = async (): Promise<number> => {
    const response = await axios.post<{ success: boolean; message: string; count: number }>(
        `${API_URL}/renewal/lock-expired`,
        {},
        { headers: getAuthHeaders() }
    );
    return response.data.count;
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
