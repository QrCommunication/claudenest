<template>
  <div class="tasks-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Tasks</h1>
          <p class="subtitle">Manage and track all tasks across projects</p>
        </div>
        <div class="header-actions">
          <select 
            v-model="selectedProjectId" 
            class="project-select"
            @change="onProjectChange"
          >
            <option value="">All Projects</option>
            <option 
              v-for="project in projectsStore.projects" 
              :key="project.id" 
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
          <Button 
            variant="primary" 
            @click="showCreateModal = true"
            :disabled="!selectedProjectId"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            New Task
          </Button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search tasks..."
            class="search-input"
          />
        </div>
        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="priorityFilter" class="filter-select">
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="assigneeFilter" class="filter-select">
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <Card class="stat-card" title="Total Tasks">
        <div class="stat-value">{{ filteredTasks.length }}</div>
      </Card>
      <Card class="stat-card" title="Pending">
        <div class="stat-value pending">{{ pendingCount }}</div>
      </Card>
      <Card class="stat-card" title="In Progress">
        <div class="stat-value in-progress">{{ inProgressCount }}</div>
      </Card>
      <Card class="stat-card" title="Done">
        <div class="stat-value done">{{ doneCount }}</div>
      </Card>
    </div>

    <!-- Loading State -->
    <div v-if="tasksStore.isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading tasks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      <h3>No tasks found</h3>
      <p v-if="selectedProjectId">
        Get started by creating your first task.
      </p>
      <p v-else>
        Select a project to view or create tasks.
      </p>
      <Button 
        v-if="selectedProjectId"
        variant="primary" 
        @click="showCreateModal = true"
      >
        Create Task
      </Button>
    </div>

    <!-- Tasks Content -->
    <div v-else class="tasks-content">
      <!-- View Toggle -->
      <div class="view-toggle">
        <button 
          class="toggle-btn"
          :class="{ active: viewMode === 'kanban' }"
          @click="viewMode = 'kanban'"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          Kanban
        </button>
        <button 
          class="toggle-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
          List
        </button>
      </div>

      <!-- Kanban View -->
      <KanbanBoard
        v-if="viewMode === 'kanban'"
        :tasks="filteredTasks"
        :columns="kanbanColumns"
        :search-query="searchQuery"
        :priority-filter="priorityFilter || undefined"
        @move-task="handleMoveTask"
        @select-task="openTaskDetail"
        @claim-task="claimTask"
        @release-task="releaseTask"
        @complete-task="completeTask"
        @create-task="showCreateModal = true"
      />

      <!-- List View -->
      <div v-else class="tasks-list">
        <TaskCard
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          view="list"
          @click="openTaskDetail(task)"
          @claim="claimTask"
          @release="releaseTask"
          @complete="completeTask"
        />
      </div>
    </div>

    <!-- Create Task Modal -->
    <TaskForm 
      v-model="showCreateModal"
      :project-id="selectedProjectId"
      @created="onTaskCreated"
    />

    <!-- Task Detail Modal -->
    <Modal v-model="showTaskDetail" :title="selectedTask?.title || 'Task Detail'">
      <div v-if="selectedTask" class="task-detail">
        <div class="task-meta-grid">
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

        <div class="task-description-section" v-if="selectedTask.description">
          <h4>Description</h4>
          <p>{{ selectedTask.description }}</p>
        </div>

        <div class="task-files-section" v-if="selectedTask.files?.length">
          <h4>Files</h4>
          <div class="files-list">
            <FileLockIndicator 
              v-for="file in selectedTask.files" 
              :key="file"
              :project-id="selectedTask.project_id"
              :file-path="file"
            />
          </div>
        </div>

        <div class="task-actions-footer">
          <Button 
            v-if="!selectedTask.is_claimed && selectedTask.status === 'pending'"
            variant="primary"
            @click="showClaimModal = true"
          >
            Claim Task
          </Button>
          <Button 
            v-if="selectedTask.is_claimed && !selectedTask.is_completed"
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
import { ref, computed, onMounted } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import { useProjectsStore } from '@/stores/projects';
import { useToastStore } from '@/stores/toasts';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import KanbanBoard from '@/components/multiagent/KanbanBoard.vue';
import TaskCard from '@/components/projects/TaskCard.vue';
import TaskForm from '@/components/projects/TaskForm.vue';
import InstanceBadge from '@/components/projects/InstanceBadge.vue';
import FileLockIndicator from '@/components/projects/FileLockIndicator.vue';
import { KANBAN_COLUMNS, type SharedTask, type TaskStatus, type TaskPriority } from '@/types';

