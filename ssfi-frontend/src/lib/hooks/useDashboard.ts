'use client';
import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';

import type { DashboardData } from '@/types/dashboard';

export const useDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get('/dashboard');
            if (response.data?.success) {
                setData(response.data.data);
            } else {
                setError(response.data?.message || 'Failed to load dashboard');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load dashboard data');
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
