<template>
  <Modal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :title="t('projectsTaskform.createNewTask')">
    <form @submit.prevent="submit" class="task-form">
      <div class="form-group">
        <label>{{ t('projectsTaskform.titleLabel') }}</label>
        <input
          v-model="form.title"
          type="text"
          :placeholder="t('projectsTaskform.taskTitlePlaceholder')"
          required
        />
      </div>

      <div class="form-group">
        <label>{{ t('projectsTaskform.description') }}</label>
        <textarea
          v-model="form.description"
          rows="3"
          :placeholder="t('projectsTaskform.taskDescriptionPlaceholder')"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>{{ t('projectsTaskform.priority') }}</label>
          <select v-model="form.priority">
            <option value="low">{{ t('projectsTaskform.low') }}</option>
            <option value="medium">{{ t('projectsTaskform.medium') }}</option>
            <option value="high">{{ t('projectsTaskform.high') }}</option>
            <option value="critical">{{ t('projectsTaskform.critical') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('projectsTaskform.estTokens') }}</label>
          <input
            v-model.number="form.estimated_tokens"
            type="number"
            min="1"
            placeholder="4000"
          />
        </div>
      </div>

      <div class="form-group">
        <label>{{ t('projectsTaskform.filesOnePerLine') }}</label>
        <textarea
          v-model="filesInput"
          rows="3"
          placeholder="/path/to/file1.js&#10;/path/to/file2.js"
        />
      </div>

      <div class="form-group">
        <label>{{ t('projectsTaskform.dependencies') }}</label>
        <div v-if="availableTasks.length === 0" class="empty-tasks">
          {{ t('projectsTaskform.noAvailableTasks') }}
        </div>
        <div v-else class="dependencies-list">
          <label
            v-for="task in availableTasks"
            :key="task.id"
            class="dependency-item"
          >
            <input
              type="checkbox"
              :value="task.id"
              v-model="form.dependencies"
            />
            <span class="task-title">{{ task.title }}</span>
            <span class="task-status" :class="task.status">{{ task.status }}</span>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <Button type="button" variant="secondary" @click="$emit('update:modelValue', false)">
          {{ t('projectsTaskform.cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          {{ t('projectsTaskform.createTask') }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTasksStore } from '@/stores/tasks';
import { useToast } from '@/composables/useToast';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import type { TaskPriority } from '@/types';

interface Props {
  modelValue: boolean;
  projectId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [];
}>();

const { t } = useI18n();
const tasksStore = useTasksStore();
const toast = useToast();

const isSubmitting = ref(false);
const filesInput = ref('');

const form = ref({
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  estimated_tokens: undefined as number | undefined,
  files: [] as string[],
  dependencies: [] as string[],
});

const availableTasks = computed(() => 
  tasksStore.tasks.filter(t => t.status !== 'done')
);

async function submit() {
  // Parse files from input
  const files = filesInput.value
    .split('\n')
    .map(f => f.trim())
    .filter(f => f);

  isSubmitting.value = true;

  try {
    await tasksStore.createTask(props.projectId, {
      ...form.value,
      files,
    });
    
    toast.success(t('projectsTaskform.taskCreatedSuccess'));
    resetForm();
    emit('created');
    emit('update:modelValue', false);
  } catch (err) {
    toast.error(t('projectsTaskform.taskCreateFailed'));
  } finally {
    isSubmitting.value = false;
  }
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
    priority: 'medium',
    estimated_tokens: undefined,
    files: [],
    dependencies: [],
  };
  filesInput.value = '';
}
</script>

<style scoped>
@reference "../../../css/tailwind.css";
.task-form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-skin-primary;
}

.form-group input,
.form-group textarea,
.form-group select {
  @apply w-full px-4 py-2 bg-surface-2 border border-skin rounded-lg text-skin-primary;
  @apply focus:outline-none focus:border-brand-purple;
}

.form-group textarea {
  @apply resize-none;
}

.form-row {
  @apply grid grid-cols-2 gap-4;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-skin;
}

.empty-tasks {
  @apply text-sm text-skin-secondary py-2;
}

.dependencies-list {
  @apply max-h-40 overflow-y-auto space-y-2;
}

.dependency-item {
  @apply flex items-center gap-3 p-2 bg-surface-3 rounded-lg cursor-pointer hover:bg-surface-4;
}

.dependency-item input {
  @apply w-auto;
}

.task-title {
  @apply flex-1 text-sm text-skin-primary truncate;
}

.task-status {
  @apply text-xs px-2 py-0.5 rounded;
}

.task-status.pending {
  @apply bg-gray-500/10 text-gray-400;
}

.task-status.in_progress {
  @apply bg-brand-purple/10 text-brand-purple;
}

.task-status.review {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.task-status.blocked {
  @apply bg-red-500/10 text-red-400;
}
</style>
