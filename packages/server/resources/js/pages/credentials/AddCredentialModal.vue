<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div :class="['modal-card', { 'modal-card-wide': step === 'terminal' }]">
      <div class="modal-header">
        <h2>{{ step === 'terminal' ? 'Login via Terminal' : 'Add Credential' }}</h2>
        <button class="close-btn" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- ==================== STEP 1: Form ==================== -->
        <form v-if="step === 'form'" @submit.prevent="handleSubmit">
          <!-- Name Input -->
          <div class="form-group">
            <label for="name" class="form-label">
              Name
              <span class="text-red-400">*</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="my-credential"
              pattern="[a-z0-9\-]+"
              title="Only lowercase letters, numbers, and dashes allowed"
              required
            />
            <p class="form-hint">Use lowercase letters, numbers, and dashes only</p>
          </div>

          <!-- Auth Type Tabs -->
          <div class="form-group">
            <label class="form-label">Authentication Type</label>
            <div class="tabs">
              <button
                type="button"
                :class="['tab', { 'tab-active': form.auth_type === 'api_key' }]"
                @click="form.auth_type = 'api_key'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
                API Key
              </button>
              <button
                type="button"
                :class="['tab', { 'tab-active': form.auth_type === 'oauth' }]"
                @click="form.auth_type = 'oauth'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                OAuth
              </button>
            </div>
          </div>

          <!-- API Key Input -->
          <div v-if="form.auth_type === 'api_key'" class="form-group">
            <label for="api_key" class="form-label">
              API Key
              <span class="text-red-400">*</span>
            </label>
            <input
              id="api_key"
              v-model="form.api_key"
              type="password"
              class="form-input font-mono"
              placeholder="sk-ant-..."
              required
            />
            <p class="form-hint">Your Claude API key from Anthropic Console</p>
          </div>

          <!-- OAuth Section -->
          <div v-if="form.auth_type === 'oauth'" class="oauth-section">
            <!-- Machine selector -->
            <div v-if="onlineMachines.length > 0" class="form-group">
              <label class="form-label">Machine</label>
              <select v-model="selectedMachineId" class="form-input">
                <option v-for="m in onlineMachines" :key="m.id" :value="m.id">
                  {{ m.display_name || m.name }} ({{ m.platform }})
                </option>
              </select>
              <p class="form-hint">A bash terminal will open on this machine</p>
            </div>
            <div v-else class="oauth-no-machine">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <p>No machines online. Start the ClaudeNest agent on your machine first.</p>
            </div>

            <!-- Connect button -->
            <button
              type="button"
              class="btn-connect-claude"
              :disabled="!form.name || !selectedMachineId"
              @click="handleConnectClaude"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
              </svg>
              Open Terminal &amp; Login
            </button>
            <p class="form-hint text-center">
              Opens a bash session — run <code>claude login</code> then capture credentials
            </p>

            <!-- Divider -->
            <div class="oauth-divider">
              <span>or enter tokens manually</span>
            </div>

            <!-- Manual token inputs -->
            <div class="form-group">
              <label for="access_token" class="form-label">Access Token</label>
              <input
                id="access_token"
                v-model="form.access_token"
                type="password"
                class="form-input font-mono text-sm"
                placeholder="oat01-..."
              />
              <p class="form-hint">From claudeAiOauth.accessToken in ~/.claude/.credentials.json</p>
            </div>
            <div class="form-group">
              <label for="refresh_token" class="form-label">Refresh Token</label>
              <input
                id="refresh_token"
                v-model="form.refresh_token"
                type="password"
                class="form-input font-mono text-sm"
                placeholder="ort01-..."
              />
              <p class="form-hint">From claudeAiOauth.refreshToken in credentials file</p>
            </div>
          </div>

          <!-- Claude Dir Mode -->
          <div class="form-group">
            <label class="form-label">Claude Directory Mode</label>
            <div class="toggle-group">
              <button
                type="button"
                :class="['toggle-btn', { 'toggle-btn-active': form.claude_dir_mode === 'shared' }]"
                @click="form.claude_dir_mode = 'shared'"
              >
                Shared
              </button>
              <button
                type="button"
                :class="['toggle-btn', { 'toggle-btn-active': form.claude_dir_mode === 'isolated' }]"
                @click="form.claude_dir_mode = 'isolated'"
              >
                Isolated
              </button>
            </div>
            <p class="form-hint">
              {{ form.claude_dir_mode === 'shared' ? 'Share credentials across machines (~/.claude/)' : 'Isolated per machine (~/.config/claudenest/)' }}
            </p>
          </div>

          <!-- Submit Buttons -->
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              <div v-if="isSubmitting" class="spinner"></div>
              <span v-else>Create Credential</span>
            </button>
          </div>
        </form>

        <!-- ==================== STEP 2: Terminal ==================== -->
        <div v-if="step === 'terminal'" class="terminal-step">
          <div class="terminal-hint">
            Run <code>claude login</code> in this terminal, complete the login, then click <strong>Capture Credentials</strong>.
          </div>

          <!-- Embedded terminal -->
          <div class="terminal-embed">
            <XtermTerminal
              v-if="bashSessionId"
              :session-id="bashSessionId"
              :auto-connect="true"
            />
          </div>

          <!-- Action bar -->
          <div class="terminal-actions">
            <button type="button" class="btn-secondary" @click="handleClose">
              Cancel
            </button>
            <button
              type="button"
              class="btn-capture"
              :disabled="isCapturing"
              @click="handleCapture"
            >
              <div v-if="isCapturing" class="spinner"></div>
              <template v-else>
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Capture Credentials
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useCredentialsStore } from '@/stores/credentials';
import { useSessionsStore } from '@/stores/sessions';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import { getErrorMessage } from '@/utils/api';
import XtermTerminal from '@/components/terminal/XtermTerminal.vue';
import type { CreateCredentialForm } from '@/types';

