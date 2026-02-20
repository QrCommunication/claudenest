<template>
  <div class="projects-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Projects</h1>
          <p class="subtitle">Manage your shared multi-agent projects</p>
        </div>
        <div class="header-actions">
          <select 
            v-model="selectedMachineId" 
            class="machine-select"
            @change="onMachineChange"
          >
            <option value="">All Machines</option>
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
            New Project
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="projectsStore.isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading projects...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProjects.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      <h3>No projects found</h3>
      <p v-if="selectedMachineId">
        Get started by creating your first project for this machine.
      </p>
      <p v-else>
        Select a machine to view or create projects.
      </p>
      <Button
        variant="primary"
        @click="$router.push({ name: 'projects.new' })"
      >
        Create Project
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
            <span class="stat-label">Active Instances</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ project.pending_tasks_count }}</span>
            <span class="stat-label">Pending Tasks</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ Math.round(project.token_usage_percent) }}%</span>
            <span class="stat-label">Token Usage</span>
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
            title="View"
            @click="goToProject(project.id)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </button>
          <button 
            class="action-btn" 
            title="Tasks"
            @click="goToTasks(project.id)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </button>
          <button 
            class="action-btn danger" 
            title="Delete"
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
    <Modal v-model="showCreateModal" title="Create New Project">
      <form @submit.prevent="createProject" class="project-form">
        <div class="form-group">
          <label>Project Name</label>
          <input 
            v-model="createForm.name" 
            type="text" 
            placeholder="My Awesome Project"
            required
          />
        </div>
        <div class="form-group">
          <div class="path-header">
            <label>Project Path</label>
            <button
              v-if="isSelectedMachineOnline"
              type="button"
              class="toggle-input-btn"
              @click="useManualInput = !useManualInput"
            >
              {{ useManualInput ? 'Browse files' : 'Manual input' }}
            </button>
          </div>

          <div v-if="useManualInput || !isSelectedMachineOnline">
            <input
              v-model="createForm.project_path"
              type="text"
              placeholder="/path/to/project"
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
          <label>Summary</label>
          <textarea 
            v-model="createForm.summary" 
            rows="3"
            placeholder="Brief description of the project"
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Architecture</label>
            <textarea 
              v-model="createForm.architecture" 
              rows="3"
              placeholder="System architecture notes"
            />
          </div>
          <div class="form-group">
            <label>Conventions</label>
            <textarea 
              v-model="createForm.conventions" 
              rows="3"
              placeholder="Coding conventions"
            />
          </div>
        </div>
        <div class="form-actions">
          <Button type="button" variant="secondary" @click="showCreateModal = false">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            :loading="projectsStore.isCreating"
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" title="Delete Project">
      <div class="delete-confirm">
        <p>Are you sure you want to delete <strong>{{ projectToDelete?.name }}</strong>?</p>
        <p class="warning">This action cannot be undone. All tasks, context, and locks will be permanently removed.</p>
        <div class="form-actions">
          <Button type="button" variant="secondary" @click="showDeleteModal = false">
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="danger"
            :loading="projectsStore.isDeleting"
            @click="deleteProject"
          >
            Delete Project
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '@/stores/projects';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import RemoteFileTree from '@/components/sessions/RemoteFileTree.vue';
import type { SharedProject } from '@/types';

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
    toast.error('Failed to load projects');
  }
}

function getMachineName(machineId: string): string {
  const machine = machinesStore.machines.find(m => m.id === machineId);
  return machine?.name || 'Unknown';
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
    toast.success('Project created successfully');
    showCreateModal.value = false;
    resetCreateForm();
  } catch (err) {
    toast.error('Failed to create project');
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
    toast.success('Project deleted successfully');
    showDeleteModal.value = false;
    projectToDelete.value = null;
  } catch (err) {
    toast.error('Failed to delete project');
  }
}
</script>

<style scoped>
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
  @apply text-3xl font-bold text-white;
}

.subtitle {
  @apply text-gray-400 mt-1;
}

.header-actions {
  @apply flex items-center gap-4;
}

.machine-select {
  @apply px-4 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white;
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
  @apply mt-4 text-gray-400;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-20 text-center;
}

.empty-state svg {
  @apply w-16 h-16 text-gray-600 mb-4;
}

.empty-state h3 {
  @apply text-xl font-semibold text-white mb-2;
}

.empty-state p {
  @apply text-gray-400 mb-6;
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
  @apply text-lg font-semibold text-white mb-1;
}

.project-path {
  @apply text-sm text-gray-400 truncate max-w-[200px];
}

.project-stats {
  @apply grid grid-cols-3 gap-4 mb-4;
}

.stat {
  @apply text-center;
}

.stat-value {
  @apply block text-2xl font-bold text-white;
}

.stat-label {
  @apply text-xs text-gray-400;
}

.project-footer {
  @apply space-y-3;
}

.token-bar {
  @apply h-2 bg-dark-3 rounded-full overflow-hidden;
}

.token-progress {
  @apply h-full bg-gradient-to-r from-brand-purple to-brand-indigo rounded-full transition-all duration-300;
}

.token-progress.is-high {
  @apply bg-gradient-to-r from-orange-500 to-red-500;
}

.machine-badge {
  @apply inline-flex items-center px-2 py-1 bg-dark-3 rounded text-xs text-gray-400;
}

.project-actions {
  @apply absolute top-4 right-4 flex items-center gap-1 opacity-0 transition-opacity duration-200;
}

.project-card:hover .project-actions {
  @apply opacity-100;
}

.action-btn {
  @apply p-2 rounded-lg bg-dark-3 text-gray-400 hover:text-white hover:bg-dark-4 transition-colors;
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
  @apply block text-sm font-medium text-gray-300;
}

.path-header {
  @apply flex items-center justify-between;
}

.toggle-input-btn {
  @apply text-xs text-brand-purple hover:underline transition-colors cursor-pointer;
}

.form-group input,
.form-group textarea {
  @apply w-full px-4 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple;
}

.form-group textarea {
  @apply resize-none;
}

.form-row {
  @apply grid grid-cols-2 gap-4;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-dark-4;
}

.delete-confirm {
  @apply space-y-4;
}

.delete-confirm p {
  @apply text-gray-300;
}

.delete-confirm .warning {
  @apply text-orange-400 text-sm;
}
</style>
