<template>
  <div class="sprint-detail">
    <!-- Empty state : aucun sprint sélectionné -->
    <div v-if="!sprint" class="sd-empty">
      <svg class="sd-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <p class="sd-empty-text">{{ t('multiagentSprintdetail.noSprintSelected') }}</p>
    </div>

    <template v-else>
      <!-- ==================== EN-TÊTE ==================== -->
      <header class="sd-header">
        <div class="sd-title-row">
          <h3 class="sd-name">{{ sprint.name }}</h3>
          <StatusBadge type="status" :value="sprint.status" />
        </div>
        <p v-if="sprint.goal" class="sd-goal">{{ sprint.goal }}</p>
      </header>

      <!-- ==================== MÉTRIQUES ==================== -->
      <div class="sd-metrics">
        <!-- Dates -->
        <div class="sd-metric">
          <span class="sd-metric-label">{{ t('multiagentSprintdetail.dates') }}</span>
          <span class="sd-metric-value sd-dates">
            <span>{{ formatDate(sprint.start_date) }}</span>
            <span class="sd-date-arrow">→</span>
            <span :class="{ 'sd-overdue': sprint.is_overdue }">{{ formatDate(sprint.end_date) }}</span>
          </span>
        </div>

        <!-- Jours restants -->
        <div class="sd-metric">
          <span class="sd-metric-label">{{ t('multiagentSprintdetail.daysLeft') }}</span>
          <span class="sd-metric-value" :class="{ 'sd-overdue': sprint.is_overdue }">
            {{ sprint.remaining_days ?? '—' }}
          </span>
        </div>

        <!-- Capacité / Vélocité (story points) -->
        <div class="sd-metric">
          <span class="sd-metric-label">{{ t('multiagentSprintdetail.velocityCapacity') }}</span>
          <span class="sd-metric-value sd-points">
            <span class="sd-points-done">{{ sprint.completed_story_points }}</span>
            <span class="sd-points-sep">/</span>
            <span class="sd-points-total">{{ capacityDisplay }}</span>
            <span class="sd-points-unit">{{ t('multiagentSprintdetail.pts') }}</span>
          </span>
        </div>

        <!-- Compteurs tâches done / remaining -->
        <div class="sd-metric">
          <span class="sd-metric-label">{{ t('multiagentSprintdetail.tasks') }}</span>
          <span class="sd-metric-value sd-task-counts">
            <span class="sd-count-done">{{ sprint.completed_tasks_count }} {{ t('multiagentSprintdetail.done') }}</span>
            <span class="sd-count-sep">·</span>
            <span class="sd-count-remaining">{{ remainingCount }} {{ t('multiagentSprintdetail.remaining') }}</span>
          </span>
        </div>
      </div>

      <!-- ==================== BARRE DE PROGRESSION ==================== -->
      <div class="sd-progress">
        <div class="sd-progress-bar">
          <div class="sd-progress-fill" :style="{ width: clampPercent(sprint.progress_percentage) + '%' }" />
        </div>
        <span class="sd-progress-percent">{{ Math.round(clampPercent(sprint.progress_percentage)) }}%</span>
      </div>

      <!-- ==================== LISTE DES TÂCHES PAR STATUT ==================== -->
      <div class="sd-tasks">
        <!-- Aucune tâche -->
        <div v-if="totalTasks === 0" class="sd-tasks-empty">
          <p class="sd-tasks-empty-text">{{ t('multiagentSprintdetail.noTasks') }}</p>
        </div>

        <section v-for="group in taskGroups" v-else :key="group.status" class="sd-group">
          <div class="sd-group-header">
            <StatusBadge type="status" :value="group.status" :dot="true" />
            <span class="sd-group-count">{{ group.tasks.length }}</span>
          </div>

          <ul class="sd-task-list">
            <li v-for="task in group.tasks" :key="task.id" class="sd-task">
              <span class="sd-task-title" :title="task.title">{{ task.title }}</span>

              <div class="sd-task-meta">
                <span v-if="task.story_points != null" class="sd-task-points" :title="t('multiagentSprintdetail.storyPoints')">
                  {{ task.story_points }} {{ t('multiagentSprintdetail.pts') }}
                </span>
                <StatusBadge type="priority" :value="task.priority" />
                <span v-if="task.assigned_to" class="sd-task-assignee" :title="task.assigned_to">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="sd-assignee-icon" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" /></svg>
                  {{ shortAssignee(task.assigned_to) }}
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StatusBadge from '@/components/common/StatusBadge.vue';
import type { Sprint, SprintTask, TaskStatus } from '@/types/multiagent';

