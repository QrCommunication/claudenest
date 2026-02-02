<template>
  <div class="tasks-board-page">
    <div class="board-header">
      <div class="header-filters">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks..."
          class="search-input"
        />
        <select v-model="priorityFilter" class="filter-select">
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <Button variant="primary" @click="showCreateModal = true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        New Task
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="tasksStore.isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading tasks...</p>
    </div>

    <!-- Kanban Board -->
    <div v-else class="kanban-board">
      <div 
        v-for="column in columns" 
        :key="column.id"
        class="kanban-column"
        :class="column.id"
        @dragover.prevent
        @drop="handleDrop(column.id, $event)"
      >
        <div class="column-header">
          <div class="column-title">
            <div class="column-dot" :class="column.color" />
            {{ column.title }}
            <span class="column-count">{{ getTasksForColumn(column.id).length }}</span>
          </div>
        </div>
        
        <div class="column-tasks">
          <TaskCard
            v-for="task in getTasksForColumn(column.id)"
            :key="task.id"
            :task="task"
            draggable="true"
            @dragstart="handleDragStart(task, $event)"
            @click="openTaskDetail(task)"
            @claim="claimTask"
            @release="releaseTask"
            @complete="completeTask"
          />
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <TaskForm 
      v-model="showCreateModal"
      :project-id="projectId"
      @created="onTaskCreated"
    />

    <!-- Task Detail Modal -->
    <Modal v-model="showTaskDetail" :title="selectedTask?.title || 'Task Detail'">
      <div v-if="selectedTask" class="task-detail">
        <div class="task-meta">
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="meta-value status" :class="selectedTask.status">{{ selectedTask.status }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value priority" :class="selectedTask.priority">{{ selectedTask.priority }}</span>
          </div>
          <div class="meta-item" v-if="selectedTask.assigned_to">
            <span class="meta-label">Assigned To</span>
            <span class="meta-value">{{ selectedTask.assigned_to.slice(0, 8) }}...</span>
          </div>
          <div class="meta-item" v-if="selectedTask.estimated_tokens">
            <span class="meta-label">Est. Tokens</span>
            <span class="meta-value">{{ selectedTask.estimated_tokens }}</span>
          </div>
        </div>

        <div class="task-description" v-if="selectedTask.description">
          <h4>Description</h4>
          <p>{{ selectedTask.description }}</p>
        </div>

        <div class="task-files" v-if="selectedTask.files?.length">
          <h4>Files</h4>
          <div class="files-list">
            <FileLockIndicator 
              v-for="file in selectedTask.files" 
              :key="file"
              :project-id="projectId"
              :file-path="file"
            />
          </div>
        </div>

        <div class="task-dependencies" v-if="selectedTask.dependencies?.length">
          <h4>Dependencies</h4>
          <ul>
            <li v-for="depId in selectedTask.dependencies" :key="depId">
              {{ getTaskTitle(depId) }}
            </li>
          </ul>
        </div>

        <div class="task-completion" v-if="selectedTask.is_completed">
          <h4>Completion Summary</h4>
          <p>{{ selectedTask.completion_summary }}</p>
          <div class="files-modified" v-if="selectedTask.files_modified?.length">
            <h5>Files Modified</h5>
            <ul>
              <li v-for="file in selectedTask.files_modified" :key="file">{{ file }}</li>
            </ul>
          </div>
        </div>

        <div class="task-actions">
          <Button 
            v-if="!selectedTask.is_claimed && selectedTask.status === 'pending'"
            variant="primary"
            @click="showClaimModal = true"
          >
            Claim Task
          </Button>
          <Button 
            v-if="selectedTask.is_claimed"
            variant="secondary"
            @click="releaseTask(selectedTask.id)"
          >
            Release
          </Button>
          <Button 
            v-if="selectedTask.is_claimed && !selectedTask.is_completed"
            variant="primary"
            @click="showCompleteModal = true"
          >
            Complete
          </Button>
          <Button variant="danger" @click="deleteTask(selectedTask.id)">
            Delete
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Claim Task Modal -->
    <Modal v-model="showClaimModal" title="Claim Task">
      <div class="claim-form">
        <p>Select an instance to claim this task:</p>
        <div class="instances-list">
          <button
            v-for="instance in availableInstances"
            :key="instance.id"
            class="instance-option"
            :class="{ selected: selectedInstanceId === instance.id }"
            @click="selectedInstanceId = instance.id"
          >
            <InstanceBadge :instance="instance" />
            <span class="instance-status" :class="instance.status">{{ instance.status }}</span>
          </button>
        </div>
        <div class="form-actions">
          <Button variant="secondary" @click="showClaimModal = false">Cancel</Button>
          <Button 
            variant="primary" 
            :disabled="!selectedInstanceId"
            @click="confirmClaim"
          >
            Claim
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Complete Task Modal -->
    <Modal v-model="showCompleteModal" title="Complete Task">
      <form @submit.prevent="confirmComplete" class="complete-form">
        <div class="form-group">
          <label>Completion Summary</label>
          <textarea 
            v-model="completionForm.summary" 
            rows="4"
            placeholder="Describe what was accomplished..."
            required
          />
        </div>
        <div class="form-group">
          <label>Files Modified (one per line)</label>
          <textarea 
            v-model="completionForm.filesModified" 
            rows="3"
            placeholder="/path/to/file1.js&#10;/path/to/file2.js"
          />
        </div>
        <div class="form-actions">
          <Button type="button" variant="secondary" @click="showCompleteModal = false">Cancel</Button>
          <Button type="submit" variant="primary">Complete Task</Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTasksStore } from '@/stores/tasks';
