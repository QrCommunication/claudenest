<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>Add Credential</h2>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
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
            <!-- Primary: Connect button -->
            <button
              type="button"
              class="btn-connect-claude"
              :disabled="!form.name || isConnecting"
              @click="handleConnectClaude"
              title="Connect directly with your Claude account"
            >
              <svg v-if="isConnecting" class="spinner-sm" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-dashoffset="10"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {{ isConnecting ? 'Waiting for connection…' : 'Connect with Claude' }}
            </button>
            <p v-if="!form.name" class="form-hint text-center">Enter a name above to enable connection</p>

            <!-- Divider -->
            <div class="oauth-divider">
              <span>or enter tokens manually</span>
            </div>

            <!-- Manual token inputs (collapsed by default) -->
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
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                Shared
              </button>
              <button
                type="button"
                :class="['toggle-btn', { 'toggle-btn-active': form.claude_dir_mode === 'isolated' }]"
                @click="form.claude_dir_mode = 'isolated'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                Isolated
              </button>
            </div>
            <p class="form-hint">
              <span v-if="form.claude_dir_mode === 'shared'">
                Share credentials across machines (stored in ~/.claude/)
              </span>
              <span v-else>
                Keep credentials isolated per machine (stored in ~/.config/claudenest/)
              </span>
            </p>
          </div>

          <!-- Submit Buttons -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn-secondary"
              @click="$emit('close')"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSubmitting"
            >
              <div v-if="isSubmitting" class="spinner"></div>
              <span v-else>Create Credential</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useCredentialsStore } from '@/stores/credentials';
import { useToast } from '@/composables/useToast';
import { getErrorMessage } from '@/utils/api';
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
const toast = useToast();

const isSubmitting = ref(false);
const isConnecting = ref(false);
let oauthPopup: Window | null = null;

const form = reactive<CredentialForm>({
  name: '',
  auth_type: 'api_key',
  api_key: '',
  access_token: '',
  refresh_token: '',
  claude_dir_mode: 'shared',
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

  isConnecting.value = true;

  try {
    // 1. Create the credential (empty OAuth shell)
    const payload: CreateCredentialForm = {
      name: form.name,
      auth_type: 'oauth',
      claude_dir_mode: form.claude_dir_mode,
    };
    const created = await store.createCredential(payload);

    // 2. Initiate OAuth and open popup
    const authUrl = await store.initiateOAuth(created.id);
    const popup = window.open(authUrl, 'claude_oauth', 'width=620,height=720,scrollbars=yes,resizable=yes');
    oauthPopup = popup;

    if (!popup) {
      toast.error('Popup blocked', 'Please allow popups for this site and try again.');
      isConnecting.value = false;
      return;
    }

    // 3. Wait for postMessage from oauth-complete page
    // (handled by Index.vue — emit close and let it refresh)
    emit('created');
  } catch (error: unknown) {
    toast.error('Connection failed', getErrorMessage(error));
    isConnecting.value = false;
  }
}

function handleOAuthMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type !== 'oauth_complete') return;

  isConnecting.value = false;
  oauthPopup = null;

  if (event.data.success) {
    toast.success('Claude connected!');
  } else if (event.data.error) {
    toast.error('OAuth failed', event.data.error);
  }
}

onMounted(() => window.addEventListener('message', handleOAuthMessage));
onUnmounted(() => {
  window.removeEventListener('message', handleOAuthMessage);
  oauthPopup?.close();
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

.spinner-sm {
  @apply w-4 h-4;
  animation: spin 0.8s linear infinite;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
