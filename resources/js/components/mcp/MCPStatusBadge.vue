<template>
  <Badge 
    :variant="badgeVariant" 
    :size="size"
    :dot="dot"
  >
    <template v-if="showIcon">
      <CheckIcon v-if="status === 'running'" class="w-3 h-3 mr-1" />
      <XIcon v-else-if="status === 'stopped'" class="w-3 h-3 mr-1" />
      <AlertCircleIcon v-else-if="status === 'error'" class="w-3 h-3 mr-1" />
      <LoaderIcon v-else-if="status === 'starting' || status === 'stopping'" class="w-3 h-3 mr-1 animate-spin" />
    </template>
    {{ displayStatus }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Badge from '@/components/common/Badge.vue';
import { 
  CheckIcon, 
  XIcon, 
  AlertCircleIcon, 
  LoaderIcon,
} from 'lucide-vue-next';
import type { MCPStatus } from '@/types';

interface Props {
  status: MCPStatus;
  size?: 'sm' | 'md';
  dot?: boolean;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  dot: true,
  showIcon: false,
});

const badgeVariant = computed(() => {
  const variants: Record<MCPStatus, 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'> = {
    running: 'success',
    stopped: 'default',
    error: 'error',
    starting: 'warning',
    stopping: 'warning',
  };
  return variants[props.status] || 'default';
});

const displayStatus = computed(() => {
  return props.status.charAt(0).toUpperCase() + props.status.slice(1);
});
</script>
