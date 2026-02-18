<template>
  <Modal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Project' : 'Create New Project'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form @submit.prevent="handleSubmit" class="project-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h4 class="section-title">Basic Information</h4>

        <div class="form-group">
          <label for="project-name">
            Project Name <span class="required">*</span>
          </label>
          <input
            id="project-name"
            v-model="form.name"
            type="text"
            placeholder="My Awesome Project"
            required
            :disabled="isSubmitting"
          />
        </div>

        <!-- Project Path -->
        <div class="form-group">
          <!-- Editing: disabled input -->
          <template v-if="isEditing">
            <label for="project-path">
              Project Path <span class="required">*</span>
            </label>
            <input
              id="project-path"
              v-model="form.project_path"
              type="text"
              placeholder="/path/to/project"
              required
              :disabled="true"
            />
            <p class="form-hint">Absolute path to the project directory on the machine</p>
          </template>

          <!-- Creating + machine online: file tree or manual input -->
          <template v-else-if="isMachineOnline">
            <div class="path-header">
              <label>
                Project Path <span class="required">*</span>
              </label>
              <button
                type="button"
                class="toggle-input-btn"
                @click="useManualInput = !useManualInput"
              >
                {{ useManualInput ? 'Browse files' : 'Manual input' }}
              </button>
            </div>

            <template v-if="useManualInput">
              <input
                v-model="form.project_path"
                type="text"
                placeholder="/path/to/project"
                required
                :disabled="isSubmitting"
              />
              <p class="form-hint">Absolute path to the project directory on the machine</p>
            </template>
            <template v-else>
              <RemoteFileTree
                :machine-id="machineId"
                @select="onPathSelected"
              />
              <input
                v-model="form.project_path"
                type="text"
                required
                class="!hidden"
                aria-hidden="true"
                tabindex="-1"
              />
              <p class="form-hint">Click a folder to select it, double-click to navigate into it</p>
            </template>
          </template>

          <!-- Creating + machine offline: plain input -->
          <template v-else>
            <label for="project-path">
              Project Path <span class="required">*</span>
            </label>
            <input
              id="project-path"
              v-model="form.project_path"
              type="text"
              placeholder="/path/to/project"
              required
              :disabled="isSubmitting"
            />
            <p class="form-hint">Absolute path to the project directory on the machine</p>
          </template>
        </div>
      </div>

      <!-- Context Info -->
      <div class="form-section">
        <h4 class="section-title">Context</h4>

        <div class="form-group">
          <label for="project-summary">Summary</label>
          <textarea
            id="project-summary"
            v-model="form.summary"
            rows="3"
            placeholder="Brief description of the project"
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="project-architecture">Architecture</label>
            <textarea
              id="project-architecture"
              v-model="form.architecture"
              rows="4"
              placeholder="System architecture notes"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="project-conventions">Conventions</label>
            <textarea
              id="project-conventions"
              v-model="form.conventions"
              rows="4"
              placeholder="Coding conventions"
              :disabled="isSubmitting"
            />
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="form-section" v-if="!isEditing">
        <h4 class="section-title">Settings</h4>

        <div class="form-row">
          <div class="form-group">
            <label for="max-tokens">Max Context Tokens</label>
            <input
              id="max-tokens"
              v-model.number="form.max_tokens"
              type="number"
              min="1000"
              max="128000"
              step="1000"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="context-retention">Context Retention (days)</label>
            <input
              id="context-retention"
              v-model.number="form.settings.contextRetentionDays"
              type="number"
              min="1"
              max="365"
              :disabled="isSubmitting"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="task-timeout">Task Timeout (minutes)</label>
            <input
              id="task-timeout"
              v-model.number="form.settings.taskTimeoutMinutes"
              type="number"
              min="5"
              max="1440"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="lock-timeout">Lock Timeout (minutes)</label>
            <input
              id="lock-timeout"
              v-model.number="form.settings.lockTimeoutMinutes"
              type="number"
              min="5"
              max="1440"
              :disabled="isSubmitting"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="broadcast-level">Broadcast Level</label>
          <select
            id="broadcast-level"
            v-model="form.settings.broadcastLevel"
            :disabled="isSubmitting"
          >
            <option value="all">All - Broadcast to all instances</option>
            <option value="managers">Managers - Only to managing instances</option>
            <option value="none">None - Disable broadcasts</option>
          </select>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="form-error">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <Button
          type="button"
          variant="secondary"
          @click="$emit('update:modelValue', false)"
          :disabled="isSubmitting"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          {{ isEditing ? 'Save Changes' : 'Create Project' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import RemoteFileTree from '@/components/sessions/RemoteFileTree.vue';
import type { SharedProject, CreateProjectForm, UpdateProjectForm, ProjectSettings } from '@/types';

interface Props {
  modelValue: boolean;
  project?: SharedProject | null;
  machineId: string;
  isSubmitting?: boolean;
  error?: string | null;
  isMachineOnline?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  project: null,
  isSubmitting: false,
  error: null,
  isMachineOnline: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'submit': [data: CreateProjectForm | UpdateProjectForm];
}>();

const isEditing = computed(() => !!props.project);

const useManualInput = ref(false);

const defaultSettings: ProjectSettings = {
  maxContextTokens: 8000,
  summarizeThreshold: 0.8,
  contextRetentionDays: 30,
  taskTimeoutMinutes: 60,
  lockTimeoutMinutes: 30,
  broadcastLevel: 'all',
};

const form = reactive({
  name: '',
  project_path: '',
  summary: '',
  architecture: '',
  conventions: '',
  max_tokens: 8000,
  settings: { ...defaultSettings },
});

// Watch for project changes to populate form when editing
watch(() => props.project, (newProject) => {
  if (newProject) {
    form.name = newProject.name;
    form.project_path = newProject.project_path;
    form.summary = newProject.summary || '';
    form.architecture = newProject.architecture || '';
    form.conventions = newProject.conventions || '';
    form.max_tokens = newProject.max_tokens || 8000;
    form.settings = { ...defaultSettings, ...newProject.settings };
  } else {
    resetForm();
  }
}, { immediate: true });

// Reset form when modal is closed
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});

