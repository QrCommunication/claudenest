<template>
  <div class="step-tasks">
    <div class="step-header">
      <div>
        <h2 class="step-title">Tasks</h2>
        <p class="step-desc">Define the initial tasks for this project. Agents will pick them up automatically.</p>
      </div>
      <button class="btn btn-add" @click="emit('add')">
        <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Add Task
      </button>
    </div>

    <!-- Task List -->
    <div class="task-list" v-if="state.tasks.length > 0">
      <div
        v-for="(task, index) in state.tasks"
        :key="index"
        class="task-card"
      >
        <div class="task-header">
          <div class="task-order">
            <button
              class="order-btn"
              :disabled="index === 0"
              @click="emit('move', index, 'up')"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="order-icon"><path d="M7 14l5-5 5 5z"/></svg>
            </button>
            <span class="order-num">{{ index + 1 }}</span>
            <button
              class="order-btn"
              :disabled="index === state.tasks.length - 1"
              @click="emit('move', index, 'down')"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="order-icon"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
          </div>

          <div class="task-fields">
            <input
              v-model="task.title"
              type="text"
              class="task-title-input"
              placeholder="Task title..."
            />
            <select v-model="task.priority" class="priority-select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <button class="remove-btn" @click="emit('remove', index)">
            <svg viewBox="0 0 24 24" fill="currentColor" class="remove-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <textarea
          v-model="task.description"
          class="task-desc-input"
          rows="2"
          placeholder="Description..."
        ></textarea>
      </div>
    </div>

    <div class="empty-tasks" v-else>
      <p>No tasks yet. Click "Add Task" or go back to generate them from context.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WizardState } from '@/composables/useProjectWizard';

interface Props {
  state: WizardState;
}

defineProps<Props>();
const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'remove', index: number): void;
  (e: 'move', index: number, direction: 'up' | 'down'): void;
}>();
</script>

<style scoped>
.step-tasks {
  @apply space-y-4;
}

.step-header {
  @apply flex items-start justify-between;
}

.step-title {
  @apply text-lg font-semibold text-white;
}

.step-desc {
  @apply text-sm text-gray-400 mt-0.5;
}

.btn-add {
  @apply inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple/20 transition-colors flex-shrink-0;
}

.btn-icon {
  @apply w-4 h-4;
}

.task-list {
  @apply space-y-3;
}

.task-card {
  @apply p-4 bg-dark-2 border border-dark-4 rounded-xl space-y-2;
}

.task-header {
  @apply flex items-center gap-3;
}

.task-order {
  @apply flex flex-col items-center gap-0.5 flex-shrink-0;
}

.order-btn {
  @apply p-0.5 text-gray-600 hover:text-white transition-colors;
}

.order-btn:disabled {
  @apply opacity-30 cursor-not-allowed;
}

.order-icon {
  @apply w-4 h-4;
}

.order-num {
  @apply text-xs text-gray-500 font-mono;
}

.task-fields {
  @apply flex-1 flex items-center gap-2;
}

.task-title-input {
  @apply flex-1 px-3 py-1.5 bg-dark-3 border border-dark-4 rounded-lg text-white text-sm focus:outline-none focus:border-brand-purple;
}

.priority-select {
  @apply px-2 py-1.5 bg-dark-3 border border-dark-4 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-purple appearance-none cursor-pointer;
}

.remove-btn {
  @apply p-1.5 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0;
}

.remove-icon {
  @apply w-4 h-4;
}

.task-desc-input {
  @apply w-full px-3 py-2 bg-dark-3 border border-dark-4 rounded-lg text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-brand-purple resize-y ml-8;
}

.empty-tasks {
  @apply text-center py-8 text-gray-500 text-sm;
}
</style>
