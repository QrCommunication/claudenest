import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '@/stores/projects';
import { useOrchestratorStore } from '@/stores/orchestrator';
import type { TaskPriority } from '@/types/multiagent';
import type { ScanResult, GeneratedContext } from './useProjectScan';

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

export interface WizardState {
  currentStep: number;
  machineId: string | null;
  path: string;
  projectName: string;
  scanResult: ScanResult | null;
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
    machineId: null,
    path: '',
    projectName: '',
    scanResult: null,
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
      case 3: return !!state.context.summary;
      case 4: return state.tasks.length > 0;
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
      // 1. Create project
      const project = await projectsStore.createProject(state.machineId, {
        name: state.projectName,
        project_path: state.path,
        summary: state.context.summary,
        architecture: state.context.architecture,
        conventions: state.context.conventions,
      });

      // 2. Create tasks
      for (const task of state.tasks) {
        await api_createTask(project.id, task);
      }

      // 3. Start orchestrator if configured
      if (state.orchestratorConfig.autoStart) {
        await orchestratorStore.startOrchestrator(project.id, {
          min_workers: state.orchestratorConfig.minWorkers,
          max_workers: state.orchestratorConfig.maxWorkers,
          poll_interval_ms: state.orchestratorConfig.pollIntervalMs,
        });
      }

      // Navigate to project
      router.push({ name: 'projects.show', params: { id: project.id } });
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
