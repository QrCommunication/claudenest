import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
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
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const error = ref<string | null>(null);

  // ==================== GETTERS ====================
  const tasksByStatus = computed(() => {
    const grouped: Record<TaskStatus, SharedTask[]> = {
      pending: [],
      in_progress: [],
      blocked: [],
      review: [],
      done: [],
    };
    tasks.value.forEach(task => {
      grouped[task.status].push(task);
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

  // ==================== ACTIONS ====================

  /**
   * Fetch tasks for a project
   */
  async function fetchTasks(
    projectId: string, 
    filters?: { status?: TaskStatus; priority?: TaskPriority; assigned_to?: string }
  ): Promise<SharedTask[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<PaginatedResponse<SharedTask>>(`/projects/${projectId}/tasks`, {
        params: filters,
      });
      tasks.value = response.data.data;
      return response.data.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch tasks';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch a single task
   */
  async function fetchTask(taskId: string): Promise<SharedTask> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<SharedTask>>(`/tasks/${taskId}`);
      selectedTask.value = response.data.data;
      return response.data.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch task';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create a new task
   */
  async function createTask(projectId: string, data: CreateTaskForm): Promise<SharedTask> {
    isCreating.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedTask>>(`/projects/${projectId}/tasks`, data);
      const task = response.data.data;
      tasks.value.unshift(task);
      return task;
    } catch (err: any) {
      error.value = err.message || 'Failed to create task';
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Update a task
   */
  async function updateTask(taskId: string, data: UpdateTaskForm): Promise<SharedTask> {
    isUpdating.value = true;
    error.value = null;

    try {
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
    } catch (err: any) {
      error.value = err.message || 'Failed to update task';
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Delete a task
   */
  async function deleteTask(taskId: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await api.delete(`/tasks/${taskId}`);
      tasks.value = tasks.value.filter(t => t.id !== taskId);

      if (selectedTask.value?.id === taskId) {
        selectedTask.value = null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete task';
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Claim a task
   */
  async function claimTask(taskId: string, instanceId: string): Promise<SharedTask> {
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedTask>>(`/tasks/${taskId}/claim`, {
        instance_id: instanceId,
      });
      const updated = response.data.data;

      // Update in list
      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      // Update selected if same
      if (selectedTask.value?.id === taskId) {
        selectedTask.value = updated;
      }

      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to claim task';
      throw err;
    }
  }

  /**
   * Release a task
   */
  async function releaseTask(taskId: string, reason?: string): Promise<SharedTask> {
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedTask>>(`/tasks/${taskId}/release`, {
        reason,
      });
      const updated = response.data.data;

      // Update in list
      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      // Update selected if same
      if (selectedTask.value?.id === taskId) {
        selectedTask.value = updated;
      }

      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to release task';
      throw err;
    }
  }

  /**
   * Complete a task
   */
  async function completeTask(taskId: string, data: CompleteTaskForm): Promise<SharedTask> {
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedTask>>(`/tasks/${taskId}/complete`, data);
      const updated = response.data.data;

      // Update in list
      const index = tasks.value.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      // Update selected if same
      if (selectedTask.value?.id === taskId) {
        selectedTask.value = updated;
      }

      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to complete task';
      throw err;
    }
  }

  /**
   * Get next available task
   */
  async function getNextAvailable(projectId: string): Promise<SharedTask | null> {
    try {
      const response = await api.get<ApiResponse<SharedTask | null>>(`/projects/${projectId}/tasks/next-available`);
      return response.data.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to get next task';
      throw err;
    }
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
   * Clear error
   */
  function clearError(): void {
    error.value = null;
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
  };
});
