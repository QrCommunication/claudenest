/**
 * Auth Store - Zustand
 * Manages authentication state
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AuthTokens } from '@/types';
import { authApi } from '@/services/api';

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasSeenOnboarding: boolean;

  // Getters
  isLoggedIn: () => boolean;

  // Actions
  setTokens: (tokens: { accessToken: string; refreshToken?: string }) => void;
  setUser: (user: User | null) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  login: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasSeenOnboarding: false,

      // Getters
      isLoggedIn: () => !!get().accessToken && !!get().user,

      // Actions
      loginWithPassword: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.loginWithPassword(email, password);
          const { user, token } = response.data!;
          set({
            user,
            accessToken: token,
            refreshToken: null,
            isAuthenticated: true,
            isLoading: false,
            hasSeenOnboarding: true,
          });
        } catch (err: unknown) {
          const apiErr = err as { status?: number; message?: string; code?: string };
          let errorMsg: string;
          if (!apiErr.status) {
            // Pas de réponse HTTP = erreur réseau (serveur injoignable)
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

      setTokens: ({ accessToken, refreshToken }) => {
        set({
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: !!accessToken,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      login: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          await authApi.login(email);
          set({ isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to send magic link';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      verifyMagicLink: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.verifyMagicLink(token);
          const { user, tokens } = response.data!;

          set({
            user,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            hasSeenOnboarding: true,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to verify magic link';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
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
        } catch (err) {
          console.error('Failed to fetch user:', err);
          // If fetch fails, user might need to re-authenticate
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);
