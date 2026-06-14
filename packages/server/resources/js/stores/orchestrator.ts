import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import type {
  ClaudeInstance,
  InstanceStatus,
  OrchestrationStats,
  DispatchResult,
  ApiResponse,
} from '@/types';

// ── Orchestrator REST contract (POST /projects/{id}/orchestrator/start) ──────

export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions';

export const PERMISSION_MODES: readonly PermissionMode[] = [
  'default',
  'acceptEdits',
  'plan',
  'bypassPermissions',
];

export interface StartOrchestratorConfig {
  max_workers: number;
  permission_mode?: PermissionMode;
  /** Enable the incident coordinator (auto-opens a Claude session on incidents). */
  coordinator?: boolean;
  /** Credential the workers run under. Omitted → the user's default credential. */
  credential_id?: string;
}

export interface OrchestratorWorker {
  id: string;
  sessionId: string;
  status: string;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  tasksCompleted: number;
}

export interface OrchestratorStatus {
  status: 'running' | 'stopped';
  active: boolean;
  workers: OrchestratorWorker[];
  tasks: { pending: number; in_progress: number; done: number };
  pendingTasks: number;
  completedTasks: number;
  orchestration: Record<string, unknown>;
}

export const useOrchestratorStore = defineStore('orchestrator', () => {
  // ==================== STATE ====================
  const stats = ref<OrchestrationStats | null>(null);
  const instances = ref<ClaudeInstance[]>([]);
  const isLoading = ref(false);
  const isDispatching = ref(false);
  const error = ref<string | null>(null);
  const lastDispatchResult = ref<DispatchResult | null>(null);

  // ==================== GETTERS ====================
  const connectedInstances = computed(() =>
    instances.value.filter(i => i.is_connected)
  );

  const idleInstances = computed(() =>
    instances.value.filter(i => i.status === 'idle')
  );

  const busyInstances = computed(() =>
    instances.value.filter(i => i.status === 'busy')
  );

  const hasAvailableCapacity = computed(() =>
    idleInstances.value.length > 0
  );

  const totalTasksCompleted = computed(() =>
    stats.value?.total_tasks_completed ?? 0
  );

  // ==================== ACTIONS ====================

  async function fetchStats(projectId: string): Promise<OrchestrationStats> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<OrchestrationStats>>(
        `/projects/${projectId}/orchestration-stats`
      );
      stats.value = response.data.data;
      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orchestration stats';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchInstances(projectId: string): Promise<ClaudeInstance[]> {
    try {
      const response = await api.get<ApiResponse<ClaudeInstance[]>>(
        `/projects/${projectId}/instances`
      );
      instances.value = response.data.data;
      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch instances';
      error.value = message;
      throw err;
    }
  }

  async function dispatch(projectId: string): Promise<DispatchResult> {
    isDispatching.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<DispatchResult>>(
        `/projects/${projectId}/dispatch`
      );
      lastDispatchResult.value = response.data.data;
      // Refresh stats after dispatch
      await fetchStats(projectId);
      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch tasks';
      error.value = message;
      throw err;
    } finally {
      isDispatching.value = false;
    }
  }

  async function getInstance(instanceId: string): Promise<ClaudeInstance> {
    try {
      const response = await api.get<ApiResponse<ClaudeInstance>>(
        `/instances/${instanceId}`
      );
      // Update in local list
      const index = instances.value.findIndex(i => i.id === instanceId);
      if (index !== -1) {
        instances.value[index] = response.data.data;
      }
      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch instance';
      error.value = message;
      throw err;
    }
  }

  // ==================== ORCHESTRATOR CONTROLS ====================

  const orchestratorStatus = ref<OrchestratorStatus | null>(null);
  const isOrchestratorLoading = ref(false);

  /**
   * Start the server-driven worker pool.
   *
   * Contract: body `{ max_workers (1-10), permission_mode?, coordinator? }`.
   * The server responds with the full orchestrator status; a 403 `PLAN_001` envelope
   * means the plan's concurrent-session cap is reached (callers should map
   * it to a dedicated message via getApiErrorCode).
   */
  async function startOrchestrator(
    projectId: string,
    config: StartOrchestratorConfig,
  ): Promise<OrchestratorStatus> {
    isOrchestratorLoading.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<OrchestratorStatus>>(
        `/projects/${projectId}/orchestrator/start`,
        config,
      );
      orchestratorStatus.value = response.data.data;
      return response.data.data;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to start orchestrator';
      throw err;
    } finally {
      isOrchestratorLoading.value = false;
    }
  }

  async function stopOrchestrator(projectId: string): Promise<void> {
    isOrchestratorLoading.value = true;
    error.value = null;

    try {
      await api.post(`/projects/${projectId}/orchestrator/stop`);
      orchestratorStatus.value = null;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to stop orchestrator';
      throw err;
    } finally {
      isOrchestratorLoading.value = false;
    }
  }

  async function fetchOrchestratorStatus(projectId: string): Promise<void> {
    try {
      const response = await api.get<ApiResponse<OrchestratorStatus>>(
        `/projects/${projectId}/orchestrator/status`,
      );
      orchestratorStatus.value = response.data.data;
    } catch {
      // Silently fail — status is informational
    }
  }

  /**
   * Quiet stats refresh for event-driven updates (no isLoading toggling,
   * never throws) — used by the `.task.*` broadcast handlers.
   */
  async function syncStats(projectId: string): Promise<void> {
    try {
      const response = await api.get<ApiResponse<OrchestrationStats>>(
        `/projects/${projectId}/orchestration-stats`,
      );
      stats.value = response.data.data;
    } catch {
      // Real-time refresh is best-effort.
    }
  }

  // ==================== LOCAL UPDATES (real-time WS) ====================

  function updateInstanceLocal(instanceId: string, updates: Partial<ClaudeInstance>): void {
    const instance = instances.value.find(i => i.id === instanceId);
    if (instance) {
      Object.assign(instance, updates);
    }
  }

  /**
   * Apply a `.instance.updated` broadcast: patch both the instances grid and
   * the matching orchestrator worker entry (status + current task pointer).
   * Task titles are unknown from the payload — they converge on the next
   * status fetch; only the id pointer is patched here.
   */
  function applyInstanceUpdate(payload: {
    id: string;
    status: InstanceStatus;
    current_task_id: string | null;
    session_id: string | null;
  }): void {
    const instance = instances.value.find(i => i.id === payload.id);
    if (instance) {
      instance.status = payload.status;
      if (!payload.current_task_id) {
        instance.current_task = null;
      } else if (instance.current_task?.id !== payload.current_task_id) {
        instance.current_task = { id: payload.current_task_id, title: '' };
      }
    }

    const worker = orchestratorStatus.value?.workers.find(w => w.id === payload.id);
    if (worker) {
      worker.status = payload.status;
      if (worker.currentTaskId !== payload.current_task_id) {
        worker.currentTaskId = payload.current_task_id;
        worker.currentTaskTitle = null;
      }
    }
  }

  function addInstanceLocal(instance: ClaudeInstance): void {
    const existing = instances.value.findIndex(i => i.id === instance.id);
    if (existing !== -1) {
      instances.value[existing] = instance;
    } else {
      instances.value.push(instance);
    }
  }

  function removeInstanceLocal(instanceId: string): void {
    instances.value = instances.value.filter(i => i.id !== instanceId);
  }

  function updateStatsLocal(newStats: Partial<OrchestrationStats>): void {
    if (stats.value) {
      Object.assign(stats.value, newStats);
    } else {
      stats.value = newStats as OrchestrationStats;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function $reset(): void {
    stats.value = null;
    instances.value = [];
    isLoading.value = false;
    isDispatching.value = false;
    error.value = null;
    lastDispatchResult.value = null;
    orchestratorStatus.value = null;
    isOrchestratorLoading.value = false;
  }

  return {
    // State
    stats,
    instances,
    isLoading,
    isDispatching,
    error,
    lastDispatchResult,

    // Getters
    connectedInstances,
    idleInstances,
    busyInstances,
    hasAvailableCapacity,
    totalTasksCompleted,

    // Actions
    fetchStats,
    fetchInstances,
    dispatch,
    getInstance,
    syncStats,
    clearError,
    $reset,

    // Orchestrator controls
    orchestratorStatus,
    isOrchestratorLoading,
    startOrchestrator,
    stopOrchestrator,
    fetchOrchestratorStatus,

    // Local updates (real-time WS)
    updateInstanceLocal,
    addInstanceLocal,
    removeInstanceLocal,
    updateStatsLocal,
    applyInstanceUpdate,
  };
});
