
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const dashboardService = {
    getDashboardStats: async () => {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    getStateDashboard: async (stateId: number) => {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/dashboard/state/${stateId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    getDistrictDashboard: async (districtId: number) => {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/dashboard/district/${districtId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};
