/**
 * API Client Service
 * Handles all HTTP communication with the ClaudeNest server
 */

import axios, { 
  AxiosInstance, 
  AxiosError, 
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, ApiError } from '@/types';
import { useAuthStore } from '@/stores/authStore';

// API Configuration
const API_BASE_URL = process.env.CLAUDENEST_API_URL || 'https://api.claudenest.app';
const API_VERSION = 'v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt token refresh
        const response = await axios.post(`${API_BASE_URL}/api/${API_VERSION}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data.data;
        
        // Update tokens in store
        useAuthStore.getState().setTokens({
          accessToken: access_token,
          refreshToken: refresh_token,
        });

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // Format error for consistent handling
    const apiError: ApiError = {
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
    };

    return Promise.reject(apiError);
  }
);

// Generic API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data),
};

// Specific API endpoints
export const authApi = {
  login: (email: string) =>
    api.post<{ message: string }>('/auth/magic-link', { email }),
  
  verifyMagicLink: (token: string) =>
    api.post<{
      user: import('@/types').User;
      tokens: { access_token: string; refresh_token: string };
    }>('/auth/magic-link/verify', { token }),

  logout: () => api.post('/auth/logout'),
  
  me: () => api.get<import('@/types').User>('/auth/me'),
};

export const machinesApi = {
  list: () => api.get<import('@/types').Machine[]>('/machines'),
  
  get: (id: string) => api.get<import('@/types').Machine>(`/machines/${id}`),
  
  create: (data: { name: string; token: string }) =>
    api.post<import('@/types').Machine>('/machines', data),
  
  update: (id: string, data: Partial<import('@/types').Machine>) =>
    api.patch<import('@/types').Machine>(`/machines/${id}`, data),
  
  delete: (id: string) => api.delete(`/machines/${id}`),
  
  wake: (id: string) => api.post(`/machines/${id}/wake`),
  
  getEnvironment: (id: string) =>
    api.get<import('@/types').MachineCapabilities>(`/machines/${id}/environment`),
  
  getSkills: (id: string) =>
    api.get<import('@/types').Skill[]>(`/machines/${id}/skills`),
  
  getMCP: (id: string) =>
    api.get<import('@/types').MCPServer[]>(`/machines/${id}/mcp`),
  
  getCommands: (id: string) =>
    api.get<string[]>(`/machines/${id}/commands`),
};

export const sessionsApi = {
  list: (machineId: string) =>
    api.get<import('@/types').Session[]>(`/machines/${machineId}/sessions`),
  
  get: (id: string) => api.get<import('@/types').Session>(`/sessions/${id}`),
  
  create: (machineId: string, data: import('@/types').CreateSessionRequest) =>
    api.post<import('@/types').Session>(`/machines/${machineId}/sessions`, data),
  
  delete: (id: string) => api.delete(`/sessions/${id}`),
  
  getLogs: (id: string, params?: { limit?: number; before?: string }) =>
    api.get<import('@/types').SessionLog[]>(`/sessions/${id}/logs`, { params }),
  
  attach: (id: string) => api.post(`/sessions/${id}/attach`),
};

export const projectsApi = {
  list: (machineId: string) =>
    api.get<import('@/types').SharedProject[]>(`/machines/${machineId}/projects`),
  
  get: (id: string) => api.get<import('@/types').SharedProject>(`/projects/${id}`),
  
  create: (machineId: string, data: { name: string; projectPath: string }) =>
    api.post<import('@/types').SharedProject>(`/machines/${machineId}/projects`, data),
  
  update: (id: string, data: Partial<import('@/types').SharedProject>) =>
    api.patch<import('@/types').SharedProject>(`/projects/${id}`, data),
  
  delete: (id: string) => api.delete(`/projects/${id}`),
  
  getContext: (id: string) =>
    api.get<{
      summary: string;
      architecture: string;
      conventions: string;
      currentFocus: string;
      recentChanges: string;
    }>(`/projects/${id}/context`),
  
  queryContext: (id: string, query: string) =>
    api.post<import('@/types').ContextChunk[]>(`/projects/${id}/context`, { query }),
  
  updateContext: (id: string, data: Partial<import('@/types').SharedProject>) =>
    api.patch(`/projects/${id}/context`, data),
  
  getChunks: (id: string, params?: { type?: string; limit?: number }) =>
    api.get<import('@/types').ContextChunk[]>(`/projects/${id}/context/chunks`, { params }),
  
  summarize: (id: string) =>
    api.post<{ summary: string }>(`/projects/${id}/context/summarize`),
  
  getInstances: (id: string) =>
    api.get<import('@/types').ClaudeInstance[]>(`/projects/${id}/instances`),
  
  getActivity: (id: string, params?: { limit?: number }) =>
    api.get<import('@/types').ActivityLog[]>(`/projects/${id}/activity`, { params }),
  
  broadcast: (id: string, message: string) =>
    api.post(`/projects/${id}/broadcast`, { message }),
};

export const tasksApi = {
  list: (projectId: string) =>
    api.get<import('@/types').SharedTask[]>(`/projects/${projectId}/tasks`),
  
  get: (id: string) => api.get<import('@/types').SharedTask>(`/tasks/${id}`),
  
  create: (projectId: string, data: Partial<import('@/types').SharedTask>) =>
    api.post<import('@/types').SharedTask>(`/projects/${projectId}/tasks`, data),
  
  update: (id: string, data: Partial<import('@/types').SharedTask>) =>
    api.patch<import('@/types').SharedTask>(`/tasks/${id}`, data),
  
  delete: (id: string) => api.delete(`/tasks/${id}`),
  
  claim: (id: string, instanceId: string) =>
    api.post<import('@/types').SharedTask>(`/tasks/${id}/claim`, { instance_id: instanceId }),
  
  release: (id: string) => api.post(`/tasks/${id}/release`),
  
  complete: (id: string, summary: string, filesModified: string[]) =>
    api.post<import('@/types').SharedTask>(`/tasks/${id}/complete`, {
      summary,
      files_modified: filesModified,
    }),
};

export const locksApi = {
  list: (projectId: string) =>
    api.get<import('@/types').FileLock[]>(`/projects/${projectId}/locks`),
  
  create: (projectId: string, path: string, reason?: string) =>
    api.post<import('@/types').FileLock>(`/projects/${projectId}/locks`, {
      path,
      reason,
    }),
  
  delete: (projectId: string, path: string) =>
    api.delete(`/projects/${projectId}/locks/${path}`),
  
  forceDelete: (projectId: string, path: string) =>
    api.delete(`/projects/${projectId}/locks/${path}/force`),
};

export default apiClient;