interface CredentialForm {
  name: string;
  auth_type: 'api_key' | 'oauth';
  api_key: string;
  access_token: string;
  refresh_token: string;
  claude_dir_mode: 'shared' | 'isolated';
}

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const store = useCredentialsStore();
const sessionsStore = useSessionsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const step = ref<'form' | 'terminal'>('form');
const isSubmitting = ref(false);
const isCapturing = ref(false);
const selectedMachineId = ref<string>('');
const bashSessionId = ref<string | null>(null);
const currentCredentialId = ref<string | null>(null);

const onlineMachines = computed(() => machinesStore.onlineMachines);

const form = reactive<CredentialForm>({
  name: '',
  auth_type: 'api_key',
  api_key: '',
  access_token: '',
  refresh_token: '',
  claude_dir_mode: 'shared',
});

onMounted(async () => {
  if (machinesStore.machines.length === 0) {
    await machinesStore.fetchMachines().catch(() => {});
  }
  if (onlineMachines.value.length > 0 && !selectedMachineId.value) {
    selectedMachineId.value = onlineMachines.value[0].id;
  }
});

async function handleSubmit(): Promise<void> {
  isSubmitting.value = true;

  try {
    if (!/^[a-z0-9-]+$/.test(form.name)) {
      toast.error('Invalid name format', 'Use only lowercase letters, numbers, and dashes');
      return;
    }

    if (form.auth_type === 'api_key' && !form.api_key.trim()) {
      toast.error('API key is required');
      return;
    }

    const payload: CreateCredentialForm = {
      name: form.name,
      auth_type: form.auth_type,
      claude_dir_mode: form.claude_dir_mode,
    };

    if (form.auth_type === 'api_key') {
      payload.api_key = form.api_key;
    } else {
      if (form.access_token.trim()) payload.access_token = form.access_token;
      if (form.refresh_token.trim()) payload.refresh_token = form.refresh_token;
    }

    await store.createCredential(payload);
    emit('created');
  } catch (error: unknown) {
    toast.error('Failed to create credential', getErrorMessage(error));
  } finally {
    isSubmitting.value = false;
  }
}

