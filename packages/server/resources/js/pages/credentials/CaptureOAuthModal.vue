<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>Capture OAuth Tokens</h2>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- Mode Toggle -->
        <div class="form-group">
          <label class="form-label">Input Mode</label>
          <div class="tabs">
            <button
              type="button"
              :class="['tab', { 'tab-active': mode === 'tokens' }]"
              @click="mode = 'tokens'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
              Paste Tokens
            </button>
            <button
              type="button"
              :class="['tab', { 'tab-active': mode === 'json' }]"
              @click="mode = 'json'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
              Paste JSON
            </button>
          </div>
        </div>

        <!-- Token Mode -->
        <form v-if="mode === 'tokens'" @submit.prevent="handleSubmitTokens">
          <div class="form-group">
            <label for="access_token" class="form-label">
              Access Token
              <span class="text-red-400">*</span>
            </label>
            <input
              id="access_token"
              v-model="tokens.access_token"
              type="password"
              class="form-input font-mono text-sm"
              placeholder="oat01-..."
              required
            />
            <p class="form-hint">From claudeAiOauth.accessToken in ~/.claude/.credentials.json</p>
          </div>

          <div class="form-group">
            <label for="refresh_token" class="form-label">Refresh Token</label>
            <input
              id="refresh_token"
              v-model="tokens.refresh_token"
              type="password"
              class="form-input font-mono text-sm"
              placeholder="ort01-..."
            />
            <p class="form-hint">From claudeAiOauth.refreshToken (recommended for auto-refresh)</p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="$emit('close')" :disabled="isSubmitting">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting || !tokens.access_token.trim()">
              <div v-if="isSubmitting" class="spinner"></div>
              <span v-else>Capture Tokens</span>
            </button>
          </div>
        </form>

        <!-- JSON Mode -->
        <form v-else @submit.prevent="handleSubmitJson">
          <div class="info-box">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-brand-cyan flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <p class="info-text">
              Copy the entire content of <code>~/.claude/.credentials.json</code> from the machine
              where Claude Code is authenticated, then paste it below.
            </p>
          </div>

          <div class="form-group">
            <label for="credentials_json" class="form-label">
              Credentials JSON
              <span class="text-red-400">*</span>
            </label>
            <textarea
              id="credentials_json"
              v-model="jsonContent"
              class="form-input font-mono text-sm"
              rows="8"
              placeholder='{ "claudeAiOauth": { "accessToken": "oat01-...", ... } }'
              required
            ></textarea>
            <p class="form-hint">The full JSON content of your credentials file</p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="$emit('close')" :disabled="isSubmitting">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting || !jsonContent.trim()">
              <div v-if="isSubmitting" class="spinner"></div>
              <span v-else>Capture from JSON</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useCredentialsStore } from '@/stores/credentials';
import { useToast } from '@/composables/useToast';
import { getErrorMessage } from '@/utils/api';

interface Props {
  credentialId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'captured'): void;
}>();

const store = useCredentialsStore();
const toast = useToast();

const mode = ref<'tokens' | 'json'>('tokens');
const isSubmitting = ref(false);
const jsonContent = ref('');
const tokens = reactive({
  access_token: '',
  refresh_token: '',
});

async function handleSubmitTokens(): Promise<void> {
  isSubmitting.value = true;
  try {
    await store.captureOAuth(props.credentialId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
    });
    toast.success('OAuth tokens captured successfully');
    emit('captured');
  } catch (error: unknown) {
    toast.error('Capture failed', getErrorMessage(error));
  } finally {
    isSubmitting.value = false;
  }
}

async function handleSubmitJson(): Promise<void> {
  isSubmitting.value = true;
  try {
    // Validate JSON locally first
    const parsed = JSON.parse(jsonContent.value);
    if (!parsed.claudeAiOauth?.accessToken) {
      toast.error('Invalid JSON', 'Missing claudeAiOauth.accessToken field');
      return;
    }

    await store.captureOAuth(props.credentialId, {
      credentials_json: jsonContent.value,
    });
    toast.success('OAuth tokens captured from JSON');
    emit('captured');
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      toast.error('Invalid JSON format', 'Please paste valid JSON content');
    } else {
      toast.error('Capture failed', getErrorMessage(error));
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

textarea.form-input {
  resize: vertical;
  min-height: 120px;
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

.info-box {
  @apply flex gap-3 p-4 rounded-lg mb-6;
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
}

.info-text {
  @apply text-xs leading-relaxed;
  color: var(--text-muted, #6b7280);
}

.info-text code {
  @apply px-1 py-0.5 rounded text-brand-cyan;
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 10%, transparent);
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
