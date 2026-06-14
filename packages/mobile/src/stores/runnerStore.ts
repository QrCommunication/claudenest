/**
 * Runner Store - Zustand
 * Surfaces the server-side Runner Agent (automated health monitor): task /
 * sprint / epic checks, alerts, recommendations, and an on-demand status sweep
 * (auto-update). Web parity: the Runner endpoints power the SPA health widget.
 */

import { create } from "zustand";
import type { RunnerHealth } from "@/types";
import { runnerApi } from "@/services/api";

function extractError(e: unknown, fallback: string): string {
  const res = (e as { response?: { data?: { error?: { message?: string } } } })
    ?.response;
  return res?.data?.error?.message ?? fallback;
}

interface RunnerState {
  health: RunnerHealth | null;
  isLoading: boolean;
  isSweeping: boolean;
  error: string | null;

  /** Load the latest health snapshot for a project. */
  fetchHealth: (projectId: string) => Promise<void>;
  /** Trigger a status sweep; returns how many items were auto-updated. */
  runAutoUpdate: (projectId: string) => Promise<number>;
  clearError: () => void;
  reset: () => void;
}

export const useRunnerStore = create<RunnerState>((set, get) => ({
  health: null,
  isLoading: false,
  isSweeping: false,
  error: null,

  fetchHealth: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await runnerApi.getHealth(projectId);
      set({ health: res.data ?? null, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: extractError(e, "Failed to load runner health"),
      });
    }
  },

  runAutoUpdate: async (projectId) => {
    set({ isSweeping: true, error: null });
    try {
      const res = await runnerApi.autoUpdate(projectId);
      const count = res.data?.count ?? 0;
      set({ isSweeping: false });
      // Refresh the snapshot so the new statuses are reflected.
      await get().fetchHealth(projectId);
      return count;
    } catch (e) {
      set({
        isSweeping: false,
        error: extractError(e, "Failed to run auto-update"),
      });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ health: null, error: null, isLoading: false }),
}));
