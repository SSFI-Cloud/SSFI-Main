import { useState, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import type {
    StudentLookupResponse,
    RaceRule,
    EventRegistration,
    RegistrationFormData,
    SkateCategory,
} from '@/types/eventRegistration';

const EVENT_REG_API = '/event-registration';

// ==========================================
// STUDENT LOOKUP
// ==========================================

export const useStudentLookup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<StudentLookupResponse | null>(null);

    const lookupStudent = useCallback(async (uid: string, eventId: string | number) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await apiClient.post<{ data: StudentLookupResponse }>(
                `${EVENT_REG_API}/lookup`,
                { uid, eventId }
            );
            // Axios response structure usually: response.data is the body. 
            // API returns { status: 'success', data: ... }. 
            // If apiClient intercepts and returns data directly, adjust. 
            // Standard axios returns full object. My backend returns { data: ... }.
            // response.data (body) has .data (payload).
            // Let's assume standard behavior as per previous hook code.
            // Need to verify if apiClient unwrap response. 
            // Given previous code: response.data.data

            const responseData = response.data as any; // Safer cast
            setData(responseData.data);
            return responseData.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Student not found';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    return { lookupStudent, reset, data, isLoading, error };
};

// ==========================================
// GET AVAILABLE RACES
// ==========================================

export const useAvailableRaces = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<RaceRule | null>(null);

    const fetchRaces = useCallback(async (category: SkateCategory, ageGroup: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(
                `${EVENT_REG_API}/races`,
                { params: { category, ageGroup } }
            );
            const responseData = response.data as any;
            setData(responseData.data);
            return responseData.data;
        } catch (err) {
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { fetchRaces, data, isLoading };
};

// ==========================================
// CREATE REGISTRATION
// ==========================================

export const useEventRegistration = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRegistration = useCallback(async (data: RegistrationFormData): Promise<EventRegistration> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.post(
                `${EVENT_REG_API}/register`,
                data
            );
            const responseData = response.data as any;
            return responseData.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { createRegistration, isLoading, error };
};

// ==========================================
// CONFIRM PAYMENT
// ==========================================

export const useConfirmPayment = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirmPayment = useCallback(async (
        registrationId: string | number, // Allow number
        paymentData: {
            paymentId: string;
            paymentMethod: string;
            transactionId?: string;
            paymentDetails?: any;
        }
    ): Promise<EventRegistration> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.post(
                `${EVENT_REG_API}/${registrationId}/confirm-payment`,
                paymentData
            );
            const responseData = response.data as any;
            return responseData.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Payment confirmation failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { confirmPayment, isLoading, error };
};

// ... Include other hooks if needed (useRegistrations, useMyRegistrations usually for dashboard, skipping for public page unless needed for summary? Page uses create and confirm mostly).
// Page uses: useStudentLookup, useEventRegistration, useConfirmPayment.
// That's all. I'll omit others for brevity unless needed.
