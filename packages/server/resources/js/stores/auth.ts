import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, ApiResponse } from '@/types';
import { api } from '@/composables/useApi';
import { mfaApi } from '@/services/api';
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

type MfaMethod = 'totp' | 'email';

interface MfaPendingState {
  token: string;
  method: MfaMethod;
}

type LoginResponseData =
  | { token: string; user: User }
  | { mfa_required: true; mfa_method: MfaMethod; mfa_token: string };

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const isLoading = ref(false);
  const authError = ref<string | null>(null);
  const fieldErrors = ref<Record<string, string[]>>({});
  // Transient MFA challenge state — intentionally NOT persisted: the
  // short-lived mfa_token must die with the page/session.
  const mfaPending = ref<MfaPendingState | null>(null);

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
      // /auth/me wraps the payload as { data: { user: {...} } } — assigning
      // `data` directly left user.name undefined, so the whole app showed
      // "Guest" after any full page reload.
      const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
      user.value = response.data.data.user;
      return user.value;
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
    mfaPending.value = null;

    try {
      const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', {
        email,
        password,
      });

      const data = response.data.data;

      if ('mfa_required' in data) {
        // No token yet — the user must complete the MFA challenge first.
        mfaPending.value = { token: data.mfa_token, method: data.mfa_method };
        return data;
      }

      setToken(data.token);
      user.value = data.user;
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Complete a pending MFA challenge. On success, behaves like a
   * successful login (token + user). Throws the raw axios error so the
   * caller can branch on error codes (MFA_002/MFA_004/MFA_005).
   */
  const verifyMfa = async (code: string) => {
    if (!mfaPending.value) {
      throw new Error('No pending MFA challenge');
    }

    isLoading.value = true;
    try {
      const data = await mfaApi.verify<User>(mfaPending.value.token, code);
      setToken(data.token);
      user.value = data.user;
      mfaPending.value = null;
      clearErrors();
      return data;
    } finally {
      isLoading.value = false;
    }
  };

  /** Abandon the pending MFA challenge and return to the login form. */
  const cancelMfa = () => {
    mfaPending.value = null;
    clearErrors();
  };

  /** Resend the MFA code by email (email method only). */
  const resendMfaCode = async () => {
    if (!mfaPending.value) {
      throw new Error('No pending MFA challenge');
    }
    await mfaApi.resend(mfaPending.value.token);
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
      mfaPending.value = null;
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
    mfaPending,
    setToken,
    clearErrors,
    fetchUser,
    login,
    verifyMfa,
    cancelMfa,
    resendMfaCode,
    register,
    forgotPassword,
    resetPassword,
    logout,
    init,
  };
});
