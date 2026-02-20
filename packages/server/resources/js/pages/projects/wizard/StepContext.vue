<template>
  <div class="step-context">
    <h2 class="step-title">Project Context</h2>
    <p class="step-desc">Generate or edit the project context. This helps agents understand the codebase.</p>

    <!-- Generate Button -->
    <button
      class="btn btn-generate"
      :disabled="!state.machineId || !state.path || isGenerating"
      @click="handleGenerate"
    >
      <div class="spinner" v-if="isGenerating"></div>
      <svg v-else viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
        <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
      </svg>
      {{ isGenerating ? 'Generating with AI...' : 'Generate with AI' }}
    </button>

    <div class="generate-error" v-if="generateError">
      {{ generateError }}
    </div>

    <!-- Context Fields -->
    <div class="context-fields">
      <div class="field">
        <label class="field-label">Summary</label>
        <textarea
          v-model="state.context.summary"
          class="field-textarea"
          rows="4"
          placeholder="Brief description of the project..."
        ></textarea>
      </div>

      <div class="field">
        <label class="field-label">Architecture</label>
        <textarea
          v-model="state.context.architecture"
          class="field-textarea"
          rows="4"
          placeholder="Architecture overview, key components..."
        ></textarea>
      </div>

      <div class="field">
        <label class="field-label">Conventions</label>
        <textarea
          v-model="state.context.conventions"
          class="field-textarea"
          rows="3"
          placeholder="Coding conventions, patterns to follow..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectScan } from '@/composables/useProjectScan';
import type { WizardState } from '@/composables/useProjectWizard';
import type { GeneratedContext } from '@/composables/useProjectScan';

interface Props {
  state: WizardState;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'generated', context: GeneratedContext): void;
}>();

const { isGenerating, generateError, generateContext } = useProjectScan();

async function handleGenerate(): Promise<void> {
  if (!props.state.machineId || !props.state.path) return;

  const result = await generateContext(
    props.state.machineId,
    props.state.path,
    props.state.scanResult?.tech_stack ?? [],
    props.state.scanResult?.readme ?? null,
    props.state.scanResult?.structure ?? [],
  );
  emit('generated', result);
}
</script>

<style scoped>
.step-context {
  @apply space-y-4;
}

.step-title {
  @apply text-lg font-semibold text-white;
}

.step-desc {
  @apply text-sm text-gray-400;
}

.btn-generate {
  @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors;
}

.btn-generate:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-icon {
  @apply w-4 h-4;
}

.spinner {
  @apply w-4 h-4 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin;
}

.generate-error {
  @apply p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm;
}

.context-fields {
  @apply space-y-4;
}

.field {
  @apply space-y-1.5;
}

.field-label {
  @apply text-xs text-gray-500 uppercase tracking-wider font-medium;
}

.field-textarea {
  @apply w-full px-4 py-3 bg-dark-2 border border-dark-4 rounded-lg text-white text-sm leading-relaxed placeholder-gray-600 focus:outline-none focus:border-brand-purple resize-y;
}
</style>
