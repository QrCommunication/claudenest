<template>
  <div class="epic-board">
    <!-- Header avec bouton d'ajout -->
    <div class="epic-board-header">
      <h3 class="text-sm font-medium text-white/70">{{ t('multiagentEpicboard.epics') }}</h3>
      <button class="add-epic-btn" @click="$emit('create')">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>

    <!-- Liste des épics -->
    <div class="epic-list">
      <div
        v-for="epic in sortedEpics"
        :key="epic.id"
        class="epic-item"
        :class="{ selected: selectedEpicId === epic.id }"
        @click="$emit('select', epic)"
      >
        <div class="epic-header">
          <div class="epic-color" :style="{ backgroundColor: epic.color }" />
          <span class="epic-title">{{ epic.title }}</span>
          <span class="epic-status" :class="epic.status">{{ epic.status }}</span>
        </div>

        <!-- Barre de progression -->
        <div class="epic-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: epic.progress_percentage + '%', backgroundColor: epic.color }"
            />
          </div>
          <span class="progress-text">
            {{ epic.completed_tasks_count }}/{{ epic.tasks_count }}
          </span>
        </div>

        <!-- Priority badge -->
        <div class="epic-meta">
          <span class="priority-badge" :class="epic.priority">{{ epic.priority }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="epics.length === 0" class="epic-empty">
        <p class="text-white/40 text-sm">{{ t('multiagentEpicboard.noEpicsYet') }}</p>
        <button class="text-purple-400 text-sm hover:text-purple-300" @click="$emit('create')">
          {{ t('multiagentEpicboard.createFirstEpic') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

.add-epic-btn {
  color: rgba(255,255,255,0.4);
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.15s;
}
.add-epic-btn:hover {
  color: #a855f7;
  background: rgba(168,85,247,0.1);
}

.epic-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.epic-item {
  padding: 0.625rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: all 0.15s ease;
}
.epic-item:hover {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.1);
}
.epic-item.selected {
  background: rgba(168,85,247,0.08);
  border-color: rgba(168,85,247,0.3);
}

.epic-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.epic-color {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 0.125rem;
  flex-shrink: 0;
}

.epic-title {
  flex: 1;
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}

.epic-status {
  font-size: 0.6875rem;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.epic-status.open { background: rgba(148,163,184,0.15); color: #94a3b8; }
.epic-status.in_progress { background: rgba(168,85,247,0.15); color: #a855f7; }
.epic-status.done { background: rgba(34,197,94,0.15); color: #22c55e; }

.epic-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.375rem;
}

.progress-bar {
  flex: 1;
  height: 0.1875rem;
  background: rgba(255,255,255,0.06);
  border-radius: 0.125rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 0.125rem;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.4);
  font-variant-numeric: tabular-nums;
}

.epic-meta {
  margin-top: 0.25rem;
}

.priority-badge {
  font-size: 0.625rem;
  padding: 0.0625rem 0.25rem;
  border-radius: 0.125rem;
}
.priority-badge.critical { background: rgba(239,68,68,0.15); color: #ef4444; }
.priority-badge.high { background: rgba(249,115,22,0.15); color: #f97316; }
.priority-badge.medium { background: rgba(234,179,8,0.15); color: #eab308; }
.priority-badge.low { background: rgba(148,163,184,0.15); color: #94a3b8; }

.epic-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
}
</style>
