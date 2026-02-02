<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Machine' : 'Add New Machine' }}</h2>
        <button class="close-btn" @click="close">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="name">Machine Name *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            placeholder="e.g., MacBook Pro"
            :class="{ 'error': errors.name }"
          />
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>

        <div v-if="!isEditing" class="form-group">
          <label for="platform">Platform *</label>
          <select
            id="platform"
            v-model="form.platform"
            required
            :class="{ 'error': errors.platform }"
          >
            <option value="">Select Platform</option>
            <option value="darwin">macOS</option>
            <option value="win32">Windows</option>
            <option value="linux">Linux</option>
          </select>
          <span v-if="errors.platform" class="error-text">{{ errors.platform }}</span>
        </div>

        <div v-if="!isEditing" class="form-group">
          <label for="hostname">Hostname</label>
          <input
            id="hostname"
            v-model="form.hostname"
            type="text"
            placeholder="e.g., macbook-pro.local"
          />
        </div>

        <div class="form-group">
          <label for="max_sessions">Maximum Sessions</label>
          <input
            id="max_sessions"
            v-model.number="form.max_sessions"
            type="number"
            min="1"
            max="100"
          />
          <span class="help-text">Maximum number of concurrent Claude sessions</span>
        </div>

        <div v-if="isEditing" class="form-group">
          <label>Capabilities</label>
          <div class="capabilities-grid">
            <label v-for="cap in availableCapabilities" :key="cap.value" class="capability-item">
              <input
                type="checkbox"
                :value="cap.value"
                v-model="form.capabilities"
              />
              <span class="checkmark"></span>
              <span class="capability-label">{{ cap.label }}</span>
            </label>
          </div>
        </div>

        <div v-if="error" class="form-error">
          {{ error }}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Machine') }}
          </button>
        </div>
      </form>

      <!-- Token Display (only for new machines) -->
      <div v-if="newToken" class="token-section">
        <div class="token-header">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3>Machine Created Successfully!</h3>
        </div>
        <p class="token-instructions">
          Copy this token and use it to configure the ClaudeNest agent on your machine.
          This token will only be shown once.
        </p>
        <div class="token-display">
          <code>{{ newToken }}</code>
          <button class="copy-btn" @click="copyToken">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
        </div>
        <button class="btn btn-primary" @click="closeWithToken">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Machine, CreateMachineForm, UpdateMachineForm, MachinePlatform } from '@/types';

interface Props {
  isOpen: boolean;
  machine?: Machine | null;
}

const props = withDefaults(defineProps<Props>(), {
  machine: null,
});

const emit = defineEmits<{
  close: [];
  submit: [data: CreateMachineForm | UpdateMachineForm];
}>();

const availableCapabilities = [
  { value: 'wake_on_lan', label: 'Wake on LAN' },
  { value: 'gpu_acceleration', label: 'GPU Acceleration' },
  { value: 'docker', label: 'Docker Support' },
  { value: 'ssh_access', label: 'SSH Access' },
  { value: 'file_sync', label: 'File Sync' },
];

const form = ref({
  name: '',
  platform: '' as MachinePlatform | '',
  hostname: '',
  max_sessions: 10,
  capabilities: [] as string[],
});

const errors = ref<Record<string, string>>({});
const error = ref('');
const isSubmitting = ref(false);
const newToken = ref('');

const isEditing = computed(() => !!props.machine);

// Reset form when machine changes or modal opens
watch(() => props.machine, (machine) => {
  if (machine) {
    form.value = {
      name: machine.name,
      platform: machine.platform,
      hostname: machine.hostname || '',
      max_sessions: machine.max_sessions,
      capabilities: machine.capabilities || [],
    };
  } else {
    form.value = {
      name: '',
      platform: '',
      hostname: '',
      max_sessions: 10,
      capabilities: [],
    };
  }
  errors.value = {};
  error.value = '';
  newToken.value = '';
}, { immediate: true });

function close() {
  emit('close');
  newToken.value = '';
}

