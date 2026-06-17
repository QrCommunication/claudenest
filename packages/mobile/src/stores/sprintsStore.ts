/**
 * Sprints Store - Zustand
 *
 * Manages project sprints and burndown data, mirroring the web SPA
 * `useSprintsStore`:
 *  - create / update / delete / start / complete,
 *  - the `showArchived` UI toggle (reveal sprints under archived epics via the
 *    backend `?archived=true` filter — sprints have no native archive flag, so
 *    there is a single list, never a separate archived one like epics),
 *  - real-time reconciliation over the shared `projects.{id}` Reverb channel.
 *
 * The store holds sprints for *multiple* projects in one flat list, scoped via
 * `project_id` (consumers read through the `*ByProject` getters).
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Sprint, SprintStatus, BurndownDataPoint } from "@/types";
import { sprintsApi } from "@/services/api";
import { websocket } from "@/services/websocket";

interface CreateSprintData {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
}

/**
 * `sprint:updated` bus event. The mobile websocket collapses `.sprint.updated`,
 * `.sprint.started` and `.sprint.completed` into this one event, so the payload
 * is a union: only the fields actually broadcast for that action are present.
 * `SprintUpdated` carries name/status/progress/remaining_days (+ `action` ∈
 * updated | started | completed); the (currently unwired) `SprintCompleted`
 * would carry velocity/story-point totals — handled defensively.
 */
interface SprintUpdatedPayload {
  sprint_id: string;
  action?: string;
  name?: string;
  status?: SprintStatus;
  progress_percentage?: number;
  remaining_days?: number | null;
  velocity?: number | null;
  completed_story_points?: number;
  total_story_points?: number;
  timestamp: string;
}

interface SprintsState {
  // State
  sprints: Sprint[];
  activeSprint: Sprint | null;
  burndownData: BurndownDataPoint[];
  // UI toggle for the board's "show sprints under archived epics" view
  // (ephemeral — not persisted; drives the `?archived=true` fetch filter).
  showArchived: boolean;
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
  setShowArchived: (value: boolean) => void;
  toggleShowArchived: () => void;
  clearError: () => void;

  // Real-time
  subscribeRealtime: (projectId: string) => () => void;

  // Local mutators (pure — reused by the API actions AND the realtime listeners)
  applySprintUpdate: (sprintId: string, updates: Partial<Sprint>) => void;
  addSprintLocal: (sprint: Sprint) => void;
  removeSprintLocal: (sprintId: string) => void;
  reconcileActiveSprint: (sprintId: string, status: SprintStatus) => void;
}

const bySortOrder = (a: Sprint, b: Sprint): number =>
  a.sort_order - b.sort_order;

export const useSprintsStore = create<SprintsState>()(
  persist(
    (set, get) => ({
      // Initial state
      sprints: [],
      activeSprint: null,
      burndownData: [],
      showArchived: false,
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
          // Honor the showArchived toggle: when on, the backend stops hiding
          // sprints that belong to archived epics.
          const response = await sprintsApi.list(projectId, {
            archived: get().showArchived,
          });
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
            sprints: [...state.sprints, sprint].sort(bySortOrder),
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
          get().removeSprintLocal(sprintId);
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

      setShowArchived: (value: boolean) => set({ showArchived: value }),

      toggleShowArchived: () =>
        set((state) => ({ showArchived: !state.showArchived })),

      clearError: () => set({ error: null }),

      // ==================== REAL-TIME ====================

      /**
       * Reconcile sprints in real time over the shared `projects.{id}` Reverb
       * channel. Registers one event-bus listener and returns a teardown that
       * removes ONLY it — it never binds or leaves the channel itself (that is
       * owned by the screen via `projectsStore.subscribeToProject` /
       * `websocket.subscribeToProject`, and is shared with the tasks/epics/locks/
       * instances consumers). Callers must store and invoke the returned fn.
       */
      subscribeRealtime: (_projectId: string) => {
        const offUpdated = websocket.on("sprint:updated", (raw: unknown) => {
          const payload = raw as SprintUpdatedPayload;
          if (!payload?.sprint_id) return;

          // Patch only the fields actually present in this broadcast (the event
          // is a union of SprintUpdated / SprintCompleted shapes).
          const updates: Partial<Sprint> = {};
          if (payload.name !== undefined) updates.name = payload.name;
          if (payload.status !== undefined) updates.status = payload.status;
          if (payload.progress_percentage !== undefined)
            updates.progress_percentage = payload.progress_percentage;
          if (payload.remaining_days !== undefined)
            updates.remaining_days = payload.remaining_days;
          if (payload.velocity !== undefined)
            updates.velocity = payload.velocity;
          if (payload.completed_story_points !== undefined)
            updates.completed_story_points = payload.completed_story_points;
          if (payload.total_story_points !== undefined)
            updates.total_story_points = payload.total_story_points;

          get().applySprintUpdate(payload.sprint_id, updates);

          // Reconcile the standalone `activeSprint` ref: promote on `active`,
          // clear when it leaves the active state (status field, or a
          // `completed` action for the SprintCompleted shape that omits status).
          if (payload.status !== undefined) {
            get().reconcileActiveSprint(payload.sprint_id, payload.status);
          } else if (
            payload.action === "completed" &&
            get().activeSprint?.id === payload.sprint_id
          ) {
            set({ activeSprint: null });
          }
        });

        return () => {
          offUpdated();
        };
      },

      // ==================== LOCAL MUTATORS ====================

      // Patch a sprint in place; keep the standalone activeSprint ref in sync.
      applySprintUpdate: (sprintId: string, updates: Partial<Sprint>) => {
        set((state) => ({
          sprints: state.sprints.map((s) =>
            s.id === sprintId ? { ...s, ...updates } : s,
          ),
          activeSprint:
            state.activeSprint?.id === sprintId
              ? { ...state.activeSprint, ...updates }
              : state.activeSprint,
        }));
      },

      // Insert (or replace) a sprint in the list, re-sorted by sort_order.
      addSprintLocal: (sprint: Sprint) => {
        set((state) => {
          const exists = state.sprints.some((s) => s.id === sprint.id);
          const sprints = (
            exists
              ? state.sprints.map((s) => (s.id === sprint.id ? sprint : s))
              : [...state.sprints, sprint]
          ).sort(bySortOrder);
          return {
            sprints,
            activeSprint:
              sprint.status === "active" ? sprint : state.activeSprint,
          };
        });
      },

      // Remove a sprint from the list; clear activeSprint if it was this one.
      removeSprintLocal: (sprintId: string) => {
        set((state) => ({
          sprints: state.sprints.filter((s) => s.id !== sprintId),
          activeSprint:
            state.activeSprint?.id === sprintId ? null : state.activeSprint,
        }));
      },

      // Promote/clear the standalone activeSprint ref after a status mutation.
      reconcileActiveSprint: (sprintId: string, status: SprintStatus) => {
        set((state) => {
          if (status === "active") {
            const promoted =
              state.sprints.find((s) => s.id === sprintId) ?? null;
            return promoted ? { activeSprint: promoted } : {};
          }
          return state.activeSprint?.id === sprintId
            ? { activeSprint: null }
            : {};
        });
      },
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
