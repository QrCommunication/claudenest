<template>
  <div 
    class="instance-card"
    :class="[instance.status, { 'is-available': instance.is_available }]"
  >
    <div class="card-header">
      <div class="instance-status-indicator" :class="instance.status" />
      <div class="instance-info">
        <h4 class="instance-id">{{ truncatedId }}</h4>
        <span class="instance-status">{{ instance.status }}</span>
      </div>
      <div class="instance-uptime" v-if="instance.uptime">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        {{ formatDuration(instance.uptime) }}
      </div>
    </div>

    <div class="card-body">
      <!-- Context Usage -->
      <div class="metric">
        <div class="metric-header">
          <span class="metric-label">Context</span>
          <span class="metric-value" :class="{ 'is-high': instance.context_usage_percent > 80 }">
            {{ Math.round(instance.context_usage_percent) }}%
          </span>
        </div>
        <div class="metric-bar">
          <div 
            class="metric-progress" 
            :style="{ width: `${instance.context_usage_percent}%` }"
            :class="{ 'is-high': instance.context_usage_percent > 80 }"
          />
        </div>
      </div>

      <!-- Tasks Completed -->
      <div class="stat-row">
        <div class="stat">
          <span class="stat-label">Tasks</span>
          <span class="stat-value">{{ instance.tasks_completed }}</span>
        </div>
        <div class="stat" v-if="instance.current_task">
          <span class="stat-label">Current</span>
          <router-link 
            :to="{ name: 'projects.tasks', params: { id: projectId }, query: { task: instance.current_task.id } }"
            class="stat-link"
          >
            {{ truncate(instance.current_task.title, 20) }}
          </router-link>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="connection-status" :class="{ 'is-connected': instance.is_connected }">
        <span class="status-dot" />
        {{ instance.is_connected ? 'Connected' : 'Disconnected' }}
      </div>
      
      <div class="availability-badge" :class="{ 'is-available': instance.is_available }">
        {{ instance.is_available ? 'Available' : 'Busy' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ClaudeInstance } from '@/types';

interface Props {
  instance: ClaudeInstance;
  projectId: string;
}

const props = defineProps<Props>();

const truncatedId = computed(() => {
  return props.instance.id.slice(0, 8) + '...';
});

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
</script>

<style scoped>
.instance-card {
  @apply bg-surface-2 rounded-xl border border-skin p-4 transition-all duration-200;
}

.instance-card:hover {
  @apply border-surface-3;
}

.instance-card.active {
  @apply border-green-500/30;
}

.instance-card.idle {
  @apply border-blue-500/30;
}

.instance-card.busy {
  @apply border-brand-purple/30;
}

.instance-card.is-available {
  @apply ring-1 ring-green-500/20;
}

.card-header {
  @apply flex items-center gap-3 mb-4;
}

.instance-status-indicator {
  @apply w-3 h-3 rounded-full flex-shrink-0;
}

.instance-status-indicator.active {
  @apply bg-green-500;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.instance-status-indicator.idle {
  @apply bg-blue-500;
}

.instance-status-indicator.busy {
  @apply bg-brand-purple;
}

.instance-status-indicator.disconnected {
  @apply bg-gray-500;
}

.instance-info {
  @apply flex-1 min-w-0;
}

.instance-id {
  @apply text-sm font-medium text-skin-primary font-mono;
}

.instance-status {
  @apply text-xs text-skin-secondary capitalize;
}

.instance-uptime {
  @apply flex items-center gap-1 text-xs text-skin-secondary;
}

.instance-uptime svg {
  @apply w-4 h-4;
}

.card-body {
  @apply space-y-4 mb-4;
}

.metric {
  @apply space-y-2;
}

.metric-header {
  @apply flex items-center justify-between;
}

.metric-label {
  @apply text-xs text-skin-secondary;
}

.metric-value {
  @apply text-sm font-medium text-skin-primary;
}

.metric-value.is-high {
  @apply text-red-400;
}

.metric-bar {
  @apply h-1.5 bg-surface-3 rounded-full overflow-hidden;
}

.metric-progress {
  @apply h-full bg-gradient-to-r from-brand-purple to-brand-indigo rounded-full transition-all duration-300;
}

.metric-progress.is-high {
  @apply bg-gradient-to-r from-orange-500 to-red-500;
}

.stat-row {
  @apply flex items-center gap-4;
}

.stat {
  @apply flex items-center gap-2;
}

.stat-label {
  @apply text-xs text-skin-secondary;
}

.stat-value {
  @apply text-sm font-medium text-skin-primary;
}

.stat-link {
  @apply text-sm text-brand-purple hover:underline truncate max-w-[120px];
}

.card-footer {
  @apply flex items-center justify-between pt-3 border-t border-skin;
}

.connection-status {
  @apply flex items-center gap-1.5 text-xs text-skin-secondary;
}

.connection-status.is-connected {
  @apply text-green-400;
}

.status-dot {
  @apply w-2 h-2 rounded-full bg-skin-muted;
}

.connection-status.is-connected .status-dot {
  @apply bg-green-500;
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
}

.availability-badge {
  @apply px-2 py-0.5 rounded text-xs font-medium;
  @apply bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400;
}

.availability-badge.is-available {
  @apply bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400;
}
</style>
