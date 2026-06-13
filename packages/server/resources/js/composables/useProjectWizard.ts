import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/composables/useApi';
import { useProjectsStore } from '@/stores/projects';
import { useOrchestratorStore } from '@/stores/orchestrator';
import type { ApiResponse } from '@/types';
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
    currentFocus: string;
    techStack: string[];
  };
  tasks: WizardTask[];
  orchestratorConfig: OrchestratorConfig;
}

const TOTAL_STEPS = 5;

// ── Step validation helpers ───────────────────────────────────────────────────

function isStep1Valid(state: WizardState): boolean {
  return !!state.machineId;
}

function isStep2Valid(state: WizardState): boolean {
  return !!state.path && !!state.scanResult;
}

function isStep3Valid(state: WizardState): boolean {
  if (state.wizardMode === 'prd') return !!state.masterPlan;
  return !!state.context.summary;
}

function isStep4Valid(state: WizardState): boolean {
  if (state.wizardMode === 'prd') {
    return !!state.masterPlan && state.masterPlan.waves.length > 0;
  }
  return state.tasks.length > 0;
}

function isStepValid(state: WizardState): boolean {
  switch (state.currentStep) {
    case 1: return isStep1Valid(state);
    case 2: return isStep2Valid(state);
    case 3: return isStep3Valid(state);
    case 4: return isStep4Valid(state);
    case 5: return true;
    default: return false;
  }
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiCreateTask(projectId: string, task: WizardTask): Promise<void> {
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

async function apiUpdateProjectWithPlan(
  projectId: string,
  state: WizardState,
): Promise<void> {
  // Patch name (+ the plan when this client has it synced). The decompose
  // already persisted master_plan server-side, so the apply below works off
  // the stored plan even if the broadcast→state sync didn't land here — never
  // dereference a possibly-null masterPlan.
  const patch: Record<string, unknown> = {
    name: state.projectName,
    prd: state.prd,
  };
  if (state.masterPlan) {
    patch.summary = state.masterPlan.prd_summary;
    patch.master_plan = state.masterPlan;
  }
  await api.patch<ApiResponse<unknown>>(`/projects/${projectId}`, patch);
  await api.post<ApiResponse<{ created: number }>>(
    `/projects/${projectId}/master-plan/apply`,
  );
}

async function apiCreateProjectWithTasks(
  machineId: string,
  state: WizardState,
  projectsStore: ReturnType<typeof useProjectsStore>,
): Promise<string> {
  const techStack = state.context.techStack.length
    ? state.context.techStack
    : (state.scanResult?.tech_stack ?? []);

  const project = await projectsStore.createProject(machineId, {
    name: state.projectName,
    project_path: state.path,
    summary: state.context.summary,
    architecture: state.context.architecture,
    conventions: state.context.conventions,
    current_focus: state.context.currentFocus,
    ...(techStack.length ? { settings: { techStack } } : {}),
  });

  for (const task of state.tasks) {
    await apiCreateTask(project.id, task);
  }

  return project.id;
}

async function apiMaybeStartOrchestrator(
  projectId: string,
  config: OrchestratorConfig,
  orchestratorStore: ReturnType<typeof useOrchestratorStore>,
): Promise<void> {
  if (!config.autoStart) return;

  // Server contract: { max_workers (1-10), permission_mode? } — min_workers
  // and poll_interval_ms were never part of the validated payload.
  await orchestratorStore.startOrchestrator(projectId, {
    max_workers: config.maxWorkers,
    permission_mode: 'acceptEdits',
  });
}

// ── Composable ────────────────────────────────────────────────────────────────

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
      currentFocus: '',
      techStack: [],
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

  const canGoNext = computed(() => isStepValid(state));
  const canGoPrev = computed(() => state.currentStep > 1);
  const isLastStep = computed(() => state.currentStep === TOTAL_STEPS);
  const progress = computed(() => (state.currentStep / TOTAL_STEPS) * 100);

  // ── Navigation ────────────────────────────────────────────────────────────

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

  // ── State mutators ────────────────────────────────────────────────────────

  function setScanResult(result: ScanResult): void {
    state.scanResult = result;
    state.projectName = result.project_name;
  }

  function setGeneratedContext(context: GeneratedContext): void {
    state.context.summary = context.summary;
    state.context.architecture = context.architecture;
    state.context.conventions = context.conventions;
    state.context.currentFocus = context.current_focus ?? '';
    state.context.techStack =
      context.tech_stack?.length ? context.tech_stack : (state.scanResult?.tech_stack ?? []);
    state.tasks = context.suggested_tasks.map(t => ({
      title: t.title,
      description: t.description,
      priority: (t.priority as TaskPriority) || 'medium',
      files: [],
    }));
  }

  function addTask(): void {
    state.tasks.push({ title: '', description: '', priority: 'medium', files: [] });
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

  // ── Submit ────────────────────────────────────────────────────────────────

  async function submit(): Promise<void> {
    if (!state.machineId) return;

    isSubmitting.value = true;
    submitError.value = null;

    try {
      const projectId = await resolveProjectId(state, projectsStore);
      await apiMaybeStartOrchestrator(projectId, state.orchestratorConfig, orchestratorStore);
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

// ── Submit helper (project resolution) ───────────────────────────────────────

async function resolveProjectId(
  state: WizardState,
  projectsStore: ReturnType<typeof useProjectsStore>,
): Promise<string> {
  // PRD mode finalizes the project created during decomposition by applying
  // its server-persisted master plan. Gate on `_projectId` ALONE (not the
  // client `masterPlan` ref): if the decompose broadcast didn't sync to this
  // client, the plan still lives in the project's master_plan column and the
  // apply endpoint uses it — never silently fall back to an empty manual
  // create, which is exactly what produced 0-task projects.
  if (state.wizardMode === 'prd' && state._projectId) {
    await apiUpdateProjectWithPlan(state._projectId, state);
    return state._projectId;
  }

  return apiCreateProjectWithTasks(state.machineId!, state, projectsStore);
}
