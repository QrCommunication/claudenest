<template>
  <div class="machine-detail-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading machine details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !machine" class="error-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>{{ error || 'Machine not found' }}</p>
      <button class="btn-secondary" @click="goBack">Go Back</button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div class="machine-title">
            <div class="title-row">
              <StatusDot :status="machine.status" />
              <h1>{{ machine.display_name }}</h1>
            </div>
            <p class="subtitle">{{ machine.hostname || 'No hostname' }} • {{ platformLabel }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            v-if="machine.status === 'offline' && machineHasWakeOnLan"
            class="btn-action wake"
            @click="wakeMachine"
            :disabled="isWaking"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
            </svg>
            {{ isWaking ? 'Waking...' : 'Wake' }}
          </button>
          <button
            class="btn-action connect"
            :disabled="machine.status !== 'online'"
            @click="startNewSession"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            New Session
          </button>
          <button class="btn-action edit" @click="showEditModal = true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit
          </button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Left Column -->
        <div class="main-column">
          <!-- Info Card -->
          <div class="card">
            <h2 class="card-title">System Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Platform</span>
                <div class="info-value platform">
                  <PlatformIcon :platform="machine.platform" />
                  <span>{{ platformLabel }}</span>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Architecture</span>
                <span class="info-value">{{ machine.arch || 'Unknown' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Agent Version</span>
                <span class="info-value">{{ machine.agent_version || 'Unknown' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Node Version</span>
                <span class="info-value">{{ machine.node_version || 'Unknown' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Claude Version</span>
                <span class="info-value">{{ machine.claude_version || 'Unknown' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Claude Path</span>
                <span class="info-value path" :title="machine.claude_path || ''">
                  {{ machine.claude_path || 'Unknown' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Capabilities Card -->
          <div class="card">
            <h2 class="card-title">Capabilities</h2>
            <div v-if="machine.capabilities?.length" class="capabilities-list">
              <span
                v-for="cap in machine.capabilities"
                :key="cap"
                class="capability-tag"
              >
                {{ formatCapability(cap) }}
              </span>
            </div>
            <p v-else class="empty-text">No capabilities configured</p>
          </div>

          <!-- Sessions Section -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                Active Sessions
                <span class="session-count">{{ machine.active_sessions_count }}</span>
              </h2>
              <button
                v-if="machine.can_accept_more_sessions && machine.status === 'online'"
                class="btn-sm"
                @click="startNewSession"
              >
                Start New
              </button>
            </div>

            <div v-if="sessionsLoading" class="section-loading">
              <div class="spinner-sm"></div>
            </div>

            <div v-else-if="sessions.length === 0" class="empty-sessions">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <p>No active sessions</p>
              <button
                v-if="machine.status === 'online'"
                class="btn-sm"
                @click="startNewSession"
              >
                Start a session
              </button>
            </div>

            <div v-else class="sessions-list">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="session-item"
                :class="{ 'running': session.is_running }"
              >
                <div class="session-info">
                  <div class="session-status" :class="session.status"></div>
                  <div class="session-details">
                    <span class="session-mode">{{ session.mode }}</span>
                    <span class="session-path" v-if="session.project_path">
                      {{ session.project_path }}
                    </span>
                  </div>
                </div>
                <div class="session-meta">
                  <span class="session-time">{{ session.formatted_duration }}</span>
                  <button class="btn-icon" @click="viewSession(session.id)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Timeline -->
          <div class="card">
            <h2 class="card-title">Activity</h2>
            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-icon connected">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div class="activity-content">
                  <p class="activity-text">Machine connected</p>
                  <p class="activity-time">{{ machine.connected_at_human || 'Unknown' }}</p>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon seen">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
                <div class="activity-content">
                  <p class="activity-text">Last seen</p>
                  <p class="activity-time">{{ machine.last_seen_human || 'Never' }}</p>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon created">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                  </svg>
                </div>
                <div class="activity-content">
                  <p class="activity-text">Machine added</p>
                  <p class="activity-time">{{ machine.created_at_human }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Settings & Danger Zone -->
        <div class="side-column">
          <!-- Settings Card -->
          <div class="card">
            <h2 class="card-title">Settings</h2>
            <div class="settings-list">
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-name">Maximum Sessions</span>
                  <span class="setting-desc">Concurrent Claude sessions allowed</span>
                </div>
                <span class="setting-value">{{ machine.max_sessions }}</span>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-name">Active Sessions</span>
                  <span class="setting-desc">Currently running sessions</span>
                </div>
                <span class="setting-value" :class="{ 'at-limit': !machine.can_accept_more_sessions }">
                  {{ machine.active_sessions_count }} / {{ machine.max_sessions }}
                </span>
              </div>
            </div>
          </div>

          <!-- Token Management -->
          <div class="card">
            <h2 class="card-title">Authentication</h2>
            <p class="card-desc">Regenerate the machine token if you need to reconfigure the agent.</p>
            <button
              class="btn-secondary"
              @click="regenerateToken"
              :disabled="isRegeneratingToken"
            >
              <span v-if="isRegeneratingToken" class="spinner-sm"></span>
              {{ isRegeneratingToken ? 'Regenerating...' : 'Regenerate Token' }}
            </button>
          </div>

          <!-- Danger Zone -->
          <div class="card danger">
            <h2 class="card-title">Danger Zone</h2>
            <div class="danger-item">
              <div class="danger-info">
                <span class="danger-name">Delete Machine</span>
                <span class="danger-desc">This will permanently remove the machine and terminate all sessions.</span>
              </div>
              <button class="btn-danger" @click="showDeleteModal = true">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <MachineForm
        :is-open="showEditModal"
        :machine="machine"
        @close="showEditModal = false"
        @submit="handleUpdate"
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
            Are you sure you want to delete <strong>{{ machine.name }}</strong>?
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

      <!-- Token Display Modal -->
      <div v-if="newToken" class="modal-overlay" @click.self="newToken = ''">
        <div class="confirm-dialog">
          <div class="confirm-header">
            <div class="confirm-icon success">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3>Token Regenerated</h3>
          </div>
          <p class="confirm-text">
            Copy this token and update your machine configuration. This token will only be shown once.
          </p>
          <div class="token-display">
            <code>{{ newToken }}</code>
            <button class="btn-icon" @click="copyToken">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
          </div>
          <div class="confirm-actions">
            <button class="btn-primary" @click="newToken = ''">
              Done
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useMachinesStore } from '@/stores/machines';
import StatusDot from '@/components/machines/StatusDot.vue';
import PlatformIcon from '@/components/machines/PlatformIcon.vue';
import MachineForm from '@/components/machines/MachineForm.vue';
import type { Machine, Session, UpdateMachineForm, MachinePlatform } from '@/types';

const router = useRouter();
const route = useRoute();
const machinesStore = useMachinesStore();

const { isLoading, error } = storeToRefs(machinesStore);

const machine = ref<Machine | null>(null);
const sessions = ref<Session[]>([]);
const sessionsLoading = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const isWaking = ref(false);
const isRegeneratingToken = ref(false);
const newToken = ref('');

const platformLabel = computed(() => {
  const labels: Record<MachinePlatform, string> = {
    darwin: 'macOS',
    win32: 'Windows',
    linux: 'Linux',
  };
  return machine.value ? labels[machine.value.platform] || 'Unknown' : 'Unknown';
});

const machineHasWakeOnLan = computed(() => 
  machine.value?.capabilities?.includes('wake_on_lan') || false
);

onMounted(async () => {
  const machineId = route.params.id as string;
  if (machineId) {
    await loadMachine(machineId);
    await loadSessions(machineId);
    
    // Check if we should auto-connect
    if (route.query.connect === 'true' && machine.value?.status === 'online') {
      startNewSession();
    }
  }
});

async function loadMachine(id: string) {
  try {
    machine.value = await machinesStore.fetchMachine(id);
  } catch (err) {
    // Error is handled by store
  }
}

async function loadSessions(id: string) {
  sessionsLoading.value = true;
  try {
    sessions.value = await machinesStore.fetchMachineSessions(id);
  } finally {
    sessionsLoading.value = false;
  }
}

function goBack() {
  router.push({ name: 'machines' });
}

async function handleUpdate(data: UpdateMachineForm) {
  if (!machine.value) return;
  
  try {
    await machinesStore.updateMachine(machine.value.id, data);
    showEditModal.value = false;
    // Refresh machine data
    await loadMachine(machine.value.id);
  } catch (err) {
    // Error is handled by store
  }
}

function confirmDelete() {
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!machine.value) return;
  
  isDeleting.value = true;
  try {
    await machinesStore.deleteMachine(machine.value.id);
    router.push({ name: 'machines' });
  } finally {
    isDeleting.value = false;
  }
}

async function wakeMachine() {
  if (!machine.value) return;
  
  isWaking.value = true;
  try {
    await machinesStore.wakeMachine(machine.value.id);
    await loadMachine(machine.value.id);
  } finally {
    isWaking.value = false;
  }
}

async function regenerateToken() {
  if (!machine.value) return;
  
  isRegeneratingToken.value = true;
  try {
    const token = await machinesStore.regenerateToken(machine.value.id);
    newToken.value = token;
  } finally {
    isRegeneratingToken.value = false;
  }
}

function copyToken() {
  navigator.clipboard.writeText(newToken.value);
}

function startNewSession() {
  if (!machine.value || machine.value.status !== 'online') return;
  router.push({ name: 'sessions.new', query: { machine: machine.value.id } });
}

function viewSession(sessionId: string) {
  router.push({ name: 'sessions.show', params: { id: sessionId } });
}

function formatCapability(cap: string): string {
  return cap
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
</script>

<style scoped>
.machine-detail-page {
  @apply p-6;
}

.loading-state,
.error-state {
  @apply flex flex-col items-center justify-center py-20;
}

.loading-state .spinner {
  @apply w-12 h-12 border-4 border-brand-purple/30 border-t-brand-purple rounded-full mb-4;
  animation: spin 1s linear infinite;
}

.error-state svg {
  @apply w-16 h-16 text-red-500 mb-4;
}

.error-state p {
  @apply text-gray-400 mb-4;
}

/* Header */
.page-header {
  @apply flex items-center justify-between mb-8;
}

.header-left {
  @apply flex items-center gap-4;
}

.back-btn {
  @apply p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-2 transition-colors;
}

.back-btn svg {
  @apply w-6 h-6;
}

.machine-title h1 {
  @apply text-2xl font-bold text-white;
}

.title-row {
  @apply flex items-center gap-2;
}

.subtitle {
  @apply text-gray-400 text-sm;
}

.header-actions {
  @apply flex items-center gap-2;
}

.btn-action {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200;
}

.btn-action svg {
  @apply w-4 h-4;
}

.btn-action.wake {
  @apply text-amber-400 bg-amber-400/10 hover:bg-amber-400/20;
}

.btn-action.connect {
  @apply text-white bg-gradient-to-r from-brand-purple to-brand-indigo;
  @apply hover:opacity-90;
}

.btn-action.connect:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-action.edit {
  @apply text-gray-300 bg-dark-2 hover:text-white hover:bg-dark-3;
}

/* Content Grid */
.content-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.main-column {
  @apply lg:col-span-2 space-y-6;
}

.side-column {
  @apply space-y-6;
}

/* Cards */
.card {
  @apply bg-dark-2 rounded-xl border border-dark-4 p-6;
}

.card-title {
  @apply text-lg font-semibold text-white mb-4 flex items-center gap-2;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-desc {
  @apply text-sm text-gray-400 mb-4;
}

.card.danger {
  @apply border-red-500/30;
}

.card.danger .card-title {
  @apply text-red-400;
}

/* Info Grid */
.info-grid {
  @apply grid grid-cols-2 md:grid-cols-3 gap-4;
}

.info-item {
  @apply space-y-1;
}

.info-label {
  @apply text-xs text-gray-500 uppercase tracking-wide;
}

.info-value {
  @apply text-sm text-white font-medium;
}

.info-value.platform {
  @apply flex items-center gap-2;
}

.info-value.path {
  @apply truncate;
}

/* Capabilities */
.capabilities-list {
  @apply flex flex-wrap gap-2;
}

.capability-tag {
  @apply px-3 py-1 text-sm rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20;
}

.empty-text {
  @apply text-gray-500 italic;
}

/* Sessions */
.session-count {
  @apply px-2 py-0.5 text-sm rounded-full bg-dark-3 text-gray-400;
}

.section-loading {
  @apply flex items-center justify-center py-8;
}

.spinner-sm {
  @apply w-6 h-6 border-2 border-brand-purple/30 border-t-brand-purple rounded-full;
  animation: spin 1s linear infinite;
}

.empty-sessions {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.empty-sessions svg {
  @apply w-12 h-12 text-gray-600 mb-3;
}

.empty-sessions p {
  @apply text-gray-500 mb-4;
}

.sessions-list {
  @apply space-y-2;
}

.session-item {
  @apply flex items-center justify-between p-3 rounded-lg bg-dark-3 border border-transparent;
  @apply hover:border-dark-4 transition-colors;
}

.session-item.running {
  @apply border-green-500/30 bg-green-500/5;
}

.session-info {
  @apply flex items-center gap-3;
}

.session-status {
  @apply w-2 h-2 rounded-full;
}

.session-status.running,
.session-status.waiting_input {
  @apply bg-green-500;
}

.session-status.starting,
.session-status.created {
  @apply bg-amber-400;
}

.session-status.completed {
  @apply bg-blue-500;
}

.session-status.error,
.session-status.terminated {
  @apply bg-red-500;
}

.session-details {
  @apply flex flex-col;
}

.session-mode {
  @apply text-sm font-medium text-white capitalize;
}

.session-path {
  @apply text-xs text-gray-500 truncate max-w-[200px];
}

.session-meta {
  @apply flex items-center gap-3;
}

.session-time {
  @apply text-sm text-gray-500;
}

/* Activity */
.activity-list {
  @apply space-y-4;
}

.activity-item {
  @apply flex items-start gap-3;
}

.activity-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
}

.activity-icon svg {
  @apply w-4 h-4;
}

.activity-icon.connected {
  @apply bg-green-500/10 text-green-500;
}

.activity-icon.seen {
  @apply bg-brand-purple/10 text-brand-purple;
}

.activity-icon.created {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.activity-content {
  @apply flex flex-col;
}

.activity-text {
  @apply text-sm text-white;
}

.activity-time {
  @apply text-xs text-gray-500;
}

/* Settings */
.settings-list {
  @apply space-y-4;
}

.setting-item {
  @apply flex items-center justify-between;
}

.setting-info {
  @apply flex flex-col;
}

.setting-name {
  @apply text-sm font-medium text-white;
}

.setting-desc {
  @apply text-xs text-gray-500;
}

.setting-value {
  @apply text-sm text-white font-mono;
}

.setting-value.at-limit {
  @apply text-red-400;
}

/* Danger Zone */
.danger-item {
  @apply flex items-center justify-between;
}

.danger-info {
  @apply flex flex-col;
}

.danger-name {
  @apply text-sm font-medium text-white;
}

.danger-desc {
  @apply text-xs text-gray-500;
}

/* Buttons */
.btn-sm {
  @apply px-3 py-1.5 text-sm rounded-lg font-medium;
  @apply bg-brand-purple text-white hover:bg-brand-purple/90 transition-colors;
}

.btn-secondary {
  @apply flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium;
  @apply text-gray-300 bg-dark-3 hover:text-white hover:bg-dark-4 transition-colors;
}

.btn-danger {
  @apply px-4 py-2 rounded-lg font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors;
}

.btn-primary {
  @apply px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-brand-purple to-brand-indigo;
  @apply hover:opacity-90 transition-opacity;
}

.btn-icon {
  @apply p-1 rounded-lg text-gray-400 hover:text-white hover:bg-dark-4 transition-colors;
}

.btn-icon svg {
  @apply w-5 h-5;
}

/* Modal */
.modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  @apply w-full max-w-md bg-dark-2 rounded-2xl border border-dark-4 p-6;
  animation: modalIn 0.2s ease-out;
}

.confirm-header {
  @apply flex items-center gap-3 mb-4;
}

.confirm-icon {
  @apply w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center;
}

.confirm-icon.success {
  @apply bg-green-500/10;
}

.confirm-icon svg {
  @apply w-6 h-6 text-red-500;
}

.confirm-icon.success svg {
  @apply text-green-500;
}

.confirm-header h3 {
  @apply text-xl font-semibold text-white;
}

.confirm-text {
  @apply text-gray-400 mb-6;
}

.confirm-actions {
  @apply flex items-center justify-end gap-3;
}

.token-display {
  @apply flex items-center gap-2 p-3 mb-6 bg-dark-3 rounded-lg;
}

.token-display code {
  @apply flex-1 text-sm font-mono text-brand-cyan break-all;
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
