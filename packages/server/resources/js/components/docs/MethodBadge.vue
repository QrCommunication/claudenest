<template>
  <span class="method-badge" :class="methodClass">
    {{ method }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
}

const props = defineProps<Props>();

const methodClass = computed(() => {
  const classes: Record<string, string> = {
    'GET': 'get',
    'POST': 'post',
    'PUT': 'put',
    'PATCH': 'patch',
    'DELETE': 'delete',
  };
  return classes[props.method.toUpperCase()] || 'default';
});
</script>

<style scoped>
.method-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.method-badge.get {
  background: color-mix(in srgb, var(--status-success, #22c55e) 20%, transparent);
  color: var(--status-success-light, #4ade80);
}

.method-badge.post {
  background: color-mix(in srgb, var(--accent-blue, #3b82f6) 20%, transparent);
  color: var(--accent-blue-light, #60a5fa);
}

.method-badge.put {
  background: color-mix(in srgb, var(--status-warning, #f59e0b) 20%, transparent);
  color: var(--status-warning-light, #fbbf24);
}

.method-badge.patch {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple-light, #c084fc);
}

.method-badge.delete {
  background: color-mix(in srgb, var(--status-error, #ef4444) 20%, transparent);
  color: var(--status-error-light, #f87171);
}

.method-badge.default {
  background: color-mix(in srgb, var(--text-muted) 20%, transparent);
  color: var(--text-secondary);
}
</style>
