<template>
  <aside class="ws-rail">
    <!-- Rail tabs -->
    <div class="rail-tabs" role="tablist">
      <button
        v-for="tab in railTabs"
        :key="tab.id"
        class="rail-tab"
        :class="{ active: modelValue === tab.id }"
        role="tab"
        :aria-selected="modelValue === tab.id"
        @click="emit('update:modelValue', tab.id)"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="rail-tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Tab content -->
    <div class="rail-content">
      <!-- TASKS -->
      <div v-if="modelValue === 'tasks'" class="rail-panel">
        <p v-if="tasks.length === 0" class="rail-empty">
          {{ t('projectsWorkspace.rail.noTasks') }}
        </p>
        <template v-else>
          <div v-for="group in taskGroups" :key="group.status" class="task-group">
            <h4 class="task-group-title">
              {{ group.label }}
              <span class="task-group-count">{{ group.tasks.length }}</span>
            </h4>
            <ul class="task-list">
              <li v-for="task in group.tasks" :key="task.id" class="task-row" :title="task.title">
                <span
                  class="task-dot"
                  :style="{ backgroundColor: task.assigned_to ? workerColor(task.assigned_to) : 'var(--text-muted)' }"
                />
                <span class="task-title">{{ task.title }}</span>
                <span v-if="task.priority === 'critical' || task.priority === 'high'" class="task-priority" :class="task.priority">
                  {{ task.priority }}
                </span>
              </li>
            </ul>
          </div>
        </template>
      </div>

      <!-- LOCKS -->
      <div v-else-if="modelValue === 'locks'" class="rail-panel">
        <p v-if="activeLocks.length === 0" class="rail-empty">
          {{ t('projectsWorkspace.rail.noLocks') }}
        </p>
        <ul v-else class="lock-list">
          <li v-for="lock in activeLocks" :key="lock.id" class="lock-row">
            <div class="lock-info">
              <code class="lock-path" :title="lock.path">{{ lock.path }}</code>
              <span class="lock-meta">
                <span class="lock-holder" :style="{ color: workerColor(lock.locked_by) }">
                  {{ lock.locked_by.slice(0, 12) }}
                </span>
                · {{ lockAge(lock) }}
              </span>
            </div>
            <button
              class="lock-release"
              :title="t('projectsWorkspace.rail.forceRelease')"
              @click="emit('forceRelease', lock.path)"
            >
              {{ t('projectsWorkspace.rail.release') }}
            </button>
          </li>
        </ul>
      </div>

      <!-- WORKERS -->
      <div v-else class="rail-panel">
        <p v-if="instances.length === 0" class="rail-empty">
          {{ t('projectsWorkspace.rail.noWorkers') }}
        </p>
        <div v-else class="rail-instances">
          <InstanceCard
            v-for="instance in instances"
            :key="instance.id"
            :instance="instance"
            :project-id="projectId"
          />
        </div>
        <button class="rail-spawn" @click="emit('spawn')">
          {{ t('projectsWorkspace.rail.spawnWorker') }}
        </button>
      </div>
    </div>

    <!-- Condensed activity feed footer -->
    <footer class="rail-footer">
      <h4 class="rail-footer-title">{{ t('projectsWorkspace.rail.activity') }}</h4>
      <div class="rail-footer-feed">
        <ActivityFeed :activities="activities" />
      </div>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityFeed from '@/components/multiagent/ActivityFeed.vue';
import InstanceCard from '@/components/multiagent/InstanceCard.vue';
import { workerColor } from '@/utils/workerColor';
import type { ActivityLog, ClaudeInstance, FileLock, SharedTask, TaskStatus } from '@/types';

export type RailTab = 'tasks' | 'locks' | 'workers';

interface Props {
  projectId: string;
  modelValue: RailTab;
  tasks: SharedTask[];
  locks: FileLock[];
  instances: ClaudeInstance[];
  activities: ActivityLog[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [tab: RailTab];
  spawn: [];
  forceRelease: [path: string];
}>();

const { t } = useI18n();

const GROUP_ORDER: TaskStatus[] = ['in_progress', 'blocked', 'review', 'pending', 'done'];

const activeLocks = computed(() =>
  props.locks.filter((lock) => new Date(lock.expires_at).getTime() > Date.now()),
);

const railTabs = computed(() => [
  {
    id: 'tasks' as const,
    label: t('projectsWorkspace.rail.tasks'),
    count: props.tasks.filter((task) => task.status !== 'done').length,
  },
  {
    id: 'locks' as const,
    label: t('projectsWorkspace.rail.locks'),
    count: activeLocks.value.length,
  },
  {
    id: 'workers' as const,
    label: t('projectsWorkspace.rail.workers'),
    count: props.instances.length,
  },
]);

const statusLabels = computed<Record<TaskStatus, string>>(() => ({
  backlog: t('projectsWorkspace.rail.statusBacklog'),
  pending: t('projectsWorkspace.rail.statusPending'),
  in_progress: t('projectsWorkspace.rail.statusInProgress'),
  blocked: t('projectsWorkspace.rail.statusBlocked'),
  review: t('projectsWorkspace.rail.statusReview'),
  done: t('projectsWorkspace.rail.statusDone'),
}));

const taskGroups = computed(() =>
  GROUP_ORDER
    .map((status) => ({
      status,
      label: statusLabels.value[status],
      tasks: props.tasks.filter((task) => task.status === status),
    }))
    .filter((group) => group.tasks.length > 0),
);

function lockAge(lock: FileLock): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(lock.locked_at).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
}
</script>

<style scoped>
.ws-rail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background-color: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
}

/* Tabs */
.rail-tabs {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
}

.rail-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 500;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.rail-tab:hover {
  color: var(--text-primary);
}

.rail-tab.active {
  color: var(--accent-purple, #a855f7);
  border-bottom-color: var(--accent-purple, #a855f7);
}

.rail-tab-count {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 14%, transparent);
  border-radius: 9999px;
  padding: 0 6px;
  min-width: 16px;
}

/* Content */
.rail-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.rail-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rail-empty {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 24px 8px;
}

/* Tasks */
.task-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.task-group-count {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  background: var(--bg-hover);
  border-radius: 9999px;
  padding: 0 6px;
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.task-row:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.task-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-priority {
  font-size: 10px;
  border-radius: 9999px;
  padding: 0 6px;
  flex-shrink: 0;
}

.task-priority.critical {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.task-priority.high {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

/* Locks */
.lock-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lock-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.lock-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lock-path {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
}

.lock-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.lock-holder {
  font-family: 'JetBrains Mono', monospace;
}

.lock-release {
  flex-shrink: 0;
  font-size: 11px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.lock-release:active {
  transform: scale(0.97);
}

.lock-release:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Workers */
.rail-instances {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rail-spawn {
  width: 100%;
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px dashed color-mix(in srgb, var(--accent-purple, #a855f7) 50%, transparent);
  border-radius: 8px;
  background: none;
  color: var(--accent-purple, #a855f7);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.rail-spawn:active {
  transform: scale(0.97);
}

.rail-spawn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 8%, transparent);
}

/* Footer activity feed */
.rail-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--border-color);
  max-height: 220px;
  display: flex;
  flex-direction: column;
}

.rail-footer-title {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.rail-footer-feed {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 8px;
  scrollbar-width: thin;
  font-size: 12px;
}
</style>
