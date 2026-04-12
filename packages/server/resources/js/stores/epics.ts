import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { useMultiAsyncAction } from '@/composables/useAsyncAction';
import type {
  Epic,
  EpicStatus,
  CreateEpicForm,
  UpdateEpicForm,
  ApiResponse,
  PaginatedResponse,
  TaskPriority,
} from '@/types';

export const useEpicsStore = defineStore('epics', () => {
  // ==================== STATE ====================
  const epics = ref<Epic[]>([]);
  const selectedEpic = ref<Epic | null>(null);

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
  const epicsByStatus = computed(() => {
    const grouped: Record<EpicStatus, Epic[]> = {
      open: [],
      in_progress: [],
      done: [],
    };
    epics.value.forEach(epic => {
      grouped[epic.status].push(epic);
    });
    return grouped;
  });

  const openEpics = computed(() =>
    epics.value.filter(e => e.status === 'open')
  );

  const activeEpics = computed(() =>
    epics.value.filter(e => e.status !== 'done')
  );

  const inProgressEpics = computed(() =>
    epics.value.filter(e => e.status === 'in_progress')
  );

  const completedEpics = computed(() =>
    epics.value.filter(e => e.status === 'done')
  );

  const overallProgress = computed(() => {
    if (epics.value.length === 0) return 0;
    return Math.round(
      epics.value.reduce((sum, e) => sum + e.progress_percentage, 0) / epics.value.length
    );
  });

  const epicsByPriority = computed(() => {
    const grouped: Record<TaskPriority, Epic[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    epics.value.forEach(epic => {
      grouped[epic.priority].push(epic);
    });
    return grouped;
  });

  const totalTasksCount = computed(() =>
    epics.value.reduce((sum, e) => sum + e.tasks_count, 0)
  );

  const totalCompletedTasksCount = computed(() =>
    epics.value.reduce((sum, e) => sum + e.completed_tasks_count, 0)
  );

  // ==================== ACTIONS ====================

  /**
   * Fetch all epics for a project
   * @throws {Error} If the fetch operation fails
   */
  async function fetchEpics(projectId: string): Promise<Epic[]> {
    return run('loading', async () => {
      const response = await api.get<PaginatedResponse<Epic>>(
        `/projects/${projectId}/epics`
      );
      epics.value = response.data.data;
      return response.data.data;
    }, 'Failed to fetch epics');
  }

  /**
   * Fetch a single epic by ID
   * @throws {Error} If the fetch fails
   */
  async function fetchEpic(epicId: string): Promise<Epic> {
    return run('loading', async () => {
      const response = await api.get<ApiResponse<Epic>>(`/epics/${epicId}`);
      selectedEpic.value = response.data.data;
      return response.data.data;
    }, 'Failed to fetch epic');
  }

  /**
   * Create a new epic
   * @throws {Error} If creation fails
   */
  async function createEpic(projectId: string, data: CreateEpicForm): Promise<Epic> {
    return run('creating', async () => {
      const response = await api.post<ApiResponse<Epic>>(
        `/projects/${projectId}/epics`,
        data
      );
      const epic = response.data.data;
      epics.value.push(epic);
      return epic;
    }, 'Failed to create epic');
  }

  /**
   * Update an epic
   * @throws {Error} If the update fails
   */
  async function updateEpic(epicId: string, data: UpdateEpicForm): Promise<Epic> {
    return run('updating', async () => {
      const response = await api.patch<ApiResponse<Epic>>(`/epics/${epicId}`, data);
      const updated = response.data.data;

      // Update in list
      const index = epics.value.findIndex(e => e.id === epicId);
      if (index !== -1) {
        epics.value[index] = { ...epics.value[index], ...updated };
      }

      // Update selected if same
      if (selectedEpic.value?.id === epicId) {
        selectedEpic.value = { ...selectedEpic.value, ...updated };
      }

      return updated;
    }, 'Failed to update epic');
  }

  /**
   * Delete an epic
   * @throws {Error} If deletion fails
   */
  async function deleteEpic(epicId: string): Promise<void> {
    return run('deleting', async () => {
      await api.delete(`/epics/${epicId}`);
      epics.value = epics.value.filter(e => e.id !== epicId);

      if (selectedEpic.value?.id === epicId) {
        selectedEpic.value = null;
      }
    }, 'Failed to delete epic');
  }

  /**
   * Reorder an epic to a new position
   * @throws {Error} If the reorder operation fails
   */
  async function reorderEpic(epicId: string, position: number): Promise<Epic> {
    return run('loading', async () => {
      const response = await api.post<ApiResponse<Epic>>(
        `/epics/${epicId}/reorder`,
        { position }
      );
      const updated = response.data.data;

      // Update sort_order in list and re-sort
      const index = epics.value.findIndex(e => e.id === epicId);
      if (index !== -1) {
        epics.value[index] = { ...epics.value[index], sort_order: updated.sort_order };
        epics.value = [...epics.value].sort((a, b) => a.sort_order - b.sort_order);
      }

      // Update selected if same
      if (selectedEpic.value?.id === epicId) {
        selectedEpic.value = { ...selectedEpic.value, sort_order: updated.sort_order };
      }

      return updated;
    }, 'Failed to reorder epic');
  }

  /**
   * Select an epic
   */
  function selectEpic(epic: Epic | null): void {
    selectedEpic.value = epic;
  }

  /**
   * Clear selected epic
   */
  function clearSelectedEpic(): void {
    selectedEpic.value = null;
  }

  /**
   * Update an epic locally (for real-time updates)
   */
  function updateEpicLocal(epicId: string, updates: Partial<Epic>): void {
    const epic = epics.value.find(e => e.id === epicId);
    if (epic) {
      Object.assign(epic, updates);
    }
    if (selectedEpic.value?.id === epicId) {
      Object.assign(selectedEpic.value, updates);
    }
  }

  /**
   * Add an epic locally (for real-time updates)
   */
  function addEpicLocal(epic: Epic): void {
    epics.value.push(epic);
    epics.value = [...epics.value].sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Remove an epic locally (for real-time updates)
   */
  function removeEpicLocal(epicId: string): void {
    epics.value = epics.value.filter(e => e.id !== epicId);
    if (selectedEpic.value?.id === epicId) {
      selectedEpic.value = null;
    }
  }

  return {
    // State
    epics,
    selectedEpic,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,

    // Getters
    epicsByStatus,
    openEpics,
    activeEpics,
    inProgressEpics,
    completedEpics,
    overallProgress,
    epicsByPriority,
    totalTasksCount,
    totalCompletedTasksCount,

    // Actions
    fetchEpics,
    fetchEpic,
    createEpic,
    updateEpic,
    deleteEpic,
    reorderEpic,
    selectEpic,
    clearSelectedEpic,
    updateEpicLocal,
    addEpicLocal,
    removeEpicLocal,
    clearError,
  };
});
