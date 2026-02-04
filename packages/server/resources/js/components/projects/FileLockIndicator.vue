<template>
  <div 
    class="file-lock-indicator"
    :class="{ 
      'is-locked': isLocked, 
      'is-owned': isOwned,
      'compact': compact 
    }"
    :title="tooltip"
  >
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path v-if="isLocked" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      <path v-else d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
    </svg>
    <span v-if="!compact && showText" class="lock-text">
      {{ isLocked ? 'Locked' : 'Unlocked' }}
    </span>
    <span v-if="compact && remainingTime" class="lock-time">
      {{ remainingTime }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useLocksStore } from '@/stores/locks';

interface Props {
  projectId: string;
  filePath: string;
  instanceId?: string;
  compact?: boolean;
  showText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showText: false,
});

const locksStore = useLocksStore();

const lock = computed(() => locksStore.getLockForPath(props.filePath));
const isLocked = computed(() => !!lock.value);
const isOwned = computed(() => 
  lock.value?.locked_by === props.instanceId
);

const remainingSeconds = ref(0);
let interval: number | null = null;

const remainingTime = computed(() => {
  if (remainingSeconds.value <= 0) return '';
  
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
});

const tooltip = computed(() => {
  if (!lock.value) return 'File is unlocked';
  
  const owner = lock.value.locked_by.slice(0, 12) + '...';
  const time = formatRemaining(lock.value.remaining_seconds);
  
  if (isOwned.value) {
    return `Locked by you • ${time} remaining`;
  }
  return `Locked by ${owner} • ${time} remaining`;
});

onMounted(() => {
  if (props.compact && isLocked.value) {
    remainingSeconds.value = lock.value?.remaining_seconds || 0;
    interval = window.setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--;
      }
    }, 1000);
  }
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
</script>

<style scoped>
.file-lock-indicator {
  @apply flex items-center gap-2;
}

.file-lock-indicator svg {
  @apply w-5 h-5;
}

.file-lock-indicator.is-locked {
  @apply text-orange-400;
}

.file-lock-indicator.is-locked.is-owned {
  @apply text-green-400;
}

.file-lock-indicator:not(.is-locked) {
  @apply text-gray-500;
}

.file-lock-indicator.compact {
  @apply gap-1;
}

.file-lock-indicator.compact svg {
  @apply w-4 h-4;
}

.lock-text {
  @apply text-sm;
}

.lock-time {
  @apply text-xs text-gray-400;
}
</style>
