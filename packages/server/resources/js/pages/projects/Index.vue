<template>
  <div class="projects-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>{{ t('projectsIndex.title') }}</h1>
          <p class="subtitle">{{ t('projectsIndex.subtitle') }}</p>
        </div>
        <div class="header-actions">
          <select 
            v-model="selectedMachineId" 
            class="machine-select"
            @change="onMachineChange"
          >
            <option value="">{{ t('projectsIndex.allMachines') }}</option>
            <option 
              v-for="machine in machinesStore.machines" 
              :key="machine.id" 
              :value="machine.id"
            >
              {{ machine.name }}
            </option>
          </select>
          <Button
            variant="primary"
            @click="$router.push({ name: 'projects.new' })"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            {{ t('projectsIndex.newProject') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="projectsStore.isLoading" class="loading-state">
      <div class="spinner" />
      <p>{{ t('projectsIndex.loadingProjects') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProjects.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      <h3>{{ t('projectsIndex.noProjectsFound') }}</h3>
      <p v-if="selectedMachineId">
        {{ t('projectsIndex.emptyForMachine') }}
      </p>
      <p v-else>
        {{ t('projectsIndex.emptySelectMachine') }}
      </p>
      <Button
        variant="primary"
        @click="$router.push({ name: 'projects.new' })"
      >
        {{ t('projectsIndex.createProject') }}
      </Button>
    </div>

    <!-- Projects Grid -->
    <div v-else class="projects-grid">
      <Card 
        v-for="project in filteredProjects" 
        :key="project.id"
        hoverable
        class="project-card"
        @click="goToProject(project.id)"
      >
        <div class="project-header">
          <div class="project-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div class="project-title">
            <h3>{{ project.name }}</h3>
            <p class="project-path">{{ project.project_path }}</p>
          </div>
        </div>

        <div class="project-stats">
          <div class="stat">
            <span class="stat-value">{{ project.active_instances_count }}</span>
            <span class="stat-label">{{ t('projectsIndex.activeInstances') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ project.pending_tasks_count }}</span>
            <span class="stat-label">{{ t('projectsIndex.pendingTasks') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ Math.round(project.token_usage_percent) }}%</span>
            <span class="stat-label">{{ t('projectsIndex.tokenUsage') }}</span>
          </div>
        </div>

        <div class="project-footer">
          <div class="token-bar">
            <div 
              class="token-progress" 
              :style="{ width: `${project.token_usage_percent}%` }"
              :class="{ 'is-high': project.token_usage_percent > 80 }"
            />
          </div>
          <div class="machine-badge">
            {{ getMachineName(project.machine_id) }}
          </div>
        </div>

        <div class="project-actions" @click.stop>
          <button
            class="action-btn"
            :title="t('projectsIndex.actionView')"
            @click="goToProject(project.id)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </button>
          <button
            class="action-btn"
            :title="t('projectsIndex.actionTasks')"
            @click="goToTasks(project.id)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </button>
          <button
            class="action-btn danger"
            :title="t('projectsIndex.actionDelete')"
            @click="confirmDelete(project)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </Card>
    </div>

    <!-- Create Project Modal -->
    <Modal v-model="showCreateModal" :title="t('projectsIndex.createModalTitle')">
      <form @submit.prevent="createProject" class="project-form">
        <div class="form-group">
          <label>{{ t('projectsIndex.fieldProjectName') }}</label>
          <input
            v-model="createForm.name"
            type="text"
            :placeholder="t('projectsIndex.placeholderProjectName')"
            required
          />
        </div>
        <div class="form-group">
          <div class="path-header">
            <label>{{ t('projectsIndex.fieldProjectPath') }}</label>
            <button
              v-if="isSelectedMachineOnline"
              type="button"
              class="toggle-input-btn"
              @click="useManualInput = !useManualInput"
            >
              {{ useManualInput ? t('projectsIndex.toggleBrowseFiles') : t('projectsIndex.toggleManualInput') }}
            </button>
          </div>

          <div v-if="useManualInput || !isSelectedMachineOnline">
            <input
              v-model="createForm.project_path"
              type="text"
              :placeholder="t('projectsIndex.placeholderProjectPath')"
              required
            />
          </div>

          <template v-else>
            <RemoteFileTree
              :machine-id="selectedMachineId"
              @select="onPathSelected"
            />
            <input
              v-model="createForm.project_path"
              type="text"
              required
              class="!hidden"
              aria-hidden="true"
              tabindex="-1"
            />
          </template>
        </div>
        <div class="form-group">
          <label>{{ t('projectsIndex.fieldSummary') }}</label>
          <textarea
            v-model="createForm.summary"
            rows="3"
            :placeholder="t('projectsIndex.placeholderSummary')"
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('projectsIndex.fieldArchitecture') }}</label>
            <textarea
              v-model="createForm.architecture"
              rows="3"
              :placeholder="t('projectsIndex.placeholderArchitecture')"
            />
          </div>
          <div class="form-group">
            <label>{{ t('projectsIndex.fieldConventions') }}</label>
            <textarea
              v-model="createForm.conventions"
              rows="3"
              :placeholder="t('projectsIndex.placeholderConventions')"
            />
          </div>
        </div>
        <div class="form-actions">
          <Button type="button" variant="secondary" @click="showCreateModal = false">
            {{ t('projectsIndex.cancel') }}
          </Button>
          <Button
            type="submit"
            variant="primary"
            :loading="projectsStore.isCreating"
          >
            {{ t('projectsIndex.createProject') }}
          </Button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="t('projectsIndex.deleteModalTitle')">
      <div class="delete-confirm">
        <p>{{ t('projectsIndex.deleteConfirmPrefix') }} <strong>{{ projectToDelete?.name }}</strong>{{ t('projectsIndex.deleteConfirmSuffix') }}</p>
        <p class="warning">{{ t('projectsIndex.deleteWarning') }}</p>
        <div class="form-actions">
          <Button type="button" variant="secondary" @click="showDeleteModal = false">
            {{ t('projectsIndex.cancel') }}
          </Button>
          <Button
            type="button"
            variant="danger"
            :loading="projectsStore.isDeleting"
            @click="deleteProject"
          >
            {{ t('projectsIndex.deleteProject') }}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '@/stores/projects';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import RemoteFileTree from '@/components/sessions/RemoteFileTree.vue';
import type { SharedProject } from '@/types';

const { t } = useI18n();
const router = useRouter();
const projectsStore = useProjectsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const selectedMachineId = ref('');
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const projectToDelete = ref<SharedProject | null>(null);
const useManualInput = ref(false);

const isSelectedMachineOnline = computed(() => {
  if (!selectedMachineId.value) return false;
  const machine = machinesStore.machines.find(m => m.id === selectedMachineId.value);
  return machine?.status === 'online';
});

const createForm = ref({
  name: '',
  project_path: '',
  summary: '',
  architecture: '',
  conventions: '',
});

const filteredProjects = computed(() => {
  if (!selectedMachineId.value) {
    return projectsStore.projects;
  }
  return projectsStore.projects.filter(p => p.machine_id === selectedMachineId.value);
});

onMounted(async () => {
  // Fetch machines first
  if (machinesStore.machines.length === 0) {
    await machinesStore.fetchMachines();
  }
  
  // If there's only one machine, select it automatically
  if (machinesStore.machines.length === 1) {
    selectedMachineId.value = machinesStore.machines[0].id;
    await loadProjects();
  }
});

async function onMachineChange() {
  if (selectedMachineId.value) {
    await loadProjects();
  } else {
    projectsStore.projects = [];
  }
}

async function loadProjects() {
  if (!selectedMachineId.value) return;
  
  try {
    await projectsStore.fetchProjects(selectedMachineId.value);
  } catch (err) {
    toast.error(t('projectsIndex.toastLoadFailed'));
  }
}

function getMachineName(machineId: string): string {
  const machine = machinesStore.machines.find(m => m.id === machineId);
  return machine?.name || t('projectsIndex.unknownMachine');
}

function goToProject(projectId: string) {
  router.push({ name: 'projects.show', params: { id: projectId } });
}

function goToTasks(projectId: string) {
  router.push({ name: 'projects.tasks', params: { id: projectId } });
}

async function createProject() {
  if (!selectedMachineId.value) return;
  
  try {
    await projectsStore.createProject(selectedMachineId.value, createForm.value);
    toast.success(t('projectsIndex.toastCreateSuccess'));
    showCreateModal.value = false;
    resetCreateForm();
  } catch (err) {
    toast.error(t('projectsIndex.toastCreateFailed'));
  }
}

function onPathSelected(path: string): void {
  createForm.value.project_path = path;
}

function resetCreateForm() {
  createForm.value = {
    name: '',
    project_path: '',
    summary: '',
    architecture: '',
    conventions: '',
  };
  useManualInput.value = false;
}

function confirmDelete(project: SharedProject) {
  projectToDelete.value = project;
  showDeleteModal.value = true;
}

async function deleteProject() {
  if (!projectToDelete.value) return;
  
  try {
    await projectsStore.deleteProject(projectToDelete.value.id);
    toast.success(t('projectsIndex.toastDeleteSuccess'));
    showDeleteModal.value = false;
    projectToDelete.value = null;
  } catch (err) {
    toast.error(t('projectsIndex.toastDeleteFailed'));
  }
}
</script>

<style scoped>
@reference "../../../css/tailwind.css";
.projects-page {
  @apply p-6;
}

.page-header {
  @apply mb-8;
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

.machine-select {
  @apply px-4 py-2 bg-surface-2 border border-skin rounded-lg text-skin-primary;
  @apply focus:outline-none focus:border-brand-purple;
}

.header-actions button {
  @apply flex items-center gap-2;
}

.header-actions button svg {
  @apply w-5 h-5;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-20;
}

.spinner {
  @apply w-10 h-10 border-2 border-brand-purple border-t-transparent rounded-full animate-spin;
}

.loading-state p {
  @apply mt-4 text-skin-secondary;
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

.projects-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.project-card {
  @apply cursor-pointer relative;
}

.project-header {
  @apply flex items-start gap-4 mb-4;
}

.project-icon {
  @apply w-12 h-12 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center flex-shrink-0;
}

.project-icon svg {
  @apply w-6 h-6;
}

.project-title h3 {
  @apply text-lg font-semibold text-skin-primary mb-1;
}

.project-path {
  @apply text-sm text-skin-secondary truncate max-w-[200px];
}

.project-stats {
  @apply grid grid-cols-3 gap-4 mb-4;
}

.stat {
  @apply text-center;
}

.stat-value {
  @apply block text-2xl font-bold text-skin-primary;
}

.stat-label {
  @apply text-xs text-skin-secondary;
}

.project-footer {
  @apply space-y-3;
}

.token-bar {
  @apply h-2 bg-surface-3 rounded-full overflow-hidden;
}

.token-progress {
  @apply h-full bg-gradient-to-r from-brand-purple to-brand-indigo rounded-full transition-all duration-300;
}

.token-progress.is-high {
  @apply bg-gradient-to-r from-orange-500 to-red-500;
}

.machine-badge {
  @apply inline-flex items-center px-2 py-1 bg-surface-3 rounded text-xs text-skin-secondary;
}

.project-actions {
  @apply absolute top-4 right-4 flex items-center gap-1 opacity-0 transition-opacity duration-200;
}

.project-card:hover .project-actions {
  @apply opacity-100;
}

.action-btn {
  @apply p-2 rounded-lg bg-surface-3 text-skin-secondary hover:text-skin-primary hover:bg-surface-4 transition-colors;
}

.action-btn svg {
  @apply w-4 h-4;
}

.action-btn.danger:hover {
  @apply text-red-400;
}

.project-form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-skin-primary;
}

.path-header {
  @apply flex items-center justify-between;
}

.toggle-input-btn {
  @apply text-xs text-brand-purple hover:underline transition-colors cursor-pointer;
}

.form-group input,
.form-group textarea {
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

.delete-confirm {
  @apply space-y-4;
}

.delete-confirm p {
  @apply text-skin-primary;
}

.delete-confirm .warning {
  @apply text-orange-400 text-sm;
}
</style>
