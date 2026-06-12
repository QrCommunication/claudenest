import { ref, onUnmounted } from 'vue';
import { api } from '@/composables/useApi';
import { getEchoClient } from '@/services/echo';
import type { ApiResponse } from '@/types';
import type Echo from 'laravel-echo';

export interface MasterPlanTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  files: string[];
  estimated_tokens?: number;
  depends_on: string[];
}

export interface MasterPlanWave {
  id: number;
  name: string;
  description: string;
  tasks: MasterPlanTask[];
}

export interface MasterPlan {
  version: 1;
  prd_summary: string;
  waves: MasterPlanWave[];
}

type BroadcastMessage = {
  type: string;
  data?: string;
  success?: boolean;
  plan?: MasterPlan;
  error?: string;
  errors?: string[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEcho(): Echo<'reverb'> | null {
  try {
    return getEchoClient();
  } catch {
    // Reverb config missing (tests, degraded boot) — real-time disabled.
    return null;
  }
}

function resolveErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useDecomposition() {
  const masterPlan = ref<MasterPlan | null>(null);
  const isDecomposing = ref(false);
  const decompositionOutput = ref('');
  const decompositionError = ref<string | null>(null);

  let echoChannel: ReturnType<Echo<'reverb'>['private']> | null = null;

  // ── Event handler (extracted to reduce nesting in subscribeToProject) ──────

  function handleBroadcastMessage(msg: BroadcastMessage): void {
    if (msg.type === 'decompose:progress') {
      decompositionOutput.value += msg.data ?? '';
      return;
    }

    if (msg.type !== 'decompose:result') return;

    isDecomposing.value = false;

    if (msg.success && msg.plan) {
      masterPlan.value = msg.plan;
    } else {
      decompositionError.value =
        msg.error ?? msg.errors?.join('; ') ?? 'Decomposition failed';
    }
  }

  function handleBroadcastEvent(event: { message: BroadcastMessage }): void {
    handleBroadcastMessage(event.message);
  }

  function subscribeToProject(projectId: string): void {
    const echo = getEcho();
    if (!echo) return;

    // Detach any previous listener first (regenerate after a start would
    // otherwise stack duplicate handlers on the same channel).
    unsubscribe();
    echoChannel = echo.private(`projects.${projectId}`);
    echoChannel.listen('.project.broadcast', handleBroadcastEvent);
  }

  function unsubscribe(): void {
    if (!echoChannel) return;

    // Only detach our handler — the `projects.{id}` channel is shared with
    // useProjectChannel subscribers; an echo.leave() would kill their listeners.
    echoChannel.stopListening('.project.broadcast', handleBroadcastEvent);
    echoChannel = null;
  }

  function resetDecompositionState(): void {
    isDecomposing.value = true;
    decompositionOutput.value = '';
    decompositionError.value = null;
  }

  function handleDecompositionError(err: unknown, fallback: string): never {
    isDecomposing.value = false;
    decompositionError.value = resolveErrorMessage(err, fallback);
    throw err;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Start PRD decomposition for a project.
   */
  async function startDecomposition(
    projectId: string,
    prd: string,
    credentialId: string,
  ): Promise<void> {
    resetDecompositionState();
    masterPlan.value = null;
    subscribeToProject(projectId);

    try {
      await api.post<ApiResponse<{ status: string }>>(
        `/projects/${projectId}/decompose`,
        { prd, credential_id: credentialId },
      );
    } catch (err: unknown) {
      handleDecompositionError(err, 'Failed to start decomposition');
    }
  }

  /**
   * Load existing master plan from server.
   */
  async function loadMasterPlan(projectId: string): Promise<MasterPlan | null> {
    try {
      const response = await api.get<ApiResponse<{
        prd: string | null;
        master_plan: MasterPlan | null;
        has_plan: boolean;
      }>>(`/projects/${projectId}/master-plan`);

      if (response.data.data.master_plan) {
        masterPlan.value = response.data.data.master_plan;
      }
      return masterPlan.value;
    } catch {
      return null;
    }
  }

  /**
   * Save edited master plan to server.
   */
  async function saveMasterPlan(projectId: string, plan: MasterPlan): Promise<void> {
    const response = await api.put<ApiResponse<{ master_plan: MasterPlan }>>(
      `/projects/${projectId}/master-plan`,
      { master_plan: plan },
    );
    masterPlan.value = response.data.data.master_plan;
  }

  /**
   * Apply master plan — create tasks from waves.
   */
  async function applyMasterPlan(
    projectId: string,
    force: boolean = false,
  ): Promise<{ created: number }> {
    const response = await api.post<ApiResponse<{ created: number }>>(
      `/projects/${projectId}/master-plan/apply`,
      force ? { force: true } : {},
    );
    return response.data.data;
  }

  /**
   * Regenerate decomposition with existing PRD.
   */
  async function regenerate(projectId: string, credentialId: string): Promise<void> {
    resetDecompositionState();
    subscribeToProject(projectId);

    try {
      await api.post<ApiResponse<{ status: string }>>(
        `/projects/${projectId}/master-plan/regenerate`,
        { credential_id: credentialId },
      );
    } catch (err: unknown) {
      handleDecompositionError(err, 'Failed to regenerate');
    }
  }

  function cleanup(): void {
    unsubscribe();
  }

  onUnmounted(cleanup);

  return {
    masterPlan,
    isDecomposing,
    decompositionOutput,
    decompositionError,
    startDecomposition,
    loadMasterPlan,
    saveMasterPlan,
    applyMasterPlan,
    regenerate,
    cleanup,
  };
}
