/**
 * Epics Store - Zustand
 * Manages project epics state
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  DecompositionStatus,
  DecomposeEpicForm,
  DecomposeEpicResponse,
  Epic,
  TaskPriority,
} from "@/types";
import { epicsApi } from "@/services/api";
import { websocket } from "@/services/websocket";

interface CreateEpicData {
  title: string;
  description?: string;
  color?: string;
  priority?: TaskPriority;
}

/**
 * Real-time `.epic.decomposition` payload (web parity: EpicDecompositionPayload
 * in stores/epics.ts). Mirrors EpicDecompositionUpdated::broadcastWith — RAW
 * snake_case. `decomposition_completed_at` maps to the Epic alias `decomposed_at`.
 */
interface EpicDecompositionPayload {
  epic_id: string;
  project_id: string;
  action: string;
  decomposition_status: DecompositionStatus | null;
  decomposition_error: string | null;
  decomposition_completed_at: string | null;
  timestamp: string;
}

/** Real-time `.epic.updated` payload (EpicUpdated::broadcastWith — no project_id). */
interface EpicUpdatedPayload {
  epic_id: string;
  action: string;
  title?: string;
  status?: Epic["status"];
  progress_percentage?: number;
  timestamp: string;
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
  /**
   * Decompose an epic from a PRD (AI flow, web parity). POSTs to
   * `/projects/{id}/epics/decompose`: the backend creates the epic up-front in
   * the `running` decomposition state and spawns an async session. The plan is
   * NOT awaited — the returned epic is added to the board immediately (live
   * badge); its sprints/tasks land later over the realtime `.epic.decomposition`
   * signal (see {@link EpicsState.subscribeRealtime}).
   */
  decomposeEpic: (
    projectId: string,
    data: DecomposeEpicForm,
  ) => Promise<DecomposeEpicResponse>;
  /**
   * Subscribe to real-time epic mutations on the `projects.{id}` channel and
   * return a teardown closure. Drives the async AI decomposition lifecycle
   * (pending → running → completed | failed) in place, plus generic epic
   * updates. Caller is responsible for `websocket.subscribeToProject(id)`
   * (the projects store owns the channel lifecycle).
   */
  subscribeRealtime: (projectId: string) => () => void;
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

      getEpicById: (epicId: string) => get().epics.find((e) => e.id === epicId),

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
            err instanceof Error ? err.message : "Failed to fetch epics";
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
            err instanceof Error ? err.message : "Failed to create epic";
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
            err instanceof Error ? err.message : "Failed to update epic";
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
            err instanceof Error ? err.message : "Failed to delete epic";
          set({ error: message });
          throw err;
        }
      },

      decomposeEpic: async (projectId: string, data: DecomposeEpicForm) => {
        set({ isLoading: true, error: null });

        try {
          const response = await epicsApi.decompose(projectId, data);
          const result = response.data!;

          // Surface the pending/running epic on the board immediately. Guard
          // against a duplicate if a realtime broadcast already raced it in.
          set((state) => ({
            epics: state.epics.some((e) => e.id === result.epic.id)
              ? state.epics.map((e) =>
                  e.id === result.epic.id ? result.epic : e,
                )
              : [...state.epics, result.epic],
            isLoading: false,
          }));

          return result;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to launch epic decomposition";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      subscribeRealtime: (projectId: string) => {
        // Patch a single epic of this project in place (no-op if it left the
        // store / belongs to another project).
        const patchEpic = (epicId: string, partial: Partial<Epic>) =>
          set((state) => ({
            epics: state.epics.map((e) =>
              e.id === epicId && e.project_id === projectId
                ? { ...e, ...partial }
                : e,
            ),
          }));

        const offDecomposition = websocket.on(
          "epic:decomposition",
          (raw: unknown) => {
            const payload = raw as EpicDecompositionPayload;
            if (payload.project_id !== projectId) return;

            // Translate `decomposition_completed_at` → Epic alias `decomposed_at`.
            patchEpic(payload.epic_id, {
              decomposition_status: payload.decomposition_status,
              decomposition_error: payload.decomposition_error,
              decomposed_at: payload.decomposition_completed_at,
            });

            // On completion the epic gained sprints + tasks absent from the
            // payload — refetch so tasks_count/progress reflect the new work.
            if (payload.action === "completed") {
              get()
                .fetchEpics(projectId)
                .catch(() => {
                  /* transient — next event or screen focus retries */
                });
            }
          },
        );

        const offUpdated = websocket.on("epic:updated", (raw: unknown) => {
          const payload = raw as EpicUpdatedPayload;
          // EpicUpdated carries no project_id — only react to epics we hold for
          // this project (the channel is already scoped server-side).
          const known = get().epics.some(
            (e) => e.id === payload.epic_id && e.project_id === projectId,
          );
          if (!known) return;

          // archive/unarchive/finalize change counts/PR fields absent from the
          // payload → authoritative refetch; plain updates patch in place.
          if (
            payload.action === "archived" ||
            payload.action === "unarchived" ||
            payload.action === "finalized"
          ) {
            get()
              .fetchEpics(projectId)
              .catch(() => {
                /* transient */
              });
            return;
          }

          patchEpic(payload.epic_id, {
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
            ...(payload.progress_percentage !== undefined
              ? { progress_percentage: payload.progress_percentage }
              : {}),
          });
        });

        return () => {
          offDecomposition();
          offUpdated();
        };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "epics-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        epics: state.epics,
      }),
    },
  ),
);
