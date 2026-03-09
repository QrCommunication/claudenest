<template>
  <div class="machines-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Machines</h1>
        <p class="subtitle">Manage your ClaudeNest connected machines</p>
      </div>
      <button class="btn-add" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Add Machine
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon online">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ onlineMachines.length }}</span>
          <span class="stat-label">Online</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon offline">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ offlineMachines.length }}</span>
          <span class="stat-label">Offline</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon sessions">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalActiveSessions }}</span>
          <span class="stat-label">Active Sessions</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ machines.length }}</span>
          <span class="stat-label">Total Machines</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search machines..."
          @input="handleSearch"
        />
      </div>

      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          :class="['tab', { active: filters.status === tab.value }]"
          @click="setStatusFilter(tab.value)"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <div class="view-toggle">
        <button
          :class="['toggle-btn', { active: viewMode === 'grid' }]"
          @click="viewMode = 'grid'"
          title="Grid view"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
          </svg>
        </button>
        <button
          :class="['toggle-btn', { active: viewMode === 'list' }]"
          @click="viewMode = 'list'"
          title="List view"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading machines...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="refresh">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMachines.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      </div>
      <h3>{{ machines.length === 0 ? 'No machines yet' : 'No machines found' }}</h3>
      <p v-if="machines.length === 0">
        Get started by adding your first machine to connect with ClaudeNest.
      </p>
      <p v-else>
        No machines match your current filters. Try adjusting your search.
      </p>
      <button v-if="machines.length === 0" class="btn-primary" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Add Your First Machine
      </button>
      <button v-else class="btn-secondary" @click="clearFilters">
        Clear Filters
      </button>
    </div>

    <!-- Machines Grid -->
    <div
      v-else
      :class="['machines-container', { 'grid-view': viewMode === 'grid', 'list-view': viewMode === 'list' }]"
    >
      <MachineCard
        v-for="machine in filteredMachines"
        :key="machine.id"
        :machine="machine"
        @click="navigateToDetail"
        @connect="connectToMachine"
        @edit="editMachine"
        @delete="confirmDelete"
        @wake="wakeMachine"
      />
    </div>

    <!-- Pagination -->
    <div v-if="!isLoading && filteredMachines.length > 0 && pagination.lastPage > 1" class="pagination">
      <button
        :disabled="pagination.currentPage === 1"
        class="page-btn"
        @click="changePage(pagination.currentPage - 1)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      <span class="page-info">
        Page {{ pagination.currentPage }} of {{ pagination.lastPage }}
      </span>
      <button
        :disabled="pagination.currentPage === pagination.lastPage"
        class="page-btn"
        @click="changePage(pagination.currentPage + 1)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <MachineForm
      ref="formRef"
      :is-open="showAddModal || showEditModal"
      :machine="machineToEdit"
      @close="closeModal"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="confirm-dialog">
        <div class="confirm-header">
          <div class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h3>Delete Machine</h3>
        </div>
        <p class="confirm-text">
          Are you sure you want to delete <strong>{{ machineToDelete?.name }}</strong>?
          This will terminate all active sessions and cannot be undone.
        </p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="showDeleteModal = false">
            Cancel
          </button>
          <button 
            class="btn-danger"
            :disabled="isDeleting"
            @click="executeDelete"
          >
            <span v-if="isDeleting" class="spinner"></span>
            {{ isDeleting ? 'Deleting...' : 'Delete Machine' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useMachinesStore } from '@/stores/machines';
import MachineCard from '@/components/machines/MachineCard.vue';
import MachineForm from '@/components/machines/MachineForm.vue';
import type { Machine, MachineStatus, CreateMachineForm, UpdateMachineForm } from '@/types';

const router = useRouter();
const machinesStore = useMachinesStore();

const { 
  machines, 
  isLoading, 
  error, 
  pagination,
  filters,
  onlineMachines,
  offlineMachines,
  totalActiveSessions,
  filteredMachines,
} = storeToRefs(machinesStore);

const viewMode = ref<'grid' | 'list'>('grid');
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const machineToEdit = ref<Machine | null>(null);
const machineToDelete = ref<Machine | null>(null);
const isDeleting = ref(false);
const formRef = ref<InstanceType<typeof MachineForm>>();

const filterTabs = computed(() => [
  { value: 'all' as const, label: 'All', count: machines.value.length },
  { value: 'online' as const, label: 'Online', count: onlineMachines.value.length },
  { value: 'offline' as const, label: 'Offline', count: offlineMachines.value.length },
  { value: 'connecting' as const, label: 'Connecting', count: machines.value.filter(m => m.status === 'connecting').length },
]);

onMounted(() => {
  machinesStore.fetchMachines();
});

function handleSearch() {
  machinesStore.setFilters({ search: filters.value.search });
  machinesStore.fetchMachines();
}

function setStatusFilter(status: MachineStatus | 'all') {
  machinesStore.setFilters({ status });
  machinesStore.fetchMachines();
}

function clearFilters() {
  machinesStore.setFilters({ search: '', status: 'all' });
  machinesStore.fetchMachines();
}

function changePage(page: number) {
  machinesStore.fetchMachines(page);
}

function refresh() {
  machinesStore.fetchMachines();
}

function navigateToDetail(machine: Machine) {
  router.push({ name: 'machine.show', params: { id: machine.id } });
}

function connectToMachine(machine: Machine) {
  if (machine.status !== 'online') return;
  router.push({ name: 'machine.show', params: { id: machine.id }, query: { connect: 'true' } });
}

function editMachine(machine: Machine) {
  machineToEdit.value = machine;
  showEditModal.value = true;
}

function closeModal() {
  showAddModal.value = false;
  showEditModal.value = false;
  machineToEdit.value = null;
}

async function handleSubmit(data: CreateMachineForm | UpdateMachineForm) {
  try {
    if (machineToEdit.value) {
      await machinesStore.updateMachine(machineToEdit.value.id, data as UpdateMachineForm);
      closeModal();
    } else {
      const result = await machinesStore.createMachine(data as CreateMachineForm);
      // Show token in the form
      formRef.value?.showToken(result.token);
    }
  } catch (err) {
    // Error is handled by store
  }
}

function confirmDelete(machine: Machine) {
  machineToDelete.value = machine;
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!machineToDelete.value) return;
  
  isDeleting.value = true;
  try {
    await machinesStore.deleteMachine(machineToDelete.value.id);
    showDeleteModal.value = false;
    machineToDelete.value = null;
  } finally {
    isDeleting.value = false;
  }
}

