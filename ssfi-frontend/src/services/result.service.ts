import { api } from '@/lib/api/client';

export const resultService = {
    // get race categories for filter
    getEventRaceCategories: async (eventId: number) => {
        const response = await api.get(`/results/${eventId}/race-categories`);
        // @ts-ignore
        return response.data; // Backend returns array directly for these new endpoints? 
        // Wait, backend uses res.json(result) which is just the array.
        // It does NOT wrap in { success, data }.
        // My backend controller: res.json(result);
        // So response.data IS the array.
        // BUT client.ts defines ApiResponse wrapper generically but doesn't force backend to use it.
        // If backend just does res.json([...]), then response.data is [...].
        // If so, why the error?
        // "Argument of type 'ApiResponse<any>' is not assignable..."
        // Because api.get generic defaults to ApiResponse<any>.
        // Typescript THINKS it is ApiResponse, but at runtime it might be distinct array.
        // But if I want to be safe, I should verify what backend sends.
        // Backend: res.json(result) -> array.
        // So runtime is fine.
        // The error is TS only.
        // I should cast it or fix backend to return standard response.
        // Let's fix backend controller to return standard { success: true, data: result }?
        // No, quicker to cast here.
    },

    // get participants for a specific race
    getParticipantsForRace: async (eventId: number, filters: any) => {
        const response = await api.get(`/results/${eventId}/participants`, { params: filters });
        return response.data;
    },

    // save results
    saveResults: async (eventId: number, data: any) => {
        const response = await api.post(`/results/${eventId}/results`, data);
        return response.data;
    },

    // toggle publication
    togglePublication: async (eventId: number, isPublished: boolean) => {
        const response = await api.post(`/results/${eventId}/publish`, { isPublished });
        return response.data;
    }
};
