<template>
  <div class="wizard-page">
    <!-- Header -->
    <div class="wizard-header">
      <h1 class="wizard-title">New Project</h1>
      <p class="wizard-subtitle">Set up a multi-agent project in {{ totalSteps }} steps</p>
    </div>

    <!-- Stepper -->
    <div class="stepper">
      <div
        v-for="step in steps"
        :key="step.number"
        class="step"
        :class="{
          'step-active': state.currentStep === step.number,
          'step-completed': state.currentStep > step.number,
          'step-upcoming': state.currentStep < step.number,
        }"
        @click="goToStep(step.number)"
      >
        <div class="step-indicator">
          <svg v-if="state.currentStep > step.number" viewBox="0 0 24 24" fill="currentColor" class="step-check">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span v-else>{{ step.number }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <StepMachine v-if="state.currentStep === 1" :state="state" />
      <StepPath
        v-else-if="state.currentStep === 2"
        :state="state"
        @scanned="setScanResult"
      />

      <!-- Step 3: PRD or Context -->
      <template v-else-if="state.currentStep === 3">
        <!-- Mode Toggle -->
        <div class="mode-toggle">
          <button
            class="mode-btn"
            :class="{ 'mode-btn-active': isPrdMode }"
            @click="handleModeSwitch('prd')"
          >
            PRD / Feature
          </button>
          <button
            class="mode-btn"
            :class="{ 'mode-btn-active': !isPrdMode }"
            @click="handleModeSwitch('manual')"
          >
            Manual Context
          </button>
        </div>

        <!-- PRD Mode -->
        <div v-if="isPrdMode" class="prd-step">
          <PrdInput
            v-model="state.prd"
            :credential-id="state.credentialId"
            :is-decomposing="isDecomposing"
            :error="decompositionError"
            @update:credential-id="(v: string) => state.credentialId = v"
            @decompose="handleDecompose"
          />
          <DecompositionProgress
            v-if="isDecomposing"
            :output="decompositionOutput"
          />
          <div v-if="state.masterPlan && !isDecomposing" class="decompose-success">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-green-400">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span class="text-sm text-green-400">
              Master Plan generated — {{ state.masterPlan.waves.length }} waves,
              {{ state.masterPlan.waves.reduce((s, w) => s + w.tasks.length, 0) }} tasks
            </span>
          </div>
        </div>

        <!-- Manual Mode -->
        <StepContext
          v-else
          :state="state"
          @generated="setGeneratedContext"
        />
      </template>

      <!-- Step 4: Master Plan or Tasks -->
      <template v-else-if="state.currentStep === 4">
        <MasterPlanEditor
          v-if="isPrdMode && state.masterPlan"
          :model-value="state.masterPlan"
          @update:model-value="handleMasterPlanUpdate"
        />
        <StepTasks
          v-else
          :state="state"
          @add="addTask"
          @remove="removeTask"
          @move="(i, d) => moveTask(i, d)"
        />
      </template>

      <StepOrchestrator
        v-else-if="state.currentStep === 5"
        :state="state"
      />
    </div>

    <!-- Error -->
    <div class="wizard-error" v-if="submitError">
      <svg viewBox="0 0 24 24" fill="currentColor" class="error-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      {{ submitError }}
    </div>

    <!-- Navigation -->
    <div class="wizard-nav">
      <button
        class="btn btn-secondary"
        :disabled="!canGoPrev"
        @click="prevStep"
      >
        Previous
      </button>
      <div class="nav-spacer"></div>
      <button
        v-if="!isLastStep"
        class="btn btn-primary"
        :disabled="!canGoNext"
        @click="nextStep"
      >
        Next
      </button>
      <button
        v-else
        class="btn btn-primary"
        :disabled="isSubmitting"
        @click="submit"
      >
        {{ isSubmitting ? 'Creating...' : 'Create Project' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useProjectWizard } from '@/composables/useProjectWizard';
import { useDecomposition } from '@/composables/useDecomposition';
import StepMachine from './wizard/StepMachine.vue';
import StepPath from './wizard/StepPath.vue';
import StepContext from './wizard/StepContext.vue';
import StepTasks from './wizard/StepTasks.vue';
import StepOrchestrator from './wizard/StepOrchestrator.vue';
import PrdInput from '@/components/projects/PrdInput.vue';
import DecompositionProgress from '@/components/projects/DecompositionProgress.vue';
import MasterPlanEditor from '@/components/projects/MasterPlanEditor.vue';
import type { WizardMode } from '@/composables/useProjectWizard';
import type { MasterPlan } from '@/composables/useDecomposition';

const {
  state,
  isSubmitting,
  submitError,
  canGoNext,
  canGoPrev,
  isLastStep,
  progress,
  totalSteps,
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
} = useProjectWizard();

const {
  masterPlan: decomposedPlan,
  isDecomposing,
  decompositionOutput,
  decompositionError,
  startDecomposition,
} = useDecomposition();

const isPrdMode = computed(() => state.wizardMode === 'prd');

const steps = computed(() => [
  { number: 1, label: 'Machine' },
  { number: 2, label: 'Path' },
  { number: 3, label: isPrdMode.value ? 'PRD' : 'Context' },
  { number: 4, label: isPrdMode.value ? 'Plan' : 'Tasks' },
  { number: 5, label: 'Launch' },
]);

function handleModeSwitch(mode: WizardMode): void {
  setWizardMode(mode);
}

async function handleDecompose(): Promise<void> {
  if (!state.machineId || !state.prd || !state.credentialId) return;

  try {
    let projectId = state._projectId;

    if (!projectId) {
      // Create project silently for decomposition
      const { useProjectsStore } = await import('@/stores/projects');
      const store = useProjectsStore();
      const project = await store.createProject(state.machineId, {
        name: state.projectName || state.path.split('/').pop() || 'New Project',
        project_path: state.path,
        summary: '',
      });
      projectId = project.id;
      state._projectId = projectId;
    }

    await startDecomposition(projectId, state.prd, state.credentialId);
  } catch {
    // Error handled by useDecomposition composable
  }
}

// Watch for decomposition completion
watch(decomposedPlan, (plan) => {
  if (plan) {
    setMasterPlan(plan);
  }
});

function handleMasterPlanUpdate(plan: MasterPlan): void {
  setMasterPlan(plan);
}
</script>

<style scoped>
.wizard-page {
  @apply max-w-4xl mx-auto space-y-6;
}

.wizard-header {
  @apply space-y-1;
}

.wizard-title {
  @apply text-2xl font-bold text-skin-primary;
}

.wizard-subtitle {
  @apply text-sm text-skin-secondary;
}

/* Stepper */
.stepper {
  @apply flex items-center justify-between;
}

.step {
  @apply flex flex-col items-center gap-2 cursor-pointer;
}

.step-indicator {
  @apply w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200;
}

.step-active .step-indicator {
  @apply bg-brand-purple text-white ring-2 ring-brand-purple/30;
}

.step-completed .step-indicator {
  @apply bg-green-600 text-white;
}

.step-upcoming .step-indicator {
  @apply bg-surface-3 text-skin-secondary;
}

.step-check {
  @apply w-5 h-5;
}

.step-label {
  @apply text-xs font-medium;
}

.step-active .step-label {
  @apply text-skin-primary;
}

.step-completed .step-label {
  @apply text-green-400;
}

.step-upcoming .step-label {
  @apply text-skin-secondary;
}

/* Progress */
.progress-bar {
  @apply w-full h-1 bg-surface-3 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-brand-purple rounded-full transition-all duration-300;
}

/* Step Content */
.step-content {
  @apply min-h-[300px];
}

/* Error */
.wizard-error {
  @apply flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm;
}

.error-icon {
  @apply w-5 h-5 flex-shrink-0;
}

/* Navigation */
.wizard-nav {
  @apply flex items-center pt-4 border-t border-skin;
}

.nav-spacer {
  @apply flex-1;
}

.btn {
  @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-brand-purple text-white hover:bg-brand-purple/80;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-secondary {
  @apply bg-surface-3 text-skin-secondary hover:bg-surface-4 hover:text-skin-primary;
}

.btn-secondary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Mode Toggle */
.mode-toggle {
  @apply flex gap-1 p-1 bg-surface-3 rounded-lg w-fit mb-4;
}

.mode-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md text-skin-secondary hover:text-skin-primary transition-colors;
}

.mode-btn-active {
  @apply bg-brand-purple text-white;
}

/* PRD Step */
.prd-step {
  @apply space-y-4;
}

.decompose-success {
  @apply flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg;
}
</style>
