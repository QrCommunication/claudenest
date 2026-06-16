import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { useMultiAsyncAction } from '@/composables/useAsyncAction';
import { getEchoClient } from '@/services/echo';
import type {
  Epic,
  EpicStatus,
  CreateEpicForm,
  UpdateEpicForm,
  DecomposeEpicForm,
  DecomposeEpicResponse,
  DecompositionStatus,
  ApiResponse,
  PaginatedResponse,
  TaskPriority,
} from '@/types';

// ── Server broadcast payload (see app/Events/EpicUpdated::broadcastWith) ──────

/**
 * `.epic.updated` — fired on update (status/progress change) and reorder.
 * Cascades (last sprint completed, ReconcileEpicStatusCommand) emit it with
 * `action='updated'` and the recomputed `status`/`progress_percentage`.
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
 * `.epic.decomposition` — the async AI decomposition lifecycle
 * (see app/Events/EpicDecompositionUpdated::broadcastWith). Fired on every
 * transition pending → running → completed | failed. `action` mirrors the
 * canonical decomposition status so consumers can branch without inferring it.
 *
 * Contract note: the broadcast carries `decomposition_completed_at`, which maps
 * to the Epic resource alias `decomposed_at` — the handler translates it.
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

export const useEpicsStore = defineStore('epics', () => {
  // ==================== STATE ====================
  const epics = ref<Epic[]>([]);
  // Archived epics live in a separate flow; the active `epics` list never
  // contains an archived epic (the backend index() defaults to the active set).
  const archivedEpics = ref<Epic[]>([]);
  const selectedEpic = ref<Epic | null>(null);
  // UI toggle for the board's "show archived" view. Plain state — the consumer
  // (EpicBoard) watches it to trigger `fetchArchivedEpics` lazily.
  const showArchived = ref(false);

  // Real-time teardown closure (not reactive — holds the Echo detach handler).
  let unsubscribeRealtimeFn: (() => void) | null = null;

  const { states, error, run, clearError } = useMultiAsyncAction([
    'loading',
    'creating',
    'updating',
    'deleting',
    'decomposing',
    'archiving',
  ] as const);

  // Aliases for backward compatibility
  const isLoading = states.loading;
  const isCreating = states.creating;
  const isUpdating = states.updating;
  const isDeleting = states.deleting;
  const isDecomposing = states.decomposing;
  const isArchiving = states.archiving;

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
   * Decompose an epic from a PRD (AI flow).
   *
   * POSTs to `/projects/{id}/epics/decompose`: the backend creates the epic
   * up-front in the `running` decomposition state and spawns an async Claude
   * session that builds its sprints/tasks. The plan is NOT awaited — the
   * returned epic is added to the board immediately (live badge) and its
   * sprints/tasks land later over the realtime `.epic.decomposition` signal
   * (see {@see subscribeRealtime}).
   *
   * @throws {Error} If the launch fails (validation, credential, offline machine)
   */
  async function decomposeEpic(
    projectId: string,
    data: DecomposeEpicForm,
  ): Promise<DecomposeEpicResponse> {
    return run('decomposing', async () => {
      const response = await api.post<ApiResponse<DecomposeEpicResponse>>(
        `/projects/${projectId}/epics/decompose`,
        data,
      );
      const result = response.data.data;

      // Surface the pending/running epic on the board right away. Guard against
      // a duplicate if a realtime broadcast already raced it in.
      if (!epics.value.some(e => e.id === result.epic.id)) {
        addEpicLocal(result.epic);
      } else {
        updateEpicLocal(result.epic.id, result.epic);
      }

      return result;
    }, 'Failed to launch epic decomposition');
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
   * Finalize a 100%-complete epic — request its pull request.
   *
   * POSTs to `/epics/{id}/finalize`: the backend stamps the finalize intent
   * (pr_branch + finalized_at) and best-effort dispatches the PR job to the
   * agent. `dispatched` is false when the project has no machine/path or the
   * machine is offline — the caller surfaces that to the user. The real
   * pr_url/pr_number/pr_state arrive later over the `.epic.updated` broadcast
   * (action `finalized`), so the returned epic is merged in optimistically.
   *
   * @throws {Error} If the epic is not complete (422) or the request fails.
   */
  async function finalizeEpic(
    epicId: string,
  ): Promise<{ epic: Epic; dispatched: boolean }> {
    return run('updating', async () => {
      const response = await api.post<ApiResponse<{ epic: Epic; dispatched: boolean }>>(
        `/epics/${epicId}/finalize`,
      );
      const { epic, dispatched } = response.data.data;
      updateEpicLocal(epicId, epic);
      return { epic, dispatched };
    }, 'Failed to finalize epic');
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
   * Fetch the archived epics for a project (backend `?archived=true`). Kept in a
   * separate list so the active board flow is never polluted by archived epics.
   * @throws {Error} If the fetch fails
   */
  async function fetchArchivedEpics(projectId: string): Promise<Epic[]> {
    return run('loading', async () => {
      const response = await api.get<PaginatedResponse<Epic>>(
        `/projects/${projectId}/epics`,
        { params: { archived: true } },
      );
      archivedEpics.value = response.data.data;
      return response.data.data;
    }, 'Failed to fetch archived epics');
  }

  /**
   * Archive an epic (reversible — the backend stamps `archived_at`, deletes
   * nothing). Moves it from the active board to the archived flow on success.
   * @throws {Error} If the archive call fails
   */
  async function archiveEpic(epicId: string): Promise<Epic> {
    return run('archiving', async () => {
      const response = await api.post<ApiResponse<Epic>>(`/epics/${epicId}/archive`);
      const archived = response.data.data;
      archiveEpicLocal(epicId, archived);
      return archived;
    }, 'Failed to archive epic');
  }

  /**
   * Unarchive an epic — restore it to the active board. Moves it back from the
   * archived flow on success.
   * @throws {Error} If the unarchive call fails
   */
  async function unarchiveEpic(epicId: string): Promise<Epic> {
    return run('archiving', async () => {
      const response = await api.post<ApiResponse<Epic>>(`/epics/${epicId}/unarchive`);
      const restored = response.data.data;
      unarchiveEpicLocal(epicId, restored);
      return restored;
    }, 'Failed to unarchive epic');
  }

  /**
   * Toggle the board's "show archived" view. Pure UI state — the consumer is
   * responsible for fetching the archived set (`fetchArchivedEpics`) when it
   * flips on.
   */
  function setShowArchived(value: boolean): void {
    showArchived.value = value;
  }

  function toggleShowArchived(): void {
    showArchived.value = !showArchived.value;
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

  /**
   * Move an epic from the active board to the archived flow locally. Pure
   * client-side state (no API call) so it is reused both after a successful
   * archive call and by the real-time `.epic.updated` (action `archived`)
   * listener — an archive triggered from another client stays consistent
   * without a refetch. `epic` is the full row when available (API response);
   * otherwise the entry already present in the active list is reused (the
   * broadcast payload carries no `is_archived`).
   */
  function archiveEpicLocal(epicId: string, epic?: Epic): void {
    const idx = epics.value.findIndex(e => e.id === epicId);
    const moved = epic ?? (idx !== -1 ? epics.value[idx] : undefined);

    if (idx !== -1) {
      epics.value.splice(idx, 1);
    }

    if (moved) {
      const archivedIdx = archivedEpics.value.findIndex(e => e.id === epicId);
      if (archivedIdx === -1) {
        archivedEpics.value.unshift(moved);
      } else {
        archivedEpics.value[archivedIdx] = moved;
      }
    }

    if (selectedEpic.value?.id === epicId) {
      selectedEpic.value = null;
    }
  }

  /**
   * Move an epic from the archived flow back to the active board locally.
   * Reused by the API action and the real-time `.epic.updated` (action
   * `unarchived`) listener. Re-sorts the active board by `sort_order`.
   */
  function unarchiveEpicLocal(epicId: string, epic?: Epic): void {
    const idx = archivedEpics.value.findIndex(e => e.id === epicId);
    const moved = epic ?? (idx !== -1 ? archivedEpics.value[idx] : undefined);

    if (idx !== -1) {
      archivedEpics.value.splice(idx, 1);
    }

    if (moved) {
      const activeIdx = epics.value.findIndex(e => e.id === epicId);
      if (activeIdx === -1) {
        epics.value.push(moved);
      } else {
        epics.value[activeIdx] = moved;
      }
      epics.value = [...epics.value].sort((a, b) => a.sort_order - b.sort_order);
    }
  }

  /**
   * Subscribe to real-time epic mutations on the `projects.{id}` channel.
   *
   * Two broadcasts are handled with a single teardown:
   *  - `.epic.updated`: targeted local update of status/progress/title (an epic
   *    cascaded to `done` shows terminated on other clients without a refresh).
   *  - `.epic.decomposition`: the async AI lifecycle (pending → running →
   *    completed | failed). Drives the board's decomposition badge in place; on
   *    `completed` it reconciles the epic's tasks_count/progress with a targeted
   *    refetch (the generated sprints/tasks aren't in the payload).
   *
   * Idempotent: re-subscribing detaches the previous handlers first. The
   * channel is shared with `useProjectChannel` and the sprints store, so
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

    const onUpdated = (payload: EpicUpdatedPayload): void => {
      // Archive lifecycle: move the epic between the active board and the
      // archived flow in place (the payload carries no `is_archived`, but the
      // action discriminates). Handled before the generic update so we never
      // re-touch an epic that just left the active list.
      if (payload.action === 'archived') {
        archiveEpicLocal(payload.epic_id);
        return;
      }
      if (payload.action === 'unarchived') {
        unarchiveEpicLocal(payload.epic_id);
        return;
      }

      updateEpicLocal(payload.epic_id, {
        title: payload.title,
        status: payload.status,
        progress_percentage: payload.progress_percentage,
      });

      // The finalize broadcast carries no PR fields (pr_url/pr_state) — refetch
      // so the board flips from "Generate PR" to the live PR link once the agent
      // reports `epic:finalized` (see AgentServe::onEpicFinalized).
      if (payload.action === 'finalized') {
        void fetchEpics(projectId);
      }
    };

    const onDecomposition = (payload: EpicDecompositionPayload): void => {
      // Translate the broadcast's `decomposition_completed_at` to the Epic
      // resource alias `decomposed_at`.
      updateEpicLocal(payload.epic_id, {
        decomposition_status: payload.decomposition_status,
        decomposition_error: payload.decomposition_error,
        decomposed_at: payload.decomposition_completed_at,
      });

      // On completion the epic gained sprints + tasks that aren't in the
      // payload — refetch so the board reflects the new tasks_count/progress.
      if (payload.action === 'completed') {
        void fetchEpics(projectId);
      }
    };

    client
      .private(channel)
      .listen('.epic.updated', onUpdated as (p: unknown) => void)
      .listen('.epic.decomposition', onDecomposition as (p: unknown) => void);

    unsubscribeRealtimeFn = () => {
      try {
        client
          .private(channel)
          .stopListening('.epic.updated', onUpdated as (p: unknown) => void)
          .stopListening(
            '.epic.decomposition',
            onDecomposition as (p: unknown) => void,
          );
      } catch {
        // Channel already gone.
      }
    };
  }

  /**
   * Detach the real-time epic listener (call on component unmount or when
   * switching projects).
   */
  function unsubscribeRealtime(): void {
    unsubscribeRealtimeFn?.();
    unsubscribeRealtimeFn = null;
  }

  return {
    // State
    epics,
    archivedEpics,
    selectedEpic,
    showArchived,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isDecomposing,
    isArchiving,
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
    fetchArchivedEpics,
    createEpic,
    decomposeEpic,
    finalizeEpic,
    updateEpic,
    deleteEpic,
    archiveEpic,
    unarchiveEpic,
    setShowArchived,
    toggleShowArchived,
    reorderEpic,
    selectEpic,
    clearSelectedEpic,
    updateEpicLocal,
    addEpicLocal,
    removeEpicLocal,
    archiveEpicLocal,
    unarchiveEpicLocal,
    subscribeRealtime,
    unsubscribeRealtime,
    clearError,
  };
});
