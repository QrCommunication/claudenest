/**
 * Orchestrator Store - Zustand
 * Manages multi-agent orchestration state
 */

import { create } from 'zustand';
import { runnerApi } from '@/services/api';

interface OrchestrationStats {
  status: string;
  details: Record<string, unknown>;
}

interface OrchestratorState {
  // State
  isRunning: boolean;
  stats: OrchestrationStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startOrchestrator: (projectId: string) => Promise<void>;
  stopOrchestrator: (projectId: string) => Promise<void>;
  fetchStats: (projectId: string) => Promise<void>;
  dispatchTasks: (projectId: string) => Promise<void>;
  clearError: () => void;
}

export const useOrchestratorStore = create<OrchestratorState>()((set) => ({
  // Initial state
  isRunning: false,
  stats: null,
  isLoading: false,
  error: null,

  // Actions
  startOrchestrator: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      await runnerApi.autoUpdate(projectId);
      set({ isRunning: true, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start orchestrator';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  stopOrchestrator: async (_projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Orchestrator stop is implicit — mark as not running locally
      set({ isRunning: false, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to stop orchestrator';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  fetchStats: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await runnerApi.getHealth(projectId);
      const health = response.data!;

      set({
        stats: {
          status: health.status,
          details: health.details,
        },
        isRunning: health.status === 'running',
        isLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch orchestrator stats';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  dispatchTasks: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      await runnerApi.autoUpdate(projectId);
      set({ isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to dispatch tasks';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
