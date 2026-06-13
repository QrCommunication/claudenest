<template>
  <div class="task-panel">
    <div class="task-panel-header">
      <h3 class="task-panel-title">{{ t('title') }}</h3>

      <!-- Sprint filter: only meaningful when a project is selected (sprints are
           scoped to a project). Hidden otherwise to avoid an empty selector. -->
      <label v-if="project" class="sprint-filter">
        <span class="sprint-filter-label">{{ t('filterBySprint') }}</span>
        <select v-model="selectedSprintId" class="sprint-filter-select">
          <option :value="ALL">{{ t('allSprints') }}</option>
          <option :value="NONE">{{ t('noSprint') }}</option>
          <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
            {{ sprint.name }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="!project" class="task-panel-empty">
      {{ t('noProject') }}
    </div>

    <div v-else-if="filteredTasks.length === 0" class="task-panel-empty">
      {{ t('empty') }}
    </div>

    <div v-else class="task-panel-list">
      <TaskCard
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        @click="$emit('task-click', task.id)"
        @claim="$emit('claim', $event)"
        @release="$emit('release', $event)"
        @complete="$emit('complete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectsStore } from '@/stores/projects';
import { useTasksStore } from '@/stores/tasks';
import { useSprintsStore } from '@/stores/sprints';
import TaskCard from '@/components/projects/TaskCard.vue';
import type { SharedTask } from '@/types';

// Component-local translations (Composition API local scope) — keeps the panel
// self-contained without touching the shared locale files.
const { t } = useI18n({
  useScope: 'local',
  messages: {
    en: {
      title: 'Tasks',
      filterBySprint: 'Sprint',
      allSprints: 'All',
      noSprint: 'No sprint',
      empty: 'No task matches this sprint.',
      noProject: 'Select a project to view its tasks.',
    },
    fr: {
      title: 'Tâches',
      filterBySprint: 'Sprint',
      allSprints: 'Tous',
      noSprint: 'Sans sprint',
      empty: 'Aucune tâche ne correspond à ce sprint.',
      noProject: 'Sélectionnez un projet pour voir ses tâches.',
    },
  },
});

defineEmits<{
  'task-click': [taskId: string];
  claim: [taskId: string];
  release: [taskId: string];
  complete: [taskId: string];
}>();

// Sentinel filter values that cannot collide with a real sprint UUID.
const ALL = '__all__';
const NONE = '__none__';

const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();
const sprintsStore = useSprintsStore();

const selectedSprintId = ref<string>(ALL);

const project = computed(() => projectsStore.selectedProject);
const tasks = computed<SharedTask[]>(() => tasksStore.tasks);
const sprints = computed(() => sprintsStore.sprints);

// Reactive filtering on sprint_id: ALL keeps everything, NONE keeps backlog
// tasks (sprint_id === null), a UUID keeps that sprint's tasks.
const filteredTasks = computed<SharedTask[]>(() => {
  if (selectedSprintId.value === ALL) {
    return tasks.value;
  }
  if (selectedSprintId.value === NONE) {
    return tasks.value.filter(task => !task.sprint_id);
  }
  return tasks.value.filter(task => task.sprint_id === selectedSprintId.value);
});

async function loadForProject(projectId: string): Promise<void> {
  // Best-effort parallel load; failures surface via the stores' own error state.
  await Promise.allSettled([
    tasksStore.fetchTasks(projectId),
    sprintsStore.fetchSprints(projectId),
  ]);
}

// Reset the filter and reload whenever the selected project changes, so a stale
// sprint id from a previous project never hides the new project's tasks.
watch(
  () => project.value?.id,
  (projectId) => {
    selectedSprintId.value = ALL;
    if (projectId) {
      void loadForProject(projectId);
    }
  },
);

onMounted(() => {
  if (project.value?.id) {
    void loadForProject(project.value.id);
  }
});
</script>

<style scoped>
.task-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  min-height: 0;
}

.task-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.task-panel-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-text, #e5e7eb));
}

.sprint-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.sprint-filter-label {
  color: var(--text-secondary, #9ca3af);
}

.sprint-filter-select {
  appearance: auto;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent));
  background: var(--bg-card, var(--surface-2, #24283b));
  color: var(--text-primary, #e5e7eb);
  font-size: 0.8rem;
  cursor: pointer;
}

.sprint-filter-select:focus-visible {
  outline: 2px solid var(--accent-purple, #a855f7);
  outline-offset: 1px;
}

.task-panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  min-height: 0;
}

.task-panel-empty {
  padding: 1.25rem 0.75rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary, #9ca3af);
}
</style>
