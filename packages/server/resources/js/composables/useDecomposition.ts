import { ref, onUnmounted } from 'vue';
import { api } from '@/composables/useApi';
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

export function useDecomposition() {
  const masterPlan = ref<MasterPlan | null>(null);
  const isDecomposing = ref(false);
  const decompositionOutput = ref('');
  const decompositionError = ref<string | null>(null);

  let echoChannel: ReturnType<Echo<"reverb">['private']> | null = null;

  /**
   * Start PRD decomposition for a project.
   */
  async function startDecomposition(
    projectId: string,
    prd: string,
    credentialId: string,
  ): Promise<void> {
    isDecomposing.value = true;
    decompositionOutput.value = '';
    decompositionError.value = null;
    masterPlan.value = null;

    // Subscribe to project channel for real-time updates
    subscribeToProject(projectId);

    try {
      await api.post<ApiResponse<{ status: string }>>(
        `/projects/${projectId}/decompose`,
        { prd, credential_id: credentialId },
      );
    } catch (err: unknown) {
      isDecomposing.value = false;
      decompositionError.value = err instanceof Error ? err.message : 'Failed to start decomposition';
      throw err;
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
    isDecomposing.value = true;
    decompositionOutput.value = '';
    decompositionError.value = null;

    subscribeToProject(projectId);

    try {
      await api.post<ApiResponse<{ status: string }>>(
        `/projects/${projectId}/master-plan/regenerate`,
        { credential_id: credentialId },
      );
    } catch (err: unknown) {
      isDecomposing.value = false;
      decompositionError.value = err instanceof Error ? err.message : 'Failed to regenerate';
      throw err;
    }
  }

  function subscribeToProject(projectId: string): void {
    // Use window.Echo if available (set up by Laravel Echo bootstrap)
    const echo = (window as unknown as Record<string, unknown>).Echo as Echo<"reverb"> | undefined;
    if (!echo) return;

    // Leave previous channel
    if (echoChannel) {
      echoChannel = null;
    }

    echoChannel = echo.private(`projects.${projectId}`);

    echoChannel.listen('.project.broadcast', (event: {
      message: {
        type: string;
        data?: string;
        success?: boolean;
        plan?: MasterPlan;
        error?: string;
        errors?: string[];
      };
    }) => {
      const msg = event.message;

      if (msg.type === 'decompose:progress') {
        decompositionOutput.value += msg.data || '';
      }

      if (msg.type === 'decompose:result') {
        isDecomposing.value = false;

        if (msg.success && msg.plan) {
          masterPlan.value = msg.plan;
        } else {
          decompositionError.value = msg.error || msg.errors?.join('; ') || 'Decomposition failed';
        }
      }
    });
  }

  function cleanup(): void {
    const echo = (window as unknown as Record<string, unknown>).Echo as Echo<"reverb"> | undefined;
    if (echo && echoChannel) {
      // Leave is handled by Echo internally when component unmounts
      echoChannel = null;
    }
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
