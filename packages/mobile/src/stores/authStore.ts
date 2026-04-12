/**
 * Auth Store - Zustand
 * Manages authentication state (email + password only)
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTokens: (tokens: { accessToken: string }) => void;
  setUser: (user: User | null) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithPassword: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.loginWithPassword(email, password);
          const { user, token } = response.data!;
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const apiErr = err as { status?: number; message?: string; code?: string };
          let errorMsg: string;
          if (!apiErr.status) {
            errorMsg = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
          } else if (apiErr.status === 401 || apiErr.code === 'AUTH_002') {
            errorMsg = 'Email ou mot de passe incorrect.';
          } else if (apiErr.status === 422) {
            errorMsg = 'Vérifiez le format de votre email.';
          } else {
            errorMsg = apiErr.message || 'Une erreur est survenue. Réessayez.';
          }
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      setTokens: ({ accessToken }) => {
        set({
          accessToken,
          isAuthenticated: !!accessToken,
        });
      },

      setUser: (user) => set({ user }),

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          // Logout API failure is not blocking — clear local state anyway
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      fetchUser: async () => {
        try {
          const response = await authApi.me();
          set({ user: response.data! });
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
