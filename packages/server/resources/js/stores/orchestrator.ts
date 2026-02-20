import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import type {
  ClaudeInstance,
  OrchestrationStats,
  DispatchResult,
  ApiResponse,
} from '@/types';

export const useOrchestratorStore = defineStore('orchestrator', () => {
  // ==================== STATE ====================
  const stats = ref<OrchestrationStats | null>(null);
  const instances = ref<ClaudeInstance[]>([]);
  const isLoading = ref(false);
  const isDispatching = ref(false);
  const error = ref<string | null>(null);
  const lastDispatchResult = ref<DispatchResult | null>(null);
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null);

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

  function startPolling(projectId: string, intervalMs: number = 10_000): void {
    stopPolling();
    // Initial fetch
    fetchStats(projectId);
    fetchInstances(projectId);
    // Periodic refresh
    pollingInterval.value = setInterval(() => {
      fetchStats(projectId);
      fetchInstances(projectId);
    }, intervalMs);
  }

  function stopPolling(): void {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
  }

  // ==================== LOCAL UPDATES (real-time WS) ====================

  function updateInstanceLocal(instanceId: string, updates: Partial<ClaudeInstance>): void {
    const instance = instances.value.find(i => i.id === instanceId);
    if (instance) {
      Object.assign(instance, updates);
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
    stopPolling();
    stats.value = null;
    instances.value = [];
    isLoading.value = false;
    isDispatching.value = false;
    error.value = null;
    lastDispatchResult.value = null;
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
    startPolling,
    stopPolling,
    clearError,
    $reset,

    // Local updates
    updateInstanceLocal,
    addInstanceLocal,
    removeInstanceLocal,
    updateStatsLocal,
  };
});
