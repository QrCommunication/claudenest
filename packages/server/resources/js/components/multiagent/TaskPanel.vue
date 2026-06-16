<template>
  <div class="task-panel">
    <div class="task-panel-header">
      <div class="task-panel-heading">
        <h3 class="task-panel-title">{{ t('title') }}</h3>
        <!-- Remaining counter: mirrors SharedTask::scopeRemaining via the store
             getter (never counts done tasks nor tasks of a completed/cancelled
             sprint) and updates in real time on claim/complete broadcasts. -->
        <span v-if="project || allProjects" class="task-panel-remaining" :title="t('remainingTitle')">
          {{ t('remaining', { count: remainingCount }) }}
        </span>
      </div>

      <!-- Sprint filter (single-project mode only): sprints are project-scoped,
           so it is hidden in all-projects mode and when no project is selected. -->
      <label v-if="project && !allProjects" class="sprint-filter">
        <span class="sprint-filter-label">{{ t('filterBySprint') }}</span>
        <select v-model="selectedSprintId" class="sprint-filter-select">
          <option :value="ALL">{{ t('allSprints') }}</option>
          <option :value="NONE">{{ t('noSprint') }}</option>
          <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
            {{ sprint.name }}
          </option>
        </select>
      </label>

      <!-- Project filter (all-projects mode): narrows the cross-project list to
           a single owned project, mapped to the server-side ?project_id param. -->
      <label v-else-if="allProjects" class="sprint-filter">
        <span class="sprint-filter-label">{{ t('filterByProject') }}</span>
        <select v-model="selectedProjectId" class="sprint-filter-select">
          <option :value="ALL">{{ t('allProjectsLabel') }}</option>
          <option v-for="p in allProjectsList" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </label>
    </div>

    <!-- No-project placeholder: only in single-project mode. All-projects mode
         never needs a selected project. -->
    <div v-if="!project && !allProjects" class="task-panel-empty">
      {{ t('noProject') }}
    </div>

    <div v-else-if="displayTasks.length === 0" class="task-panel-empty">
      {{ allProjects ? t('emptyAll') : t('empty') }}
    </div>

    <!-- All-projects mode: group the cross-project tasks under a project header
         (each task carries its project_id). -->
    <div v-else-if="allProjects" class="task-panel-list">
      <div v-for="group in groupedByProject" :key="group.id" class="task-group">
        <div class="task-group-header">{{ group.name }}</div>
        <TaskCard
          v-for="task in group.tasks"
          :key="task.id"
          :task="task"
          @click="$emit('task-click', task.id)"
          @claim="$emit('claim', $event)"
          @release="$emit('release', $event)"
          @complete="$emit('complete', $event)"
        />
      </div>
    </div>

    <!-- Single-project mode: flat sprint-filtered list. -->
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
import { ref, computed, watch } from 'vue';
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
      emptyAll: 'No tasks across your projects.',
      noProject: 'Select a project to view its tasks.',
      filterByProject: 'Project',
      allProjectsLabel: 'All projects',
      unknownProject: 'Unknown project',
      remaining: '{count} remaining',
      remainingTitle: 'Tasks left to do (excludes done tasks and tasks of completed sprints)',
    },
    fr: {
      title: 'Tâches',
      filterBySprint: 'Sprint',
      allSprints: 'Tous',
      noSprint: 'Sans sprint',
      empty: 'Aucune tâche ne correspond à ce sprint.',
      emptyAll: 'Aucune tâche dans vos projets.',
      noProject: 'Sélectionnez un projet pour voir ses tâches.',
      filterByProject: 'Projet',
      allProjectsLabel: 'Tous les projets',
      unknownProject: 'Projet inconnu',
      remaining: '{count} restantes',
      remainingTitle: 'Tâches restant à faire (exclut les tâches terminées et celles des sprints terminés)',
    },
  },
});

