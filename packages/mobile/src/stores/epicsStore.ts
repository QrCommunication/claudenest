/**
 * Epics Store - Zustand
 *
 * Manages project epics, mirroring the web SPA `useEpicsStore`:
 *  - active + archived epics (kept in separate lists so the active board flow is
 *    never polluted by archived epics),
 *  - the `showArchived` UI toggle,
 *  - the AI decomposition flow (PRD → async sprints/tasks),
 *  - reversible archive / unarchive,
 *  - reorder,
 *  - real-time reconciliation over the shared `projects.{id}` Reverb channel.
 *
 * The store holds epics for *multiple* projects in one flat list, scoped via
 * `project_id` (consumers read through the `*ByProject` getters).
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Epic,
  TaskPriority,
  DecomposeEpicForm,
  DecomposeEpicResponse,
  DecompositionStatus,
  EpicStatus,
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
 * `.epic.updated` broadcast (app/Events/EpicUpdated::broadcastWith). Carries no
 * `project_id` — the epic is reconciled by `epic_id` against the flat list.
 * `action` ∈ updated | reordered | archived | unarchived | finalizing | finalized.
 */
interface EpicUpdatedPayload {
  epic_id: string;
  action: string;
  title: string;
  status: EpicStatus;
  progress_percentage: number;
  timestamp: string;
}

/**
 * `.epic.decomposition` broadcast (app/Events/EpicDecompositionUpdated). The
 * payload's `decomposition_completed_at` maps to the Epic resource alias
 * `decomposed_at` — translated when patching the epic.
 */
interface EpicDecompositionPayload {
  epic_id: string;
  project_id: string;
  action: DecompositionStatus;
  decomposition_status: DecompositionStatus | null;
  decomposition_error: string | null;
  decomposition_completed_at: string | null;
  timestamp: string;
}

interface EpicsState {
  // State
  epics: Epic[];
  archivedEpics: Epic[];
  // UI toggle for the board's "show archived" view (ephemeral — not persisted).
  showArchived: boolean;
  isLoading: boolean;
  isDecomposing: boolean;
  isArchiving: boolean;
  error: string | null;

  // Getters
  getEpicsByProject: (projectId: string) => Epic[];
  getArchivedEpicsByProject: (projectId: string) => Epic[];
  getEpicById: (epicId: string) => Epic | undefined;

  // Actions
  fetchEpics: (projectId: string) => Promise<void>;
  fetchArchivedEpics: (projectId: string) => Promise<void>;
  createEpic: (projectId: string, data: CreateEpicData) => Promise<Epic>;
  decomposeEpic: (
    projectId: string,
    data: DecomposeEpicForm,
  ) => Promise<DecomposeEpicResponse>;
  updateEpic: (epicId: string, data: Partial<Epic>) => Promise<void>;
  deleteEpic: (epicId: string) => Promise<void>;
  archiveEpic: (epicId: string) => Promise<Epic>;
  unarchiveEpic: (epicId: string) => Promise<Epic>;
  reorderEpic: (epicId: string, position: number) => Promise<void>;
  setShowArchived: (value: boolean) => void;
  toggleShowArchived: () => void;
  clearError: () => void;

  // Real-time
  subscribeRealtime: (projectId: string) => () => void;

  // Local mutators (pure — reused by the API actions AND the realtime listeners)
  applyEpicUpdate: (epicId: string, updates: Partial<Epic>) => void;
  archiveEpicLocal: (epicId: string, epic?: Epic) => void;
  unarchiveEpicLocal: (epicId: string, epic?: Epic) => void;
}

const bySortOrder = (a: Epic, b: Epic): number => a.sort_order - b.sort_order;

