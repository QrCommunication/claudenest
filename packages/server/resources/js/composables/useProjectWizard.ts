import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '@/stores/projects';
import { useOrchestratorStore } from '@/stores/orchestrator';
import type { TaskPriority } from '@/types/multiagent';
import type { ScanResult, GeneratedContext } from './useProjectScan';
import type { MasterPlan } from './useDecomposition';

export interface WizardTask {
  title: string;
  description: string;
  priority: TaskPriority;
  files: string[];
}

export interface OrchestratorConfig {
  autoStart: boolean;
  minWorkers: number;
  maxWorkers: number;
  pollIntervalMs: number;
}

export type WizardMode = 'prd' | 'manual';

export interface WizardState {
  currentStep: number;
  wizardMode: WizardMode;
  machineId: string | null;
  path: string;
  projectName: string;
  scanResult: ScanResult | null;
  // PRD mode
  prd: string;
  credentialId: string;
  masterPlan: MasterPlan | null;
  _projectId: string | null; // Set when project created during decomposition
  // Manual mode
  context: {
    summary: string;
    architecture: string;
    conventions: string;
  };
  tasks: WizardTask[];
  orchestratorConfig: OrchestratorConfig;
}

const TOTAL_STEPS = 5;

export function useProjectWizard() {
  const router = useRouter();
  const projectsStore = useProjectsStore();
  const orchestratorStore = useOrchestratorStore();

  const state = reactive<WizardState>({
    currentStep: 1,
    wizardMode: 'prd',
    machineId: null,
    path: '',
    projectName: '',
    scanResult: null,
    // PRD mode
    prd: '',
    credentialId: '',
    masterPlan: null,
    _projectId: null,
    // Manual mode
    context: {
      summary: '',
      architecture: '',
      conventions: '',
    },
    tasks: [],
    orchestratorConfig: {
      autoStart: false,
      minWorkers: 1,
      maxWorkers: 3,
      pollIntervalMs: 15000,
    },
  });

  const isSubmitting = ref(false);
  const submitError = ref<string | null>(null);

  const canGoNext = computed(() => {
    switch (state.currentStep) {
      case 1: return !!state.machineId;
      case 2: return !!state.path && !!state.scanResult;
      case 3:
        if (state.wizardMode === 'prd') {
          return !!state.masterPlan;
        }
        return !!state.context.summary;
      case 4:
        if (state.wizardMode === 'prd') {
          return !!state.masterPlan && state.masterPlan.waves.length > 0;
        }
        return state.tasks.length > 0;
      case 5: return true;
      default: return false;
    }
  });

  const canGoPrev = computed(() => state.currentStep > 1);
  const isLastStep = computed(() => state.currentStep === TOTAL_STEPS);
  const progress = computed(() => (state.currentStep / TOTAL_STEPS) * 100);

  function nextStep(): void {
    if (state.currentStep < TOTAL_STEPS && canGoNext.value) {
      state.currentStep++;
    }
  }

  function prevStep(): void {
    if (state.currentStep > 1) {
      state.currentStep--;
    }
  }

  function goToStep(step: number): void {
    if (step >= 1 && step <= TOTAL_STEPS) {
      state.currentStep = step;
    }
  }

  function setScanResult(result: ScanResult): void {
    state.scanResult = result;
    state.projectName = result.project_name;
  }

  function setGeneratedContext(context: GeneratedContext): void {
    state.context.summary = context.summary;
    state.context.architecture = context.architecture;
    state.context.conventions = context.conventions;
    state.tasks = context.suggested_tasks.map(t => ({
      title: t.title,
      description: t.description,
      priority: (t.priority as TaskPriority) || 'medium',
      files: [],
    }));
  }

  function addTask(): void {
    state.tasks.push({
      title: '',
      description: '',
      priority: 'medium',
      files: [],
    });
  }

  function removeTask(index: number): void {
    state.tasks.splice(index, 1);
  }

  function setWizardMode(mode: WizardMode): void {
    state.wizardMode = mode;
  }

  function setMasterPlan(plan: MasterPlan): void {
    state.masterPlan = plan;
  }

  function moveTask(index: number, direction: 'up' | 'down'): void {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= state.tasks.length) return;
    const temp = state.tasks[index];
    state.tasks[index] = state.tasks[newIndex];
    state.tasks[newIndex] = temp;
  }

  async function submit(): Promise<void> {
    if (!state.machineId) return;

    isSubmitting.value = true;
    submitError.value = null;

    try {
      const isPrd = state.wizardMode === 'prd' && state.masterPlan;
      let projectId: string;

      if (isPrd && state._projectId) {
        // Project already created during decomposition — update it
        projectId = state._projectId;
        await api.patch<ApiResponse<unknown>>(
          `/projects/${projectId}`,
          {
            name: state.projectName,
            summary: state.masterPlan!.prd_summary,
            prd: state.prd,
            master_plan: state.masterPlan,
          },
        );

        // Apply master plan — creates tasks from waves server-side
        await api.post<ApiResponse<{ created: number }>>(
          `/projects/${projectId}/master-plan/apply`,
        );
      } else {
        // Create project fresh (manual mode or no prior project)
        const project = await projectsStore.createProject(state.machineId, {
          name: state.projectName,
          project_path: state.path,
          summary: state.context.summary,
          architecture: state.context.architecture,
          conventions: state.context.conventions,
        });
        projectId = project.id;

        // Create tasks manually
        for (const task of state.tasks) {
          await api_createTask(projectId, task);
        }
      }

      // Start orchestrator if configured
      if (state.orchestratorConfig.autoStart) {
        await orchestratorStore.startOrchestrator(projectId, {
          min_workers: state.orchestratorConfig.minWorkers,
          max_workers: state.orchestratorConfig.maxWorkers,
          poll_interval_ms: state.orchestratorConfig.pollIntervalMs,
        });
      }

      // Navigate to project
      router.push({ name: 'projects.show', params: { id: projectId } });
    } catch (err: unknown) {
      submitError.value = err instanceof Error ? err.message : 'Failed to create project';
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    state,
    isSubmitting,
    submitError,
    canGoNext,
    canGoPrev,
    isLastStep,
    progress,
    totalSteps: TOTAL_STEPS,
    nextStep,
    prevStep,
    goToStep,
    setScanResult,
    setGeneratedContext,
    setWizardMode,
    setMasterPlan,
    addTask,
    removeTask,
    moveTask,
    submit,
  };
}

// Helper: create task via API
import { api } from '@/composables/useApi';
import type { ApiResponse } from '@/types';

async function api_createTask(
  projectId: string,
  task: WizardTask,
): Promise<void> {
  await api.post<ApiResponse<unknown>>(
    `/projects/${projectId}/tasks`,
    {
      title: task.title,
      description: task.description,
      priority: task.priority,
      files: task.files,
    },
  );
}