const tasksStore = useTasksStore();
const projectsStore = useProjectsStore();
const toastStore = useToastStore();

// State
const selectedProjectId = ref('');
const searchQuery = ref('');
const statusFilter = ref<TaskStatus | ''>('');
const priorityFilter = ref<TaskPriority | ''>('');
const assigneeFilter = ref('');
const viewMode = ref<'kanban' | 'list'>('kanban');

const showCreateModal = ref(false);
const showTaskDetail = ref(false);
const showClaimModal = ref(false);
const showCompleteModal = ref(false);
const selectedTask = ref<SharedTask | null>(null);
const selectedInstanceId = ref('');

const completionForm = ref({
  summary: '',
  filesModified: '',
});

const kanbanColumns = KANBAN_COLUMNS;

// Computed
const filteredTasks = computed(() => {
  let tasks = tasksStore.tasks;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }
  
  if (statusFilter.value) {
    tasks = tasks.filter(t => t.status === statusFilter.value);
  }
  
  if (priorityFilter.value) {
    tasks = tasks.filter(t => t.priority === priorityFilter.value);
  }
  
  if (assigneeFilter.value === 'unassigned') {
    tasks = tasks.filter(t => !t.assigned_to);
  } else if (assigneeFilter.value === 'assigned') {
    tasks = tasks.filter(t => t.assigned_to);
  }
  
  return tasks;
});

const pendingCount = computed(() => filteredTasks.value.filter(t => t.status === 'pending').length);
const inProgressCount = computed(() => filteredTasks.value.filter(t => t.status === 'in_progress').length);
const doneCount = computed(() => filteredTasks.value.filter(t => t.status === 'done').length);

const availableInstances = computed(() => 
  projectsStore.instances.filter(i => i.is_available || i.status === 'idle')
);

// Lifecycle
onMounted(() => {
  // Projects are loaded when the user selects a machine via onProjectChange
});

// Methods
async function onProjectChange() {
  if (selectedProjectId.value) {
    await loadTasks();
    await projectsStore.fetchInstances(selectedProjectId.value);
  } else {
    tasksStore.tasks = [];
  }
}

async function loadTasks() {
  if (!selectedProjectId.value) return;
  
  try {
    await tasksStore.fetchTasks(selectedProjectId.value);
  } catch (err) {
    toastStore.error('Failed to load tasks');
  }
}

async function handleMoveTask(taskId: string, newStatus: TaskStatus) {
  try {
    await tasksStore.moveTask(taskId, newStatus);
    toastStore.success(`Task moved to ${newStatus.replace('_', ' ')}`);
  } catch (err) {
    toastStore.error('Failed to move task');
  }
}

function openTaskDetail(task: SharedTask) {
  selectedTask.value = task;
  showTaskDetail.value = true;
}

function onTaskCreated() {
  showCreateModal.value = false;
  toastStore.success('Task created successfully');
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
    showTaskDetail.value = false;
    toastStore.success('Task claimed successfully');
  } catch (err) {
    toastStore.error('Failed to claim task');
  }
}

async function releaseTask(taskId: string) {
  try {
    await tasksStore.releaseTask(taskId);
    showTaskDetail.value = false;
    toastStore.success('Task released');
  } catch (err) {
    toastStore.error('Failed to release task');
  }
}

function completeTask(taskId: string) {
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
    toastStore.success('Task completed successfully');
  } catch (err) {
    toastStore.error('Failed to complete task');
  }
}

async function deleteTask(taskId: string) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    await tasksStore.deleteTask(taskId);
    showTaskDetail.value = false;
    toastStore.success('Task deleted');
  } catch (err) {
    toastStore.error('Failed to delete task');
  }
}
</script>