import { useProjectsStore } from '@/stores/projects';
import { useToast } from '@/composables/useToast';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import TaskCard from '@/components/projects/TaskCard.vue';
import TaskForm from '@/components/projects/TaskForm.vue';
import InstanceBadge from '@/components/projects/InstanceBadge.vue';
import FileLockIndicator from '@/components/projects/FileLockIndicator.vue';
import { KANBAN_COLUMNS, type TaskStatus, type SharedTask } from '@/types';

const props = defineProps<{
  projectId?: string;
}>();

const route = useRoute();
const tasksStore = useTasksStore();
const projectsStore = useProjectsStore();
const toast = useToast();

const projectId = computed(() => props.projectId || route.params.id as string);

const searchQuery = ref('');
const priorityFilter = ref('');
const showCreateModal = ref(false);
const showTaskDetail = ref(false);
const showClaimModal = ref(false);
const showCompleteModal = ref(false);
const selectedTask = ref<SharedTask | null>(null);
const selectedInstanceId = ref('');
const draggedTask = ref<SharedTask | null>(null);

const columns = KANBAN_COLUMNS;

const completionForm = ref({
  summary: '',
  filesModified: '',
});

const filteredTasks = computed(() => {
  let tasks = tasksStore.tasks;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }
  
  if (priorityFilter.value) {
    tasks = tasks.filter(t => t.priority === priorityFilter.value);
  }
  
  return tasks;
});

const availableInstances = computed(() => 
  projectsStore.instances.filter(i => i.is_available || i.status === 'idle')
);

onMounted(async () => {
  await loadTasks();
  if (projectsStore.instances.length === 0) {
    await projectsStore.fetchInstances(projectId.value);
  }
});

watch(projectId, async () => {
  await loadTasks();
});

async function loadTasks() {
  if (!projectId.value) return;
  
  try {
    await tasksStore.fetchTasks(projectId.value);
  } catch (err) {
    toast.error('Failed to load tasks');
  }
}

function getTasksForColumn(status: TaskStatus): SharedTask[] {
  if (status === 'blocked') {
    return filteredTasks.value.filter(t => t.status === 'blocked' || t.is_blocked);
  }
  return filteredTasks.value.filter(t => t.status === status && !t.is_blocked);
}

function handleDragStart(task: SharedTask, event: DragEvent) {
  draggedTask.value = task;
  event.dataTransfer?.setData('text/plain', task.id);
}

async function handleDrop(newStatus: TaskStatus, event: DragEvent) {
  event.preventDefault();
  
  if (!draggedTask.value) return;
  
  const task = draggedTask.value;
  
  if (task.status === newStatus) return;
  
  try {
    await tasksStore.updateTask(task.id, { status: newStatus } as any);
    toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
  } catch (err) {
    toast.error('Failed to move task');
  }
  
  draggedTask.value = null;
}

function openTaskDetail(task: SharedTask) {
  selectedTask.value = task;
  showTaskDetail.value = true;
}

function onTaskCreated() {
  showCreateModal.value = false;
  toast.success('Task created successfully');
}

async function claimTask(taskId: string) {
  selectedTask.value = tasksStore.tasks.find(t => t.id === taskId) || null;
  showClaimModal.value = true;
}

async function confirmClaim() {
  if (!selectedTask.value || !selectedInstanceId.value) return;
  
  try {
    await tasksStore.claimTask(selectedTask.value.id, selectedInstanceId.value);
    showClaimModal.value = false;
    selectedInstanceId.value = '';
    toast.success('Task claimed successfully');
  } catch (err) {
    toast.error('Failed to claim task');
  }
}

async function releaseTask(taskId: string) {
  try {
    await tasksStore.releaseTask(taskId);
    showTaskDetail.value = false;
    toast.success('Task released');
  } catch (err) {
    toast.error('Failed to release task');
  }
}

async function completeTask(taskId: string) {
  selectedTask.value = tasksStore.tasks.find(t => t.id === taskId) || null;
  showCompleteModal.value = true;
}

