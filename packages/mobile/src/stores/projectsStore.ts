/**
 * Projects Store - Zustand
 * Manages multi-agent project state
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  SharedProject,
  SharedTask,
  ContextChunk,
  FileLock,
  ClaudeInstance,
  ActivityLog,
  TokenBudget,
} from "@/types";
import { projectsApi, tasksApi, locksApi } from "@/services/api";
import { websocket } from "@/services/websocket";
import { useOrchestratorStore } from "./orchestratorStore";

/**
 * Realtime `.instance.updated` payload (snake_case from Reverb), re-emitted
 * by services/websocket as `instance:updated` with a guaranteed project_id.
 * Local type — the shared types file is owned by a parallel change.
 */
interface InstanceUpdatedPayload {
  project_id?: string;
  id?: string;
  status?: string;
  current_task_id?: string | null;
  session_id?: string | null;
}

const INSTANCE_STATUSES: readonly ClaudeInstance["status"][] = [
  "active",
  "idle",
  "busy",
  "disconnected",
];

const isInstanceStatus = (value: unknown): value is ClaudeInstance["status"] =>
  typeof value === "string" &&
  (INSTANCE_STATUSES as readonly string[]).includes(value);

interface ProjectsState {
  // State
  projects: SharedProject[];
  archivedProjects: SharedProject[];
  isLoadingArchived: boolean;
  tasks: SharedTask[];
  locks: FileLock[];
  instances: ClaudeInstance[];
  activityLogs: ActivityLog[];
  contextChunks: ContextChunk[];
  tokenBudget: TokenBudget | null;
  isLoadingTokenBudget: boolean;
  isLoading: boolean;
  error: string | null;
  selectedProjectId: string | null;

  // Getters
  selectedProject: () => SharedProject | undefined;
  getProjectById: (id: string) => SharedProject | undefined;
  getProjectTasks: (projectId: string) => SharedTask[];
  getProjectLocks: (projectId: string) => FileLock[];
  getProjectInstances: (projectId: string) => ClaudeInstance[];
  getProjectActivity: (projectId: string) => ActivityLog[];

