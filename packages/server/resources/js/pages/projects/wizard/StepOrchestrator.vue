<template>
  <div class="step-orchestrator">
    <h2 class="step-title">{{ t('projectsWizardSteporchestrator.launchConfiguration') }}</h2>
    <p class="step-desc">{{ t('projectsWizardSteporchestrator.configureOrchestratorDesc') }}</p>

    <!-- Auto-Start Toggle -->
    <div class="toggle-row">
      <label class="toggle-label">
        <input
          type="checkbox"
          v-model="state.orchestratorConfig.autoStart"
          class="toggle-input"
        />
        <span class="toggle-switch"></span>
        <span class="toggle-text">{{ t('projectsWizardSteporchestrator.startOrchestratorImmediately') }}</span>
      </label>
      <span class="toggle-hint">{{ t('projectsWizardSteporchestrator.autoDispatchHint') }}</span>
    </div>

    <!-- Config (shown when auto-start enabled) -->
    <div class="config-section" v-if="state.orchestratorConfig.autoStart">
      <div class="config-grid">
        <div class="config-field">
          <label class="field-label">{{ t('projectsWizardSteporchestrator.minWorkers') }}</label>
          <input
            type="number"
            v-model.number="state.orchestratorConfig.minWorkers"
            class="field-input"
            min="1"
            max="5"
          />
        </div>
        <div class="config-field">
          <label class="field-label">{{ t('projectsWizardSteporchestrator.maxWorkers') }}</label>
          <input
            type="number"
            v-model.number="state.orchestratorConfig.maxWorkers"
            class="field-input"
            min="1"
            max="10"
          />
        </div>
        <div class="config-field">
          <label class="field-label">{{ t('projectsWizardSteporchestrator.pollIntervalMs') }}</label>
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
      <h3 class="summary-title">{{ t('projectsWizardSteporchestrator.projectSummary') }}</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">{{ t('projectsWizardSteporchestrator.name') }}</span>
          <span class="summary-value">{{ state.projectName || '—' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('projectsWizardSteporchestrator.path') }}</span>
          <span class="summary-value font-mono text-xs">{{ state.path || '—' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('projectsWizardSteporchestrator.techStack') }}</span>
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
          <span class="summary-label">{{ t('projectsWizardSteporchestrator.tasks') }}</span>
          <span class="summary-value">{{ t('projectsWizardSteporchestrator.taskCount', { count: taskCount }) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('projectsWizardSteporchestrator.orchestrator') }}</span>
          <span class="summary-value">
            {{ state.orchestratorConfig.autoStart ? t('projectsWizardSteporchestrator.autoStartWorkers', { min: state.orchestratorConfig.minWorkers, max: state.orchestratorConfig.maxWorkers }) : t('projectsWizardSteporchestrator.manualStart') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WizardState } from '@/composables/useProjectWizard';

interface Props {
  state: WizardState;
}

const props = defineProps<Props>();

const { t } = useI18n();

// PRD mode keeps the decomposed work in `masterPlan.waves` (not `state.tasks`,
// which only the manual mode fills) — count from the right source so the recap
// matches what step 4 showed instead of always reading 0.
const taskCount = computed(() =>
  props.state.wizardMode === 'prd'
    ? (props.state.masterPlan?.waves.reduce((n, w) => n + w.tasks.length, 0) ?? 0)
    : props.state.tasks.length,
);
</script>

<style scoped>
@reference "../../../../css/tailwind.css";
.step-orchestrator {
  @apply space-y-6;
}

.step-title {
  @apply text-lg font-semibold text-skin-primary;
}

.step-desc {
  @apply text-sm text-skin-secondary;
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
  @apply relative w-10 h-5 bg-surface-4 rounded-full transition-colors duration-200;
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
  @apply text-sm text-skin-primary font-medium;
}

.toggle-hint {
  @apply text-xs text-skin-secondary ml-[52px];
}

/* Config */
.config-section {
  @apply p-4 bg-surface-2 border border-skin rounded-xl;
}

.config-grid {
  @apply grid grid-cols-3 gap-4;
}

.config-field {
  @apply space-y-1;
}

.field-label {
  @apply text-xs text-skin-secondary uppercase tracking-wider font-medium;
}

.field-input {
  @apply w-full px-3 py-2 bg-surface-3 border border-skin rounded-lg text-skin-primary text-sm focus:outline-none focus:border-brand-purple;
}

/* Summary */
.summary-section {
  @apply p-4 bg-surface-2 border border-skin rounded-xl space-y-3;
}

.summary-title {
  @apply text-sm font-semibold text-skin-primary;
}

.summary-grid {
  @apply space-y-2;
}

.summary-item {
  @apply flex items-start justify-between py-1.5 border-b border-skin last:border-0;
}

.summary-label {
  @apply text-xs text-skin-secondary uppercase tracking-wider;
}

.summary-value {
  @apply text-sm text-skin-primary text-right;
}

.stack-badges {
  @apply flex flex-wrap gap-1 justify-end;
}

.tech-badge {
  @apply text-xs bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full;
}
</style>