interface Props {
  /**
   * All-projects mode: ignore the selected project and list tasks across every
   * active project the user owns (via tasksStore.fetchAllTasks). The sprint
   * filter is replaced by a project filter and tasks are grouped by project.
   */
  allProjects?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  allProjects: false,
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
// All-projects mode: ALL = every project, a UUID = narrow to that project.
const selectedProjectId = ref<string>(ALL);

const project = computed(() => projectsStore.selectedProject);
const tasks = computed<SharedTask[]>(() => tasksStore.tasks);
const sprints = computed(() => sprintsStore.sprints);
const allProjects = computed(() => props.allProjects);
const allProjectsList = computed(() => projectsStore.projects);

// Remaining counter sourced from the store getter (scopeRemaining mirror,
// real-time reactive). `?? 0` guards against partial store mocks in tests.
const remainingCount = computed<number>(() => tasksStore.remainingTasksCount ?? 0);

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

// Tasks rendered in the current mode — drives the empty-state check.
const displayTasks = computed<SharedTask[]>(() =>
  allProjects.value ? tasks.value : filteredTasks.value
);

// All-projects mode: group the cross-project task list by project. The
// server already narrowed to the user's active projects (and optionally a
// single project), so we just bucket what we received and resolve names from
// the projects store (fallback for a project not present in the list).
const groupedByProject = computed(() => {
  const groups = new Map<string, { id: string; name: string; tasks: SharedTask[] }>();
  for (const task of tasks.value) {
    let group = groups.get(task.project_id);
    if (!group) {
      const proj = allProjectsList.value.find(p => p.id === task.project_id);
      group = { id: task.project_id, name: proj?.name ?? t('unknownProject'), tasks: [] };
      groups.set(task.project_id, group);
    }
    group.tasks.push(task);
  }
  return [...groups.values()];
});

// Map the selected filter to the server-side query param honored by
// TaskController::index. ALL -> no param (default visibility: in-progress tasks
// + tasks completed today). NONE -> ?sprint_id=none (whole backlog, bypassing
// default visibility). A UUID -> ?sprint_id=<uuid> (that sprint's full task set,
// also bypassing default visibility). Returning undefined keeps the default view.
function sprintFilterParams(): { sprint_id?: string } | undefined {
  if (selectedSprintId.value === ALL) {
    return undefined;
  }
  if (selectedSprintId.value === NONE) {
    return { sprint_id: 'none' };
  }
  return { sprint_id: selectedSprintId.value };
}

// Quiet best-effort: errors surface via the store's own error state.
function reloadTasks(projectId: string): void {
  void tasksStore.fetchTasks(projectId, sprintFilterParams());
}

// All-projects mode: ALL -> no param (every active project). A UUID ->
// ?project_id=<uuid> (narrow to that owned project, validated server-side).
function allProjectsFilterParams(): { project_id?: string } | undefined {
  return selectedProjectId.value === ALL
    ? undefined
    : { project_id: selectedProjectId.value };
}

function reloadAllTasks(): void {
  void tasksStore.fetchAllTasks(allProjectsFilterParams());
}

// Project change: reset the filter (a stale sprint id from a previous project
// must never leak) and reload its sprint list. Task loading is NOT done here —
// the combined watcher below is the single source of truth for the task list,
// so resetting selectedSprintId here funnels into exactly one task fetch.
watch(
  () => project.value?.id,
  (projectId) => {
    if (allProjects.value) return;
    selectedSprintId.value = ALL;
    if (projectId) {
      void sprintsStore.fetchSprints(projectId);
    }
  },
  { immediate: true },
);

// Single source of truth for the task list: re-fetch from the server whenever
// the project OR the sprint filter changes, so selecting a sprint surfaces its
// full task set (incl. statuses hidden by the default view) instead of a
// client-side slice of the default-visible tasks. On a project switch both refs
// change in the same flush, so Vue fires this once with the new values (no
// double fetch). `immediate` covers the initial mount.
watch(
  [() => project.value?.id, selectedSprintId],
  ([projectId]) => {
    if (allProjects.value) return;
    if (projectId) {
      reloadTasks(projectId);
    }
  },
  { immediate: true },
);

// All-projects mode source of truth: re-fetch the cross-project list whenever
// the mode is on and the project filter changes. `immediate` covers mount.
watch(
  [allProjects, selectedProjectId],
  ([isAll]) => {
    if (isAll) {
      reloadAllTasks();
    }
  },
  { immediate: true },
);
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

.task-panel-heading {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.task-panel-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-text, #e5e7eb));
}

.task-panel-remaining {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--accent-cyan, #22d3ee);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan, #22d3ee) 30%, transparent);
  white-space: nowrap;
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

/* All-projects mode: per-project grouping */
.task-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-group + .task-group {
  margin-top: 0.75rem;
}

.task-group-header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.25rem 0.1rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary, #9ca3af);
  background: var(--bg-card, var(--surface-2, #24283b));
  border-bottom: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}
</style>
