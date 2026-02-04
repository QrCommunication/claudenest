<template>
  <div 
    class="instance-badge"
    :class="[size, instance?.status || 'unknown']"
    :title="tooltip"
  >
    <div class="instance-icon">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </div>
    <span v-if="size !== 'sm'" class="instance-id">
      {{ displayId }}
    </span>
    <span 
      v-if="showStatus && size !== 'sm'" 
      class="instance-status"
      :class="instance?.status"
    >
      {{ instance?.status }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ClaudeInstance } from '@/types';

interface Props {
  instance?: ClaudeInstance;
  instanceId?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showStatus: true,
});

// If instance not provided directly, create a minimal one from instanceId
const instance = computed<ClaudeInstance | null>(() => {
  if (props.instance) return props.instance;
  if (props.instanceId) {
    return {
      id: props.instanceId,
      status: 'unknown',
      is_connected: false,
      is_available: false,
      context_tokens: 0,
      context_usage_percent: 0,
      max_context_tokens: 0,
      tasks_completed: 0,
      current_task: null,
      uptime: null,
      connected_at: '',
      last_activity_at: '',
    } as ClaudeInstance;
  }
  return null;
});

const displayId = computed(() => {
  const id = instance.value?.id || props.instanceId || '';
  if (props.size === 'sm') {
    return id.slice(0, 6) + '...';
  }
  return id.slice(0, 12) + '...';
});

const tooltip = computed(() => {
  if (!instance.value) return 'Unknown instance';
  
  const parts = [
    `ID: ${instance.value.id}`,
    `Status: ${instance.value.status}`,
  ];
  
  if (instance.value.context_usage_percent !== undefined) {
    parts.push(`Context: ${Math.round(instance.value.context_usage_percent)}%`);
  }
  
  if (instance.value.tasks_completed !== undefined) {
    parts.push(`Tasks: ${instance.value.tasks_completed}`);
  }
  
  return parts.join(' • ');
});
</script>

<style scoped>
.instance-badge {
  @apply inline-flex items-center gap-2;
}

.instance-badge.sm {
  @apply gap-1;
}

.instance-badge.lg {
  @apply gap-3;
}

.instance-icon {
  @apply flex items-center justify-center rounded-full bg-dark-4;
}

.instance-badge.sm .instance-icon {
  @apply w-6 h-6;
}

.instance-badge.md .instance-icon {
  @apply w-8 h-8;
}

.instance-badge.lg .instance-icon {
  @apply w-10 h-10;
}

.instance-icon svg {
  @apply w-4 h-4 text-gray-400;
}

.instance-badge.sm .instance-icon svg {
  @apply w-3 h-3;
}

.instance-badge.lg .instance-icon svg {
  @apply w-5 h-5;
}

.instance-id {
  @apply font-mono text-sm text-white;
}

.instance-badge.sm .instance-id {
  @apply text-xs;
}

.instance-status {
  @apply text-xs px-2 py-0.5 rounded-full;
}

.instance-status.active {
  @apply bg-green-500/10 text-green-400;
}

.instance-status.idle {
  @apply bg-blue-500/10 text-blue-400;
}

.instance-status.busy {
  @apply bg-brand-purple/10 text-brand-purple;
}

.instance-status.disconnected,
.instance-status.unknown {
  @apply bg-gray-500/10 text-gray-400;
}

/* Status-based icon colors */
.instance-badge.active .instance-icon svg {
  @apply text-green-400;
}

.instance-badge.idle .instance-icon svg {
  @apply text-blue-400;
}

.instance-badge.busy .instance-icon svg {
  @apply text-brand-purple;
}
</style>
