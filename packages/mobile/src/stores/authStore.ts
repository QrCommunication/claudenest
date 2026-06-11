/**
 * Auth Store - Zustand
 * Manages authentication state (email + password, optional MFA step)
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/types";
import { authApi } from "@/services/api";

export interface MfaPending {
  /** Short-lived server token identifying the pending MFA challenge. */
  token: string;
  method: "email" | "totp";
}

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /**
   * Set when the server answered login with an MFA challenge.
   * Intentionally NOT persisted (see partialize) — a pending challenge
   * never survives an app restart.
   */
  mfaPending: MfaPending | null;

  // Actions
  setTokens: (tokens: { accessToken: string }) => void;
  setUser: (user: User | null) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  resendMfaCode: () => Promise<void>;
  cancelMfa: () => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

interface ApiErrorLike {
  status?: number;
  message?: string;
  code?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaPending: null,

      loginWithPassword: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.loginWithPassword(email, password);
          const data = response.data!;

          // MFA challenge: no token issued yet — switch to the code step.
          if ("mfa_required" in data) {
            set({
              mfaPending: { token: data.mfa_token, method: data.mfa_method },
              isLoading: false,
            });
            return;
          }

          const { user, token } = data;
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
            mfaPending: null,
          });
        } catch (err: unknown) {
          const apiErr = err as ApiErrorLike;
          let errorMsg: string;
          if (!apiErr.status) {
            errorMsg =
              "Impossible de contacter le serveur. Vérifiez votre connexion.";
          } else if (apiErr.status === 401 || apiErr.code === "AUTH_002") {
            errorMsg = "Email ou mot de passe incorrect.";
          } else if (apiErr.status === 422) {
            errorMsg = "Vérifiez le format de votre email.";
          } else {
            errorMsg = apiErr.message || "Une erreur est survenue. Réessayez.";
          }
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      verifyMfa: async (code: string) => {
        const pending = get().mfaPending;
        if (!pending) {
          const errorMsg = "Aucune vérification en cours. Reconnectez-vous.";
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }

        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyMfa(pending.token, code.trim());
          const { user, token } = response.data!;
          // Same treatment as a successful login.
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mfaPending: null,
          });
        } catch (err: unknown) {
          const apiErr = err as ApiErrorLike;
          let errorMsg: string;
          let dropPending = false;

          if (!apiErr.status) {
            errorMsg =
              "Impossible de contacter le serveur. Vérifiez votre connexion.";
          } else if (
            apiErr.status === 401 ||
            apiErr.status === 404 ||
            apiErr.status === 410
          ) {
            // mfa_token expired or invalidated (e.g. after 5 failed attempts)
            // → the challenge is dead, force a fresh login.
            errorMsg = "Session de vérification expirée. Reconnectez-vous.";
            dropPending = true;
          } else if (apiErr.status === 429) {
            if (apiErr.code === "MFA_005") {
              // 5 wrong codes — the server invalidated the mfa_token.
              errorMsg = "Trop de tentatives échouées. Reconnectez-vous.";
              dropPending = true;
            } else {
              errorMsg =
                "Trop de tentatives. Patientez un instant avant de réessayer.";
            }
          } else if (apiErr.status === 422 || apiErr.status === 400) {
            errorMsg = "Code invalide. Vérifiez et réessayez.";
          } else {
            errorMsg = apiErr.message || "Une erreur est survenue. Réessayez.";
          }

          set({
            isLoading: false,
            error: errorMsg,
            ...(dropPending ? { mfaPending: null } : {}),
          });
          throw new Error(errorMsg);
        }
      },

      resendMfaCode: async () => {
        const pending = get().mfaPending;
        if (!pending || pending.method !== "email") {
          return;
        }
        try {
          await authApi.resendMfa(pending.token);
          set({ error: null });
        } catch (err: unknown) {
          const apiErr = err as ApiErrorLike;
          if (apiErr.status === 401) {
            // mfa_token expired — challenge is dead, force a fresh login.
            set({
              mfaPending: null,
              error: "Session de vérification expirée. Reconnectez-vous.",
            });
            throw new Error("expired");
          }
          const errorMsg =
            apiErr.status === 429
              ? "Trop de demandes. Patientez avant de renvoyer un code."
              : "Impossible de renvoyer le code. Réessayez.";
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      cancelMfa: () => set({ mfaPending: null, error: null }),

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
            mfaPending: null,
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
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // mfaPending is deliberately excluded: never persist a challenge token.
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
