<template>
  <div class="project-show-page">
    <!-- Loading State -->
    <div v-if="projectsStore.isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading project...</p>
    </div>

    <template v-else-if="project">
      <!-- Header -->
      <div class="project-header">
        <div class="header-content">
          <div class="header-title">
            <router-link to="/projects" class="back-link">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Projects
            </router-link>
            <h1>{{ project.name }}</h1>
            <p class="project-path">{{ project.project_path }}</p>
          </div>
          <div class="header-actions">
            <div class="token-usage">
              <span class="token-label">Token Usage</span>
              <div class="token-bar">
                <div 
                  class="token-progress" 
                  :style="{ width: `${project.token_usage_percent}%` }"
                  :class="{ 'is-high': project.token_usage_percent > 80 }"
                />
              </div>
              <span class="token-value">{{ Math.round(project.token_usage_percent) }}%</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="tab.icon" />
            </svg>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <div class="overview-grid">
            <Card title="Project Info" class="info-card">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Machine</span>
                  <span class="info-value">{{ machineName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Path</span>
                  <span class="info-value">{{ project.project_path }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Created</span>
                  <span class="info-value">{{ formatDate(project.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Updated</span>
                  <span class="info-value">{{ formatDate(project.updated_at) }}</span>
                </div>
              </div>
            </Card>

            <Card title="Statistics" class="stats-card">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.total_tasks ?? 0 }}</span>
                  <span class="stat-label">Total Tasks</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.pending_tasks ?? 0 }}</span>
                  <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.completed_tasks ?? 0 }}</span>
                  <span class="stat-label">Completed</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.active_instances ?? 0 }}</span>
                  <span class="stat-label">Instances</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.active_locks ?? 0 }}</span>
                  <span class="stat-label">File Locks</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.activity_last_24h ?? 0 }}</span>
                  <span class="stat-label">Activity (24h)</span>
                </div>
              </div>
            </Card>

            <Card title="Active Instances" class="instances-card">
              <div v-if="instances.length === 0" class="empty-instances">
                No active instances
              </div>
              <div v-else class="instances-list">
                <div 
                  v-for="instance in instances" 
                  :key="instance.id"
                  class="instance-item"
                >
                  <InstanceBadge :instance="instance" />
                  <div class="instance-details">
                    <span class="instance-status" :class="instance.status">
                      {{ instance.status }}
                    </span>
                    <span class="instance-tokens">
                      {{ Math.round(instance.context_usage_percent) }}% context
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Recent Activity" class="activity-card">
              <div v-if="activityLogs.length === 0" class="empty-activity">
                No recent activity
              </div>
              <div v-else class="activity-list">
                <div 
                  v-for="log in activityLogs.slice(0, 5)" 
                  :key="log.id"
                  class="activity-item"
                >
                  <span class="activity-type" :class="log.type">{{ log.type }}</span>
                  <span class="activity-message">{{ log.message }}</span>
                  <span class="activity-time">{{ formatRelativeTime(log.created_at) }}</span>
                </div>
              </div>
            </Card>
          </div>

          <!-- Quick Context Preview -->
          <Card title="Current Focus" class="focus-card mt-6">
            <div v-if="project.current_focus" class="context-preview">
              {{ project.current_focus }}
            </div>
            <div v-else class="empty-context">
              No current focus set. 
              <button @click="activeTab = 'context'">Update context</button>
            </div>
          </Card>
        </div>

        <!-- Tasks Tab -->
        <div v-else-if="activeTab === 'tasks'" class="tab-panel">
          <TasksBoard :project-id="projectId" />
        </div>

        <!-- Context Tab -->
        <div v-else-if="activeTab === 'context'" class="tab-panel">
          <ContextViewer :project-id="projectId" />
        </div>

        <!-- Orchestration Tab -->
        <div v-else-if="activeTab === 'orchestration'" class="tab-panel">
          <OrchestrationPanel />
        </div>

        <!-- Instances Tab -->
        <div v-else-if="activeTab === 'instances'" class="tab-panel">
          <div class="instances-grid">
            <Card 
              v-for="instance in instances" 
              :key="instance.id"
              :title="instance.id"
              class="instance-card"
            >
              <div class="instance-full">
                <div class="instance-header">
                  <InstanceBadge :instance="instance" size="lg" />
                  <span class="instance-uptime" v-if="instance.uptime">
                    {{ formatDuration(instance.uptime) }}
                  </span>
                </div>
                <div class="instance-metrics">
                  <div class="metric">
                    <span class="metric-label">Status</span>
                    <span class="metric-value" :class="instance.status">{{ instance.status }}</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Context Usage</span>
                    <div class="metric-bar">
                      <div 
                        class="metric-progress" 
                        :style="{ width: `${instance.context_usage_percent}%` }"
                      />
                    </div>
                    <span class="metric-value">{{ Math.round(instance.context_usage_percent) }}%</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Tasks Completed</span>
                    <span class="metric-value">{{ instance.tasks_completed }}</span>
                  </div>
                  <div class="metric" v-if="instance.current_task">
                    <span class="metric-label">Current Task</span>
                    <router-link 
                      :to="{ name: 'projects.tasks', params: { id: projectId }, query: { task: instance.current_task.id } }"
                      class="task-link"
                    >
                      {{ instance.current_task.title }}
                    </router-link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- Activity Tab -->
        <div v-else-if="activeTab === 'activity'" class="tab-panel">
          <Card title="Activity Log">
            <div v-if="activityLogs.length === 0" class="empty-activity">
              No activity recorded yet
            </div>
            <div v-else class="full-activity-list">
              <div 
                v-for="log in activityLogs" 
                :key="log.id"
                class="activity-row"
              >
                <div class="activity-icon" :class="log.color">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path :d="log.icon" />
                  </svg>
                </div>
                <div class="activity-content">
                  <span class="activity-title">{{ log.message }}</span>
                  <span class="activity-meta">
                    {{ log.type }} • {{ formatRelativeTime(log.created_at) }}
                  </span>
                </div>
                <div v-if="log.instance_id" class="activity-instance">
                  {{ log.instance_id.slice(0, 8) }}...
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="not-found">
      <h2>Project not found</h2>
      <router-link to="/projects" class="btn-primary">
        Back to Projects
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectsStore } from '@/stores/projects';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import InstanceBadge from '@/components/projects/InstanceBadge.vue';
import TasksBoard from './Tasks.vue';
import ContextViewer from './Context.vue';
import OrchestrationPanel from './Orchestration.vue';