export const useEpicsStore = create<EpicsState>()(
  persist(
    (set, get) => ({
      // Initial state
      epics: [],
      archivedEpics: [],
      showArchived: false,
      isLoading: false,
      isDecomposing: false,
      isArchiving: false,
      error: null,

      // Getters
      getEpicsByProject: (projectId: string) =>
        get().epics.filter((e) => e.project_id === projectId),

      getArchivedEpicsByProject: (projectId: string) =>
        get().archivedEpics.filter((e) => e.project_id === projectId),

      getEpicById: (epicId: string) =>
        get().epics.find((e) => e.id === epicId) ??
        get().archivedEpics.find((e) => e.id === epicId),

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

      // Archived epics live in a separate list (backend `?archived=true`); the
      // active `epics` list never contains an archived epic.
      fetchArchivedEpics: async (projectId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await epicsApi.listArchived(projectId);
          set((state) => ({
            archivedEpics: [
              ...state.archivedEpics.filter((e) => e.project_id !== projectId),
              ...response.data!,
            ],
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to fetch archived epics";
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
            epics: [...state.epics, epic].sort(bySortOrder),
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

      // Decompose an epic from a PRD (AI flow). The backend creates the epic in
      // its `running` decomposition state and spawns an async session; sprints/
      // tasks land later over the `.epic.decomposition` signal. The returned epic
      // is surfaced immediately (live badge), de-duped against a racing realtime.
      decomposeEpic: async (projectId: string, data: DecomposeEpicForm) => {
        set({ isDecomposing: true, error: null });

        try {
          const response = await epicsApi.decompose(projectId, data);
          const result = response.data!;

          set((state) => {
            const exists = state.epics.some((e) => e.id === result.epic.id);
            return {
              epics: exists
                ? state.epics.map((e) =>
                    e.id === result.epic.id ? result.epic : e,
                  )
                : [...state.epics, result.epic].sort(bySortOrder),
              isDecomposing: false,
            };
          });

          return result;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to launch epic decomposition";
          set({ isDecomposing: false, error: message });
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
            archivedEpics: state.archivedEpics.filter((e) => e.id !== epicId),
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to delete epic";
          set({ error: message });
          throw err;
        }
      },

      // Archive an epic (reversible — backend stamps `archived_at`, deletes
      // nothing). Moves it from the active board to the archived flow.
      archiveEpic: async (epicId: string) => {
        set({ isArchiving: true, error: null });

        try {
          const response = await epicsApi.archive(epicId);
          const archived = response.data!;
          get().archiveEpicLocal(epicId, archived);
          set({ isArchiving: false });
          return archived;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to archive epic";
          set({ isArchiving: false, error: message });
          throw err;
        }
      },

      // Unarchive an epic — restore it to the active board.
      unarchiveEpic: async (epicId: string) => {
        set({ isArchiving: true, error: null });

        try {
          const response = await epicsApi.unarchive(epicId);
          const restored = response.data!;
          get().unarchiveEpicLocal(epicId, restored);
          set({ isArchiving: false });
          return restored;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to unarchive epic";
          set({ isArchiving: false, error: message });
          throw err;
        }
      },

      // Reorder an epic. The backend returns the updated EpicResource; patch the
      // local `sort_order` and re-sort the active board.
      reorderEpic: async (epicId: string, position: number) => {
        try {
          const response = await epicsApi.reorder(epicId, position);
          const updated = response.data!;

          set((state) => ({
            epics: state.epics
              .map((e) =>
                e.id === epicId ? { ...e, sort_order: updated.sort_order } : e,
              )
              .sort(bySortOrder),
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to reorder epic";
          set({ error: message });
          throw err;
        }
      },

      setShowArchived: (value: boolean) => set({ showArchived: value }),

      toggleShowArchived: () =>
        set((state) => ({ showArchived: !state.showArchived })),

      clearError: () => set({ error: null }),

      // ==================== REAL-TIME ====================

      /**
       * Reconcile epics in real time over the shared `projects.{id}` Reverb
       * channel. Registers two event-bus listeners and returns a teardown that
       * removes ONLY them — it never binds or leaves the channel itself (that is
       * owned by the screen via `projectsStore.subscribeToProject` /
       * `websocket.subscribeToProject`, and is shared with the tasks/locks/
       * instances consumers). Returns a no-op teardown when called twice without
       * cleanup-safe semantics: callers should store and invoke the returned fn.
       */
      subscribeRealtime: (projectId: string) => {
        const offUpdated = websocket.on("epic:updated", (raw: unknown) => {
          const payload = raw as EpicUpdatedPayload;
          if (!payload?.epic_id) return;

          // Archive lifecycle: move the epic between the active board and the
          // archived flow in place (the payload carries no `is_archived`, but the
          // action discriminates). Handled before the generic patch.
          if (payload.action === "archived") {
            get().archiveEpicLocal(payload.epic_id);
            return;
          }
          if (payload.action === "unarchived") {
            get().unarchiveEpicLocal(payload.epic_id);
            return;
          }

          get().applyEpicUpdate(payload.epic_id, {
            title: payload.title,
            status: payload.status,
            progress_percentage: payload.progress_percentage,
          });

          // The finalize broadcast carries no PR fields (pr_url/pr_state) —
          // refetch so the card flips to the live PR link once the agent reports
          // `epic:finalized`.
          if (payload.action === "finalized") {
            const epic = get().getEpicById(payload.epic_id);
            get()
              .fetchEpics(epic?.project_id ?? projectId)
              .catch(() => {
                /* transient — next event or screen focus retries */
              });
          }
        });

        const offDecomposition = websocket.on(
          "epic:decomposition",
          (raw: unknown) => {
            const payload = raw as EpicDecompositionPayload;
            if (!payload?.epic_id) return;

            // Translate `decomposition_completed_at` → Epic alias `decomposed_at`.
            get().applyEpicUpdate(payload.epic_id, {
              decomposition_status: payload.decomposition_status,
              decomposition_error: payload.decomposition_error,
              decomposed_at: payload.decomposition_completed_at,
            });

            // On completion the epic gained sprints + tasks not in the payload —
            // refetch so its tasks_count/progress reflect the generated plan.
            if (payload.action === "completed") {
              get()
                .fetchEpics(payload.project_id ?? projectId)
                .catch(() => {
                  /* transient — next event or screen focus retries */
                });
            }
          },
        );

        return () => {
          offUpdated();
          offDecomposition();
        };
      },

      // ==================== LOCAL MUTATORS ====================

      // Patch an epic in place wherever it lives (active or archived list).
      applyEpicUpdate: (epicId: string, updates: Partial<Epic>) => {
        set((state) => ({
          epics: state.epics.map((e) =>
            e.id === epicId ? { ...e, ...updates } : e,
          ),
          archivedEpics: state.archivedEpics.map((e) =>
            e.id === epicId ? { ...e, ...updates } : e,
          ),
        }));
      },

      // Move an epic from the active board to the archived flow. `epic` is the
      // full row when available (API response); otherwise the entry already in
      // the active list is reused (the broadcast payload carries no `is_archived`).
      archiveEpicLocal: (epicId: string, epic?: Epic) => {
        set((state) => {
          const existing = state.epics.find((e) => e.id === epicId);
          const moved = epic ?? existing;
          if (!moved) return state;

          const archivedExists = state.archivedEpics.some(
            (e) => e.id === epicId,
          );
          return {
            epics: state.epics.filter((e) => e.id !== epicId),
            archivedEpics: archivedExists
              ? state.archivedEpics.map((e) => (e.id === epicId ? moved : e))
              : [moved, ...state.archivedEpics],
          };
        });
      },

      // Move an epic from the archived flow back to the active board, re-sorted.
      unarchiveEpicLocal: (epicId: string, epic?: Epic) => {
        set((state) => {
          const existing = state.archivedEpics.find((e) => e.id === epicId);
          const moved = epic ?? existing;
          if (!moved) return state;

          const activeExists = state.epics.some((e) => e.id === epicId);
          const epics = (
            activeExists
              ? state.epics.map((e) => (e.id === epicId ? moved : e))
              : [...state.epics, moved]
          ).sort(bySortOrder);

          return {
            epics,
            archivedEpics: state.archivedEpics.filter((e) => e.id !== epicId),
          };
        });
      },
    }),
    {
      name: "epics-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        epics: state.epics,
        archivedEpics: state.archivedEpics,
      }),
    },
  ),
);
