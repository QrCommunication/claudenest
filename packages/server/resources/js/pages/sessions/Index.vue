<template>
  <div class="sessions-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Sessions</h1>
        <p class="subtitle">Manage your Claude sessions across machines</p>
      </div>
      <router-link to="/sessions/new" class="btn-add">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        New Session
      </router-link>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ sessions.length }}</span>
          <span class="stat-label">Total Sessions</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon running">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ runningSessions.length }}</span>
          <span class="stat-label">Running</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ completedSessions.length }}</span>
          <span class="stat-label">Completed</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon errors">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ errorSessions.length }}</span>
          <span class="stat-label">Errors</span>
        </div>
      </div>
    </div>

    <!-- Machine Selector -->
    <div class="machine-selector">
      <Select
        v-model="selectedMachineId"
        :options="machineOptions"
        label="Machine"
        placeholder="Select a machine to view sessions"
        size="md"
        @change="handleMachineChange"
      />
      <button
        v-if="selectedMachineId"
        class="btn-refresh"
        :disabled="isLoading"
        title="Refresh sessions"
        @click="refreshSessions"
      >
        <svg
          :class="['w-5 h-5', { 'animate-spin': isLoading }]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && sessions.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading sessions...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="refreshSessions">Try Again</button>
    </div>

    <!-- No Machine Selected -->
    <div v-else-if="!selectedMachineId" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      </div>
      <h3>Select a machine</h3>
      <p>Choose a machine from the dropdown above to view its sessions.</p>
      <router-link
        v-if="machines.length === 0"
        to="/machines"
        class="btn-primary-link"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Add a Machine First
      </router-link>
    </div>

    <!-- Empty Sessions -->
    <div v-else-if="sessions.length === 0 && !isLoading" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>
      <h3>No sessions yet</h3>
      <p>This machine has no sessions. Start a new Claude session to get going.</p>
      <router-link to="/sessions/new" class="btn-primary-link">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Create First Session
      </router-link>
    </div>

    <!-- Sessions Table -->
    <div v-else class="sessions-table-wrapper">
      <Table
        :data="sessions"
        :columns="tableColumns"
        :is-loading="isLoading"
        empty-text="No sessions found"
        row-key="id"
      >
        <template #row="{ row: rawRow }">
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="session-id" :title="asSession(rawRow).id">
              {{ truncateId(asSession(rawRow).id) }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <Badge :variant="modeBadgeVariant(asSession(rawRow).mode)" size="sm">
              {{ asSession(rawRow).mode }}
            </Badge>
          </td>
          <td class="px-6 py-4">
            <span
              v-if="asSession(rawRow).project_path"
              class="project-path"
              :title="asSession(rawRow).project_path ?? undefined"
            >
              {{ truncatePath(asSession(rawRow).project_path ?? '') }}
            </span>
            <span v-else class="text-skin-secondary">N/A</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <Badge :variant="statusBadgeVariant(asSession(rawRow).status)" :dot="true" size="sm">
              {{ formatStatus(asSession(rawRow).status) }}
            </Badge>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-skin-primary">
            {{ asSession(rawRow).formatted_duration || '--' }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-skin-secondary">
            {{ formatRelativeTime(asSession(rawRow).created_at) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="actions-cell">
              <router-link
                v-if="asSession(rawRow).is_running"
                :to="`/sessions/${asSession(rawRow).id}`"
                class="action-btn attach"
                title="Attach to session"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Attach
              </router-link>
              <button
                v-if="asSession(rawRow).is_running"
                class="action-btn terminate"
                title="Terminate session"
                :disabled="terminatingId === asSession(rawRow).id"
                @click="handleTerminate(asSession(rawRow).id)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                {{ terminatingId === asSession(rawRow).id ? '...' : 'Stop' }}
              </button>
              <router-link
                v-if="!asSession(rawRow).is_running"
                :to="`/sessions/${asSession(rawRow).id}`"
                class="action-btn view"
                title="View session details"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                View
              </router-link>
            </div>
          </td>
        </template>
      </Table>
    </div>

    <!-- Terminate Confirmation Modal -->
    <div v-if="showTerminateModal" class="modal-overlay" @click.self="showTerminateModal = false">
      <div class="confirm-dialog">
        <div class="confirm-header">
          <div class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h3>Terminate Session</h3>
        </div>
        <p class="confirm-text">
          Are you sure you want to terminate session
          <strong class="text-skin-primary">{{ truncateId(sessionToTerminate ?? '') }}</strong>?
          This will end the running Claude instance.
        </p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="showTerminateModal = false">
            Cancel
          </button>
          <button
            class="btn-danger"
            :disabled="terminatingId !== null"
            @click="confirmTerminate"
          >
            <span v-if="terminatingId" class="spinner-sm"></span>
            {{ terminatingId ? 'Terminating...' : 'Terminate' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionsStore } from '@/stores/sessions';
import Table from '@/components/common/Table.vue';
import Badge from '@/components/common/Badge.vue';
import Select from '@/components/common/Select.vue';
import type { Session, TableColumn, SessionStatus, SessionMode, SelectOption } from '@/types';

const store = useSessionsStore();
const {
  sessions,
  machines,
  isLoading,
  error,
  runningSessions,
  completedSessions,
} = storeToRefs(store);

// Type cast helper for Table slot (row comes as unknown from generic Table)
function asSession(row: unknown): Session {
  return row as Session;
}

const selectedMachineId = ref<string | number>('');
const terminatingId = ref<string | null>(null);
const showTerminateModal = ref(false);
const sessionToTerminate = ref<string | null>(null);

// Computed: error sessions
const errorSessions = computed(() =>
  sessions.value.filter(s => s.status === 'error' || s.status === 'terminated')
);

// Computed: machine select options
const machineOptions = computed<SelectOption[]>(() =>
  machines.value.map(m => ({
    value: m.id,
    label: `${m.name} (${m.status})`,
    disabled: false,
  }))
);

// Table columns definition
const tableColumns: TableColumn[] = [
  { key: 'id', label: 'Session ID', width: '180px' },
  { key: 'mode', label: 'Mode', width: '120px' },
  { key: 'project_path', label: 'Project Path' },
  { key: 'status', label: 'Status', width: '140px' },
  { key: 'formatted_duration', label: 'Duration', width: '110px' },
  { key: 'created_at', label: 'Created', width: '140px', sortable: true },
  { key: 'actions', label: 'Actions', width: '180px' },
];

// -- Lifecycle --
onMounted(async () => {
  await store.fetchMachines();
  // Auto-select first online machine, or first machine if none online
  if (machines.value.length > 0) {
    const onlineMachine = machines.value.find(m => m.status === 'online');
    const target = onlineMachine ?? machines.value[0];
    selectedMachineId.value = target.id;
    await store.fetchSessions(target.id);
  }
});

// -- Handlers --
function handleMachineChange(value: string | number): void {
  const machineId = String(value);
  if (machineId) {
    store.fetchSessions(machineId);
  }
}

function refreshSessions(): void {
  if (selectedMachineId.value) {
    store.fetchSessions(String(selectedMachineId.value));
  }
}

function handleTerminate(sessionId: string): void {
  sessionToTerminate.value = sessionId;
  showTerminateModal.value = true;
}

async function confirmTerminate(): Promise<void> {
  if (!sessionToTerminate.value) return;
  terminatingId.value = sessionToTerminate.value;
  try {
    await store.terminateSession(sessionToTerminate.value);
    showTerminateModal.value = false;
    sessionToTerminate.value = null;
  } catch {
    // Error is handled by store
  } finally {
    terminatingId.value = null;
  }
}

// -- Formatters --
function truncateId(id: string): string {
  if (!id) return '';
  return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

function truncatePath(path: string): string {
  if (!path) return '';
  const parts = path.split('/');
  if (parts.length <= 3) return path;
  return `.../${parts.slice(-2).join('/')}`;
}

function formatStatus(status: SessionStatus): string {
  const labels: Record<SessionStatus, string> = {
    created: 'Created',
    starting: 'Starting',
    running: 'Running',
    waiting_input: 'Waiting',
    completed: 'Completed',
    error: 'Error',
    terminated: 'Terminated',
  };
  return labels[status] ?? status;
}

function statusBadgeVariant(status: SessionStatus): 'success' | 'error' | 'warning' | 'info' | 'default' | 'purple' {
  const map: Record<SessionStatus, 'success' | 'error' | 'warning' | 'info' | 'default' | 'purple'> = {
    created: 'default',
    starting: 'info',
    running: 'success',
    waiting_input: 'purple',
    completed: 'default',
    error: 'error',
    terminated: 'warning',
  };
  return map[status] ?? 'default';
}

function modeBadgeVariant(mode: SessionMode): 'info' | 'purple' | 'warning' {
  const map: Record<SessionMode, 'info' | 'purple' | 'warning'> = {
    interactive: 'info',
    headless: 'purple',
    oneshot: 'warning',
  };
  return map[mode] ?? 'info';
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '--';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
</script>

<style scoped>
.sessions-page {
  @apply p-6 space-y-6;
}

/* Header */
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
  @apply hover:opacity-90 hover:shadow-lg transition-all duration-200 no-underline;
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

.stat-icon.total {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.stat-icon.running {
  @apply bg-green-500/10 text-green-500;
}

.stat-icon.completed {
  @apply bg-brand-purple/10 text-brand-purple;
}

.stat-icon.errors {
  @apply bg-red-500/10 text-red-500;
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

/* Machine Selector */
.machine-selector {
  @apply flex items-end gap-3 p-4 bg-surface-2 rounded-xl border border-skin;
}

.machine-selector > :first-child {
  @apply flex-1;
}

.btn-refresh {
  @apply p-2.5 rounded-lg bg-surface-3 border border-skin text-skin-secondary;
  @apply hover:text-skin-primary hover:border-brand-purple/50 transition-all duration-200;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Sessions Table */
.sessions-table-wrapper {
  @apply bg-surface-2 rounded-xl border border-skin overflow-hidden;
}

.sessions-table-wrapper :deep(.rounded-card) {
  @apply rounded-none border-0;
}

.session-id {
  @apply font-mono text-sm text-brand-cyan;
}

.project-path {
  @apply text-sm text-skin-primary font-mono truncate max-w-[200px] block;
}

/* Actions */
.actions-cell {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 no-underline;
}

.action-btn.attach {
  @apply bg-green-500/10 text-green-400 border border-green-500/20;
  @apply hover:bg-green-500/20;
}

.action-btn.terminate {
  @apply bg-red-500/10 text-red-400 border border-red-500/20;
  @apply hover:bg-red-500/20;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-btn.view {
  @apply bg-surface-3 text-skin-secondary border border-skin;
  @apply hover:text-skin-primary hover:border-brand-purple/50;
}

/* Loading & Error & Empty States */
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

.error-state p {
  @apply text-skin-secondary mb-4;
}

.btn-secondary {
  @apply px-4 py-2 text-skin-primary hover:text-skin-primary transition-colors;
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

.btn-primary-link {
  @apply flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-indigo text-white rounded-lg font-medium;
  @apply hover:opacity-90 transition-opacity no-underline;
}

.btn-primary-link svg {
  @apply w-5 h-5;
}

/* Modal */
.modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(4px);
}

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

.btn-cancel {
  @apply px-4 py-2 text-skin-primary hover:text-skin-primary transition-colors;
}

.btn-danger {
  @apply flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium;
  @apply hover:bg-red-700 transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.spinner-sm {
  @apply inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full;
  animation: spin 1s linear infinite;
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
