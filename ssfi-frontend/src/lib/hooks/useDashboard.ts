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
            const response = await api.get('/dashboard');
            if (response.data?.success) {
                setData(response.data.data);
            } else {
                throw new Error(response.data?.message || 'Failed to load dashboard');
            }
        } catch (err: any) {
            // Auto-retry once after delay (handles auth race condition on first load)
            if (retryCount < 1) {
                await new Promise(r => setTimeout(r, 1500));
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
