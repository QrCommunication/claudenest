/**
 * Credentials Store - Zustand
 * Manages Claude credential state (API keys, OAuth tokens)
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { credentialsApi } from '@/services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export interface Credential {
  id: string;
  name: string;
  auth_type: 'api_key' | 'oauth';
  token_status: 'ok' | 'expired' | 'missing' | 'needs_login';
  masked_key?: string;
  has_refresh_token?: boolean;
  is_default: boolean;
  is_expired?: boolean;
  expires_at?: string;
  last_used_at?: string;
  claude_dir_mode?: 'shared' | 'isolated';
}

interface CredentialsState {
  // State
  credentials: Credential[];
  isLoading: boolean;
  error: string | null;

  // Getters
  getDefaultCredential: () => Credential | null;

  // Actions
  fetchCredentials: () => Promise<void>;
  createCredential: (data: {
    name: string;
    auth_type: 'api_key' | 'oauth';
    claude_dir_mode: 'shared' | 'isolated';
    api_key?: string;
    access_token?: string;
    refresh_token?: string;
  }) => Promise<Credential>;
  deleteCredential: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  testCredential: (id: string) => Promise<{ valid: boolean; message: string }>;
  refreshCredential: (id: string) => Promise<void>;
  initiateOAuth: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set, get) => ({
      // Initial state
      credentials: [],
      isLoading: false,
      error: null,

      // Getters
      getDefaultCredential: () =>
        get().credentials.find((c) => c.is_default) ?? null,

      // Actions
      fetchCredentials: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await credentialsApi.list();
          const data = response.data?.data ?? response.data ?? [];
          set({ credentials: data, isLoading: false });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch credentials';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      createCredential: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await credentialsApi.create(data);
          const credential: Credential = response.data?.data ?? response.data;

          set((state) => ({
            credentials: [...state.credentials, credential],
            isLoading: false,
          }));

          return credential;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to create credential';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      deleteCredential: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          await credentialsApi.delete(id);

          set((state) => ({
            credentials: state.credentials.filter((c) => c.id !== id),
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to delete credential';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      setDefault: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          await credentialsApi.setDefault(id);

          set((state) => ({
            credentials: state.credentials.map((c) => ({
              ...c,
              is_default: c.id === id,
            })),
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to set default credential';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      testCredential: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await credentialsApi.test(id);
          const result: { valid: boolean; message: string } =
            response.data?.data ?? response.data;
          set({ isLoading: false });
          return result;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to test credential';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      refreshCredential: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          await credentialsApi.refresh(id);
          // Re-fetch to get updated token status
          await get().fetchCredentials();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to refresh credential';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      initiateOAuth: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await credentialsApi.initiateOAuth(id);
          const authUrl: string =
            response.data?.data?.auth_url ?? response.data?.auth_url;

          if (!authUrl) {
            throw new Error('No auth_url returned from server');
          }

          const redirectUrl = Linking.createURL('oauth/callback');
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

          if (result.type === 'success' && result.url) {
            const url = result.url;

            if (url.includes('error=')) {
              const errorMatch = url.match(/error=([^&]+)/);
              const errorMsg = errorMatch
                ? decodeURIComponent(errorMatch[1])
                : 'OAuth authentication failed';
              throw new Error(errorMsg);
            }

            if (url.includes('success=')) {
              await get().fetchCredentials();
            }
          }

          set({ isLoading: false });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'OAuth authentication failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'credentials-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        credentials: state.credentials,
      }),
    }
  )
);
