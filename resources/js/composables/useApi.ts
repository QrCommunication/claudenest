import { ref } from 'vue';
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';
import { useToast } from './useToast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function useApi() {
  return api;
}

interface ParsedError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

interface UseQueryOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ParsedError) => void;
  showErrorToast?: boolean;
}

export function useQuery<T>(
  url: string,
  options: UseQueryOptions<T> = {}
) {
  const data = ref<T | null>(null);
  const isLoading = ref(false);
  const error = ref<ParsedError | null>(null);
  const { showErrorToast = true } = options;
  const toast = useToast();

  const fetch = async (config?: AxiosRequestConfig) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<T>(url, config);
      data.value = response.data;
      options.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const apiError = parseError(err);
      error.value = apiError;
      options.onError?.(apiError);
      
      if (showErrorToast) {
        toast.error(apiError.message);
      }
      throw apiError;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    data,
    isLoading,
    error,
    fetch,
  };
}

export function useMutation<T, D = unknown>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options: UseQueryOptions<T> = {}
) {
  const data = ref<T | null>(null);
  const isLoading = ref(false);
  const error = ref<ApiError | null>(null);
  const { showErrorToast = true, onSuccess } = options;
  const toast = useToast();

  const mutate = async (payload?: D, config?: AxiosRequestConfig) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api[method]<T>(url, payload, config);
      data.value = response.data;
      onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const apiError = parseError(err);
      error.value = apiError;
      options.onError?.(apiError);
      
      if (showErrorToast) {
        toast.error(apiError.message);
      }
      throw apiError;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}

interface ParsedError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

function parseError(error: unknown): ParsedError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return {
      code: axiosError.response?.data?.code || 'UNKNOWN_ERROR',
      message: axiosError.response?.data?.message || axiosError.message,
      errors: axiosError.response?.data?.errors,
      status: axiosError.response?.status || 500,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    status: 500,
  };
}

export { api };
