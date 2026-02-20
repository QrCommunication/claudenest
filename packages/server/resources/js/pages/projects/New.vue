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
      <StepContext
        v-else-if="state.currentStep === 3"
        :state="state"
        @generated="setGeneratedContext"
      />
      <StepTasks
        v-else-if="state.currentStep === 4"
        :state="state"
        @add="addTask"
        @remove="removeTask"
        @move="(i, d) => moveTask(i, d)"
      />
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
import { useProjectWizard } from '@/composables/useProjectWizard';
import StepMachine from './wizard/StepMachine.vue';
import StepPath from './wizard/StepPath.vue';
import StepContext from './wizard/StepContext.vue';
import StepTasks from './wizard/StepTasks.vue';
import StepOrchestrator from './wizard/StepOrchestrator.vue';

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
  addTask,
  removeTask,
  moveTask,
  submit,
} = useProjectWizard();

const steps = [
  { number: 1, label: 'Machine' },
  { number: 2, label: 'Path' },
  { number: 3, label: 'Context' },
  { number: 4, label: 'Tasks' },
  { number: 5, label: 'Launch' },
];
</script>

<style scoped>
.wizard-page {
  @apply max-w-4xl mx-auto space-y-6;
}

.wizard-header {
  @apply space-y-1;
}

.wizard-title {
  @apply text-2xl font-bold text-white;
}

.wizard-subtitle {
  @apply text-sm text-gray-400;
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
  @apply bg-dark-3 text-gray-500;
}

.step-check {
  @apply w-5 h-5;
}

.step-label {
  @apply text-xs font-medium;
}

.step-active .step-label {
  @apply text-white;
}

.step-completed .step-label {
  @apply text-green-400;
}

.step-upcoming .step-label {
  @apply text-gray-500;
}

/* Progress */
.progress-bar {
  @apply w-full h-1 bg-dark-3 rounded-full overflow-hidden;
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
  @apply flex items-center pt-4 border-t border-dark-4;
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
  @apply bg-dark-3 text-gray-300 hover:bg-dark-4 hover:text-white;
}

.btn-secondary:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
