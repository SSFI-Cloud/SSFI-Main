import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - fall through to clear & redirect
      }

      // No refresh token or refresh failed - clear everything and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Avoid redirect loop if already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - Account expired or not approved
    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Access denied';

      // Don't redirect expired users - let them see the dashboard with renewal banner
      // Just show the error message
      if (message.includes('approval')) {
        toast.error('Your account is pending approval.');
      } else {
        toast.error(message);
      }
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      toast.error('Resource not found');
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    }

    // Network error
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── GET request deduplication + short-lived cache ──
// Identical GET requests within the TTL window share one network call.
// This eliminates duplicate /stats/public and /registration-windows calls.
const _getCache = new Map<string, { data: any; ts: number }>();
const _inflight = new Map<string, Promise<any>>();
const GET_CACHE_TTL = 60_000; // 60 seconds

function cachedGet<T = any>(url: string, config?: AxiosRequestConfig) {
  const key = url + (config?.params ? JSON.stringify(config.params) : '');

  // Return cached response if still fresh
  const cached = _getCache.get(key);
  if (cached && Date.now() - cached.ts < GET_CACHE_TTL) {
    return Promise.resolve(cached.data);
  }

  // Deduplicate: reuse in-flight request for the same URL
  const inflight = _inflight.get(key);
  if (inflight) return inflight;

  const promise = apiClient
    .get<ApiResponse<T>>(url, config)
    .then((res) => {
      _getCache.set(key, { data: res, ts: Date.now() });
      _inflight.delete(key);
      return res;
    })
    .catch((err) => {
      _inflight.delete(key);
      throw err;
    });

  _inflight.set(key, promise);
  return promise;
}

// Generic API methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    cachedGet<T>(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config),
};

// File upload helper
export const uploadFile = async (
  endpoint: string,
  file: File,
  fieldName: string = 'file',
  additionalData?: Record<string, any>
) => {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Multiple files upload
export const uploadMultipleFiles = async (
  endpoint: string,
  files: File[],
  fieldName: string = 'files',
  additionalData?: Record<string, any>
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append(fieldName, file);
  });

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default apiClient;
