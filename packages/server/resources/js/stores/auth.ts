import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, ApiResponse } from '@/types';
import { api } from '@/composables/useApi';
import axios from 'axios';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface ForgotPasswordForm {
  email: string;
}

interface ResetPasswordForm {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const isLoading = ref(false);
  const authError = ref<string | null>(null);
  const fieldErrors = ref<Record<string, string[]>>({});

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const setToken = (newToken: string | null) => {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  const clearErrors = () => {
    authError.value = null;
    fieldErrors.value = {};
  };

  const handleError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      if (data?.error?.message) {
        authError.value = data.error.message;
      } else if (data?.message) {
        authError.value = data.message;
      } else {
        authError.value = 'An unexpected error occurred';
      }
      if (data?.errors) {
        fieldErrors.value = data.errors;
      }
    } else {
      authError.value = error instanceof Error ? error.message : 'An unexpected error occurred';
    }
  };

  const fetchUser = async () => {
    if (!token.value) return null;

    try {
      isLoading.value = true;
      const response = await api.get<ApiResponse<User>>('/auth/me');
      user.value = response.data.data;
      return response.data.data;
    } catch (error) {
      setToken(null);
      user.value = null;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (email: string, password: string) => {
    clearErrors();
    isLoading.value = true;

    try {
      const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
        email,
        password,
      });
      
      setToken(response.data.data.token);
      user.value = response.data.data.user;
      return response.data.data;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (form: RegisterForm): Promise<boolean> => {
    clearErrors();
    isLoading.value = true;

    try {
      const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', form);
      
      setToken(response.data.data.token);
      user.value = response.data.data.user;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const forgotPassword = async (form: ForgotPasswordForm): Promise<{ success: boolean }> => {
    clearErrors();
    isLoading.value = true;

    try {
      await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', form);
      return { success: true };
    } catch (error) {
      handleError(error);
      return { success: false };
    } finally {
      isLoading.value = false;
    }
  };

  const resetPassword = async (form: ResetPasswordForm): Promise<{ success: boolean }> => {
    clearErrors();
    isLoading.value = true;

    try {
      await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', form);
      return { success: true };
    } catch (error) {
      handleError(error);
      return { success: false };
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setToken(null);
      user.value = null;
      clearErrors();
    }
  };

  const init = async () => {
    if (token.value) {
      await fetchUser();
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    authError,
    fieldErrors,
    setToken,
    clearErrors,
    fetchUser,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    init,
  };
});
