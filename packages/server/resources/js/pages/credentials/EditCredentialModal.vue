<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>Edit Credential</h2>
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
            <label for="edit-name" class="form-label">
              Name
              <span class="required">*</span>
            </label>
            <input
              id="edit-name"
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="my-credential"
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and dashes allowed"
              required
            />
            <p class="form-hint">Use lowercase letters, numbers, and dashes only</p>
          </div>

          <!-- Auth Type (read-only display) -->
          <div class="form-group">
            <label class="form-label">Authentication Type</label>
            <span :class="authTypeBadgeClass">
              {{ credential.auth_type === 'api_key' ? 'API Key' : 'OAuth' }}
            </span>
          </div>

          <!-- API Key Input (only for api_key type) -->
          <div v-if="credential.auth_type === 'api_key'" class="form-group">
            <label for="edit-api-key" class="form-label">API Key</label>
            <input
              id="edit-api-key"
              v-model="form.api_key"
              type="password"
              class="form-input font-mono"
              placeholder="Leave empty to keep current key"
            />
            <p class="form-hint">Leave empty to keep the existing key unchanged</p>
          </div>

          <!-- OAuth Token Inputs -->
          <div v-if="credential.auth_type === 'oauth'" class="form-group">
            <label for="edit-access-token" class="form-label">Access Token</label>
            <input
              id="edit-access-token"
              v-model="form.access_token"
              type="password"
              class="form-input font-mono text-sm"
              placeholder="Leave empty to keep current token"
            />
          </div>

          <div v-if="credential.auth_type === 'oauth'" class="form-group">
            <label for="edit-refresh-token" class="form-label">Refresh Token</label>
            <input
              id="edit-refresh-token"
              v-model="form.refresh_token"
              type="password"
              class="form-input font-mono text-sm"
              placeholder="Leave empty to keep current token"
            />
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
              :disabled="isSubmitting || !hasChanges"
            >
              <div v-if="isSubmitting" class="spinner"></div>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useCredentialsStore } from '@/stores/credentials';
import { useToast } from '@/composables/useToast';
import type { Credential, UpdateCredentialForm } from '@/types';

interface Props {
  credential: Credential;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const store = useCredentialsStore();
const toast = useToast();
const isSubmitting = ref(false);

const form = reactive({
  name: props.credential.name,
  api_key: '',
  access_token: '',
  refresh_token: '',
  claude_dir_mode: props.credential.claude_dir_mode || 'shared',
});

const authTypeBadgeClass = computed(() => {
  return props.credential.auth_type === 'api_key'
    ? 'badge badge-purple'
    : 'badge badge-cyan';
});

const hasChanges = computed(() => {
  if (form.name !== props.credential.name) return true;
  if (form.claude_dir_mode !== (props.credential.claude_dir_mode || 'shared')) return true;
  if (form.api_key.trim()) return true;
  if (form.access_token.trim()) return true;
  if (form.refresh_token.trim()) return true;
  return false;
});

async function handleSubmit(): Promise<void> {
  if (!hasChanges.value) return;
  isSubmitting.value = true;

  try {
    if (!/^[a-z0-9-]+$/.test(form.name)) {
      toast.error('Invalid name format', 'Use only lowercase letters, numbers, and dashes');
      return;
    }

    const payload: UpdateCredentialForm = {};

    if (form.name !== props.credential.name) {
      payload.name = form.name;
    }
    if (form.claude_dir_mode !== (props.credential.claude_dir_mode || 'shared')) {
      payload.claude_dir_mode = form.claude_dir_mode as 'shared' | 'isolated';
    }
    if (form.api_key.trim()) {
      payload.api_key = form.api_key;
    }
    if (form.access_token.trim()) {
      payload.access_token = form.access_token;
    }
    if (form.refresh_token.trim()) {
      payload.refresh_token = form.refresh_token;
    }

    await store.updateCredential(props.credential.id, payload);
    emit('updated');
  } catch (error: unknown) {
    if (error instanceof Error) {
      toast.error('Failed to update credential', error.message);
    } else {
      toast.error('Failed to update credential');
    }
  } finally {
    isSubmitting.value = false;
  }
}
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

.required {
  color: var(--status-error, #ef4444);
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

.badge {
  @apply inline-flex px-2 py-1 rounded text-xs font-medium;
}

.badge-purple {
  @apply bg-brand-purple/20 text-brand-purple;
}

.badge-cyan {
  @apply bg-brand-cyan/20 text-brand-cyan;
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
