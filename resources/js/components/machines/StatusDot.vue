<template>
  <span
    class="status-dot"
    :class="[`status-${status}`, { 'animate-pulse': status === 'connecting' }]"
    :title="tooltip"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MachineStatus } from '@/types';

interface Props {
  status: MachineStatus;
}

const props = defineProps<Props>();

const tooltip = computed(() => {
  const labels: Record<MachineStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    connecting: 'Connecting...',
  };
  return labels[props.status];
});
</script>

<style scoped>
.status-dot {
  @apply inline-block w-3 h-3 rounded-full;
}

.status-online {
  @apply bg-green-500;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.status-offline {
  @apply bg-red-500;
}

.status-connecting {
  @apply bg-amber-400;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
}
</style>