function resetForm() {
  form.name = '';
  form.project_path = '';
  form.summary = '';
  form.architecture = '';
  form.conventions = '';
  form.max_tokens = 8000;
  form.settings = { ...defaultSettings };
  useManualInput.value = false;
}

function onPathSelected(path: string) {
  form.project_path = path;
}

function handleSubmit() {
  if (isEditing.value && props.project) {
    // Only include changed fields for update
    const updateData: UpdateProjectForm = {};

    if (form.name !== props.project.name) updateData.name = form.name;
    if (form.summary !== props.project.summary) updateData.summary = form.summary;
    if (form.architecture !== props.project.architecture) updateData.architecture = form.architecture;
    if (form.conventions !== props.project.conventions) updateData.conventions = form.conventions;
    if (form.max_tokens !== props.project.max_tokens) updateData.max_tokens = form.max_tokens;

    emit('submit', updateData);
  } else {
    // Create new project
    const createData: CreateProjectForm = {
      name: form.name,
      project_path: form.project_path,
      summary: form.summary || undefined,
      architecture: form.architecture || undefined,
      conventions: form.conventions || undefined,
      settings: form.settings,
    };

    emit('submit', createData);
  }
}
</script>

<style scoped>
.project-form {
  @apply space-y-6 max-h-[70vh] overflow-y-auto pr-2;
}

.form-section {
  @apply space-y-4;
}

.section-title {
  @apply text-sm font-semibold text-white uppercase tracking-wide pb-2 border-b border-dark-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-gray-300;
}

.form-group label .required {
  @apply text-red-400 ml-1;
}

.form-group input,
.form-group textarea,
.form-group select {
  @apply w-full px-4 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple transition-colors;
}

.form-group input:disabled,
.form-group textarea:disabled,
.form-group select:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.form-group textarea {
  @apply resize-none;
}

.form-hint {
  @apply text-xs text-gray-500;
}

.form-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-error {
  @apply flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm;
}

.form-error svg {
  @apply w-5 h-5 flex-shrink-0;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-dark-4 sticky bottom-0 bg-dark-1 pb-2;
}

.path-header {
  @apply flex items-center justify-between;
}

.path-header label {
  @apply text-sm font-medium text-gray-300;
}

.path-header label .required {
  @apply text-red-400 ml-1;
}

.toggle-input-btn {
  @apply text-xs text-brand-purple hover:underline transition-colors cursor-pointer;
}

/* Custom scrollbar */
.project-form::-webkit-scrollbar {
  @apply w-1.5;
}

.project-form::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.project-form::-webkit-scrollbar-thumb {
  @apply bg-dark-4 rounded-full;
}

.project-form::-webkit-scrollbar-thumb:hover {
  @apply bg-dark-3;
}
</style>
