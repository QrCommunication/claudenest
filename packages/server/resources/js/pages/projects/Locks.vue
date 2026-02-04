<template>
  <div class="file-locks-page">
    <div class="locks-header">
      <div class="header-stats">
        <div class="stat-box">
          <span class="stat-number">{{ locksStore.activeLocks.length }}</span>
          <span class="stat-label">Active Locks</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ uniqueInstances.length }}</span>
          <span class="stat-label">Instances</span>
        </div>
      </div>
      <Button variant="primary" @click="showLockModal = true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
        Lock File
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="locksStore.isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading locks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="locksStore.activeLocks.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 6c1.1 0 2 .9 2 2v2h-4V8c0-1.1.9-2 2-2z"/>
      </svg>
      <h3>No Active Locks</h3>
      <p>Files can be locked to prevent conflicts between instances.</p>
    </div>

    <!-- Locks List -->
    <div v-else class="locks-layout">
      <!-- Tree View -->
      <Card title="Lock Map" class="tree-card">
        <div class="lock-tree">
          <div 
            v-for="(locks, dir) in locksByDirectory" 
            :key="dir"
            class="tree-directory"
          >
            <div class="tree-dir-header" @click="toggleDir(dir)">
              <svg 
                viewBox="0 0 24 24" 
                fill="currentColor"
                :class="{ 'is-open': expandedDirs.includes(dir) }"
              >
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              <span>{{ dir || 'Root' }}</span>
              <span class="dir-count">{{ locks.length }}</span>
            </div>
            <div v-if="expandedDirs.includes(dir)" class="tree-files">
              <div 
                v-for="lock in locks" 
                :key="lock.id"
                class="tree-file"
                :class="{ selected: selectedLock?.id === lock.id }"
                @click="selectedLock = lock"
              >
                <FileLockIndicator 
                  :project-id="projectId" 
                  :file-path="lock.path"
                  :compact="true"
                />
                <span class="file-name">{{ getFileName(lock.path) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Locks Table -->
      <Card title="Active Locks" class="table-card">
        <div class="locks-table-container">
          <table class="locks-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Locked By</th>
                <th>Reason</th>
                <th>Time Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="lock in sortedLocks" 
                :key="lock.id"
                :class="{ 'is-selected': selectedLock?.id === lock.id }"
                @click="selectedLock = lock"
              >
                <td class="file-cell">
                  <FileLockIndicator 
                    :project-id="projectId" 
                    :file-path="lock.path"
                    :compact="true"
                  />
                  <span class="file-path">{{ lock.path }}</span>
                </td>
                <td class="instance-cell">
                  <code>{{ lock.locked_by.slice(0, 12) }}...</code>
                </td>
                <td class="reason-cell">
                  {{ lock.reason || 'No reason provided' }}
                </td>
                <td class="time-cell">
                  <span :class="{ 'is-expiring': lock.remaining_seconds < 300 }">
                    {{ formatRemaining(lock.remaining_seconds) }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button 
                    class="action-btn extend"
                    title="Extend lock"
                    @click.stop="extendLock(lock)"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                    </svg>
                  </button>
                  <button 
                    class="action-btn unlock"
                    title="Unlock"
                    @click.stop="unlockFile(lock)"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
                    </svg>
                  </button>
                  <button 
                    class="action-btn force"
                    title="Force unlock"
                    @click.stop="forceUnlock(lock)"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    <!-- Lock Detail Panel -->
    <Card v-if="selectedLock" title="Lock Details" class="detail-card">
      <div class="lock-detail">
        <div class="detail-row">
          <span class="detail-label">Path</span>
          <code class="detail-value">{{ selectedLock.path }}</code>
        </div>
        <div class="detail-row">
          <span class="detail-label">Locked By</span>
          <code class="detail-value">{{ selectedLock.locked_by }}</code>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reason</span>
          <span class="detail-value">{{ selectedLock.reason || 'No reason provided' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Locked At</span>
          <span class="detail-value">{{ formatDate(selectedLock.locked_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expires At</span>
          <span class="detail-value">{{ formatDate(selectedLock.expires_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Remaining</span>
          <span class="detail-value" :class="{ 'is-expiring': selectedLock.remaining_seconds < 300 }">
            {{ formatRemaining(selectedLock.remaining_seconds) }}
          </span>
        </div>
      </div>
    </Card>

    <!-- Lock File Modal -->
    <Modal v-model="showLockModal" title="Lock File">
      <form @submit.prevent="lockFile" class="lock-form">
        <div class="form-group">
          <label>File Path</label>
          <input 
            v-model="lockForm.path" 
            type="text" 
            placeholder="/path/to/file"
            required
          />
        </div>
        <div class="form-group">
          <label>Instance ID</label>
          <select v-model="lockForm.instance_id" required>
            <option value="">Select an instance</option>
            <option 
              v-for="instance in projectsStore.instances" 
              :key="instance.id" 
              :value="instance.id"
            >
              {{ instance.id.slice(0, 16) }}... ({{ instance.status }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Reason (optional)</label>
          <input 
            v-model="lockForm.reason" 
            type="text" 
            placeholder="Why are you locking this file?"
          />
        </div>
        <div class="form-group">
          <label>Duration (minutes)</label>
          <input 
            v-model.number="lockForm.duration_minutes" 
            type="number" 
            min="1"
            max="1440"
            placeholder="30"
          />
        </div>
        <div class="form-actions">
          <Button type="button" variant="secondary" @click="showLockModal = false">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            :loading="locksStore.isCreating"
          >
            Lock File
          </Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useLocksStore } from '@/stores/locks';
import { useProjectsStore } from '@/stores/projects';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import FileLockIndicator from '@/components/projects/FileLockIndicator.vue';
import type { FileLock } from '@/types';

const props = defineProps<{
  projectId?: string;
}>();

const route = useRoute();
const locksStore = useLocksStore();
const projectsStore = useProjectsStore();
const toast = useToast();

const projectId = computed(() => props.projectId || route.params.id as string);

const showLockModal = ref(false);
const selectedLock = ref<FileLock | null>(null);
const expandedDirs = ref<string[]>(['']);
const updateInterval = ref<number | null>(null);

const lockForm = ref({
  path: '',
  instance_id: '',
  reason: '',
  duration_minutes: 30,
});

const uniqueInstances = computed(() => {
  const instanceIds = new Set(locksStore.locks.map(l => l.locked_by));
  return Array.from(instanceIds);
});

const locksByDirectory = computed(() => {
  const grouped: Record<string, FileLock[]> = {};
  
  locksStore.activeLocks.forEach(lock => {
    const parts = lock.path.split('/');
    parts.pop(); // Remove filename
    const dir = parts.join('/') || '/';
    
    if (!grouped[dir]) {
      grouped[dir] = [];
    }
    grouped[dir].push(lock);
  });
  
  return grouped;
});

const sortedLocks = computed(() => {
  return [...locksStore.activeLocks].sort((a, b) => {
    // Sort by remaining time (ascending)
    return a.remaining_seconds - b.remaining_seconds;
  });
});

onMounted(async () => {
  await loadLocks();
  
  // Start countdown timer
  updateInterval.value = window.setInterval(() => {
    locksStore.updateRemainingTimes();
  }, 1000);
  
  // Fetch instances if needed
  if (projectsStore.instances.length === 0) {
    await projectsStore.fetchInstances(projectId.value);
  }
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});

async function loadLocks() {
  if (!projectId.value) return;
  
  try {
    await locksStore.fetchLocks(projectId.value);
  } catch (err) {
    toast.error('Failed to load locks');
  }
}

function toggleDir(dir: string) {
  const index = expandedDirs.value.indexOf(dir);
  if (index === -1) {
    expandedDirs.value.push(dir);
  } else {
    expandedDirs.value.splice(index, 1);
  }
}

function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function lockFile() {
  if (!projectId.value) return;
  
  try {
    await locksStore.lockFile(projectId.value, lockForm.value);
    showLockModal.value = false;
    resetLockForm();
    toast.success('File locked successfully');
  } catch (err) {
    toast.error('Failed to lock file');
  }
}

function resetLockForm() {
  lockForm.value = {
    path: '',
    instance_id: '',
    reason: '',
    duration_minutes: 30,
  };
}

async function unlockFile(lock: FileLock) {
  if (!projectId.value) return;
  
  try {
    await locksStore.unlockFile(projectId.value, lock.path, lock.locked_by);
    toast.success('File unlocked');
  } catch (err) {
    toast.error('Failed to unlock file');
  }
}

async function forceUnlock(lock: FileLock) {
  if (!projectId.value) return;
  if (!confirm('Force unlock this file? This may cause conflicts.')) return;
  
  try {
    await locksStore.forceUnlock(projectId.value, lock.path);
    toast.success('File force unlocked');
  } catch (err) {
    toast.error('Failed to force unlock');
  }
}

async function extendLock(lock: FileLock) {
  if (!projectId.value) return;
  
  try {
    await locksStore.extendLock(projectId.value, lock.path, lock.locked_by, 30);
    toast.success('Lock extended by 30 minutes');
  } catch (err) {
    toast.error('Failed to extend lock');
  }
}
</script>

<style scoped>
.file-locks-page {
  @apply space-y-6;
}

.locks-header {
  @apply flex items-center justify-between;
}

.header-stats {
  @apply flex items-center gap-4;
}

.stat-box {
  @apply flex flex-col items-center px-4 py-2 bg-dark-2 rounded-lg border border-dark-4;
}

.stat-number {
  @apply text-2xl font-bold text-white;
}

.stat-label {
  @apply text-xs text-gray-400;
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
  @apply w-16 h-16 text-gray-600 mb-4;
}

.empty-state h3 {
  @apply text-xl font-semibold text-white mb-2;
}

.empty-state p {
  @apply text-gray-400;
}

.locks-layout {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.tree-card {
  @apply lg:col-span-1;
}

.table-card {
  @apply lg:col-span-2;
}

.lock-tree {
  @apply space-y-2 max-h-96 overflow-y-auto;
}

.tree-directory {
  @apply space-y-1;
}

.tree-dir-header {
  @apply flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-dark-3;
}

.tree-dir-header svg {
  @apply w-5 h-5 text-brand-purple;
  transition: transform 0.2s;
}

.tree-dir-header svg.is-open {
  transform: rotate(0deg);
}

.tree-dir-header span {
  @apply text-sm font-medium text-white;
}

.dir-count {
  @apply ml-auto text-xs text-gray-400 bg-dark-3 px-2 py-0.5 rounded-full;
}

.tree-files {
  @apply ml-6 space-y-1;
}

.tree-file {
  @apply flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-dark-3;
}

.tree-file.selected {
  @apply bg-brand-purple/10 border border-brand-purple/30;
}

.file-name {
  @apply text-sm text-gray-300 truncate;
}

.locks-table-container {
  @apply overflow-x-auto;
}

.locks-table {
  @apply w-full text-sm;
}

.locks-table th {
  @apply text-left text-gray-400 font-medium py-3 px-4 border-b border-dark-4;
}

.locks-table td {
  @apply py-3 px-4 border-b border-dark-4;
}

.locks-table tbody tr {
  @apply hover:bg-dark-3/50 cursor-pointer transition-colors;
}

.locks-table tbody tr.is-selected {
  @apply bg-brand-purple/10;
}

.file-cell {
  @apply flex items-center gap-2;
}

.file-path {
  @apply text-white truncate max-w-[200px];
}

.instance-cell code {
  @apply text-xs text-gray-400;
}

.reason-cell {
  @apply text-gray-300 max-w-[150px] truncate;
}

.time-cell span {
  @apply text-gray-300;
}

.time-cell span.is-expiring {
  @apply text-orange-400 font-medium;
}

.actions-cell {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply p-1.5 rounded text-gray-400 hover:text-white transition-colors;
}

.action-btn svg {
  @apply w-4 h-4;
}

.action-btn.extend:hover {
  @apply text-brand-cyan;
}

.action-btn.unlock:hover {
  @apply text-green-400;
}

.action-btn.force:hover {
  @apply text-orange-400;
}

.detail-card {
  @apply space-y-4;
}

.lock-detail {
  @apply space-y-3;
}

.detail-row {
  @apply flex items-center justify-between py-2 border-b border-dark-4 last:border-0;
}

.detail-label {
  @apply text-sm text-gray-400;
}

.detail-value {
  @apply text-sm text-white;
}

.detail-value.is-expiring {
  @apply text-orange-400 font-medium;
}

.lock-form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-gray-300;
}

.form-group input,
.form-group select {
  @apply w-full px-4 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4;
}
</style>