const { t } = useI18n();

interface Props {
  sprint: Sprint | null;
}

const props = defineProps<Props>();

/**
 * Display order for status groups — workflow-oriented (active work first,
 * done last). Only statuses with at least one task are rendered.
 */
const STATUS_ORDER: TaskStatus[] = [
  'in_progress',
  'review',
  'blocked',
  'pending',
  'backlog',
  'done',
];

const tasks = computed<SprintTask[]>(() => props.sprint?.tasks ?? []);

const totalTasks = computed(() => tasks.value.length);

/** Group tasks by status, keeping only non-empty groups in workflow order. */
const taskGroups = computed(() => {
  const buckets = new Map<TaskStatus, SprintTask[]>();
  for (const task of tasks.value) {
    const list = buckets.get(task.status) ?? [];
    list.push(task);
    buckets.set(task.status, list);
  }
  return STATUS_ORDER
    .filter(status => buckets.has(status))
    .map(status => ({ status, tasks: buckets.get(status)! }));
});

/**
 * Remaining = server-provided scopeRemaining count when available, else a
 * local fallback (total - done) so the counter still renders without the
 * enriched detail payload.
 */
const remainingCount = computed(() => {
  if (props.sprint?.remaining_tasks_count != null) {
    return props.sprint.remaining_tasks_count;
  }
  const s = props.sprint;
  if (!s) return 0;
  return Math.max(0, s.tasks_count - s.completed_tasks_count);
});

const capacityDisplay = computed(() => props.sprint?.capacity ?? props.sprint?.total_story_points ?? 0);

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value ?? 0));

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Truncate long instance IDs to keep the assignee chip compact. */
function shortAssignee(id: string): string {
  return id.length > 14 ? `${id.slice(0, 12)}…` : id;
}
</script>

<style scoped>
.sprint-detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 1rem;
}

/* ==================== EMPTY ==================== */
.sd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
}
.sd-empty-icon {
  width: 32px;
  height: 32px;
  color: var(--text-disabled);
}
.sd-empty-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

/* ==================== HEADER ==================== */
.sd-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sd-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sd-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sd-goal {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

/* ==================== METRICS ==================== */
.sd-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.625rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}
.sd-metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.sd-metric-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.sd-metric-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.sd-overdue {
  color: var(--status-error);
}

.sd-dates {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.sd-date-arrow {
  color: var(--text-disabled);
}

.sd-points {
  display: inline-flex;
  align-items: baseline;
  gap: 0.2rem;
}
.sd-points-done {
  color: var(--accent-purple);
  font-size: 1rem;
}
.sd-points-sep {
  color: var(--text-disabled);
}
.sd-points-total {
  color: var(--text-muted);
  font-weight: 500;
}
.sd-points-unit {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
}

.sd-task-counts {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 500;
}
.sd-count-done {
  color: var(--status-success);
}
.sd-count-sep {
  color: var(--text-disabled);
}
.sd-count-remaining {
  color: var(--text-secondary);
}

/* ==================== PROGRESS ==================== */
.sd-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sd-progress-bar {
  flex: 1;
  height: 0.4rem;
  background: color-mix(in srgb, var(--text-muted) 20%, transparent);
  border-radius: 999px;
  overflow: hidden;
}
.sd-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent-purple);
  transition: width 0.4s ease;
}
.sd-progress-percent {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 2.25rem;
  text-align: right;
}

/* ==================== TASK GROUPS ==================== */
.sd-tasks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.sd-tasks-empty {
  padding: 1.5rem 1rem;
  text-align: center;
}
.sd-tasks-empty-text {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
}

.sd-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.sd-group-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.sd-group-count {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--text-muted) 14%, transparent);
  border-radius: 999px;
  padding: 0.05rem 0.4rem;
  font-variant-numeric: tabular-nums;
}

.sd-task-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.sd-task {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: border-color 0.15s, background 0.15s;
}
.sd-task:hover {
  border-color: color-mix(in srgb, var(--accent-purple) 35%, var(--border-color));
  background: color-mix(in srgb, var(--accent-purple) 4%, var(--bg-card));
}
.sd-task-title {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sd-task-meta {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}
.sd-task-points {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--accent-cyan);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.sd-task-assignee {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.65rem;
  color: var(--text-muted);
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sd-assignee-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  opacity: 0.7;
}
</style>
