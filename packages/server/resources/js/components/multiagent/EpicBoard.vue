<template>
  <div class="epic-board">
    <!-- Header avec bouton d'ajout -->
    <div class="epic-board-header">
      <h3 class="epic-board-title">{{ t('multiagentEpicboard.epics') }}</h3>
      <button class="add-epic-btn" :title="t('multiagentEpicboard.createFirstEpic')" @click="$emit('create')">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    </div>

    <!-- Liste des épics -->
    <div class="epic-list">
      <div
        v-for="epic in sortedEpics"
        :key="epic.id"
        class="epic-card"
        :class="{ selected: selectedEpicId === epic.id, 'is-done': epic.status === 'done' }"
        :style="{ '--epic-color': epic.color || 'var(--accent-purple)' }"
        @click="$emit('select', epic)"
      >
        <!-- Bandeau de couleur (côté gauche) -->
        <span class="epic-band" aria-hidden="true" />

        <div class="epic-body">
          <!-- Ligne titre : icône + titre + statut -->
          <div class="epic-header">
            <span class="epic-icon">
              <template v-if="epic.icon">{{ epic.icon }}</template>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h12v2H3v-2z" /></svg>
            </span>
            <span class="epic-title">{{ epic.title }}</span>
            <StatusBadge type="status" :value="epic.status" />
          </div>

          <!-- Barre de progression -->
          <div class="epic-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: clampPercent(epic.progress_percentage) + '%' }"
              />
            </div>
            <span class="progress-percent">{{ Math.round(clampPercent(epic.progress_percentage)) }}%</span>
          </div>

          <!-- Méta : compteur de tâches + priorité -->
          <div class="epic-meta">
            <span class="task-count">
              <svg viewBox="0 0 24 24" fill="currentColor" class="task-count-icon"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              {{ epic.completed_tasks_count }}/{{ epic.tasks_count }} {{ t('multiagentEpicboard.tasks') }}
            </span>
            <StatusBadge type="priority" :value="epic.priority" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="epics.length === 0" class="epic-empty">
        <p class="epic-empty-text">{{ t('multiagentEpicboard.noEpicsYet') }}</p>
        <button class="epic-empty-btn" @click="$emit('create')">
          {{ t('multiagentEpicboard.createFirstEpic') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StatusBadge from '@/components/common/StatusBadge.vue';
import type { Epic } from '@/types/multiagent';

const { t } = useI18n();

interface Props {
  epics: Epic[];
  selectedEpicId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedEpicId: '',
});

defineEmits<{
  select: [epic: Epic];
  create: [];
  update: [epicId: string, data: Partial<Epic>];
  delete: [epicId: string];
}>();

const sortedEpics = computed(() =>
  [...props.epics].sort((a, b) => a.sort_order - b.sort_order)
);

const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, value ?? 0));
</script>

<style scoped>
.epic-board {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.epic-board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.epic-board-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.add-epic-btn {
  color: var(--text-muted);
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: color 0.15s, background-color 0.15s;
}
.add-epic-btn:hover {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 12%, transparent);
}

.epic-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

/* ====================== CARTE EPIC ====================== */

.epic-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.epic-card:hover {
  border-color: color-mix(in srgb, var(--epic-color) 45%, var(--border-color));
  background: color-mix(in srgb, var(--epic-color) 5%, var(--bg-card));
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.epic-card.selected {
  border-color: var(--epic-color);
  background: color-mix(in srgb, var(--epic-color) 10%, var(--bg-card));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--epic-color) 40%, transparent);
}
.epic-card.is-done {
  opacity: 0.78;
}

/* Bandeau de couleur sur le bord gauche */
.epic-band {
  width: 4px;
  flex-shrink: 0;
  background: var(--epic-color);
}

.epic-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
}

/* ----- Ligne titre ----- */
.epic-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.epic-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1;
  color: var(--epic-color);
  background: color-mix(in srgb, var(--epic-color) 16%, transparent);
}
.epic-icon svg {
  width: 0.875rem;
  height: 0.875rem;
}

.epic-title {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ----- Barre de progression ----- */
.epic-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 0.375rem;
  background: color-mix(in srgb, var(--text-muted) 22%, transparent);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--epic-color);
  transition: width 0.4s ease;
}

.progress-percent {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 2.25rem;
  text-align: right;
}

/* ----- Méta ----- */
.epic-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.task-count {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.task-count-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--status-success);
}

/* ----- Empty state ----- */
.epic-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
}
.epic-empty-text {
  font-size: 0.8125rem;
  color: var(--text-muted);
}
.epic-empty-btn {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--accent-purple);
  transition: color 0.15s;
}
.epic-empty-btn:hover {
  color: color-mix(in srgb, var(--accent-purple) 80%, white);
}
</style>
