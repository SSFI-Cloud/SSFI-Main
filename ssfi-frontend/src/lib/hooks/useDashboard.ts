'use client';
import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';

import type { DashboardData } from '@/types/dashboard';

export const useDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async (retryCount = 0) => {
        setIsLoading(true);
        setError(null);

        try {
            // Wait for auth token to be available (race condition on first load after login)
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!token && retryCount < 3) {
                await new Promise(r => setTimeout(r, 500));
                return fetchDashboard(retryCount + 1);
            }

            const response = await api.get('/dashboard');
            if (response.data?.success) {
                setData(response.data.data);
            } else {
                throw new Error(response.data?.message || 'Failed to load dashboard');
            }
        } catch (err: any) {
            // Auto-retry after delay (handles auth race condition on first load)
            if (retryCount < 3) {
                await new Promise(r => setTimeout(r, 1000));
                return fetchDashboard(retryCount + 1);
            }
            setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        data,
        isLoading,
        error,
        fetchDashboard,
        refetch: fetchDashboard,
    };
};

export default useDashboard;