function closeWithToken() {
  newToken.value = '';
  close();
}

function validate(): boolean {
  errors.value = {};
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Machine name is required';
  }
  
  if (!isEditing.value && !form.value.platform) {
    errors.value.platform = 'Platform is required';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validate()) return;
  
  isSubmitting.value = true;
  error.value = '';
  
  try {
    let data: CreateMachineForm | UpdateMachineForm;
    
    if (isEditing.value) {
      data = {
        name: form.value.name,
        max_sessions: form.value.max_sessions,
        capabilities: form.value.capabilities,
      };
    } else {
      data = {
        name: form.value.name,
        platform: form.value.platform as MachinePlatform,
        hostname: form.value.hostname || undefined,
        max_sessions: form.value.max_sessions,
        capabilities: form.value.capabilities,
      };
    }
    
    emit('submit', data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    isSubmitting.value = false;
  }
}

function showToken(token: string) {
  newToken.value = token;
}

function copyToken() {
  navigator.clipboard.writeText(newToken.value);
}

// Expose showToken method to parent
defineExpose({ showToken });
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(4px);
}

.modal-content {
  @apply w-full max-w-lg bg-dark-2 rounded-2xl border border-dark-4 shadow-2xl;
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-dark-4;
}

.modal-header h2 {
  @apply text-xl font-semibold text-white;
}

.close-btn {
  @apply p-1 rounded-lg text-gray-400 hover:text-white hover:bg-dark-3 transition-colors;
}

.close-btn svg {
  @apply w-6 h-6;
}

.modal-body {
  @apply p-6 space-y-4;
}

.form-group {
  @apply space-y-1.5;
}

.form-group label {
  @apply block text-sm font-medium text-gray-300;
}

.form-group input,
.form-group select {
  @apply w-full px-3 py-2 bg-dark-3 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple;
  @apply transition-colors;
}

.form-group input.error,
.form-group select.error {
  @apply border-red-500 focus:border-red-500 focus:ring-red-500;
}

.error-text {
  @apply text-xs text-red-400;
}

.help-text {
  @apply text-xs text-gray-500;
}

.capabilities-grid {
  @apply grid grid-cols-2 gap-3 mt-2;
}

.capability-item {
  @apply flex items-center gap-2 cursor-pointer;
}

.capability-item input {
  @apply hidden;
}

.checkmark {
  @apply w-5 h-5 rounded border border-dark-4 bg-dark-3 flex items-center justify-center;
  @apply transition-colors;
}

.capability-item input:checked + .checkmark {
  @apply bg-brand-purple border-brand-purple;
}

.capability-item input:checked + .checkmark::after {
  content: '';
  @apply w-3 h-1.5 border-l-2 border-b-2 border-white transform -rotate-45 -mt-0.5;
}

.capability-label {
  @apply text-sm text-gray-300;
}

.form-error {
  @apply px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400;
}

.modal-footer {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-dark-4;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2;
}

.btn-secondary {
  @apply text-gray-300 hover:text-white hover:bg-dark-3;
}

.btn-primary {
  @apply bg-gradient-to-r from-brand-purple to-brand-indigo text-white;
  @apply hover:opacity-90 hover:shadow-lg;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Token Section */
.token-section {
  @apply p-6 border-t border-dark-4 bg-green-500/5;
}

.token-header {
  @apply flex items-center gap-2 text-green-400 mb-3;
}

.token-header svg {
  @apply w-6 h-6;
}

.token-header h3 {
  @apply text-lg font-semibold;
}

.token-instructions {
  @apply text-sm text-gray-400 mb-4;
}

.token-display {
  @apply flex items-center gap-2 mb-4;
}

.token-display code {
  @apply flex-1 px-3 py-2 bg-dark-3 rounded-lg text-sm font-mono text-brand-cyan break-all;
}

.copy-btn {
  @apply p-2 rounded-lg bg-dark-3 text-gray-400 hover:text-white hover:bg-dark-4 transition-colors;
}

.copy-btn svg {
  @apply w-5 h-5;
}
</style>