async function wakeMachine(id: string) {
  try {
    await machinesStore.wakeMachine(id);
  } catch (err) {
    // Error is handled by store
  }
}
</script>

<style scoped>
.machines-page {
  @apply p-6 space-y-6;
}

.page-header {
  @apply flex items-center justify-between;
}

.header-content h1 {
  @apply text-3xl font-bold text-skin-primary;
}

.subtitle {
  @apply text-skin-secondary mt-1;
}

.btn-add {
  @apply flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-indigo text-white rounded-lg font-medium;
  @apply hover:opacity-90 hover:shadow-lg transition-all duration-200;
}

.btn-add svg {
  @apply w-5 h-5;
}

/* Stats Grid */
.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-card {
  @apply flex items-center gap-3 p-4 bg-surface-2 rounded-xl border border-skin;
}

.stat-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center;
}

.stat-icon svg {
  @apply w-6 h-6;
}

.stat-icon.online {
  @apply bg-green-500/10 text-green-500;
}

.stat-icon.offline {
  @apply bg-red-500/10 text-red-500;
}

.stat-icon.sessions {
  @apply bg-brand-purple/10 text-brand-purple;
}

.stat-icon.total {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.stat-info {
  @apply flex flex-col;
}

.stat-value {
  @apply text-2xl font-bold text-skin-primary;
}

.stat-label {
  @apply text-sm text-skin-secondary;
}

/* Filters */
.filters-bar {
  @apply flex flex-wrap items-center gap-4 p-4 bg-surface-2 rounded-xl border border-skin;
}

.search-box {
  @apply flex items-center gap-2 flex-1 min-w-[200px];
  @apply px-3 py-2 bg-surface-3 rounded-lg border border-skin;
}

.search-box svg {
  @apply w-5 h-5 text-skin-secondary;
}

.search-box input {
  @apply flex-1 bg-transparent text-skin-primary placeholder-skin-secondary outline-none;
}

.filter-tabs {
  @apply flex items-center gap-1;
}

.tab {
  @apply flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-skin-secondary transition-colors;
}

.tab:hover {
  @apply text-skin-primary bg-surface-3;
}

.tab.active {
  @apply text-white bg-brand-purple/20;
}

.tab-count {
  @apply px-1.5 py-0.5 text-xs rounded-full bg-surface-4;
}

.view-toggle {
  @apply flex items-center gap-1 ml-auto;
}

.toggle-btn {
  @apply p-2 rounded-lg text-skin-secondary transition-colors;
}

.toggle-btn:hover {
  @apply text-skin-primary bg-surface-3;
}

.toggle-btn.active {
  @apply text-white bg-brand-purple;
}

.toggle-btn svg {
  @apply w-5 h-5;
}

/* Loading & Error States */
.loading-state,
.error-state,
.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-center;
}

