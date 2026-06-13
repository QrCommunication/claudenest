<template>
  <div
    class="task-card"
    :class="[task.status, { 'is-dragging': isDragging }]"
    :style="{ '--task-accent': statusColor }"
    draggable="true"
    @dragstart="$emit('dragstart', $event)"
    @click="$emit('click')"
  >
    <!-- Bandeau de couleur (statut) sur le bord gauche -->
    <span class="task-band" aria-hidden="true" />

    <div class="task-body">
      <div class="task-header">
        <div class="task-tags">
          <StatusBadge type="priority" :value="task.priority" />
          <StatusBadge type="status" :value="task.status" dot />
        </div>
        <div class="task-badges">
          <span v-if="task.is_claimed" class="badge claimed" :title="t('projectsTaskcard.claimed')">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </span>
          <span v-if="task.is_blocked" class="badge blocked" :title="t('projectsTaskcard.blocked')">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
            </svg>
          </span>
          <span v-if="task.files?.length" class="badge files" :title="t('projectsTaskcard.hasFiles')">
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

      <!-- Labels en chips -->
      <div v-if="task.labels?.length" class="task-labels">
        <span v-for="label in task.labels" :key="label" class="label-chip">{{ label }}</span>
      </div>

      <div class="task-footer">
        <div class="footer-left">
          <div class="task-assignee" v-if="task.assigned_to">
            <InstanceBadge :instance-id="task.assigned_to" size="sm" />
          </div>
          <div v-else-if="task.status === 'pending'" class="task-unclaimed">
            {{ t('projectsTaskcard.unclaimed') }}
          </div>
          <span v-if="task.story_points != null" class="story-points" :title="t('projectsTaskcard.storyPoints')">
            <svg viewBox="0 0 24 24" fill="currentColor" class="points-icon"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 16.9 5.7 21.4 8 14 2 9.4h7.6z"/></svg>
            {{ task.story_points }} {{ t('projectsTaskcard.points') }}
          </span>
        </div>

        <div class="task-actions" @click.stop>
          <button
            v-if="!task.is_claimed && task.status === 'pending'"
            class="action-btn claim"
            @click="$emit('claim', task.id)"
            :title="t('projectsTaskcard.claimTask')"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>
          <button
            v-if="task.is_claimed && !task.is_completed"
            class="action-btn release"
            @click="$emit('release', task.id)"
            :title="t('projectsTaskcard.releaseTask')"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <button
            v-if="task.is_claimed && !task.is_completed"
            class="action-btn complete"
            @click="$emit('complete', task.id)"
            :title="t('projectsTaskcard.completeTask')"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InstanceBadge from './InstanceBadge.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import type { SharedTask, TaskStatus } from '@/types';

const { t } = useI18n();

interface Props {
  task: SharedTask;
}

const props = defineProps<Props>();

defineEmits<{
  click: [];
  dragstart: [event: DragEvent];
  claim: [taskId: string];
  release: [taskId: string];
  complete: [taskId: string];
}>();

const isDragging = ref(false);

// Couleur sémantique du statut pour le bandeau latéral de la carte.
// (Le mapping couleur des badges eux-mêmes vit dans StatusBadge.vue.)
const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'var(--text-muted)',
  pending: 'var(--text-muted)',
  in_progress: 'var(--accent-purple)',
  blocked: 'var(--status-error)',
  review: 'var(--accent-cyan)',
  done: 'var(--status-success)',
};

const statusColor = computed(() =>
  STATUS_COLORS[props.task.status] ?? 'var(--text-muted)'
);

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
@reference "../../../css/tailwind.css";

.task-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.task-card:hover {
  border-color: color-mix(in srgb, var(--task-accent) 45%, var(--border-color));
  background: color-mix(in srgb, var(--task-accent) 5%, var(--bg-card));
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.2));
}

.task-card.is-dragging {
  opacity: 0.5;
}

.task-card.done {
  opacity: 0.78;
}

/* Bandeau de couleur (statut) sur le bord gauche */
.task-band {
  width: 4px;
  flex-shrink: 0;
  background: var(--task-accent);
}

.task-body {
  flex: 1;
  min-width: 0;
  padding: 0.875rem 1rem;
}

/* ==================== HEADER ==================== */
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

.task-tags {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
  flex-wrap: wrap;
}

/* ----- Badges (claimed/blocked/files) ----- */
.task-badges {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  font-size: 0.6875rem;
  padding: 0.0625rem 0.3125rem;
  border-radius: 0.25rem;
}
.badge svg {
  width: 0.75rem;
  height: 0.75rem;
}
.badge.claimed {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 14%, transparent);
}
.badge.blocked {
  color: var(--status-error);
  background: color-mix(in srgb, var(--status-error) 14%, transparent);
}
.badge.files {
  color: var(--accent-cyan);
  background: color-mix(in srgb, var(--accent-cyan) 14%, transparent);
}

/* ==================== CONTENU ==================== */
.task-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-description {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  margin-bottom: 0.625rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ----- Labels en chips ----- */
.task-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.625rem;
}
.label-chip {
  font-size: 0.625rem;
  font-weight: 500;
  padding: 0.0625rem 0.4375rem;
  border-radius: 999px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--text-muted) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-muted) 22%, transparent);
}

/* ==================== FOOTER ==================== */
.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.task-unclaimed {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-style: italic;
}

.story-points {
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--accent-indigo);
  background: color-mix(in srgb, var(--accent-indigo) 14%, transparent);
  padding: 0.0625rem 0.4375rem;
  border-radius: 0.25rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.points-icon {
  width: 0.6875rem;
  height: 0.6875rem;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}
.action-btn {
  padding: 0.375rem;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  transition: color 0.15s, background-color 0.15s;
}
.action-btn svg {
  width: 1rem;
  height: 1rem;
}
.action-btn.claim:hover {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 12%, transparent);
}
.action-btn.release:hover {
  color: #f97316;
  background: color-mix(in srgb, #f97316 12%, transparent);
}
.action-btn.complete:hover {
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 12%, transparent);
}

/* ==================== TOKENS ==================== */
.task-tokens {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}
.token-bar {
  flex: 1;
  height: 0.25rem;
  background: color-mix(in srgb, var(--text-muted) 20%, transparent);
  border-radius: 999px;
  overflow: hidden;
}
.token-progress {
  height: 100%;
  background: var(--accent-cyan);
  border-radius: 999px;
}
.token-label {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
