<template>
  <div 
    class="task-card"
    :class="[task.status, { 'is-dragging': isDragging }]"
    draggable="true"
    @dragstart="$emit('dragstart', $event)"
    @click="$emit('click')"
  >
    <div class="task-header">
      <span class="task-priority" :class="task.priority">{{ task.priority }}</span>
      <div class="task-badges">
        <span v-if="task.is_claimed" class="badge claimed" title="Claimed">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </span>
        <span v-if="task.is_blocked" class="badge blocked" title="Blocked">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
          </svg>
        </span>
        <span v-if="task.files?.length" class="badge files" title="Has files">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          {{ task.files.length }}
        </span>
      </div>
    </div>

    <h4 class="task-title">{{ task.title }}</h4>
    
    <p v-if="task.description" class="task-description">
      {{ truncate(task.description, 100) }}
    </p>

    <div class="task-footer">
      <div class="task-assignee" v-if="task.assigned_to">
        <InstanceBadge :instance-id="task.assigned_to" size="sm" />
      </div>
      <div v-else-if="task.status === 'pending'" class="task-unclaimed">
        Unclaimed
      </div>
      
      <div class="task-actions" @click.stop>
        <button 
          v-if="!task.is_claimed && task.status === 'pending'"
          class="action-btn claim"
          @click="$emit('claim', task.id)"
          title="Claim task"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
        <button 
          v-if="task.is_claimed && !task.is_completed"
          class="action-btn release"
          @click="$emit('release', task.id)"
          title="Release task"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <button 
          v-if="task.is_claimed && !task.is_completed"
          class="action-btn complete"
          @click="$emit('complete', task.id)"
          title="Complete task"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="task.estimated_tokens" class="task-tokens">
      <div class="token-bar">
        <div 
          class="token-progress" 
          :style="{ width: `${Math.min(100, (task.estimated_tokens / 8000) * 100)}%` }"
        />
      </div>
      <span class="token-label">~{{ formatTokens(task.estimated_tokens) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import InstanceBadge from './InstanceBadge.vue';
import type { SharedTask } from '@/types';

interface Props {
  task: SharedTask;
}

defineProps<Props>();

defineEmits<{
  click: [];
  dragstart: [event: DragEvent];
  claim: [taskId: string];
  release: [taskId: string];
  complete: [taskId: string];
}>();

const isDragging = ref(false);

function truncate(text: string, length: number): string {
  if (!text || text.length <= length) return text || '';
  return text.slice(0, length) + '...';
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}
</script>

<style scoped>
.task-card {
  @apply p-4 bg-surface-3 rounded-lg border border-skin cursor-pointer;
  @apply hover:border-brand-purple/50 transition-all duration-200;
  @apply hover:shadow-lg hover:shadow-brand-purple/5;
}

.task-card.is-dragging {
  @apply opacity-50;
}

.task-card.done {
  @apply opacity-75;
}

.task-card.blocked {
  @apply border-red-500/30;
}

.task-header {
  @apply flex items-center justify-between mb-3;
}

.task-priority {
  @apply text-xs font-medium px-2 py-0.5 rounded uppercase;
}

.task-priority.critical {
  @apply bg-red-500/10 text-red-400;
}

.task-priority.high {
  @apply bg-orange-500/10 text-orange-400;
}

.task-priority.medium {
  @apply bg-yellow-500/10 text-yellow-400;
}

.task-priority.low {
  @apply bg-gray-500/10 text-gray-400;
}

.task-badges {
  @apply flex items-center gap-1;
}

.badge {
  @apply flex items-center gap-1 text-xs px-1.5 py-0.5 rounded;
}

.badge svg {
  @apply w-3 h-3;
}

.badge.claimed {
  @apply bg-brand-purple/10 text-brand-purple;
}

.badge.blocked {
  @apply bg-red-500/10 text-red-400;
}

.badge.files {
  @apply bg-blue-500/10 text-blue-400;
}

.task-title {
  @apply text-sm font-medium text-skin-primary mb-2 line-clamp-2;
}

.task-description {
  @apply text-xs text-skin-secondary mb-3 line-clamp-2;
}

.task-footer {
  @apply flex items-center justify-between;
}

.task-unclaimed {
  @apply text-xs text-skin-muted italic;
}

.task-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded text-skin-secondary hover:text-skin-primary transition-colors;
}

.action-btn svg {
  @apply w-4 h-4;
}

.action-btn.claim:hover {
  @apply text-brand-purple bg-brand-purple/10;
}

.action-btn.release:hover {
  @apply text-orange-400 bg-orange-500/10;
}

.action-btn.complete:hover {
  @apply text-green-400 bg-green-500/10;
}

.task-tokens {
  @apply flex items-center gap-2 mt-3 pt-3 border-t border-skin;
}

.token-bar {
  @apply flex-1 h-1 bg-surface-4 rounded-full overflow-hidden;
}

.token-progress {
  @apply h-full bg-brand-cyan rounded-full;
}

.token-label {
  @apply text-xs text-skin-secondary;
}
</style>