async function handleConnectClaude(): Promise<void> {
  if (!form.name || !/^[a-z0-9-]+$/.test(form.name)) {
    toast.error('Enter a valid name first', 'Use only lowercase letters, numbers, and dashes');
    return;
  }

  if (!selectedMachineId.value) {
    toast.error('No machine selected');
    return;
  }

  try {
    // 1. Create the credential shell
    const payload: CreateCredentialForm = {
      name: form.name,
      auth_type: 'oauth',
      claude_dir_mode: form.claude_dir_mode,
    };
    const created = await store.createCredential(payload);
    currentCredentialId.value = created.id;

    // 2. Create a bash session on the machine
    const session = await sessionsStore.createSession(selectedMachineId.value, {
      mode: 'bash',
    });
    bashSessionId.value = session.id;

    // 3. Switch to terminal view
    step.value = 'terminal';
  } catch (error: unknown) {
    toast.error('Failed to start terminal', getErrorMessage(error));
  }
}

async function handleCapture(): Promise<void> {
  if (!currentCredentialId.value || !selectedMachineId.value) return;

  isCapturing.value = true;

  try {
    await store.captureFromMachine(currentCredentialId.value, selectedMachineId.value);
    toast.success('Credentials captured!', 'OAuth tokens stored from ~/.claude/.credentials.json');

    // Clean up the bash session
    if (bashSessionId.value) {
      await sessionsStore.terminateSession(bashSessionId.value).catch(() => {});
    }

    emit('created');
  } catch (error: unknown) {
    toast.error('Capture failed', getErrorMessage(error));
  } finally {
    isCapturing.value = false;
  }
}

function handleClose(): void {
  // Terminate bash session if active
  if (bashSessionId.value) {
    sessionsStore.terminateSession(bashSessionId.value).catch(() => {});
  }
  emit('close');
}

onUnmounted(() => {
  // Don't terminate on unmount — user might close modal but session continues
});
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 80%, transparent);
  backdrop-filter: blur(4px);
}

