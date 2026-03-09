<template>
  <div class="step-path">
    <h2 class="step-title">Project Path</h2>
    <p class="step-desc">Enter the project path on the remote machine, then scan to detect the tech stack.</p>

    <!-- Path Input -->
    <div class="path-input-row">
      <input
        v-model="state.path"
        type="text"
        class="path-input"
        placeholder="/home/user/my-project"
        @keyup.enter="handleScan"
      />
      <button
        class="btn btn-primary"
        :disabled="!state.path || !state.machineId || isScanning"
        @click="handleScan"
      >
        <div class="spinner" v-if="isScanning"></div>
        {{ isScanning ? 'Scanning...' : 'Scan' }}
      </button>
    </div>

    <!-- File Browser Toggle -->
    <button class="browse-toggle" @click="showBrowser = !showBrowser">
      <svg viewBox="0 0 24 24" fill="currentColor" class="browse-icon">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
      {{ showBrowser ? 'Hide Browser' : 'Browse Files' }}
    </button>

    <!-- Remote File Tree -->
    <div v-if="showBrowser && state.machineId" class="browser-container">
      <RemoteFileTree
        :machine-id="state.machineId"
        @select="handlePathSelect"
      />
    </div>

    <!-- Error -->
    <div class="scan-error" v-if="scanError">
      {{ scanError }}
    </div>

    <!-- Scan Result -->
    <div class="scan-result" v-if="state.scanResult">
      <div class="result-header">
        <svg viewBox="0 0 24 24" fill="currentColor" class="result-icon">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span class="result-name">{{ state.scanResult.project_name }}</span>
        <span class="git-badge" v-if="state.scanResult.has_git">git</span>
      </div>

      <!-- Tech Stack -->
      <div class="tech-stack" v-if="state.scanResult.tech_stack.length > 0">
        <span class="stack-label">Detected Stack:</span>
        <div class="stack-badges">
          <span
            v-for="tech in state.scanResult.tech_stack"
            :key="tech"
            class="tech-badge"
          >
            {{ tech }}
          </span>
        </div>
      </div>

      <!-- Structure Preview -->
      <div class="structure-preview" v-if="state.scanResult.structure.length > 0">
        <span class="stack-label">Structure:</span>
        <pre class="structure-code">{{ state.scanResult.structure.slice(0, 15).join('\n') }}<template v-if="state.scanResult.structure.length > 15">
...and {{ state.scanResult.structure.length - 15 }} more</template></pre>
      </div>

      <!-- Project Name Override -->
      <div class="name-override">
        <label class="field-label">Project Name</label>
        <input
          v-model="state.projectName"
          type="text"
          class="field-input"
          placeholder="My Project"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useProjectScan } from '@/composables/useProjectScan';
import RemoteFileTree from '@/components/sessions/RemoteFileTree.vue';
import type { WizardState } from '@/composables/useProjectWizard';
import type { ScanResult } from '@/composables/useProjectScan';

interface Props {
  state: WizardState;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'scanned', result: ScanResult): void;
}>();

const showBrowser = ref(false);
const { isScanning, scanError, scanProject } = useProjectScan();

function handlePathSelect(path: string): void {
  props.state.path = path;
}

async function handleScan(): Promise<void> {
  if (!props.state.machineId || !props.state.path) return;

  const result = await scanProject(props.state.machineId, props.state.path);
  emit('scanned', result);
}
</script>

<style scoped>
.step-path {
  @apply space-y-4;
}

.step-title {
  @apply text-lg font-semibold text-skin-primary;
}

.step-desc {
  @apply text-sm text-skin-secondary;
}

.path-input-row {
  @apply flex items-center gap-3;
}

.path-input {
  @apply flex-1 px-4 py-2.5 bg-surface-2 border border-skin rounded-lg text-skin-primary text-sm font-mono placeholder-skin-secondary focus:outline-none focus:border-brand-purple;
}

.btn {
  @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors;
}

.btn-primary {
  @apply bg-brand-purple text-white hover:bg-brand-purple/80;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin;
}

.browse-toggle {
  @apply inline-flex items-center gap-2 text-sm text-skin-secondary hover:text-skin-primary transition-colors;
}

.browse-icon {
  @apply w-4 h-4;
}

.browser-container {
  @apply border border-skin rounded-xl overflow-hidden max-h-64 overflow-y-auto;
}

.scan-error {
  @apply p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm;
}

.scan-result {
  @apply p-4 bg-surface-2 border border-skin rounded-xl space-y-3;
}

.result-header {
  @apply flex items-center gap-2;
}

.result-icon {
  @apply w-5 h-5 text-green-400;
}

.result-name {
  @apply text-base font-semibold text-skin-primary;
}

.git-badge {
  @apply text-xs bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full font-mono;
}

.tech-stack {
  @apply space-y-2;
}

.stack-label {
  @apply text-xs text-skin-secondary uppercase tracking-wider;
}

.stack-badges {
  @apply flex flex-wrap gap-2;
}

.tech-badge {
  @apply text-xs bg-brand-cyan/10 text-brand-cyan px-2.5 py-1 rounded-full font-medium;
}

.structure-preview {
  @apply space-y-2;
}

.structure-code {
  @apply text-xs text-skin-secondary bg-surface-3 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed;
}

.name-override {
  @apply space-y-1;
}

.field-label {
  @apply text-xs text-skin-secondary uppercase tracking-wider;
}

.field-input {
  @apply w-full px-3 py-2 bg-surface-3 border border-skin rounded-lg text-skin-primary text-sm focus:outline-none focus:border-brand-purple;
}
</style>
