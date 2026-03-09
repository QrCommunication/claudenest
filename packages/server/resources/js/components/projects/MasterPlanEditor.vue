<template>
  <div class="master-plan-editor">
    <!-- Plan Summary -->
    <div v-if="plan" class="plan-header">
      <h3 class="plan-title">{{ $t('projects.masterplan.title') }}</h3>
      <p v-if="plan.prd_summary" class="plan-summary">{{ plan.prd_summary }}</p>
      <div class="plan-stats">
        <span class="stat">{{ plan.waves.length }} {{ $t('projects.masterplan.waves') }}</span>
        <span class="stat-sep">·</span>
        <span class="stat">{{ totalTasks }} {{ $t('projects.masterplan.tasks') }}</span>
      </div>
    </div>

    <!-- Waves -->
    <div v-if="plan" class="waves">
      <div
        v-for="(wave, wi) in plan.waves"
        :key="wave.id"
        class="wave"
      >
        <div class="wave-header" @click="toggleWave(wi)">
          <div class="flex items-center gap-2">
            <svg
              class="chevron"
              :class="{ 'chevron-open': expandedWaves.has(wi) }"
              viewBox="0 0 24 24" fill="currentColor"
            >
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
            <span class="wave-badge">W{{ wave.id }}</span>
            <input
              v-model="wave.name"
              class="wave-name-input"
              @click.stop
              @change="emitUpdate"
            />
          </div>
          <div class="wave-meta">
            <span class="task-count">{{ wave.tasks.length }} {{ $t('projects.masterplan.tasks') }}</span>
            <button class="btn-icon" @click.stop="removeWave(wi)" :title="$t('common.delete')">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Tasks in wave -->
        <div v-if="expandedWaves.has(wi)" class="wave-tasks">
          <div
            v-for="(task, ti) in wave.tasks"
            :key="ti"
            class="task-row"
          >
            <div class="task-main">
              <select
                v-model="task.priority"
                class="priority-select"
                :class="priorityClass(task.priority)"
                @change="emitUpdate"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input
                v-model="task.title"
                class="task-title-input"
                :placeholder="$t('projects.masterplan.task_title')"
                @change="emitUpdate"
              />
              <button class="btn-icon-sm" @click="removeTask(wi, ti)" :title="$t('common.delete')">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <textarea
              v-model="task.description"
              class="task-desc-input"
              :placeholder="$t('projects.masterplan.task_description')"
              rows="2"
              @change="emitUpdate"
            ></textarea>
            <div v-if="task.files.length > 0" class="task-files">
              <span v-for="file in task.files" :key="file" class="file-tag">{{ file }}</span>
            </div>
          </div>

          <!-- Add task button -->
          <button class="btn-add-task" @click="addTask(wi)">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            {{ $t('projects.masterplan.add_task') }}
          </button>
        </div>
      </div>

      <!-- Add wave button -->
      <button class="btn-add-wave" @click="addWave">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        {{ $t('projects.masterplan.add_wave') }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p class="text-skin-secondary">{{ $t('projects.masterplan.no_plan') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { MasterPlan, MasterPlanWave, MasterPlanTask } from '@/composables/useDecomposition';

interface Props {
  modelValue: MasterPlan | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: MasterPlan): void;
}>();

const plan = computed(() => props.modelValue);

const expandedWaves = reactive(new Set<number>([0, 1, 2, 3]));

const totalTasks = computed(() =>
  plan.value?.waves.reduce((sum, w) => sum + w.tasks.length, 0) ?? 0
);

function toggleWave(index: number): void {
  if (expandedWaves.has(index)) {
    expandedWaves.delete(index);
  } else {
    expandedWaves.add(index);
  }
}

function emitUpdate(): void {
  if (plan.value) {
    emit('update:modelValue', { ...plan.value });
  }
}

function addWave(): void {
  if (!plan.value) return;
  const nextId = Math.max(...plan.value.waves.map(w => w.id), -1) + 1;
  plan.value.waves.push({
    id: nextId,
    name: `Wave ${nextId}`,
    description: '',
    tasks: [],
  });
  expandedWaves.add(plan.value.waves.length - 1);
  emitUpdate();
}

function removeWave(index: number): void {
  if (!plan.value) return;
  plan.value.waves.splice(index, 1);
  emitUpdate();
}

function addTask(waveIndex: number): void {
  if (!plan.value) return;
  plan.value.waves[waveIndex].tasks.push({
    title: '',
    description: '',
    priority: 'medium',
    files: [],
    depends_on: [],
  });
  emitUpdate();
}

function removeTask(waveIndex: number, taskIndex: number): void {
  if (!plan.value) return;
  plan.value.waves[waveIndex].tasks.splice(taskIndex, 1);
  emitUpdate();
}

function priorityClass(priority: string): string {
  return {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  }[priority] || 'priority-medium';
}
</script>

<style scoped>
.master-plan-editor {
  @apply space-y-4;
}

.plan-header {
  @apply space-y-2;
}

.plan-title {
  @apply text-lg font-semibold text-skin-primary;
}

.plan-summary {
  @apply text-sm text-skin-secondary;
}

.plan-stats {
  @apply flex items-center gap-2 text-xs text-skin-muted;
}

.stat-sep {
  @apply text-skin-secondary;
}

/* Waves */
.waves {
  @apply space-y-3;
}

.wave {
  @apply bg-surface-3 border border-skin rounded-lg overflow-hidden;
}

.wave-header {
  @apply flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-4/50 transition-colors;
}

.chevron {
  @apply w-5 h-5 text-skin-muted transition-transform duration-200;
}

.chevron-open {
  @apply rotate-90;
}

.wave-badge {
  @apply text-xs font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded;
}

.wave-name-input {
  @apply bg-transparent border-none text-sm font-medium text-skin-primary focus:outline-none focus:ring-0;
}

.wave-meta {
  @apply flex items-center gap-3;
}

.task-count {
  @apply text-xs text-skin-muted;
}

.btn-icon {
  @apply p-1 rounded hover:bg-red-500/10 text-skin-secondary hover:text-red-400 transition-colors;
}

/* Tasks */
.wave-tasks {
  @apply px-4 pb-3 space-y-2 border-t border-skin;
}

.task-row {
  @apply mt-2 space-y-1 p-2 bg-surface-2 rounded-lg;
}

.task-main {
  @apply flex items-center gap-2;
}

.priority-select {
  @apply bg-surface-3 border border-skin rounded text-xs px-2 py-1 focus:outline-none;
}

.priority-critical { @apply text-red-400; }
.priority-high { @apply text-orange-400; }
.priority-medium { @apply text-yellow-400; }
.priority-low { @apply text-skin-muted; }

.task-title-input {
  @apply flex-1 bg-transparent border-none text-sm text-skin-primary placeholder-skin-secondary
         focus:outline-none focus:ring-0;
}

.btn-icon-sm {
  @apply p-1 rounded hover:bg-red-500/10 text-skin-secondary hover:text-red-400 transition-colors;
}

.task-desc-input {
  @apply w-full bg-surface-3 border border-skin rounded text-xs text-skin-secondary p-2
         placeholder-skin-secondary resize-none focus:outline-none focus:ring-1 focus:ring-brand-purple/30;
}

.task-files {
  @apply flex flex-wrap gap-1;
}

.file-tag {
  @apply text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-1.5 py-0.5 rounded;
}

/* Add buttons */
.btn-add-task {
  @apply mt-2 inline-flex items-center gap-1 text-xs text-skin-muted hover:text-brand-purple transition-colors;
}

.btn-add-wave {
  @apply inline-flex items-center gap-1 px-4 py-2 text-sm text-skin-muted hover:text-brand-purple
         border border-dashed border-skin rounded-lg hover:border-brand-purple/30 transition-colors;
}
</style>