  // Actions - Projects
  fetchProjects: (machineId: string) => Promise<void>;
  fetchProject: (id: string) => Promise<SharedProject>;
  createProject: (
    machineId: string,
    data: { name: string; projectPath: string },
  ) => Promise<SharedProject>;
  updateProject: (id: string, data: Partial<SharedProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchArchivedProjects: (machineId: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  unarchiveProject: (id: string) => Promise<void>;
  /** Fetch aggregated token usage + cost estimate for a project. */
  fetchTokenBudget: (id: string) => Promise<TokenBudget>;
  /** Realtime: drop an externally-archived project from the active list. */
  applyProjectArchived: (projectId: string) => void;
  /** Realtime: an externally-restored project re-enters the active list. */
  applyProjectUnarchived: (projectId: string, machineId?: string) => void;

  // Actions - Tasks
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (
    projectId: string,
    data: Partial<SharedTask>,
  ) => Promise<SharedTask>;
  updateTask: (id: string, data: Partial<SharedTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  claimTask: (id: string, instanceId: string) => Promise<void>;
  releaseTask: (id: string) => Promise<void>;
  completeTask: (
    id: string,
    summary: string,
    filesModified: string[],
  ) => Promise<void>;

  // Actions - Context
  fetchContext: (projectId: string) => Promise<void>;
  queryContext: (projectId: string, query: string) => Promise<ContextChunk[]>;
  updateContext: (
    projectId: string,
    data: Partial<SharedProject>,
  ) => Promise<void>;

  // Actions - Locks
  fetchLocks: (projectId: string) => Promise<void>;
  createLock: (
    projectId: string,
    path: string,
    reason?: string,
  ) => Promise<void>;
  deleteLock: (projectId: string, path: string) => Promise<void>;

  // Actions - Instances
  fetchInstances: (projectId: string) => Promise<void>;

  // Actions - Activity
  fetchActivity: (projectId: string, limit?: number) => Promise<void>;
  broadcast: (projectId: string, message: string) => Promise<void>;

  // Actions
  selectProject: (id: string | null) => void;
  subscribeToProject: (projectId: string) => () => void;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      archivedProjects: [],
      isLoadingArchived: false,
      tasks: [],
      locks: [],
      instances: [],
      activityLogs: [],
      contextChunks: [],
      tokenBudget: null,
      isLoadingTokenBudget: false,
      isLoading: false,
      error: null,
      selectedProjectId: null,

      // Getters
      selectedProject: () =>
        get().projects.find((p) => p.id === get().selectedProjectId),
      getProjectById: (id: string) => get().projects.find((p) => p.id === id),
      getProjectTasks: (projectId: string) =>
        get().tasks.filter((t) => t.projectId === projectId),
      getProjectLocks: (projectId: string) =>
        get().locks.filter((l) => l.project_id === projectId),
      getProjectInstances: (projectId: string) =>
        get().instances.filter((i) => i.projectId === projectId),
      getProjectActivity: (projectId: string) =>
        get().activityLogs.filter((a) => a.projectId === projectId),

      // Projects
      fetchProjects: async (machineId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await projectsApi.list(machineId);
          set((state) => ({
            projects: [
              ...state.projects.filter((p) => p.machineId !== machineId),
              ...response.data!,
            ],
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch projects";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      fetchProject: async (id: string) => {
        const response = await projectsApi.get(id);
        const project = response.data!;

        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? project : p)),
        }));

        return project;
      },

      createProject: async (
        machineId: string,
        data: { name: string; projectPath: string },
      ) => {
        set({ isLoading: true, error: null });

        try {
          const response = await projectsApi.create(machineId, data);
          const project = response.data!;

          set((state) => ({
            projects: [...state.projects, project],
            isLoading: false,
          }));

          return project;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create project";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      updateProject: async (id: string, data: Partial<SharedProject>) => {
        try {
          const response = await projectsApi.update(id, data);
          const project = response.data!;

          set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? project : p)),
          }));
        } catch (err) {
          console.error("Failed to update project:", err);
          throw err;
        }
      },

      deleteProject: async (id: string) => {
        try {
          await projectsApi.delete(id);

          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            tasks: state.tasks.filter((t) => t.projectId !== id),
            locks: state.locks.filter((l) => l.project_id !== id),
            instances: state.instances.filter((i) => i.projectId !== id),
            activityLogs: state.activityLogs.filter((a) => a.projectId !== id),
            selectedProjectId:
              state.selectedProjectId === id ? null : state.selectedProjectId,
          }));
        } catch (err) {
          console.error("Failed to delete project:", err);
          throw err;
        }
      },

      fetchArchivedProjects: async (machineId: string) => {
        set({ isLoadingArchived: true });
        try {
          const response = await projectsApi.listArchived(machineId);
          set((state) => ({
            archivedProjects: [
              ...state.archivedProjects.filter(
                (p) => p.machineId !== machineId,
              ),
              ...response.data!,
            ],
            isLoadingArchived: false,
          }));
        } catch (err) {
          set({ isLoadingArchived: false });
          console.error("Failed to fetch archived projects:", err);
          throw err;
        }
      },

      archiveProject: async (id: string) => {
        const project = await projectsApi.archive(id).then((r) => r.data!);
        // Reversible: move from the active list into the archived list locally.
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          archivedProjects: [
            project,
            ...state.archivedProjects.filter((p) => p.id !== id),
          ],
          selectedProjectId:
            state.selectedProjectId === id ? null : state.selectedProjectId,
        }));
      },

      unarchiveProject: async (id: string) => {
        const project = await projectsApi.unarchive(id).then((r) => r.data!);
        set((state) => ({
          archivedProjects: state.archivedProjects.filter((p) => p.id !== id),
          projects: [project, ...state.projects.filter((p) => p.id !== id)],
        }));
      },

      fetchTokenBudget: async (id: string) => {
        set({ isLoadingTokenBudget: true });
        try {
          const response = await projectsApi.tokenBudget(id);
          const budget = response.data!;
          set({ tokenBudget: budget, isLoadingTokenBudget: false });
          return budget;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch token budget";
          set({ isLoadingTokenBudget: false, error: message });
          throw err;
        }
      },

      applyProjectArchived: (projectId: string) => {
        set((state) => {
          if (!state.projects.some((p) => p.id === projectId)) return state;
          return {
            projects: state.projects.filter((p) => p.id !== projectId),
            selectedProjectId:
              state.selectedProjectId === projectId
                ? null
                : state.selectedProjectId,
          };
        });
      },

      applyProjectUnarchived: (projectId: string, machineId?: string) => {
        set((state) => ({
          archivedProjects: state.archivedProjects.filter(
            (p) => p.id !== projectId,
          ),
        }));
        // Re-fetch the active list to pull the restored project with full data.
        if (machineId) void get().fetchProjects(machineId);
      },

      // Tasks
      fetchTasks: async (projectId: string) => {
        try {
          const response = await tasksApi.list(projectId);
          set((state) => ({
            tasks: [
              ...state.tasks.filter((t) => t.projectId !== projectId),
              ...response.data!,
            ],
          }));
        } catch (err) {
          console.error("Failed to fetch tasks:", err);
          throw err;
        }
      },

      createTask: async (projectId: string, data: Partial<SharedTask>) => {
        const response = await tasksApi.create(projectId, data);
        const task = response.data!;

        set((state) => ({
          tasks: [...state.tasks, task],
        }));

        return task;
      },

      updateTask: async (id: string, data: Partial<SharedTask>) => {
        const response = await tasksApi.update(id, data);
        const task = response.data!;

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
      },

      deleteTask: async (id: string) => {
        await tasksApi.delete(id);

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      claimTask: async (id: string, instanceId: string) => {
        const response = await tasksApi.claim(id, instanceId);
        const task = response.data!;

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
      },

      releaseTask: async (id: string) => {
        await tasksApi.release(id);
        // Refresh task data
        const response = await tasksApi.get(id);
        const task = response.data!;

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
      },

      completeTask: async (
        id: string,
        summary: string,
        filesModified: string[],
      ) => {
        const response = await tasksApi.complete(id, summary, filesModified);
        const task = response.data!;

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
      },

      // Context
      fetchContext: async (projectId: string) => {
        try {
          const response = await projectsApi.getContext(projectId);
          const context = response.data!;

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    summary: context.summary,
                    architecture: context.architecture,
                    conventions: context.conventions,
                    currentFocus: context.currentFocus,
                    recentChanges: context.recentChanges,
                  }
                : p,
            ),
          }));
        } catch (err) {
          console.error("Failed to fetch context:", err);
          throw err;
        }
      },

      queryContext: async (projectId: string, query: string) => {
        const response = await projectsApi.queryContext(projectId, query);
        const chunks = response.data!;

        set((state) => ({
          contextChunks: [
            ...state.contextChunks.filter((c) => c.projectId !== projectId),
            ...chunks,
          ],
        }));

        return chunks;
      },

      updateContext: async (
        projectId: string,
        data: Partial<SharedProject>,
      ) => {
        await projectsApi.updateContext(projectId, data);
        // Update local state
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...data } : p,
          ),
        }));
      },

      // Locks
      fetchLocks: async (projectId: string) => {
        try {
          const response = await locksApi.list(projectId);
          // The list endpoint omits project_id — stamp it so the per-project
          // getter and dedupe work.
          const fresh = (response.data ?? []).map((l) => ({
            ...l,
            project_id: projectId,
          }));
          set((state) => ({
            locks: [
              ...state.locks.filter((l) => l.project_id !== projectId),
              ...fresh,
            ],
          }));
        } catch (err) {
          console.error("Failed to fetch locks:", err);
          throw err;
        }
      },

      createLock: async (projectId: string, path: string, reason?: string) => {
        await locksApi.create(projectId, path, reason);
        // The create response shape differs from the list — refetch for a
        // consistent, fully-populated lock list.
        await get().fetchLocks(projectId);
      },

      deleteLock: async (projectId: string, path: string) => {
        await locksApi.delete(projectId, path);

        set((state) => ({
          locks: state.locks.filter(
            (l) => !(l.project_id === projectId && l.path === path),
          ),
        }));
      },

      // Instances
      fetchInstances: async (projectId: string) => {
        try {
          const response = await projectsApi.getInstances(projectId);
          set((state) => ({
            instances: [
              ...state.instances.filter((i) => i.projectId !== projectId),
              ...response.data!,
            ],
          }));
        } catch (err) {
          console.error("Failed to fetch instances:", err);
          throw err;
        }
      },

      // Activity
      fetchActivity: async (projectId: string, limit = 50) => {
        try {
          const response = await projectsApi.getActivity(projectId, { limit });
          set((state) => ({
            activityLogs: [
              ...state.activityLogs.filter((a) => a.projectId !== projectId),
              ...response.data!,
            ],
          }));
        } catch (err) {
          console.error("Failed to fetch activity:", err);
          throw err;
        }
      },

      broadcast: async (projectId: string, message: string) => {
        await projectsApi.broadcast(projectId, message);
      },

      // General actions
      selectProject: (id: string | null) => {
        set({ selectedProjectId: id });
      },

      subscribeToProject: (projectId: string) => {
        websocket.subscribeToProject(projectId);

        const unsubscribeTask = websocket.on(
          "task:updated",
          (_raw: unknown) => {
            // Refresh tasks for this project
            get().fetchTasks(projectId);
          },
        );

        const unsubscribeLock = websocket.on("file:locked", (raw: unknown) => {
          const payload = raw as {
            projectId: string;
            path: string;
            lockedBy: string;
          };
          if (payload.projectId === projectId) {
            get().fetchLocks(projectId);
          }
        });

        const unsubscribeUnlock = websocket.on(
          "file:unlocked",
          (raw: unknown) => {
            const payload = raw as { projectId: string; path: string };
            if (payload.projectId === projectId) {
              get().fetchLocks(projectId);
            }
          },
        );

        const unsubscribeInstance = websocket.on(
          "instance:updated",
          (raw: unknown) => {
            const payload = raw as InstanceUpdatedPayload;
            if (payload.project_id !== projectId || !payload.id) return;

            // Forward to the orchestrator store when it exposes the handler
            // (optional while the orchestration slice lands in parallel).
            const orchestrator = useOrchestratorStore.getState() as unknown as {
              applyInstanceUpdate?: (update: {
                id: string;
                status?: string;
                current_task_id?: string | null;
                session_id?: string | null;
              }) => void;
            };
            orchestrator.applyInstanceUpdate?.({
              id: payload.id,
              status: payload.status,
              current_task_id: payload.current_task_id,
              session_id: payload.session_id,
            });

            // Unknown instance (first connection) — fetch the authoritative
            // list once; otherwise patch in place without a refetch.
            const known = get().instances.some((i) => i.id === payload.id);
            if (!known) {
              get()
                .fetchInstances(projectId)
                .catch(() => {
                  /* transient — next event or screen focus will retry */
                });
              return;
            }

            set((state) => ({
              instances: state.instances.map((instance) => {
                if (instance.id !== payload.id) return instance;
                return {
                  ...instance,
                  status: isInstanceStatus(payload.status)
                    ? payload.status
                    : instance.status,
                  currentTaskId:
                    payload.current_task_id !== undefined
                      ? payload.current_task_id
                      : instance.currentTaskId,
                  sessionId:
                    payload.session_id !== undefined
                      ? payload.session_id
                      : instance.sessionId,
                };
              }),
            }));
          },
        );

        return () => {
          unsubscribeTask();
          unsubscribeLock();
          unsubscribeUnlock();
          unsubscribeInstance();
          websocket.unsubscribeFromProject(projectId);
        };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "projects-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        selectedProjectId: state.selectedProjectId,
      }),
    },
  ),
);
