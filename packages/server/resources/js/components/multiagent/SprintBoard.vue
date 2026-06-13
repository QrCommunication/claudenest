<template>
  <div class="sprint-board">
    <!-- Sprint header avec métriques -->
    <div v-if="sprint" class="sprint-header">
      <div class="sprint-info">
        <h3 class="sprint-name">{{ sprint.name }}</h3>
        <span v-if="sprint.goal" class="sprint-goal">{{ sprint.goal }}</span>
      </div>

      <div class="sprint-metrics">
        <!-- Story points -->
        <div class="metric">
          <div class="metric-points">
            <span class="metric-value">{{ sprint.completed_story_points }}</span>
            <span class="metric-separator">/</span>
            <span class="metric-total">{{ sprint.total_story_points }}</span>
            <span class="metric-label">{{ t('multiagentSprintboard.pts') }}</span>
          </div>
        </div>

        <!-- Remaining days -->
        <div class="metric">
          <span
            class="metric-value"
            :class="{ 'overdue': sprint.is_overdue }"
          >{{ sprint.remaining_days ?? '—' }}</span>
          <span class="metric-label">{{ t('multiagentSprintboard.daysLeft') }}</span>
        </div>

        <!-- Progress ring -->
        <div class="metric">
          <div class="progress-ring">
            <svg viewBox="0 0 36 36" class="ring-svg">
              <path
                class="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                class="ring-fill"
                :stroke-dasharray="`${sprint.progress_percentage}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span class="ring-text">{{ Math.round(sprint.progress_percentage) }}%</span>
          </div>
        </div>
      </div>

      <div class="sprint-dates">
        <span class="date-value">{{ formatDate(sprint.start_date) }}</span>
        <span class="date-arrow">→</span>
        <span class="date-value" :class="{ 'overdue': sprint.is_overdue }">
          {{ formatDate(sprint.end_date) }}
        </span>
        <button
          v-if="sprint.status === 'active'"
          class="complete-sprint-btn"
          @click="$emit('complete-sprint')"
        >
          {{ t('multiagentSprintboard.completeSprint') }}
        </button>
      </div>
    </div>

    <!-- No active sprint -->
    <div v-else class="no-sprint">
      <svg class="no-sprint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <p class="no-sprint-text">{{ t('multiagentSprintboard.noActiveSprint') }}</p>
      <button class="start-sprint-btn" @click="$emit('create-sprint')">
        {{ t('multiagentSprintboard.startNewSprint') }}
      </button>
    </div>

    <!-- Tasks slot -->
    <div class="sprint-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Sprint } from '@/types';

const { t } = useI18n();

interface Props {
  sprint: Sprint | null;
}

defineProps<Props>();

defineEmits<{
  'create-sprint': [];
  'complete-sprint': [];
}>();

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}
</script>

<style scoped>
.sprint-board {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

/* ==================== SPRINT HEADER ==================== */

.sprint-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.sprint-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.sprint-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sprint-goal {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==================== METRICS ROW ==================== */

.sprint-metrics {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.metric-points {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.metric-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #a855f7;
  line-height: 1;
}

.metric-value.overdue {
  color: #ef4444;
}

.metric-separator {
  font-size: 0.85rem;
  color: var(--text-disabled);
  line-height: 1;
}

.metric-total {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1;
}

.metric-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 1px;
}

/* ==================== PROGRESS RING ==================== */

.progress-ring {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-svg {
  width: 36px;
  height: 36px;
  transform: rotate(-90deg);
  position: absolute;
  inset: 0;
}

.ring-bg {
  fill: none;
  stroke: var(--border-color);
  stroke-width: 3;
}

.ring-fill {
  fill: none;
  stroke: #a855f7;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.ring-text {
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--text-secondary);
  position: relative;
  z-index: 1;
  line-height: 1;
}

/* ==================== DATES ==================== */

.sprint-dates {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
}

.date-value {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.date-value.overdue {
  color: #ef4444;
}

.date-arrow {
  font-size: 0.7rem;
  color: var(--text-disabled);
}

.complete-sprint-btn {
  margin-left: 8px;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.complete-sprint-btn:hover {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.08);
  border-color: rgba(168, 85, 247, 0.3);
}

/* ==================== NO SPRINT ==================== */

.no-sprint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
}

.no-sprint-icon {
  width: 32px;
  height: 32px;
  color: var(--text-disabled);
}

.no-sprint-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.start-sprint-btn {
  font-size: 0.78rem;
  color: #a855f7;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}

.start-sprint-btn:hover {
  background: rgba(168, 85, 247, 0.1);
}

/* ==================== SPRINT BODY ==================== */

.sprint-body {
  flex: 1;
  min-height: 0;
}
</style>