.modal-card {
  @apply w-full max-w-lg rounded-xl shadow-2xl;
  background: var(--bg-card, var(--surface-2, #24283b));
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  max-height: 90vh;
  overflow-y: auto;
  transition: max-width 0.3s ease;
}

.modal-card-wide {
  @apply max-w-3xl;
  max-height: 95vh;
}

.modal-header {
  @apply flex items-center justify-between p-6;
  border-bottom: 1px solid var(--border-primary, #2d3154);
}

.modal-header h2 {
  @apply text-xl font-bold;
  color: var(--text-primary, #c0caf5);
}

.close-btn {
  @apply p-1 rounded-lg transition-colors;
  color: var(--text-muted, #6b7280);
}

.close-btn:hover {
  color: var(--text-primary, #c0caf5);
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.15));
}

.modal-body {
  @apply p-6;
}

.form-group {
  @apply mb-6;
}

.form-label {
  @apply block text-sm font-medium mb-2;
  color: var(--text-secondary, #9ca3af);
}

.form-input {
  @apply w-full px-3 py-2 rounded-lg;
  @apply focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple;
  @apply transition-colors;
  color: var(--text-primary, #c0caf5);
  background: var(--bg-secondary, var(--surface-1, #1a1b26));
  border: 1px solid var(--border-primary, #374151);
}

.form-input::placeholder {
  color: var(--text-muted, #6b7280);
}

.form-hint {
  @apply mt-1 text-xs;
  color: var(--text-muted, #6b7280);
}

.form-hint code {
  @apply px-1.5 py-0.5 rounded font-mono text-xs;
  background: var(--bg-secondary, var(--surface-1, #1a1b26));
  color: var(--accent-cyan, #22d3ee);
}

.tabs {
  @apply flex gap-2 p-1 rounded-lg;
  background: var(--bg-secondary, var(--surface-1, #1a1b26));
}

.tab {
  @apply flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md;
  @apply text-sm font-medium transition-all;
  color: var(--text-muted, #6b7280);
}

.tab-active {
  @apply bg-brand-purple text-white;
}

.oauth-section {
  @apply space-y-4;
}

.btn-connect-claude {
  @apply w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-white;
  @apply transition-all duration-200;
  @apply disabled:opacity-40 disabled:cursor-not-allowed;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  box-shadow: 0 0 20px color-mix(in srgb, #a855f7 30%, transparent);
}

.btn-connect-claude:not(:disabled):hover {
  box-shadow: 0 0 30px color-mix(in srgb, #a855f7 50%, transparent);
  transform: translateY(-1px);
}

.oauth-divider {
  @apply flex items-center gap-3 text-xs;
  color: var(--text-muted, #6b7280);
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  @apply flex-1 h-px;
  background: var(--border-primary, #374151);
}

.oauth-no-machine {
  @apply flex items-center gap-3 p-4 rounded-lg text-sm;
  background: color-mix(in srgb, #fbbf24 10%, transparent);
  color: #fbbf24;
  border: 1px solid color-mix(in srgb, #fbbf24 20%, transparent);
}

.oauth-no-machine p {
  @apply m-0;
}

.toggle-group {
  @apply flex gap-2;
}

.toggle-btn {
  @apply flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg;
  @apply text-sm font-medium transition-all;
  color: var(--text-muted, #6b7280);
  background: var(--bg-secondary, var(--surface-1, #1a1b26));
  border: 1px solid var(--border-primary, #374151);
}

.toggle-btn:hover {
  border-color: var(--text-muted, #6b7280);
}

.toggle-btn-active {
  @apply bg-brand-indigo/20 border-brand-indigo text-brand-indigo;
}

.modal-footer {
  @apply flex items-center justify-end gap-3 mt-8;
}

.btn-primary {
  @apply px-6 py-2.5 rounded-lg font-medium text-white;
  @apply bg-gradient-to-r from-brand-purple to-brand-indigo;
  @apply hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-opacity;
  @apply min-w-[140px] flex items-center justify-center;
}

.btn-secondary {
  @apply px-6 py-2.5 rounded-lg font-medium;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors;
  color: var(--text-secondary, #9ca3af);
  background: var(--bg-tertiary, #24283b);
}

.btn-secondary:hover {
  color: var(--text-primary, #c0caf5);
}

.spinner {
  @apply w-5 h-5 border-2 border-white/30 border-t-white rounded-full;
  animation: spin 0.8s linear infinite;
}

/* ==================== Terminal Step ==================== */

.terminal-step {
  @apply flex flex-col gap-4;
}

.terminal-hint {
  @apply p-3 rounded-lg text-sm;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--text-secondary, #9ca3af);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.terminal-hint code {
  @apply px-1.5 py-0.5 rounded font-mono text-xs;
  background: var(--bg-secondary, var(--surface-1, #1a1b26));
  color: var(--accent-cyan, #22d3ee);
}

.terminal-embed {
  @apply rounded-lg overflow-hidden;
  height: 400px;
  border: 1px solid var(--border-primary, #2d3154);
}

.terminal-embed :deep(.terminal-wrapper) {
  height: 100%;
}

.terminal-embed :deep(.terminal-container) {
  height: 100%;
}

.terminal-actions {
  @apply flex items-center justify-between gap-3;
}

.btn-capture {
  @apply flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-all;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  min-width: 200px;
  justify-content: center;
}

.btn-capture:not(:disabled):hover {
  box-shadow: 0 0 20px color-mix(in srgb, #22c55e 30%, transparent);
  transform: translateY(-1px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
