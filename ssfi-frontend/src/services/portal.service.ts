const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface State {
    id: number;
    state_name: string;
    code: string;
    logo?: string;
    website?: string;
    districtsCount?: number;
    clubsCount?: number;
    skatersCount?: number;
    eventsCount?: number;
    created_at?: string;
}

export interface District {
    id: number;
    district_name: string;
    code: string;
    state_id: number;
    state_name: string;
    state_code: string;
    clubsCount?: number;
    skatersCount?: number;
    eventsCount?: number;
    created_at?: string;
}

export const portalService = {
    // State APIs
    getAllStates: async (params: { search?: string; page?: number; limit?: number } = {}) => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        const response = await fetch(`${API_URL}/states?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch states');
        return response.json();
    },

    getStateById: async (id: number | string) => {
        const response = await fetch(`${API_URL}/states/${id}`);
        if (!response.ok) throw new Error('Failed to fetch state details');
        const data = await response.json();
        return data.data.state as State;
    },

    // District APIs
    getAllDistricts: async (params: { stateId?: number; search?: string; page?: number; limit?: number } = {}) => {
        const queryParams = new URLSearchParams();
        if (params.stateId) queryParams.append('stateId', params.stateId.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        const response = await fetch(`${API_URL}/districts?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch districts');
        return response.json();
    },

    getDistrictById: async (id: number | string) => {
        const response = await fetch(`${API_URL}/districts/${id}`);
        if (!response.ok) throw new Error('Failed to fetch district details');
        const data = await response.json();
        return data.data.district as District;
    },

    // Event Registration APIs
    getEventRegistrations: async (eventId: number | string, params: any = {}, token?: string) => {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key]) queryParams.append(key, params[key]);
        });

        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/event-registration/${eventId}/registrations?${queryParams.toString()}`, {
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch registrations');
        return response.json();
    },

    exportRegistrations: async (eventId: number | string, token?: string) => {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/event-registration/${eventId}/registrations/export`, {
            headers
        });

        if (!response.ok) {
            throw new Error('Failed to export registrations');
        }

        return response.blob();
    },

    lookupStudent: async (uid: string, eventId: number | string) => {
        // Public endpoint
        const response = await fetch(`${API_URL}/event-registration/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, eventId: Number(eventId) })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Student lookup failed');
        }
        return response.json();
    },

    getAvailableRaces: async (category: string, ageGroup: string) => {
        // Public endpoint
        const response = await fetch(`${API_URL}/event-registration/races?category=${category}&ageGroup=${ageGroup}`);
        if (!response.ok) throw new Error('Failed to fetch races');
        return response.json();
    },

    getMyRegistration: async (eventId: number | string, token: string) => {
        const response = await fetch(`${API_URL}/event-registration/${eventId}/my-registration`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to fetch registration');
        }
        return response.json().then(res => res.data);
    },

    manualRegister: async (data: any, token: string) => {
        const response = await fetch(`${API_URL}/event-registration/manual-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Manual registration failed');
        }
        return response.json();
    }
};
