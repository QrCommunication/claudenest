import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '@/types';

// ============================================================================
// Configuration
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// ============================================================================
// Axios Instance
// ============================================================================

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// ============================================================================
// Request Interceptor
// ============================================================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracing
    if (config.headers) {
      config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add CSRF token for Laravel
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor with Retry Logic
// ============================================================================

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: number };
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Retry logic for network errors and specific status codes
    const shouldRetry = 
      config &&
      (
        !error.response || 
        RETRYABLE_STATUS_CODES.includes(error.response.status)
      );

    // Initialize retry counter if not exists
    const retryCount = config._retry || 0;

    if (shouldRetry && retryCount < MAX_RETRIES) {
      config._retry = retryCount + 1;

      const delay = RETRY_DELAY * Math.pow(2, config._retry - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return api.request(config);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract error message from error object
 * @param error - Error object (unknown type)
 * @returns Human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    return axiosError.response?.data?.error?.message || 
           axiosError.message || 
           'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Extract error code from error object
 * @param error - Error object (unknown type)
 * @returns Error code string
 */
export function getErrorCode(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    return axiosError.response?.data?.error?.code || 'UNKNOWN_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

export default api;