<style scoped>
.tasks-page {
  @apply p-6 space-y-6;
}

.page-header {
  @apply space-y-4;
}

.header-content {
  @apply flex flex-col md:flex-row md:items-center md:justify-between gap-4;
}

.page-header h1 {
  @apply text-3xl font-bold text-skin-primary;
}

.subtitle {
  @apply text-skin-secondary mt-1;
}

.header-actions {
  @apply flex items-center gap-4;
}

.project-select {
  @apply px-4 py-2 bg-surface-2 border border-skin rounded-lg text-skin-primary;
  @apply focus:outline-none focus:border-brand-purple;
}

.filters-bar {
  @apply flex flex-wrap items-center gap-3;
}

.search-input {
  @apply px-4 py-2 bg-surface-2 border border-skin rounded-lg text-skin-primary w-64;
  @apply focus:outline-none focus:border-brand-purple;
}

.filter-select {
  @apply px-4 py-2 bg-surface-2 border border-skin rounded-lg text-skin-primary;
  @apply focus:outline-none focus:border-brand-purple;
}

.stats-row {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-card {
  @apply text-center;
}

.stat-value {
  @apply text-3xl font-bold text-skin-primary;
}

.stat-value.pending {
  @apply text-yellow-400;
}

.stat-value.in-progress {
  @apply text-brand-purple;
}

.stat-value.done {
  @apply text-green-400;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-20;
}

.spinner {
  @apply w-10 h-10 border-2 border-brand-purple border-t-transparent rounded-full animate-spin;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-20 text-center;
}

.empty-state svg {
  @apply w-16 h-16 text-skin-secondary mb-4;
}

.empty-state h3 {
  @apply text-xl font-semibold text-skin-primary mb-2;
}

.empty-state p {
  @apply text-skin-secondary mb-6;
}

.tasks-content {
  @apply space-y-4;
}

.view-toggle {
  @apply flex items-center gap-2;
}

.toggle-btn {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium text-skin-secondary bg-surface-2 rounded-lg transition-colors;
}

.toggle-btn:hover {
  @apply text-skin-primary bg-surface-3;
}

.toggle-btn.active {
  @apply text-skin-primary bg-brand-purple/20 text-brand-purple;
}

.toggle-btn svg {
  @apply w-4 h-4;
}

.tasks-list {
  @apply space-y-3;
}

.task-detail {
  @apply space-y-6;
}

.task-meta-grid {
  @apply grid grid-cols-2 gap-4;
}

.meta-item {
  @apply flex flex-col gap-1;
}

.meta-label {
  @apply text-xs text-skin-secondary uppercase tracking-wide;
}

.meta-value {
  @apply text-sm font-medium text-skin-primary;
}

.meta-value.status {
  @apply inline-flex w-fit px-2 py-1 rounded text-xs;
}

.meta-value.priority {
  @apply inline-flex w-fit px-2 py-1 rounded text-xs;
}

.task-description-section,
.task-files-section {
  @apply space-y-2;
}

.task-description-section h4,
.task-files-section h4 {
  @apply text-sm font-semibold text-skin-primary;
}

.task-description-section p {
  @apply text-sm text-skin-primary whitespace-pre-wrap;
}

.files-list {
  @apply space-y-2;
}

.task-actions-footer {
  @apply flex items-center gap-3 pt-4 border-t border-skin;
}

.claim-form,
.complete-form {
  @apply space-y-4;
}

.instances-list {
  @apply space-y-2;
}

.instance-option {
  @apply w-full flex items-center justify-between p-3 bg-surface-3 rounded-lg border border-transparent;
  @apply hover:border-brand-purple/50 transition-colors;
}

.instance-option.selected {
  @apply border-brand-purple bg-brand-purple/10;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-skin-primary;
}

.form-group textarea {
  @apply w-full px-4 py-2 bg-surface-2 border border-skin rounded-lg text-skin-primary;
  @apply focus:outline-none focus:border-brand-purple resize-none;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4;
}
</style>
