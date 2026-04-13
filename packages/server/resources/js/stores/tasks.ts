import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { useMultiAsyncAction } from '@/composables/useAsyncAction';
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

export const useTasksStore = defineStore('tasks', () => {
  // ==================== STATE ====================
  const tasks = ref<SharedTask[]>([]);
  const selectedTask = ref<SharedTask | null>(null);

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

    // Actions
    fetchTasks,
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
    updateTaskLocal,
    addTaskLocal,
    removeTaskLocal,
    fetchSubtasks,
    moveTaskTo,
    fetchTasksFiltered,
  };
});
