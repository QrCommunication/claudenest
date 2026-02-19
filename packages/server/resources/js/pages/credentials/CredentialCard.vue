<template>
  <div class="credential-card">
    <div class="card-header">
      <div class="flex items-center gap-2">
        <h3 class="credential-name">{{ credential.name }}</h3>
        <svg
          v-if="credential.is_default"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="default-star"
          title="Default credential"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
      <span :class="authTypeBadgeClass">
        {{ credential.auth_type === 'api_key' ? 'API Key' : 'OAuth' }}
      </span>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="info-label">Status</span>
        <div class="flex items-center gap-2">
          <span :class="statusDotClass"></span>
          <span :class="statusTextClass">{{ tokenStatusText }}</span>
        </div>
      </div>

      <div v-if="credential.auth_type === 'api_key'" class="info-row">
        <span class="info-label">API Key</span>
        <code class="masked-key">{{ maskedKey }}</code>
      </div>

      <div v-if="credential.claude_dir_mode" class="info-row">
        <span class="info-label">Claude Dir</span>
        <span :class="modeBadgeClass">
          {{ credential.claude_dir_mode }}
        </span>
      </div>

      <div v-if="credential.auth_type === 'oauth' && expiresText" class="info-row">
        <span class="info-label">Token Expiry</span>
        <span :class="['info-value', credential.is_expired ? 'text-red-400' : 'text-green-400']">
          {{ expiresText }}
        </span>
      </div>

      <div v-if="credential.auth_type === 'oauth'" class="info-row">
        <span class="info-label">Refresh Token</span>
        <span :class="['info-value', credential.has_refresh_token ? 'text-green-400' : 'text-yellow-400']">
          {{ credential.has_refresh_token ? 'Available' : 'Not set' }}
        </span>
      </div>

      <div v-if="credential.last_used_at" class="info-row">
        <span class="info-label">Last Used</span>
        <span class="info-value">{{ lastUsedText }}</span>
      </div>
    </div>

    <div class="card-footer">
      <button
        class="action-btn"
        @click="$emit('test', credential.id)"
        title="Test credential"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Test
      </button>

      <button
        v-if="credential.auth_type === 'oauth'"
        class="action-btn"
        @click="$emit('refresh', credential.id)"
        title="Refresh OAuth token"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
        Refresh
      </button>

      <button
        v-if="credential.auth_type === 'oauth'"
        class="action-btn"
        @click="$emit('capture', credential.id)"
        title="Capture OAuth tokens"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        Capture
      </button>

      <button
        v-if="!credential.is_default"
        class="action-btn"
        @click="$emit('set-default', credential.id)"
        title="Set as default"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
        Default
      </button>

      <button
        class="action-btn action-btn-danger"
        @click="$emit('delete', credential.id)"
        title="Delete credential"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Credential } from '@/types';

interface Props {
  credential: Credential;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'test', id: string): void;
  (e: 'refresh', id: string): void;
  (e: 'capture', id: string): void;
  (e: 'set-default', id: string): void;
  (e: 'edit', credential: Credential): void;
  (e: 'delete', id: string): void;
}>();

const authTypeBadgeClass = computed(() => {
  return props.credential.auth_type === 'api_key'
    ? 'badge badge-purple'
    : 'badge badge-cyan';
});

const tokenStatusText = computed(() => {
  const status = props.credential.token_status;
  if (!status) return 'Unknown';

  const statusMap: Record<string, string> = {
    'ok': 'Active',
    'expired': 'Expired',
    'missing': 'Missing',
    'needs_login': 'Needs Login',
  };

  return statusMap[status] || status;
});

const statusDotClass = computed(() => {
  const status = props.credential.token_status;

  const classMap: Record<string, string> = {
    'ok': 'status-dot status-dot-green',
    'expired': 'status-dot status-dot-yellow',
    'missing': 'status-dot status-dot-red',
    'needs_login': 'status-dot status-dot-red',
  };

  return classMap[status || 'missing'] || 'status-dot status-dot-gray';
});

const statusTextClass = computed(() => {
  const status = props.credential.token_status;

  const classMap: Record<string, string> = {
    'ok': 'text-green-400',
    'expired': 'text-yellow-400',
    'missing': 'text-red-400',
    'needs_login': 'text-red-400',
  };

  return classMap[status || 'missing'] || 'text-gray-400';
});

const maskedKey = computed(() => {
  if (props.credential.auth_type !== 'api_key') return '';
  const key = props.credential.masked_key || '';
  if (!key || key.length <= 12) return '••••••••••••';
  return key;
});

const expiresText = computed(() => {
  if (!props.credential.expires_at) return null;
  const expires = new Date(props.credential.expires_at);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m remaining`;
  if (diffHours < 24) return `${diffHours}h remaining`;
  return `${diffDays}d remaining`;
});

const modeBadgeClass = computed(() => {
  return props.credential.claude_dir_mode === 'shared'
    ? 'badge badge-indigo'
    : 'badge badge-gray';
});

const lastUsedText = computed(() => {
  if (!props.credential.last_used_at) return 'Never';

  const date = new Date(props.credential.last_used_at);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
});
</script>

<style scoped>
.credential-card {
  @apply rounded-lg overflow-hidden;
  background: var(--bg-card, var(--surface-2, #24283b));
  border: 1px solid var(--border-primary, color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent));
  transition: all 0.3s ease;
}

.credential-card:hover {
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.card-header {
  @apply flex items-center justify-between p-4;
  border-bottom: 1px solid var(--border-primary, #2d3154);
}

.credential-name {
  @apply text-base font-semibold;
  color: var(--text-primary, #c0caf5);
}

.default-star {
  @apply w-4 h-4 text-yellow-400;
}

.badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.badge-purple {
  @apply bg-brand-purple/20 text-brand-purple;
}

.badge-cyan {
  @apply bg-brand-cyan/20 text-brand-cyan;
}

.badge-indigo {
  @apply bg-brand-indigo/20 text-brand-indigo;
}

.badge-gray {
  background: var(--bg-tertiary, #374151);
  color: var(--text-secondary, #9ca3af);
}

.card-body {
  @apply p-4 space-y-3;
}

.info-row {
  @apply flex items-center justify-between;
}

.info-label {
  @apply text-sm;
  color: var(--text-muted, #6b7280);
}

.info-value {
  @apply text-sm;
  color: var(--text-secondary, #9ca3af);
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-dot-green {
  @apply bg-green-500;
  box-shadow: 0 0 8px color-mix(in srgb, var(--status-success, #22c55e) 50%, transparent);
}

.status-dot-yellow {
  @apply bg-yellow-500;
  box-shadow: 0 0 8px color-mix(in srgb, var(--status-warning, #eab308) 50%, transparent);
}

.status-dot-red {
  @apply bg-red-500;
  box-shadow: 0 0 8px color-mix(in srgb, var(--status-error, #ef4444) 50%, transparent);
}

.status-dot-gray {
  @apply bg-gray-500;
}

.masked-key {
  @apply text-xs font-mono px-2 py-1 rounded;
  color: var(--text-muted, #6b7280);
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.15));
}

.card-footer {
  @apply flex items-center gap-2 p-3 flex-wrap;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.15));
  border-top: 1px solid var(--border-primary, #2d3154);
}

.action-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium;
  @apply hover:bg-brand-purple/20 hover:text-brand-purple;
  @apply transition-all duration-200;
  color: var(--text-secondary, #9ca3af);
  background: var(--bg-tertiary, #24283b);
}

.action-btn-danger {
  @apply hover:bg-red-500/20 hover:text-red-400;
}

.action-btn svg {
  @apply flex-shrink-0;
}
</style>
