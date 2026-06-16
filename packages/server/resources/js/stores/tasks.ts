import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { useMultiAsyncAction } from '@/composables/useAsyncAction';
import { getEchoClient } from '@/services/echo';
import { useSprintsStore } from '@/stores/sprints';
import type {
  SharedTask,
  TaskStatus,
  TaskPriority,
  CreateTaskForm,
  UpdateTaskForm,
  CompleteTaskForm,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// ── Server broadcast payloads (see app/Events/Task*::broadcastWith) ───────────

/** `.task.claimed` — fired when an instance atomically claims a task. */
interface TaskClaimedPayload {
  task_id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  assigned_to: string | null;
  sprint_id: string | null;
  epic_id: string | null;
  claimed_at: string | null;
  timestamp: string;
}

/** `.task.completed` — fired when a task is completed (status → done). */
interface TaskCompletedPayload {
  task_id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  sprint_id: string | null;
  epic_id: string | null;
  assigned_to: string | null;
  completion_summary: string | null;
  files_modified: string[] | null;
  completed_at: string | null;
}

export const useTasksStore = defineStore('tasks', () => {
  // ==================== STATE ====================
  const tasks = ref<SharedTask[]>([]);
  const selectedTask = ref<SharedTask | null>(null);

  // Real-time teardown closure (not reactive — holds the Echo detach handlers).
  let unsubscribeRealtimeFn: (() => void) | null = null;

  const { states, error, run, clearError } = useMultiAsyncAction([
    'loading',
    'creating',
    'updating',
    'deleting',
  ] as const);

  // Aliases for backward compatibility
  const isLoading = states.loading;
  const isCreating = states.creating;
  const isUpdating = states.updating;
  const isDeleting = states.deleting;

  // ==================== GETTERS ====================
  const tasksByStatus = computed(() => {
    const grouped: Record<TaskStatus, SharedTask[]> = {
      backlog: [],
      pending: [],
      in_progress: [],
      blocked: [],
      review: [],
      done: [],
    };
    tasks.value.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  });

  const pendingTasks = computed(() =>
    tasks.value.filter(t => t.status === 'pending')
  );

  const inProgressTasks = computed(() =>
    tasks.value.filter(t => t.status === 'in_progress')
  );

  const completedTasks = computed(() =>
    tasks.value.filter(t => t.status === 'done')
  );

  const blockedTasks = computed(() =>
    tasks.value.filter(t => t.status === 'blocked')
  );

  const claimedTasks = computed(() =>
    tasks.value.filter(t => t.is_claimed)
  );

  const unclaimedTasks = computed(() =>
    tasks.value.filter(t => !t.is_claimed && t.status === 'pending')
  );

  const tasksByPriority = computed(() => {
    const priority: Record<TaskPriority, SharedTask[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    tasks.value.forEach(task => {
      priority[task.priority].push(task);
    });
    return priority;
  });

  const backlogTasks = computed(() =>
    tasks.value.filter(t => t.status === 'backlog')
  );

  const tasksByEpic = computed(() => {
    const grouped: Record<string, SharedTask[]> = { unassigned: [] };
    tasks.value.forEach(task => {
      const key = task.epic_id || 'unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });
    return grouped;
  });

  const tasksBySprint = computed(() => {
    const grouped: Record<string, SharedTask[]> = { backlog: [] };
    tasks.value.forEach(task => {
      const key = task.sprint_id || 'backlog';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });
    return grouped;
  });

  const rootTasks = computed(() =>
    tasks.value.filter(t => !t.parent_id)
  );

  const totalStoryPoints = computed(() =>
    tasks.value.reduce((sum, t) => sum + (t.story_points || 0), 0)
  );

  const completedStoryPoints = computed(() =>
    tasks.value.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.story_points || 0), 0)
  );

  /**
   * Local mirror of `SharedTask::scopeRemaining`: counts tasks that are not
   * done AND are not stranded in a completed/cancelled sprint (backlog tasks
   * with no sprint always count). Replicated client-side so the remaining
   * counter updates in real time on claim/complete without a stats refetch.
   *
   * Sprint statuses come from the sibling sprints store (lazy lookup). If the
   * sprints store is not yet populated, the closed-sprint exclusion degrades
   * gracefully to "exclude done only" — never over-excludes.
   */
  const remainingTasksCount = computed(() => {
    const sprintsStore = useSprintsStore();
    const closedSprintIds = new Set(
      sprintsStore.sprints
        .filter(s => s.status === 'completed' || s.status === 'cancelled')
        .map(s => s.id),
    );

    return tasks.value.filter(t => {
      if (t.status === 'done') return false;
      if (t.sprint_id && closedSprintIds.has(t.sprint_id)) return false;
      return true;
    }).length;
  });

  // ==================== ACTIONS ====================

  /**
   * Fetch tasks for a project with optional filtering.
   * Supports basic filters (status, priority, assigned_to) and extended filters
   * (epic_id, sprint_id, parent_id, root_only).
   * @throws {Error} If the fetch operation fails
   */
  async function fetchTasks(
    projectId: string,
    filters?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigned_to?: string;
      epic_id?: string;
      sprint_id?: string;
      parent_id?: string;
      root_only?: boolean;
    }
  ): Promise<SharedTask[]> {
    return run('loading', async () => {
      const response = await api.get<PaginatedResponse<SharedTask>>(`/projects/${projectId}/tasks`, {
        params: filters,
      });
      tasks.value = response.data.data;
      return response.data.data;
    }, 'Failed to fetch tasks');
  }

  /**
   * Fetch tasks across EVERY active project the user owns — the all-projects
   * task panel (backend `GET /tasks` → TaskController::allForUser).
   *
   * Mirrors {@see fetchTasks}'s filtering (status / priority / assigned_to) but
   * spans all the user's active (non-archived) projects. Each task carries its
   * `project_id` (TaskResource) so the caller can group by project. Pass
   * `project_id` to narrow back to a single owned project, or `include_all` to
   * override the default visibility window (include tasks completed before today).
   * @throws {Error} If the fetch operation fails
   */
  async function fetchAllTasks(
    filters?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigned_to?: string;
      project_id?: string;
      include_all?: boolean;
    }
  ): Promise<SharedTask[]> {
    return run('loading', async () => {
      const response = await api.get<PaginatedResponse<SharedTask>>('/tasks', {
        params: filters,
      });
      tasks.value = response.data.data;
      return response.data.data;
    }, 'Failed to fetch tasks');
  }

  /**
   * Fetch a single task by ID
   * @throws {Error} If the fetch fails
   */
  async function fetchTask(taskId: string): Promise<SharedTask> {
    return run('loading', async () => {
      const response = await api.get<ApiResponse<SharedTask>>(`/tasks/${taskId}`);
      selectedTask.value = response.data.data;
      return response.data.data;
    }, 'Failed to fetch task');
  }

  /**
   * Create a new task
   * @throws {Error} If creation fails
   */
  async function createTask(projectId: string, data: CreateTaskForm): Promise<SharedTask> {
    return run('creating', async () => {
      const response = await api.post<ApiResponse<SharedTask>>(`/projects/${projectId}/tasks`, data);
      const task = response.data.data;
      tasks.value.unshift(task);
      return task;
    }, 'Failed to create task');
  }

  /**
   * Update a task
   * @throws {Error} If the update fails
   */
  async function updateTask(taskId: string, data: UpdateTaskForm): Promise<SharedTask> {
    return run('updating', async () => {
      const response = await api.patch<ApiResponse<SharedTask>>(`/tasks/${taskId}`, data);
      const updated = response.data.data;

      // Update in list
      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updated };
      }

      // Update selected if same
      if (selectedTask.value?.id === taskId) {
        selectedTask.value = { ...selectedTask.value, ...updated };
      }

      return updated;
    }, 'Failed to update task');
  }

  /**
   * Delete a task
   * @throws {Error} If deletion fails
   */
  async function deleteTask(taskId: string): Promise<void> {
    return run('deleting', async () => {
      await api.delete(`/tasks/${taskId}`);
      tasks.value = tasks.value.filter(t => t.id !== taskId);

      if (selectedTask.value?.id === taskId) {
        selectedTask.value = null;
      }
    }, 'Failed to delete task');
  }

  /**
   * Claim a task for an instance (atomic operation)
   * @throws {Error} If claiming fails
   */
  async function claimTask(taskId: string, instanceId: string): Promise<SharedTask> {
    return run('updating', async () => {
      const response = await api.post<ApiResponse<SharedTask>>(`/tasks/${taskId}/claim`, {
        instance_id: instanceId,
      });
      const updated = response.data.data;

      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      if (selectedTask.value?.id === taskId) {
        selectedTask.value = updated;
      }

      return updated;
    }, 'Failed to claim task');
  }

  /**
   * Release a claimed task
   * @throws {Error} If release fails
   */
  async function releaseTask(taskId: string, reason?: string): Promise<SharedTask> {
    return run('updating', async () => {
      const response = await api.post<ApiResponse<SharedTask>>(`/tasks/${taskId}/release`, {
        reason,
      });
      const updated = response.data.data;

      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      if (selectedTask.value?.id === taskId) {
        selectedTask.value = updated;
      }

      return updated;
    }, 'Failed to release task');
  }

  /**
   * Complete a task with summary
   * @throws {Error} If completion fails
   */
  async function completeTask(taskId: string, data: CompleteTaskForm): Promise<SharedTask> {
    return run('updating', async () => {
      const response = await api.post<ApiResponse<SharedTask>>(`/tasks/${taskId}/complete`, data);
      const updated = response.data.data;

      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      if (selectedTask.value?.id === taskId) {
        selectedTask.value = updated;
      }

      return updated;
    }, 'Failed to complete task');
  }

  /**
   * Get next available task for claiming
   * @throws {Error} If fetch fails
   */
  async function getNextAvailable(projectId: string): Promise<SharedTask | null> {
    return run('loading', async () => {
      const response = await api.get<ApiResponse<SharedTask | null>>(`/projects/${projectId}/tasks/next-available`);
      return response.data.data;
    }, 'Failed to get next task');
  }

  /**
   * Move task to different status (for kanban)
   */
  async function moveTask(taskId: string, newStatus: TaskStatus): Promise<SharedTask> {
    return updateTask(taskId, { status: newStatus } as UpdateTaskForm);
  }

  /**
   * Select a task
   */
  function selectTask(task: SharedTask | null): void {
    selectedTask.value = task;
  }

  /**
   * Clear selected task
   */
  function clearSelectedTask(): void {
    selectedTask.value = null;
  }

  /**
   * Lightweight single-task refetch for real-time events whose payload is
   * partial (e.g. `.task.created`) or targets an unknown item. Quiet by
   * design: no loading flags, never throws (a 404 means the task vanished
   * before we could sync — nothing to do).
   */
  async function syncTaskFromServer(taskId: string): Promise<SharedTask | null> {
    try {
      const response = await api.get<ApiResponse<SharedTask>>(`/tasks/${taskId}`);
      const task = response.data.data;

      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = task;
      } else {
        tasks.value.unshift(task);
      }

      if (selectedTask.value?.id === taskId) {
        selectedTask.value = task;
      }

      return task;
    } catch {
      return null;
    }
  }

  /**
   * Update task locally (for real-time updates)
   */
  function updateTaskLocal(taskId: string, updates: Partial<SharedTask>): void {
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
    }
    if (selectedTask.value?.id === taskId) {
      Object.assign(selectedTask.value, updates);
    }
  }

  /**
   * Add task locally (for real-time updates)
   */
  function addTaskLocal(task: SharedTask): void {
    tasks.value.unshift(task);
  }

  /**
   * Remove task locally (for real-time updates)
   */
  function removeTaskLocal(taskId: string): void {
    tasks.value = tasks.value.filter(t => t.id !== taskId);
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = null;
    }
  }

  /**
   * Fetch subtasks for a given task
   * @throws {Error} If the fetch fails
   */
  async function fetchSubtasks(taskId: string): Promise<SharedTask[]> {
    return run('loading', async () => {
      const response = await api.get<ApiResponse<SharedTask[]>>(`/tasks/${taskId}/subtasks`);
      return response.data.data;
    }, 'Failed to fetch subtasks');
  }

  /**
   * Move a task to a different epic, sprint, status, or sort position
   * @throws {Error} If the move fails
   */
  async function moveTaskTo(taskId: string, data: {
    epic_id?: string | null;
    sprint_id?: string | null;
    status?: TaskStatus;
    sort_order?: number;
  }): Promise<SharedTask> {
    return run('updating', async () => {
      const response = await api.post<ApiResponse<SharedTask>>(`/tasks/${taskId}/move`, data);
      const updated = response.data.data;
      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updated };
      }
      if (selectedTask.value?.id === taskId) {
        selectedTask.value = { ...selectedTask.value, ...updated };
      }
      return updated;
    }, 'Failed to move task');
  }

  /**
   * Subscribe to real-time task mutations on the `projects.{id}` channel.
   *
   * Applies targeted local updates from `TaskClaimed` / `TaskCompleted`
   * broadcasts (status, assignee, completion fields) without a global refetch,
   * so the board and the `remainingTasksCount` getter update the instant a
   * worker claims or completes a task elsewhere.
   *
   * Idempotent: re-subscribing detaches the previous handlers first. The
   * channel is shared with `useProjectChannel` and the epics/sprints stores,
   * so teardown only `stopListening` our own handlers — never `leave()`, which
   * would drop those sibling subscriptions.
   */
  function subscribeRealtime(projectId: string): void {
    unsubscribeRealtime();

    let client: ReturnType<typeof getEchoClient>;
    try {
      client = getEchoClient();
    } catch {
      // Reverb config missing (tests, degraded boot) — real-time disabled.
      return;
    }

    const channel = `projects.${projectId}`;

    const onClaimed = (payload: TaskClaimedPayload): void => {
      updateTaskLocal(payload.task_id, {
        status: payload.status,
        assigned_to: payload.assigned_to,
        claimed_at: payload.claimed_at,
        sprint_id: payload.sprint_id,
        epic_id: payload.epic_id,
        is_claimed: !!payload.assigned_to,
        is_completed: payload.status === 'done',
      });
    };

    const onCompleted = (payload: TaskCompletedPayload): void => {
      updateTaskLocal(payload.task_id, {
        status: payload.status,
        assigned_to: payload.assigned_to,
        completed_at: payload.completed_at,
        completion_summary: payload.completion_summary ?? undefined,
        files_modified: payload.files_modified ?? undefined,
        sprint_id: payload.sprint_id,
        epic_id: payload.epic_id,
        is_completed: payload.status === 'done',
        is_claimed: !!payload.assigned_to,
      });
    };

    client
      .private(channel)
      .listen('.task.claimed', onClaimed as (p: unknown) => void)
      .listen('.task.completed', onCompleted as (p: unknown) => void);

    unsubscribeRealtimeFn = () => {
      try {
        client
          .private(channel)
          .stopListening('.task.claimed', onClaimed as (p: unknown) => void)
          .stopListening('.task.completed', onCompleted as (p: unknown) => void);
      } catch {
        // Channel already gone.
      }
    };
  }

  /**
   * Detach the real-time task listeners (call on component unmount or when
   * switching projects).
   */
  function unsubscribeRealtime(): void {
    unsubscribeRealtimeFn?.();
    unsubscribeRealtimeFn = null;
  }

  /**
   * @deprecated Use fetchTasks with extended filters instead.
   * Kept for backward compatibility.
   */
  const fetchTasksFiltered = fetchTasks;

  return {
    // State
    tasks,
    selectedTask,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,

    // Getters
    tasksByStatus,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    blockedTasks,
    claimedTasks,
    unclaimedTasks,
    tasksByPriority,
    backlogTasks,
    tasksByEpic,
    tasksBySprint,
    rootTasks,
    totalStoryPoints,
    completedStoryPoints,
    remainingTasksCount,

    // Actions
    fetchTasks,
    fetchAllTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    claimTask,
    releaseTask,
    completeTask,
    getNextAvailable,
    moveTask,
    selectTask,
    clearSelectedTask,
    clearError,
    syncTaskFromServer,
    updateTaskLocal,
    addTaskLocal,
    removeTaskLocal,
    subscribeRealtime,
    unsubscribeRealtime,
    fetchSubtasks,
    moveTaskTo,
    fetchTasksFiltered,
  };
});
