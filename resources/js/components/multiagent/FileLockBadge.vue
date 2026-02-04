<template>
  <div 
    class="file-lock-badge"
    :class="[lockStatus, { 'is-own-lock': isOwnLock }]"
    @click="handleClick"
  >
    <div class="lock-icon">
      <svg v-if="isLocked" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
      </svg>
    </div>
    
    <div class="lock-info">
      <span class="lock-filename">{{ filename }}</span>
      <span v-if="isLocked" class="lock-meta">
        Locked by {{ truncatedOwner }}
        <span v-if="lock?.remaining_seconds" class="lock-expiry">
          ({{ formatExpiry(lock.remaining_seconds) }})
        </span>
      </span>
      <span v-else class="lock-meta unlocked">Unlocked</span>
    </div>
    
    <div v-if="showActions && isLocked" class="lock-actions">
      <button 
        v-if="isOwnLock"
        class="action-btn unlock"
        @click.stop="$emit('unlock', filePath)"
        title="Unlock file"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
        </svg>
      </button>
      <button 
        v-else-if="canForceUnlock"
        class="action-btn force-unlock"
        @click.stop="$emit('force-unlock', filePath)"
        title="Force unlock (admin)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FileLock } from '@/types';

interface Props {
  filePath: string;
  lock?: FileLock | null;
  currentInstanceId?: string;
  showActions?: boolean;
  canForceUnlock?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  lock: null,
  currentInstanceId: '',
  showActions: true,
  canForceUnlock: false,
});

const emit = defineEmits<{
  'click': [filePath: string];
  'unlock': [filePath: string];
  'force-unlock': [filePath: string];
}>();

const isLocked = computed(() => !!props.lock);

const isOwnLock = computed(() => {
  if (!props.lock || !props.currentInstanceId) return false;
  return props.lock.locked_by === props.currentInstanceId;
});

const lockStatus = computed(() => {
  if (!isLocked.value) return 'unlocked';
  if (isOwnLock.value) return 'own-lock';
  return 'locked';
});

const filename = computed(() => {
  const parts = props.filePath.split('/');
  return parts[parts.length - 1] || props.filePath;
});

const truncatedOwner = computed(() => {
  if (!props.lock) return '';
  const id = props.lock.locked_by;
  return id.slice(0, 8) + '...';
});

function formatExpiry(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function handleClick() {
  emit('click', props.filePath);
}
</script>

<style scoped>
.file-lock-badge {
  @apply flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer;
  @apply bg-dark-3 border-dark-4 hover:border-dark-3;
}

.file-lock-badge.locked {
  @apply bg-red-500/5 border-red-500/20;
}

.file-lock-badge.own-lock {
  @apply bg-brand-purple/5 border-brand-purple/20;
}

.lock-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0;
  @apply bg-green-500/10 text-green-400;
}

.file-lock-badge.locked .lock-icon {
  @apply bg-red-500/10 text-red-400;
}

.file-lock-badge.own-lock .lock-icon {
  @apply bg-brand-purple/10 text-brand-purple;
}

.lock-icon svg {
  @apply w-4 h-4;
}

.lock-info {
  @apply flex-1 min-w-0;
}

.lock-filename {
  @apply block text-sm font-medium text-white truncate;
}

.lock-meta {
  @apply block text-xs text-gray-400;
}

.lock-meta.unlocked {
  @apply text-green-400;
}

.file-lock-badge.locked .lock-meta {
  @apply text-red-400;
}

.file-lock-badge.own-lock .lock-meta {
  @apply text-brand-purple;
}

.lock-expiry {
  @apply text-gray-500;
}

.lock-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded-lg transition-colors;
}

.action-btn.unlock {
  @apply text-green-400 hover:bg-green-500/10;
}

.action-btn.force-unlock {
  @apply text-red-400 hover:bg-red-500/10;
}

.action-btn svg {
  @apply w-4 h-4;
}
</style>
