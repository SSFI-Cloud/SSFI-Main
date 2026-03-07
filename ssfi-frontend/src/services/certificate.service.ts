import { api } from '@/lib/api/client';

export const certificateService = {
    // get available certificates
    getMyCertificates: async () => {
        const response = await api.get(`/certificates/my`);
        // @ts-ignore
        return response.data;
    }
};
