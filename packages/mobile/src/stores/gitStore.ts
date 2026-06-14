/**
 * Git Store - Zustand
 * Worktree status + pull-request tracking for a shared project (web parity:
 * resources/js/stores/git.ts). The server proxies every call to the sandboxed
 * agent, so failures surface as a single `error` string the screen renders.
 */

import { create } from "zustand";
import type { GitStatus, MergeMethod, PullRequest } from "@/types";
import { gitApi } from "@/services/api";

function extractError(e: unknown, fallback: string): string {
  const res = (e as { response?: { data?: { error?: { message?: string } } } })
    ?.response;
  return res?.data?.error?.message ?? fallback;
}

interface GitState {
  status: GitStatus | null;
  pulls: PullRequest[];
  isLoadingStatus: boolean;
  isLoadingPulls: boolean;
  mergingNumber: number | null;
  error: string | null;

  fetchStatus: (projectId: string) => Promise<void>;
  fetchPulls: (projectId: string) => Promise<void>;
  refresh: (projectId: string) => Promise<void>;
  mergePull: (
    projectId: string,
    number: number,
    method?: MergeMethod,
  ) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useGitStore = create<GitState>((set, get) => ({
  status: null,
  pulls: [],
  isLoadingStatus: false,
  isLoadingPulls: false,
  mergingNumber: null,
  error: null,

  fetchStatus: async (projectId) => {
    set({ isLoadingStatus: true, error: null });
    try {
      const res = await gitApi.status(projectId);
      set({ status: res.data ?? null, isLoadingStatus: false });
    } catch (e) {
      set({
        isLoadingStatus: false,
        error: extractError(e, "Failed to load git status"),
      });
    }
  },

  fetchPulls: async (projectId) => {
    set({ isLoadingPulls: true, error: null });
    try {
      const res = await gitApi.pulls(projectId);
      set({ pulls: res.data?.pulls ?? [], isLoadingPulls: false });
    } catch (e) {
      set({
        isLoadingPulls: false,
        error: extractError(e, "Failed to load pull requests"),
      });
    }
  },

  refresh: async (projectId) => {
    await Promise.all([
      get().fetchStatus(projectId),
      get().fetchPulls(projectId),
    ]);
  },

  mergePull: async (projectId, number, method = "squash") => {
    set({ mergingNumber: number, error: null });
    try {
      await gitApi.merge(projectId, number, method);
      // Drop the merged PR locally; a refresh reconciles ahead/behind/branch.
      set((state) => ({
        pulls: state.pulls.filter((p) => p.number !== number),
        mergingNumber: null,
      }));
      void get().fetchStatus(projectId);
      return true;
    } catch (e) {
      set({
        mergingNumber: null,
        error: extractError(e, "Merge failed"),
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      status: null,
      pulls: [],
      isLoadingStatus: false,
      isLoadingPulls: false,
      mergingNumber: null,
      error: null,
    }),
}));
