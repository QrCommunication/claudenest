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
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.method-badge.post {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.method-badge.put {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.method-badge.patch {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.method-badge.delete {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.method-badge.default {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}
</style>
