<template>
  <div class="callout" :class="type" role="note">
    <div class="callout-icon" aria-hidden="true">
      <!-- Info -->
      <svg v-if="type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <!-- Warning -->
      <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <!-- Tip -->
      <svg v-else-if="type === 'tip'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18h6"/>
        <path d="M10 22h4"/>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
      </svg>
      <!-- Danger -->
      <svg v-else-if="type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
    <div class="callout-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'info' | 'warning' | 'tip' | 'danger';
}>(), {
  type: 'info',
});
</script>

<style scoped>
.callout {
  display: flex;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  border-left: 3px solid;
  border-radius: 0 6px 6px 0;
  font-size: 0.85rem;
  line-height: 1.6;
}

/* Info (blue) */
.callout.info {
  border-left-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.callout.info .callout-icon {
  color: #3b82f6;
}

/* Warning (amber) */
.callout.warning {
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

.callout.warning .callout-icon {
  color: #f59e0b;
}

/* Tip (green) */
.callout.tip {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.callout.tip .callout-icon {
  color: #22c55e;
}

/* Danger (red) */
.callout.danger {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.callout.danger .callout-icon {
  color: #ef4444;
}

.callout-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 0.1rem;
}

.callout-icon svg {
  width: 18px;
  height: 18px;
}

.callout-content {
  flex: 1;
  min-width: 0;
  color: var(--text-secondary);
}

.callout-content :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.callout-content :deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  padding: 0.1rem 0.3rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
}

.callout-content :deep(a) {
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
}

.callout-content :deep(a:hover) {
  border-bottom-color: #3b82f6;
}
</style>
