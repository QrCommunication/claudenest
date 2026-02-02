/**
 * Projects Store - Zustand
 * Manages multi-agent project state
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SharedProject,
  SharedTask,
  ContextChunk,
  FileLock,
  ClaudeInstance,
  ActivityLog,
} from '@/types';
import { projectsApi, tasksApi, locksApi } from '@/services/api';
import { websocket } from '@/services/websocket';

interface ProjectsState {
  // State
  projects: SharedProject[];
  tasks: SharedTask[];
  locks: FileLock[];
  instances: ClaudeInstance[];
  activityLogs: ActivityLog[];
  contextChunks: ContextChunk[];
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
    data: { name: string; projectPath: string }
  ) => Promise<SharedProject>;
  updateProject: (id: string, data: Partial<SharedProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Actions - Tasks
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (projectId: string, data: Partial<SharedTask>) => Promise<SharedTask>;
  updateTask: (id: string, data: Partial<SharedTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  claimTask: (id: string, instanceId: string) => Promise<void>;
  releaseTask: (id: string) => Promise<void>;
  completeTask: (id: string, summary: string, filesModified: string[]) => Promise<void>;

  // Actions - Context
  fetchContext: (projectId: string) => Promise<void>;
  queryContext: (projectId: string, query: string) => Promise<ContextChunk[]>;
  updateContext: (projectId: string, data: Partial<SharedProject>) => Promise<void>;

  // Actions - Locks
  fetchLocks: (projectId: string) => Promise<void>;
  createLock: (projectId: string, path: string, reason?: string) => Promise<void>;
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
      tasks: [],
      locks: [],
      instances: [],
      activityLogs: [],
      contextChunks: [],
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
        get().locks.filter((l) => l.projectId === projectId),
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
            err instanceof Error ? err.message : 'Failed to fetch projects';
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
        data: { name: string; projectPath: string }
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
            err instanceof Error ? err.message : 'Failed to create project';
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
          console.error('Failed to update project:', err);
          throw err;
        }
      },

      deleteProject: async (id: string) => {
        try {
          await projectsApi.delete(id);

          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            tasks: state.tasks.filter((t) => t.projectId !== id),
            locks: state.locks.filter((l) => l.projectId !== id),
            instances: state.instances.filter((i) => i.projectId !== id),
            activityLogs: state.activityLogs.filter((a) => a.projectId !== id),
            selectedProjectId:
              state.selectedProjectId === id ? null : state.selectedProjectId,
          }));
        } catch (err) {
          console.error('Failed to delete project:', err);
          throw err;
        }
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
          console.error('Failed to fetch tasks:', err);
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
        filesModified: string[]
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
                : p
            ),
          }));
        } catch (err) {
          console.error('Failed to fetch context:', err);
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

      updateContext: async (projectId: string, data: Partial<SharedProject>) => {
        await projectsApi.updateContext(projectId, data);
        // Update local state
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...data } : p
          ),
        }));
      },

      // Locks
      fetchLocks: async (projectId: string) => {
        try {
          const response = await locksApi.list(projectId);
          set((state) => ({
            locks: [
              ...state.locks.filter((l) => l.projectId !== projectId),
              ...response.data!,
            ],
          }));
        } catch (err) {
          console.error('Failed to fetch locks:', err);
          throw err;
        }
      },

      createLock: async (projectId: string, path: string, reason?: string) => {
        const response = await locksApi.create(projectId, path, reason);
        const lock = response.data!;

        set((state) => ({
          locks: [...state.locks, lock],
        }));
      },

      deleteLock: async (projectId: string, path: string) => {
        await locksApi.delete(projectId, path);

        set((state) => ({
          locks: state.locks.filter(
            (l) => !(l.projectId === projectId && l.path === path)
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
          console.error('Failed to fetch instances:', err);
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
          console.error('Failed to fetch activity:', err);
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
          'task:updated',
          (payload: { taskId: string; status: string }) => {
            // Refresh tasks for this project
            get().fetchTasks(projectId);
          }
        );

        const unsubscribeLock = websocket.on(
          'file:locked',
          (payload: { projectId: string; path: string; lockedBy: string }) => {
            if (payload.projectId === projectId) {
              get().fetchLocks(projectId);
            }
          }
        );

        const unsubscribeUnlock = websocket.on(
          'file:unlocked',
          (payload: { projectId: string; path: string }) => {
            if (payload.projectId === projectId) {
              get().fetchLocks(projectId);
            }
          }
        );

        const unsubscribeInstance = websocket.on(
          'instance:connected',
          (payload: { projectId: string }) => {
            if (payload.projectId === projectId) {
              get().fetchInstances(projectId);
            }
          }
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
      name: 'projects-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        selectedProjectId: state.selectedProjectId,
      }),
    }
  )
);
