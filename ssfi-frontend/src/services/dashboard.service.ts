import { api } from '@/lib/api/client';

export const dashboardService = {
    getDashboardStats: async () => {
        const response = await api.get('/dashboard');
        return response.data;
    },

    getStateDashboard: async (stateId: number) => {
        const response = await api.get(`/dashboard/state/${stateId}`);
        return response.data;
    },

    getDistrictDashboard: async (districtId: number) => {
        const response = await api.get(`/dashboard/district/${districtId}`);
        return response.data;
    },
};
