<template>
  <div class="step-orchestrator">
    <h2 class="step-title">Launch Configuration</h2>
    <p class="step-desc">Configure the orchestrator and review your project before creation.</p>

    <!-- Auto-Start Toggle -->
    <div class="toggle-row">
      <label class="toggle-label">
        <input
          type="checkbox"
          v-model="state.orchestratorConfig.autoStart"
          class="toggle-input"
        />
        <span class="toggle-switch"></span>
        <span class="toggle-text">Start orchestrator immediately</span>
      </label>
      <span class="toggle-hint">The orchestrator will auto-dispatch tasks to available agents.</span>
    </div>

    <!-- Config (shown when auto-start enabled) -->
    <div class="config-section" v-if="state.orchestratorConfig.autoStart">
      <div class="config-grid">
        <div class="config-field">
          <label class="field-label">Min Workers</label>
          <input
            type="number"
            v-model.number="state.orchestratorConfig.minWorkers"
            class="field-input"
            min="1"
            max="5"
          />
        </div>
        <div class="config-field">
          <label class="field-label">Max Workers</label>
          <input
            type="number"
            v-model.number="state.orchestratorConfig.maxWorkers"
            class="field-input"
            min="1"
            max="10"
          />
        </div>
        <div class="config-field">
          <label class="field-label">Poll Interval (ms)</label>
          <input
            type="number"
            v-model.number="state.orchestratorConfig.pollIntervalMs"
            class="field-input"
            min="5000"
            max="60000"
            step="1000"
          />
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      <h3 class="summary-title">Project Summary</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Name</span>
          <span class="summary-value">{{ state.projectName || '—' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Path</span>
          <span class="summary-value font-mono text-xs">{{ state.path || '—' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Tech Stack</span>
          <div class="stack-badges" v-if="state.scanResult?.tech_stack?.length">
            <span
              v-for="tech in state.scanResult.tech_stack"
              :key="tech"
              class="tech-badge"
            >{{ tech }}</span>
          </div>
          <span v-else class="summary-value">—</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Tasks</span>
          <span class="summary-value">{{ state.tasks.length }} task(s)</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Orchestrator</span>
          <span class="summary-value">
            {{ state.orchestratorConfig.autoStart ? `Auto-start (${state.orchestratorConfig.minWorkers}-${state.orchestratorConfig.maxWorkers} workers)` : 'Manual start' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WizardState } from '@/composables/useProjectWizard';

interface Props {
  state: WizardState;
}

defineProps<Props>();
</script>

<style scoped>
.step-orchestrator {
  @apply space-y-6;
}

.step-title {
  @apply text-lg font-semibold text-white;
}

.step-desc {
  @apply text-sm text-gray-400;
}

/* Toggle */
.toggle-row {
  @apply space-y-1;
}

.toggle-label {
  @apply inline-flex items-center gap-3 cursor-pointer;
}

.toggle-input {
  @apply hidden;
}

.toggle-switch {
  @apply relative w-10 h-5 bg-dark-4 rounded-full transition-colors duration-200;
}

.toggle-switch::after {
  content: '';
  @apply absolute left-0.5 top-0.5 w-4 h-4 bg-gray-400 rounded-full transition-transform duration-200;
}

.toggle-input:checked + .toggle-switch {
  @apply bg-brand-purple;
}

.toggle-input:checked + .toggle-switch::after {
  @apply translate-x-5 bg-white;
}

.toggle-text {
  @apply text-sm text-white font-medium;
}

.toggle-hint {
  @apply text-xs text-gray-500 ml-[52px];
}

/* Config */
.config-section {
  @apply p-4 bg-dark-2 border border-dark-4 rounded-xl;
}

.config-grid {
  @apply grid grid-cols-3 gap-4;
}

.config-field {
  @apply space-y-1;
}

.field-label {
  @apply text-xs text-gray-500 uppercase tracking-wider font-medium;
}

.field-input {
  @apply w-full px-3 py-2 bg-dark-3 border border-dark-4 rounded-lg text-white text-sm focus:outline-none focus:border-brand-purple;
}

/* Summary */
.summary-section {
  @apply p-4 bg-dark-2 border border-dark-4 rounded-xl space-y-3;
}

.summary-title {
  @apply text-sm font-semibold text-white;
}

.summary-grid {
  @apply space-y-2;
}

.summary-item {
  @apply flex items-start justify-between py-1.5 border-b border-dark-4 last:border-0;
}

.summary-label {
  @apply text-xs text-gray-500 uppercase tracking-wider;
}

.summary-value {
  @apply text-sm text-white text-right;
}

.stack-badges {
  @apply flex flex-wrap gap-1 justify-end;
}

.tech-badge {
  @apply text-xs bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full;
}
</style>
