import { useState, useCallback } from 'react';
import apiClient from '../api/client';
import type {
  Student,
  StudentListResponse,
  StudentStatsResponse,
  StudentQueryParams,
  StudentRegistrationData,
  State,
  District,
  Club,
  AgeCategory,
} from '@/types/student';

// Base API path
const STUDENTS_API = '/students';
const STUDENT_REGISTRATION_API = '/affiliations/student';
const LOCATIONS_API = '/locations';

// ============================================
// STUDENT HOOKS
// ============================================

/** Helper: build student registration FormData from typed data */
const buildStudentFormData = (data: StudentRegistrationData): FormData => {
  const formData = new FormData();
  // Fields that are file uploads (base64 data URIs or File objects)
  const fileFields = ['profilePhoto', 'birthCertificate'];
  // Fields to skip entirely (not sent to backend)
  const skipFields = ['termsAccepted', 'photoFile', 'birthCertificateFile'];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && !skipFields.includes(key)) {
      if (fileFields.includes(key)) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'string' && value.startsWith('data:')) {
          const byteString = atob(value.split(',')[1]);
          const mimeString = value.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          formData.append(key, blob, `${key}.${mimeString.split('/')[1]}`);
        } else if (typeof value === 'string' && value) {
          formData.append(key, value);
        }
      } else {
        formData.append(key, String(value));
      }
    }
  });
  return formData;
};

export interface StudentPaymentOrder {
  uid: string;
  name: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  userDetails: { name: string; email: string; phone: string };
}

/**
 * Hook for registering a new student (with payment flow)
 */
export const useRegisterStudent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Legacy: direct registration without payment */
  const registerStudent = useCallback(async (data: StudentRegistrationData): Promise<Student> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = buildStudentFormData(data);
      const response = await apiClient.post<{ data: Student }>(STUDENT_REGISTRATION_API, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to register student';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Step 1: Submit registration + create Razorpay order */
  const initiateStudentRegistration = useCallback(async (data: StudentRegistrationData): Promise<StudentPaymentOrder> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = buildStudentFormData(data);
      const response = await apiClient.post<{ data: StudentPaymentOrder }>(
        `${STUDENT_REGISTRATION_API}/initiate`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to initiate registration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Step 2: Verify Razorpay payment */
  const verifyStudentPayment = useCallback(async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; uid: string; message: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<{ data: { success: boolean; uid: string; message: string } }>(
        `${STUDENT_REGISTRATION_API}/verify`,
        paymentData,
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Payment verification failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { registerStudent, initiateStudentRegistration, verifyStudentPayment, isLoading, error };
};

/**
 * Hook for fetching students list
 */
export const useStudents = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentListResponse | null>(null);

  const fetchStudents = useCallback(async (params?: StudentQueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: StudentListResponse }>(STUDENTS_API, {
        params,
      });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch students';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchStudents, data, isLoading, error };
};

/**
 * Hook for fetching a single student
 */
export const useStudent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Student | null>(null);

  const fetchStudent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: Student }>(`${STUDENTS_API}/${id}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch student';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStudentByUID = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: Student }>(`${STUDENTS_API}/uid/${uid}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch student';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchStudent, fetchStudentByUID, data, isLoading, error };
};

/**
 * Hook for fetching student statistics
 */
export const useStudentStats = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentStatsResponse | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: StudentStatsResponse }>(`${STUDENTS_API}/stats`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch statistics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchStats, data, isLoading, error };
};

/**
 * Hook for student approval/rejection
 */
export const useStudentApproval = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveStudent = useCallback(async (id: string): Promise<Student> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ data: Student }>(`${STUDENTS_API}/${id}/approve`);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to approve student';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectStudent = useCallback(async (id: string, remarks: string): Promise<Student> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ data: Student }>(`${STUDENTS_API}/${id}/reject`, {
        remarks,
      });
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reject student';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { approveStudent, rejectStudent, isLoading, error };
};

// ============================================
// LOCATION HOOKS
// ============================================

/**
 * Hook for fetching states
 */
export const useStates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<State[]>([]);

  const fetchStates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: State[] }>(`${LOCATIONS_API}/states`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch states';
      console.warn('useStates error:', errorMessage);
      setError(errorMessage);
      // Suppress crash: throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchStates, data, isLoading, error };
};

/**
 * Hook for fetching districts by state
 */
export const useDistricts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<District[]>([]);

  const fetchDistricts = useCallback(async (stateId: string) => {
    if (!stateId) {
      setData([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: District[] }>(
        `${LOCATIONS_API}/states/${stateId}/districts`
      );
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch districts';
      console.warn('useDistricts error:', errorMessage);
      setError(errorMessage);
      // throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearDistricts = useCallback(() => {
    setData([]);
  }, []);

  return { fetchDistricts, clearDistricts, data, isLoading, error };
};

/**
 * Hook for fetching clubs by district
 */
export const useClubs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Club[]>([]);

  const fetchClubs = useCallback(async (districtId: string) => {
    if (!districtId) {
      setData([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: Club[] }>(
        `${LOCATIONS_API}/districts/${districtId}/clubs`
      );
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch clubs';
      console.warn('useClubs error:', errorMessage);
      setError(errorMessage);
      // throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchClubs = useCallback(async (params: { stateId?: string; districtId?: string; search?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: Club[] }>(`${LOCATIONS_API}/clubs`, { params });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to search clubs';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearClubs = useCallback(() => {
    setData([]);
  }, []);

  return { fetchClubs, searchClubs, clearClubs, data, isLoading, error };
};

/**
 * Hook for fetching age categories
 */
export const useAgeCategories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgeCategory[]>([]);

  const fetchAgeCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: AgeCategory[] }>(`${STUDENTS_API}/age-categories`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch age categories';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAgeCategories, data, isLoading, error };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate age from date of birth.
 * Default cutoff: January 1 of the current year.
 */
export const calculateAge = (dateOfBirth: string, cutoffDate?: string): number => {
  const cutoff = cutoffDate
    ? new Date(cutoffDate)
    : new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
  const dob = new Date(dateOfBirth);

  let age = cutoff.getFullYear() - dob.getFullYear();
  const monthDiff = cutoff.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && cutoff.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get age category from age (as of Jan 1 cutoff).
 * Categories: U-4, U-6, U-8, U-10, U-12, U-14, U-16, Above 16, Masters 30+
 */
export const getAgeCategoryFromAge = (age: number): string => {
  if (age < 4)  return 'U-4';
  if (age < 6)  return 'U-6';
  if (age < 8)  return 'U-8';
  if (age < 10) return 'U-10';
  if (age < 12) return 'U-12';
  if (age < 14) return 'U-14';
  if (age < 16) return 'U-16';
  if (age < 30) return 'Above 16';
  return 'Masters 30+';
};
