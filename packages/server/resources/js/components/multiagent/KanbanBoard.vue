<template>
  <div class="kanban-board">
    <div 
      v-for="column in columns" 
      :key="column.id"
      class="kanban-column"
      :class="column.id"
      @dragover.prevent="onDragOver(column.id, $event)"
      @drop="onDrop(column.id, $event)"
      @dragleave="onDragLeave(column.id, $event)"
    >
      <div class="column-header">
        <div class="column-title">
          <div class="column-indicator" :class="column.color" />
          <span class="column-name">{{ column.title }}</span>
          <span class="column-count">{{ getTasksForColumn(column.id).length }}</span>
        </div>
        <button 
          v-if="column.id === 'pending'"
          class="column-add-btn"
          @click="$emit('create-task')"
          title="Add task"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
      
      <div class="column-tasks" :class="{ 'is-drag-over': dragOverColumn === column.id }">
        <TaskCard
          v-for="task in getTasksForColumn(column.id)"
          :key="task.id"
          :task="task"
          :draggable="canDragTask(task)"
          @dragstart="onDragStart(task, $event)"
          @dragend="onDragEnd($event)"
          @click="$emit('select-task', task)"
          @claim="$emit('claim-task', $event)"
          @release="$emit('release-task', $event)"
          @complete="$emit('complete-task', $event)"
        />
        
        <div v-if="getTasksForColumn(column.id).length === 0" class="column-empty">
          <p>No {{ column.title.toLowerCase() }} tasks</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TaskCard from '@/components/projects/TaskCard.vue';
import type { SharedTask, TaskStatus, TaskPriority } from '@/types';

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
}

interface Props {
  tasks: SharedTask[];
  columns: KanbanColumn[];
  searchQuery?: string;
  priorityFilter?: TaskPriority | '';
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  priorityFilter: '',
});

const emit = defineEmits<{
  'move-task': [taskId: string, newStatus: TaskStatus];
  'select-task': [task: SharedTask];
  'claim-task': [taskId: string];
  'release-task': [taskId: string];
  'complete-task': [taskId: string];
  'create-task': [];
}>();

const draggedTask = ref<SharedTask | null>(null);
const dragOverColumn = ref<TaskStatus | null>(null);

const filteredTasks = computed(() => {
  let tasks = [...props.tasks];
  
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }
  
  if (props.priorityFilter) {
    tasks = tasks.filter(t => t.priority === props.priorityFilter);
  }
  
  return tasks;
});

function getTasksForColumn(status: TaskStatus): SharedTask[] {
  if (status === 'blocked') {
    return filteredTasks.value.filter(t => t.status === 'blocked' || t.is_blocked);
  }
  return filteredTasks.value.filter(t => t.status === status && !t.is_blocked);
}

function canDragTask(task: SharedTask): boolean {
  // Allow dragging if task is not blocked
  return !task.is_blocked;
}

function onDragStart(task: SharedTask, event: DragEvent) {
  draggedTask.value = task;
  event.dataTransfer?.setData('text/plain', task.id);
  event.dataTransfer?.setData('application/json', JSON.stringify(task));
  event.dataTransfer!.effectAllowed = 'move';
  
  // Add a custom drag image if needed
  const target = event.target as HTMLElement;
  target.classList.add('is-dragging');
}

function onDragEnd(event: DragEvent) {
  const target = event.target as HTMLElement;
  target.classList.remove('is-dragging');
  draggedTask.value = null;
  dragOverColumn.value = null;
}

function onDragOver(columnId: TaskStatus, event: DragEvent) {
  event.preventDefault();
  if (draggedTask.value && draggedTask.value.status !== columnId) {
    dragOverColumn.value = columnId;
  }
}

function onDragLeave(columnId: TaskStatus, event: DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement;
  const column = event.currentTarget as HTMLElement;
  
  // Only clear if we're actually leaving the column
  if (!column.contains(relatedTarget)) {
    dragOverColumn.value = null;
  }
}

function onDrop(columnId: TaskStatus, event: DragEvent) {
  event.preventDefault();
  dragOverColumn.value = null;
  
  if (!draggedTask.value) return;
  
  const task = draggedTask.value;
  
  if (task.status === columnId) return;
  
  // Emit the move event
  emit('move-task', task.id, columnId);
  
  draggedTask.value = null;
}
</script>

<style scoped>
.kanban-board {
  @apply grid gap-6;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.kanban-column {
  @apply bg-dark-2/50 rounded-xl border border-dark-4 flex flex-col min-h-[500px];
  @apply transition-colors duration-200;
}

.column-header {
  @apply flex items-center justify-between p-4 border-b border-dark-4;
}

.column-title {
  @apply flex items-center gap-3;
}

.column-indicator {
  @apply w-3 h-3 rounded-full;
}

.column-indicator.bg-gray-500 {
  background-color: #6b7280;
}

.column-indicator.bg-brand-purple {
  background-color: var(--accent-purple, #a855f7);
}

.column-indicator.bg-brand-cyan {
  background-color: var(--accent-cyan, #22d3ee);
}

.column-indicator.bg-green-500 {
  background-color: #22c55e;
}

.column-name {
  @apply font-semibold text-white;
}

.column-count {
  @apply text-sm text-gray-400 bg-dark-3 px-2 py-0.5 rounded-full;
}

.column-add-btn {
  @apply p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-3 transition-colors;
}

.column-add-btn svg {
  @apply w-5 h-5;
}

.column-tasks {
  @apply flex-1 p-3 space-y-3 overflow-y-auto;
  @apply transition-colors duration-200;
}

.column-tasks.is-drag-over {
  @apply bg-brand-purple/5 border-2 border-dashed border-brand-purple/30 rounded-lg;
}

.column-empty {
  @apply flex items-center justify-center h-32 text-gray-500 text-sm;
}

:global(.task-card.is-dragging) {
  @apply opacity-50 rotate-2 scale-95;
}

/* Custom scrollbar */
.column-tasks::-webkit-scrollbar {
  @apply w-1.5;
}

.column-tasks::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.column-tasks::-webkit-scrollbar-thumb {
  @apply bg-dark-4 rounded-full;
}

.column-tasks::-webkit-scrollbar-thumb:hover {
  @apply bg-dark-3;
}
</style>