async function confirmComplete() {
  if (!selectedTask.value) return;
  
  const files = completionForm.value.filesModified
    .split('\n')
    .map(f => f.trim())
    .filter(f => f);
  
  try {
    await tasksStore.completeTask(selectedTask.value.id, {
      summary: completionForm.value.summary,
      files_modified: files,
      instance_id: selectedTask.value.assigned_to || '',
    });
    showCompleteModal.value = false;
    showTaskDetail.value = false;
    completionForm.value = { summary: '', filesModified: '' };
    toast.success('Task completed successfully');
  } catch (err) {
    toast.error('Failed to complete task');
  }
}

async function deleteTask(taskId: string) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    await tasksStore.deleteTask(taskId);
    showTaskDetail.value = false;
    toast.success('Task deleted');
  } catch (err) {
    toast.error('Failed to delete task');
  }
}

function getTaskTitle(taskId: string): string {
  const task = tasksStore.tasks.find(t => t.id === taskId);
  return task?.title || 'Unknown Task';
}
</script>

<style scoped>
.tasks-board-page {
  @apply space-y-6;
}

.board-header {
  @apply flex flex-col md:flex-row md:items-center md:justify-between gap-4;
}

.header-filters {
  @apply flex items-center gap-3;
}

.search-input {
  @apply px-4 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white w-64;
  @apply focus:outline-none focus:border-brand-purple;
}

.filter-select {
  @apply px-4 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-20;
}

.spinner {
  @apply w-10 h-10 border-2 border-brand-purple border-t-transparent rounded-full animate-spin;
}

.kanban-board {
  @apply grid gap-6;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.kanban-column {
  @apply bg-dark-2/50 rounded-xl border border-dark-4 flex flex-col min-h-[400px];
}

.column-header {
  @apply p-4 border-b border-dark-4;
}

.column-title {
  @apply flex items-center gap-2 font-semibold text-white;
}

.column-dot {
  @apply w-3 h-3 rounded-full;
}

.column-count {
  @apply ml-auto text-sm text-gray-400 bg-dark-3 px-2 py-0.5 rounded-full;
}

.column-tasks {
  @apply flex-1 p-3 space-y-3;
}

.task-detail {
  @apply space-y-6;
}

.task-meta {
  @apply grid grid-cols-2 gap-4;
}

.meta-item {
  @apply flex flex-col gap-1;
}

.meta-label {
  @apply text-xs text-gray-400 uppercase tracking-wide;
}

.meta-value {
  @apply text-sm font-medium text-white;
}

.meta-value.status {
  @apply inline-flex w-fit px-2 py-1 rounded text-xs;
}

.meta-value.status.pending {
  @apply bg-gray-500/10 text-gray-400;
}

.meta-value.status.in_progress {
  @apply bg-brand-purple/10 text-brand-purple;
}

.meta-value.status.review {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.meta-value.status.done {
  @apply bg-green-500/10 text-green-400;
}

.meta-value.status.blocked {
  @apply bg-red-500/10 text-red-400;
}

.meta-value.priority {
  @apply inline-flex w-fit px-2 py-1 rounded text-xs;
}

.meta-value.priority.critical {
  @apply bg-red-500/10 text-red-400;
}

.meta-value.priority.high {
  @apply bg-orange-500/10 text-orange-400;
}

.meta-value.priority.medium {
  @apply bg-yellow-500/10 text-yellow-400;
}

.meta-value.priority.low {
  @apply bg-gray-500/10 text-gray-400;
}

.task-description,
.task-files,
.task-dependencies,
.task-completion {
  @apply space-y-2;
}

.task-description h4,
.task-files h4,
.task-dependencies h4,
.task-completion h4 {
  @apply text-sm font-semibold text-white;
}

.task-description p,
.task-completion p {
  @apply text-sm text-gray-300 whitespace-pre-wrap;
}

.files-list {
  @apply space-y-2;
}

.task-dependencies ul,
.files-modified ul {
  @apply list-disc list-inside text-sm text-gray-300;
}

.task-actions {
  @apply flex items-center gap-3 pt-4 border-t border-dark-4;
}

.claim-form,
.complete-form {
  @apply space-y-4;
}

.claim-form p {
  @apply text-gray-300;
}

.instances-list {
  @apply space-y-2;
}

.instance-option {
  @apply w-full flex items-center justify-between p-3 bg-dark-3 rounded-lg border border-transparent;
  @apply hover:border-brand-purple/50 transition-colors;
}

.instance-option.selected {
  @apply border-brand-purple bg-brand-purple/10;
}

.instance-status {
  @apply text-xs px-2 py-1 rounded;
}

.instance-status.active {
  @apply bg-green-500/10 text-green-400;
}

.instance-status.idle {
  @apply bg-blue-500/10 text-blue-400;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-gray-300;
}

.form-group textarea {
  @apply w-full px-4 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple resize-none;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4;
}
</style>