const route = useRoute();
const projectsStore = useProjectsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const projectId = computed(() => route.params.id as string);
const project = computed(() => projectsStore.selectedProject);
const projectStats = computed(() => projectsStore.projectStats);
const instances = computed(() => projectsStore.instances);
const activityLogs = computed(() => projectsStore.activityLogs);

const activeTab = ref('overview');

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
  { id: 'tasks', label: 'Tasks', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
  { id: 'context', label: 'Context', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' },
  { id: 'orchestration', label: 'Orchestration', icon: 'M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z' },
  { id: 'instances', label: 'Instances', icon: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z' },
  { id: 'activity', label: 'Activity', icon: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' },
];

const machineName = computed(() => {
  if (!project.value) return 'Unknown';
  const machine = machinesStore.machines.find(m => m.id === project.value?.machine_id);
  return machine?.name || 'Unknown';
});

onMounted(async () => {
  await loadProject();
});

watch(projectId, async () => {
  await loadProject();
});

async function loadProject() {
  if (!projectId.value) return;
  
  try {
    await Promise.all([
      projectsStore.fetchProject(projectId.value),
      projectsStore.fetchProjectStats(projectId.value),
      projectsStore.fetchInstances(projectId.value),
      projectsStore.fetchActivity(projectId.value, 100),
    ]);
  } catch (err) {
    toast.error('Failed to load project');
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
</script>

<style scoped>
.project-show-page {
  @apply p-6;
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

.project-header {
  @apply mb-6;
}

.header-content {
  @apply flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6;
}

.back-link {
  @apply flex items-center gap-2 text-skin-secondary hover:text-skin-primary transition-colors text-sm mb-2;
}

.back-link svg {
  @apply w-4 h-4;
}

.header-title h1 {
  @apply text-2xl font-bold text-skin-primary;
}

.project-path {
  @apply text-sm text-skin-secondary mt-1;
}

.token-usage {
  @apply flex items-center gap-3;
}

.token-label {
  @apply text-sm text-skin-secondary;
}

.token-bar {
  @apply w-32 h-2 bg-surface-3 rounded-full overflow-hidden;
}

.token-progress {
  @apply h-full bg-gradient-to-r from-brand-purple to-brand-indigo rounded-full transition-all duration-300;
}

.token-progress.is-high {
  @apply bg-gradient-to-r from-orange-500 to-red-500;
}

.token-value {
  @apply text-sm font-medium text-skin-primary;
}

.tabs {
  @apply flex items-center gap-1 border-b border-skin;
}

.tab {
  @apply flex items-center gap-2 px-4 py-3 text-sm font-medium text-skin-secondary transition-colors relative;
}

.tab:hover {
  @apply text-skin-primary;
}

.tab.active {
  @apply text-brand-purple;
}

.tab.active::after {
  content: '';
  @apply absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple;
}

.tab svg {
  @apply w-4 h-4;
}

.tab-content {
  @apply mt-6;
}

.overview-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.info-list {
  @apply space-y-3;
}

.info-item {
  @apply flex justify-between items-center;
}

.info-label {
  @apply text-sm text-skin-secondary;
}

.info-value {
  @apply text-sm text-skin-primary font-medium;
}

.stats-grid {
  @apply grid grid-cols-3 gap-4;
}

.stat-item {
  @apply text-center;
}

.stat-number {
  @apply block text-2xl font-bold text-skin-primary;
}

.stat-label {
  @apply text-xs text-skin-secondary mt-1;
}

.empty-instances,
.empty-activity {
  @apply text-center text-skin-secondary py-8;
}

.instances-list {
  @apply space-y-3;
}

.instance-item {
  @apply flex items-center justify-between p-3 bg-surface-3 rounded-lg;
}

.instance-details {
  @apply flex items-center gap-4 text-sm;
}

.instance-status {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.instance-status.active {
  @apply bg-green-500/10 text-green-400;
}

.instance-status.idle {
  @apply bg-blue-500/10 text-blue-400;
}

.instance-status.busy {
  @apply bg-brand-purple/10 text-brand-purple;
}

.instance-status.disconnected {
  @apply bg-gray-500/10 text-gray-400;
}

.instance-tokens {
  @apply text-skin-secondary;
}

.activity-list {
  @apply space-y-3;
}

.activity-item {
  @apply flex items-center gap-3 text-sm;
}

.activity-type {
  @apply px-2 py-0.5 rounded text-xs font-medium;
}

.activity-message {
  @apply text-skin-primary flex-1 truncate;
}

.activity-time {
  @apply text-skin-secondary text-xs;
}

.focus-card {
  @apply col-span-full;
}

.context-preview {
  @apply text-skin-primary whitespace-pre-wrap;
}

.empty-context {
  @apply text-skin-secondary text-center py-4;
}

.empty-context button {
  @apply text-brand-purple hover:underline ml-1;
}

.instances-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.instance-card {
  @apply space-y-4;
}

.instance-header {
  @apply flex items-center justify-between;
}

.instance-uptime {
  @apply text-sm text-skin-secondary;
}

.instance-metrics {
  @apply space-y-3;
}

.metric {
  @apply flex items-center gap-3;
}

.metric-label {
  @apply text-sm text-skin-secondary w-28;
}

.metric-bar {
  @apply flex-1 h-2 bg-surface-3 rounded-full overflow-hidden;
}

.metric-progress {
  @apply h-full bg-brand-purple rounded-full;
}

.metric-value {
  @apply text-sm text-skin-primary w-12 text-right;
}

.metric-value.active {
  @apply text-green-400;
}

.metric-value.idle {
  @apply text-blue-400;
}

.metric-value.busy {
  @apply text-brand-purple;
}

.task-link {
  @apply text-brand-purple hover:underline truncate;
}

.full-activity-list {
  @apply space-y-4;
}

.activity-row {
  @apply flex items-center gap-4;
}

.activity-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0;
}

.activity-icon svg {
  @apply w-5 h-5;
}

.activity-content {
  @apply flex-1 min-w-0;
}

.activity-title {
  @apply block text-skin-primary text-sm;
}

.activity-meta {
  @apply block text-xs text-skin-secondary mt-0.5;
}

.activity-instance {
  @apply text-xs text-skin-secondary font-mono;
}

.not-found {
  @apply flex flex-col items-center justify-center py-20;
}

.not-found h2 {
  @apply text-xl font-semibold text-skin-primary mb-4;
}

.btn-primary {
  @apply px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-indigo text-white rounded-lg;
}
</style>
