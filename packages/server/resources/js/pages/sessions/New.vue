<template>
  <div class="new-session-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <h1>New Session</h1>
    </div>
    <div class="form-container">
      <div class="card">
        <h2 class="card-title">Start a new session</h2>
        <p class="card-desc">
          Create a new Claude session on machine:
          <strong>{{ machineName }}</strong>
        </p>

        <div class="form-group">
          <label for="machine_select">Machine</label>
          <select
            id="machine_select"
            v-model="selectedMachineId"
            :disabled="isFetchingMachines"
          >
            <option value="" disabled>
              {{ isFetchingMachines ? 'Loading machines...' : 'Select a machine' }}
            </option>
            <option
              v-for="machine in availableMachines"
              :key="machine.id"
              :value="machine.id"
            >
              {{ machine.name }}
              <template v-if="machine.status !== 'online'">
                ({{ machine.status }})
              </template>
            </option>
          </select>
          <p v-if="noOnlineMachines && !isFetchingMachines" class="field-warning">
            No online machines available. The session may fail to start.
          </p>
        </div>

        <div class="form-group">
          <label>Session Mode</label>
          <div class="mode-options">
            <label class="mode-option" :class="{ 'mode-selected': mode === 'interactive' }">
              <input type="radio" value="interactive" v-model="mode" />
              <div>
                <span class="mode-label">Interactive</span>
                <span class="mode-desc">Full interactive terminal session</span>
              </div>
            </label>
            <label class="mode-option" :class="{ 'mode-selected': mode === 'headless' }">
              <input type="radio" value="headless" v-model="mode" />
              <div>
                <span class="mode-label">Headless</span>
                <span class="mode-desc">Run without terminal UI</span>
              </div>
            </label>
            <label class="mode-option" :class="{ 'mode-selected': mode === 'oneshot' }">
              <input type="radio" value="oneshot" v-model="mode" />
              <div>
                <span class="mode-label">One-shot</span>
                <span class="mode-desc">Execute a single prompt and exit</span>
              </div>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="project_path">Project Path (optional)</label>
          <input
            id="project_path"
            v-model="projectPath"
            type="text"
            placeholder="/path/to/project"
          />
        </div>

        <div class="form-group">
          <label for="prompt">
            Initial Prompt
            {{ mode === 'oneshot' ? '(required)' : '(optional)' }}
          </label>
          <textarea
            id="prompt"
            v-model="initialPrompt"
            rows="4"
            placeholder="Enter your initial prompt..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" @click="$router.back()">Cancel</button>
          <button
            class="btn-primary"
            @click="startSession"
            :disabled="isStarting || !canStart"
          >
            <span v-if="isStarting" class="spinner"></span>
            {{ isStarting ? 'Starting...' : 'Start Session' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionsStore } from '@/stores/sessions';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import type { SessionMode } from '@/types';

const route = useRoute();
const router = useRouter();
const sessionsStore = useSessionsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const mode = ref<SessionMode>('interactive');
const projectPath = ref('');
const initialPrompt = ref('');
const isStarting = ref(false);
const isFetchingMachines = ref(false);
const selectedMachineId = ref('');

const availableMachines = computed(() => machinesStore.machines);

const noOnlineMachines = computed(() =>
  availableMachines.value.length > 0 &&
  availableMachines.value.every(m => m.status !== 'online')
);

const machineName = computed(() => {
  if (!selectedMachineId.value) return 'None selected';
  const machine = availableMachines.value.find(m => m.id === selectedMachineId.value);
  return machine ? machine.name : 'Unknown';
});

const canStart = computed(() => {
  if (!selectedMachineId.value) return false;
  if (mode.value === 'oneshot' && !initialPrompt.value.trim()) return false;
  return true;
});

onMounted(async () => {
  isFetchingMachines.value = true;
  try {
    await machinesStore.fetchMachines();

    const queryMachineId = route.query.machine as string | undefined;
    if (queryMachineId) {
      const exists = availableMachines.value.some(m => m.id === queryMachineId);
      if (exists) {
        selectedMachineId.value = queryMachineId;
      }
    }

    if (!selectedMachineId.value && availableMachines.value.length === 1) {
      selectedMachineId.value = availableMachines.value[0].id;
    }
  } catch {
    toast.error('Failed to load machines', 'Could not fetch the list of available machines.');
  } finally {
    isFetchingMachines.value = false;
  }
});

async function startSession() {
  if (!canStart.value) return;

  isStarting.value = true;
  try {
    const session = await sessionsStore.createSession(selectedMachineId.value, {
      mode: mode.value,
      project_path: projectPath.value.trim() || undefined,
      initial_prompt: initialPrompt.value.trim() || undefined,
    });

    toast.success('Session started', `Session created successfully on ${machineName.value}.`);

    router.push({ name: 'session.terminal', params: { id: session.id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    toast.error('Failed to start session', message);
  } finally {
    isStarting.value = false;
  }
}
</script>

<style scoped>
.new-session-page {
  @apply p-6;
}

.page-header {
  @apply flex items-center gap-4 mb-8;
}

.back-btn {
  @apply p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-2 transition-colors;
}

.back-btn svg {
  @apply w-6 h-6;
}

.page-header h1 {
  @apply text-2xl font-bold text-white;
}

.form-container {
  @apply max-w-2xl;
}

.card {
  @apply bg-dark-2 rounded-xl border border-dark-4 p-6;
}

.card-title {
  @apply text-xl font-semibold text-white mb-2;
}

.card-desc {
  @apply text-gray-400 mb-6;
}

.form-group {
  @apply mb-6;
}

.form-group label {
  @apply block text-sm font-medium text-gray-300 mb-2;
}

.form-group input,
.form-group textarea,
.form-group select {
  @apply w-full px-3 py-2 bg-dark-3 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple;
  @apply transition-colors;
}

.form-group select {
  @apply appearance-none cursor-pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.form-group select:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.form-group textarea {
  @apply resize-none;
}

.field-warning {
  @apply text-xs text-yellow-400 mt-1;
}

.mode-options {
  @apply space-y-2;
}

.mode-option {
  @apply flex items-start gap-3 p-3 rounded-lg bg-dark-3 cursor-pointer;
  @apply hover:bg-dark-4 transition-colors border border-transparent;
}

.mode-option.mode-selected {
  @apply border-brand-purple/50 bg-brand-purple/5;
}

.mode-option input {
  @apply mt-1;
}

.mode-label {
  @apply block text-sm font-medium text-white;
}

.mode-desc {
  @apply block text-xs text-gray-500;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-dark-4;
}

.btn-secondary {
  @apply px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors;
}

.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white;
  @apply bg-gradient-to-r from-brand-purple to-brand-indigo;
  @apply hover:opacity-90 transition-opacity;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
