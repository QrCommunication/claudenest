/**
 * Epics Store - Zustand
 * Manages project epics state
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Epic } from '@/types';
import { epicsApi } from '@/services/api';

interface CreateEpicData {
  title: string;
  description?: string;
  color?: string;
  priority?: string;
}

interface EpicsState {
  // State
  epics: Epic[];
  isLoading: boolean;
  error: string | null;

  // Getters
  getEpicsByProject: (projectId: string) => Epic[];
  getEpicById: (epicId: string) => Epic | undefined;

  // Actions
  fetchEpics: (projectId: string) => Promise<void>;
  createEpic: (projectId: string, data: CreateEpicData) => Promise<Epic>;
  updateEpic: (epicId: string, data: Partial<Epic>) => Promise<void>;
  deleteEpic: (epicId: string) => Promise<void>;
  clearError: () => void;
}

export const useEpicsStore = create<EpicsState>()(
  persist(
    (set, get) => ({
      // Initial state
      epics: [],
      isLoading: false,
      error: null,

      // Getters
      getEpicsByProject: (projectId: string) =>
        get().epics.filter((e) => e.project_id === projectId),

      getEpicById: (epicId: string) =>
        get().epics.find((e) => e.id === epicId),

      // Actions
      fetchEpics: async (projectId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await epicsApi.list(projectId);
          set((state) => ({
            epics: [
              ...state.epics.filter((e) => e.project_id !== projectId),
              ...response.data!,
            ],
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch epics';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      createEpic: async (projectId: string, data: CreateEpicData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await epicsApi.create(projectId, {
            ...data,
            project_id: projectId,
          });
          const epic = response.data!;

          set((state) => ({
            epics: [...state.epics, epic],
            isLoading: false,
          }));

          return epic;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to create epic';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      updateEpic: async (epicId: string, data: Partial<Epic>) => {
        try {
          const response = await epicsApi.update(epicId, data);
          const epic = response.data!;

          set((state) => ({
            epics: state.epics.map((e) => (e.id === epicId ? epic : e)),
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to update epic';
          set({ error: message });
          throw err;
        }
      },

      deleteEpic: async (epicId: string) => {
        try {
          await epicsApi.delete(epicId);

          set((state) => ({
            epics: state.epics.filter((e) => e.id !== epicId),
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to delete epic';
          set({ error: message });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'epics-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        epics: state.epics,
      }),
    }
  )
);
