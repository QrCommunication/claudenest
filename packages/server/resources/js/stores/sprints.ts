import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { getEchoClient } from '@/services/echo';
import type {
  Sprint,
  SprintStatus,
  CreateSprintForm,
  UpdateSprintForm,
  BurndownDataPoint,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// ── Server broadcast payloads (see app/Events/Sprint*::broadcastWith) ─────────

/** `.sprint.updated` — fired on create/update/start and any status change. */
interface SprintUpdatedPayload {
  sprint_id: string;
  action: string;
  name: string;
  status: SprintStatus;
  progress_percentage: number;
  remaining_days: number | null;
  timestamp: string;
}

/** `.sprint.completed` — fired when a sprint transitions active → completed. */
interface SprintCompletedPayload {
  sprint_id: string;
  name: string;
  velocity: number | null;
  completed_story_points: number;
  total_story_points: number;
  timestamp: string;
}

export const useSprintsStore = defineStore('sprints', () => {
  // ==================== STATE ====================
  const sprints = ref<Sprint[]>([]);
  const activeSprint = ref<Sprint | null>(null);
  const selectedSprint = ref<Sprint | null>(null);
  const burndownData = ref<BurndownDataPoint[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const isFetchingBurndown = ref(false);
  const error = ref<string | null>(null);

  // Real-time teardown closure (not reactive — holds the Echo detach handlers).
  let unsubscribeRealtimeFn: (() => void) | null = null;

  // ==================== GETTERS ====================
  const sprintsByStatus = computed(() => {
    const grouped: Record<SprintStatus, Sprint[]> = {
      planning: [],
      active: [],
      completed: [],
      cancelled: [],
    };
    sprints.value.forEach(sprint => {
      grouped[sprint.status].push(sprint);
    });
    return grouped;
  });

  const currentSprint = computed(() =>
    sprints.value.find(s => s.status === 'active') ?? null
  );

  const planningSprints = computed(() =>
    sprints.value.filter(s => s.status === 'planning')
  );

  const completedSprints = computed(() =>
    sprints.value.filter(s => s.status === 'completed')
  );

  const cancelledSprints = computed(() =>
    sprints.value.filter(s => s.status === 'cancelled')
  );

  const overdueSprints = computed(() =>
    sprints.value.filter(s => s.is_overdue)
  );

  const totalStoryPoints = computed(() =>
    sprints.value.reduce((sum, s) => sum + s.total_story_points, 0)
  );

  const completedStoryPoints = computed(() =>
    sprints.value.reduce((sum, s) => sum + s.completed_story_points, 0)
  );

  const overallProgress = computed(() => {
    if (totalStoryPoints.value === 0) return 0;
    return Math.round((completedStoryPoints.value / totalStoryPoints.value) * 100);
  });

  // ==================== ACTIONS ====================

  /**
   * Fetch sprints for a project with optional status filter
   * @throws {Error} If the fetch operation fails
   */
  async function fetchSprints(
    projectId: string,
    filters?: { status?: SprintStatus }
  ): Promise<Sprint[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<PaginatedResponse<Sprint>>(
        `/projects/${projectId}/sprints`,
        { params: filters }
      );
      sprints.value = response.data.data;

      // Sync activeSprint from the fetched list
      activeSprint.value = sprints.value.find(s => s.status === 'active') ?? null;

      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sprints';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch a single sprint by ID
   * @throws {Error} If the fetch fails
   */
  async function fetchSprint(sprintId: string): Promise<Sprint> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<Sprint>>(`/sprints/${sprintId}`);
      const sprint = response.data.data;

      selectedSprint.value = sprint;

      // Keep activeSprint in sync
      if (sprint.status === 'active') {
        activeSprint.value = sprint;
      }

      return sprint;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sprint';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create a new sprint
   * @throws {Error} If creation fails
   */
  async function createSprint(projectId: string, data: CreateSprintForm): Promise<Sprint> {
    isCreating.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<Sprint>>(
        `/projects/${projectId}/sprints`,
        data
      );
      const sprint = response.data.data;
      sprints.value.push(sprint);
      sprints.value = [...sprints.value].sort((a, b) => a.sort_order - b.sort_order);
      return sprint;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create sprint';
      error.value = message;
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Update a sprint
   * @throws {Error} If the update fails
   */
  async function updateSprint(sprintId: string, data: UpdateSprintForm): Promise<Sprint> {
    isUpdating.value = true;
    error.value = null;

    try {
      const response = await api.patch<ApiResponse<Sprint>>(`/sprints/${sprintId}`, data);
      const updated = response.data.data;

      // Update in list
      const index = sprints.value.findIndex(s => s.id === sprintId);
      if (index !== -1) {
        sprints.value[index] = { ...sprints.value[index], ...updated };
      }

      // Update selected if same
      if (selectedSprint.value?.id === sprintId) {
        selectedSprint.value = { ...selectedSprint.value, ...updated };
      }

      // Keep activeSprint in sync
      if (activeSprint.value?.id === sprintId) {
        activeSprint.value = { ...activeSprint.value, ...updated };
      }

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update sprint';
      error.value = message;
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Delete a sprint
   * @throws {Error} If deletion fails
   */
  async function deleteSprint(sprintId: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await api.delete(`/sprints/${sprintId}`);
      sprints.value = sprints.value.filter(s => s.id !== sprintId);

      if (selectedSprint.value?.id === sprintId) {
        selectedSprint.value = null;
      }

      if (activeSprint.value?.id === sprintId) {
        activeSprint.value = null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete sprint';
      error.value = message;
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Start a sprint (transition from planning → active)
   * @throws {Error} If starting fails
   */
  async function startSprint(sprintId: string): Promise<Sprint> {
    isUpdating.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<Sprint>>(`/sprints/${sprintId}/start`);
      const started = response.data.data;

      // Update in list
      const index = sprints.value.findIndex(s => s.id === sprintId);
      if (index !== -1) {
        sprints.value[index] = { ...sprints.value[index], ...started };
      }

      // Update selected if same
      if (selectedSprint.value?.id === sprintId) {
        selectedSprint.value = { ...selectedSprint.value, ...started };
      }

      // Promote to activeSprint
      activeSprint.value = started;

      return started;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start sprint';
      error.value = message;
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Complete a sprint (transition from active → completed)
   * @throws {Error} If completion fails
   */
  async function completeSprint(sprintId: string): Promise<Sprint> {
    isUpdating.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<Sprint>>(`/sprints/${sprintId}/complete`);
      const completed = response.data.data;

      // Update in list
      const index = sprints.value.findIndex(s => s.id === sprintId);
      if (index !== -1) {
        sprints.value[index] = { ...sprints.value[index], ...completed };
      }

      // Update selected if same
      if (selectedSprint.value?.id === sprintId) {
        selectedSprint.value = { ...selectedSprint.value, ...completed };
      }

      // Clear activeSprint if it was this sprint
      if (activeSprint.value?.id === sprintId) {
        activeSprint.value = null;
      }

      return completed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete sprint';
      error.value = message;
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Fetch burndown chart data for a sprint
   * @throws {Error} If the fetch fails
   */
  async function fetchBurndown(sprintId: string): Promise<BurndownDataPoint[]> {
    isFetchingBurndown.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<BurndownDataPoint[]>>(
        `/sprints/${sprintId}/burndown`
      );
      burndownData.value = response.data.data;
      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch burndown data';
      error.value = message;
      throw err;
    } finally {
      isFetchingBurndown.value = false;
    }
  }

  /**
   * Select a sprint
   */
  function selectSprint(sprint: Sprint | null): void {
    selectedSprint.value = sprint;
  }

  /**
   * Clear selected sprint
   */
  function clearSelectedSprint(): void {
    selectedSprint.value = null;
  }

  /**
   * Update a sprint locally (for real-time updates)
   */
  function updateSprintLocal(sprintId: string, updates: Partial<Sprint>): void {
    const sprint = sprints.value.find(s => s.id === sprintId);
    if (sprint) {
      Object.assign(sprint, updates);
    }
    if (selectedSprint.value?.id === sprintId) {
      Object.assign(selectedSprint.value, updates);
    }
    if (activeSprint.value?.id === sprintId) {
      Object.assign(activeSprint.value, updates);
    }
  }

  /**
   * Add a sprint locally (for real-time updates)
   */
  function addSprintLocal(sprint: Sprint): void {
    sprints.value.push(sprint);
    sprints.value = [...sprints.value].sort((a, b) => a.sort_order - b.sort_order);
    if (sprint.status === 'active') {
      activeSprint.value = sprint;
    }
  }

  /**
   * Remove a sprint locally (for real-time updates)
   */
  function removeSprintLocal(sprintId: string): void {
    sprints.value = sprints.value.filter(s => s.id !== sprintId);
    if (selectedSprint.value?.id === sprintId) {
      selectedSprint.value = null;
    }
    if (activeSprint.value?.id === sprintId) {
      activeSprint.value = null;
    }
  }

  /**
   * Clear burndown data
   */
  function clearBurndownData(): void {
    burndownData.value = [];
  }

  /**
   * Reconcile the `activeSprint` ref after a real-time status mutation.
   * The `currentSprint` getter recomputes itself from the list, but the
   * standalone `activeSprint` ref must be promoted/cleared explicitly so the
   * Sprint screen never shows a stale "active" sprint that just completed.
   */
  function reconcileActiveSprint(sprintId: string, status: SprintStatus): void {
    if (status === 'active') {
      const promoted = sprints.value.find(s => s.id === sprintId) ?? null;
      if (promoted) activeSprint.value = promoted;
    } else if (activeSprint.value?.id === sprintId) {
      activeSprint.value = null;
    }
  }

  /**
   * Subscribe to real-time sprint mutations on the `projects.{id}` channel.
   *
   * Applies targeted local updates from `SprintUpdated` / `SprintCompleted`
   * broadcasts (status, velocity, progress) without a global refetch.
   * Idempotent: re-subscribing detaches the previous handlers first.
   *
   * The channel is shared with `useProjectChannel` and sibling stores, so
   * teardown only `stopListening` our own handlers — never `leave()`, which
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

    const onUpdated = (payload: SprintUpdatedPayload): void => {
      updateSprintLocal(payload.sprint_id, {
        name: payload.name,
        status: payload.status,
        progress_percentage: payload.progress_percentage,
        remaining_days: payload.remaining_days,
      });
      reconcileActiveSprint(payload.sprint_id, payload.status);
    };

    const onCompleted = (payload: SprintCompletedPayload): void => {
      updateSprintLocal(payload.sprint_id, {
        status: 'completed',
        velocity: payload.velocity,
        completed_story_points: payload.completed_story_points,
        total_story_points: payload.total_story_points,
      });
      // A completed sprint is no longer active.
      if (activeSprint.value?.id === payload.sprint_id) {
        activeSprint.value = null;
      }
    };

    client
      .private(channel)
      .listen('.sprint.updated', onUpdated as (p: unknown) => void)
      .listen('.sprint.completed', onCompleted as (p: unknown) => void);

    unsubscribeRealtimeFn = () => {
      try {
        client
          .private(channel)
          .stopListening('.sprint.updated', onUpdated as (p: unknown) => void)
          .stopListening('.sprint.completed', onCompleted as (p: unknown) => void);
      } catch {
        // Channel already gone.
      }
    };
  }

  /**
   * Detach the real-time sprint listeners (call on component unmount or when
   * switching projects).
   */
  function unsubscribeRealtime(): void {
    unsubscribeRealtimeFn?.();
    unsubscribeRealtimeFn = null;
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    sprints,
    activeSprint,
    selectedSprint,
    burndownData,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isFetchingBurndown,
    error,

    // Getters
    sprintsByStatus,
    currentSprint,
    planningSprints,
    completedSprints,
    cancelledSprints,
    overdueSprints,
    totalStoryPoints,
    completedStoryPoints,
    overallProgress,

    // Actions
    fetchSprints,
    fetchSprint,
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    fetchBurndown,
    selectSprint,
    clearSelectedSprint,
    updateSprintLocal,
    addSprintLocal,
    removeSprintLocal,
    subscribeRealtime,
    unsubscribeRealtime,
    clearBurndownData,
    clearError,
  };
});