.loading-state .spinner {
  @apply w-10 h-10 border-4 border-brand-purple/30 border-t-brand-purple rounded-full mb-4;
  animation: spin 1s linear infinite;
}

.error-state svg {
  @apply w-16 h-16 text-red-500 mb-4;
}

.empty-icon {
  @apply w-20 h-20 rounded-full bg-surface-3 flex items-center justify-center mb-4;
}

.empty-icon svg {
  @apply w-10 h-10 text-skin-secondary;
}

.empty-state h3 {
  @apply text-xl font-semibold text-skin-primary mb-2;
}

.empty-state p {
  @apply text-skin-secondary max-w-md mb-6;
}

.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-indigo text-white rounded-lg font-medium;
  @apply hover:opacity-90 transition-opacity;
}

.btn-primary svg {
  @apply w-5 h-5;
}

.btn-secondary {
  @apply px-4 py-2 text-skin-primary hover:text-skin-primary transition-colors;
}

/* Machines Container */
.machines-container {
  @apply transition-all duration-200;
}

.machines-container.grid-view {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.machines-container.list-view {
  @apply flex flex-col gap-2;
}

/* Pagination */
.pagination {
  @apply flex items-center justify-center gap-4 mt-6;
}

.page-btn {
  @apply p-2 rounded-lg text-skin-secondary hover:text-skin-primary hover:bg-surface-2 transition-colors;
}

.page-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.page-btn svg {
  @apply w-5 h-5;
}

.page-info {
  @apply text-sm text-skin-secondary;
}

/* Modal Overlay */
.modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(4px);
}

/* Confirm Dialog */
.confirm-dialog {
  @apply w-full max-w-md bg-surface-2 rounded-2xl border border-skin p-6;
  animation: modalIn 0.2s ease-out;
}

.confirm-header {
  @apply flex items-center gap-3 mb-4;
}

.confirm-icon {
  @apply w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center;
}

.confirm-icon svg {
  @apply w-6 h-6 text-red-500;
}

.confirm-header h3 {
  @apply text-xl font-semibold text-skin-primary;
}

.confirm-text {
  @apply text-skin-secondary mb-6;
}

.confirm-actions {
  @apply flex items-center justify-end gap-3;
}

.btn-danger {
  @apply flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium;
  @apply hover:bg-red-600 transition-colors;
}

.btn-danger:disabled {
  @apply opacity-50 cursor-not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
