/**
 * Sprints Store - Zustand
 * Manages project sprints and burndown data
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Sprint, BurndownDataPoint } from "@/types";
import { sprintsApi } from "@/services/api";

interface CreateSprintData {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
}

interface SprintsState {
  // State
  sprints: Sprint[];
  activeSprint: Sprint | null;
  burndownData: BurndownDataPoint[];
  isLoading: boolean;
  error: string | null;

  // Getters
  getSprintsByProject: (projectId: string) => Sprint[];
  getSprintById: (sprintId: string) => Sprint | undefined;
  getActiveSprintForProject: (projectId: string) => Sprint | null;

  // Actions
  fetchSprints: (projectId: string) => Promise<void>;
  createSprint: (projectId: string, data: CreateSprintData) => Promise<Sprint>;
  updateSprint: (sprintId: string, data: Partial<Sprint>) => Promise<void>;
  deleteSprint: (sprintId: string) => Promise<void>;
  startSprint: (sprintId: string) => Promise<void>;
  completeSprint: (sprintId: string) => Promise<void>;
  fetchBurndown: (sprintId: string) => Promise<void>;
  clearError: () => void;
}

export const useSprintsStore = create<SprintsState>()(
  persist(
    (set, get) => ({
      // Initial state
      sprints: [],
      activeSprint: null,
      burndownData: [],
      isLoading: false,
      error: null,

      // Getters
      getSprintsByProject: (projectId: string) =>
        get().sprints.filter((s) => s.project_id === projectId),

      getSprintById: (sprintId: string) =>
        get().sprints.find((s) => s.id === sprintId),

      getActiveSprintForProject: (projectId: string) =>
        get().sprints.find(
          (s) => s.project_id === projectId && s.status === "active",
        ) ?? null,

      // Actions
      fetchSprints: async (projectId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await sprintsApi.list(projectId);
          const sprints = response.data!;

          const activeSprint =
            sprints.find(
              (s) => s.project_id === projectId && s.status === "active",
            ) ?? null;

          set((state) => ({
            sprints: [
              ...state.sprints.filter((s) => s.project_id !== projectId),
              ...sprints,
            ],
            activeSprint,
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch sprints";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      createSprint: async (projectId: string, data: CreateSprintData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await sprintsApi.create(projectId, {
            ...data,
            project_id: projectId,
          });
          const sprint = response.data!;

          set((state) => ({
            sprints: [...state.sprints, sprint],
            isLoading: false,
          }));

          return sprint;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create sprint";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      updateSprint: async (sprintId: string, data: Partial<Sprint>) => {
        try {
          const response = await sprintsApi.update(sprintId, data);
          const sprint = response.data!;

          set((state) => ({
            sprints: state.sprints.map((s) => (s.id === sprintId ? sprint : s)),
            activeSprint:
              state.activeSprint?.id === sprintId ? sprint : state.activeSprint,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to update sprint";
          set({ error: message });
          throw err;
        }
      },

      deleteSprint: async (sprintId: string) => {
        try {
          await sprintsApi.delete(sprintId);

          set((state) => ({
            sprints: state.sprints.filter((s) => s.id !== sprintId),
            activeSprint:
              state.activeSprint?.id === sprintId ? null : state.activeSprint,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to delete sprint";
          set({ error: message });
          throw err;
        }
      },

      startSprint: async (sprintId: string) => {
        try {
          const response = await sprintsApi.start(sprintId);
          const sprint = response.data!;

          set((state) => ({
            sprints: state.sprints.map((s) => (s.id === sprintId ? sprint : s)),
            activeSprint: sprint,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to start sprint";
          set({ error: message });
          throw err;
        }
      },

      completeSprint: async (sprintId: string) => {
        try {
          const response = await sprintsApi.complete(sprintId);
          const sprint = response.data!;

          set((state) => ({
            sprints: state.sprints.map((s) => (s.id === sprintId ? sprint : s)),
            activeSprint:
              state.activeSprint?.id === sprintId ? null : state.activeSprint,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to complete sprint";
          set({ error: message });
          throw err;
        }
      },

      fetchBurndown: async (sprintId: string) => {
        try {
          const response = await sprintsApi.getBurndown(sprintId);
          // Server returns { sprint, burndown } — extract the series.
          set({ burndownData: response.data?.burndown ?? [] });
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to fetch burndown data";
          set({ error: message });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "sprints-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sprints: state.sprints,
        activeSprint: state.activeSprint,
      }),
    },
  ),
);
