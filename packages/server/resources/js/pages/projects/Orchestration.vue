<template>
  <div class="orchestration-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Orchestration</h1>
        <p class="page-subtitle" v-if="project">{{ project.name }}</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          @click="refreshAll"
          :disabled="isLoading"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Refresh
        </button>
        <button
          v-if="!isOrchestratorRunning"
          class="btn btn-primary"
          @click="handleStartOrchestrator"
          :disabled="isOrchestratorLoading"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
            <path d="M8 5v14l11-7z"/>
          </svg>
          {{ isOrchestratorLoading ? 'Starting...' : 'Start Orchestrator' }}
        </button>
        <button
          v-else
          class="btn btn-danger"
          @click="handleStopOrchestrator"
          :disabled="isOrchestratorLoading"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
            <path d="M6 6h12v12H6z"/>
          </svg>
          {{ isOrchestratorLoading ? 'Stopping...' : 'Stop Orchestrator' }}
        </button>
        <button
          class="btn btn-secondary"
          @click="handleDispatch"
          :disabled="isDispatching || !hasAvailableCapacity"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
          {{ isDispatching ? 'Dispatching...' : 'Auto-Dispatch' }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon instances-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.instances.total }}</span>
          <span class="stat-label">Instances</span>
          <div class="stat-breakdown">
            <span class="badge badge-idle">{{ stats.instances.idle }} idle</span>
            <span class="badge badge-busy">{{ stats.instances.busy }} busy</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon tasks-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.tasks.pending }}</span>
          <span class="stat-label">Pending Tasks</span>
          <div class="stat-breakdown">
            <span class="badge badge-progress">{{ stats.tasks.in_progress }} in progress</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon completed-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.tasks.completed }}</span>
          <span class="stat-label">Completed</span>
          <div class="stat-breakdown">
            <span class="badge badge-blocked" v-if="stats.tasks.blocked > 0">
              {{ stats.tasks.blocked }} blocked
            </span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon total-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.total_tasks_completed }}</span>
          <span class="stat-label">Total Completed</span>
        </div>
      </div>
    </div>

    <!-- Dispatch Result -->
    <div class="dispatch-result" v-if="lastDispatchResult && lastDispatchResult.count > 0">
      <div class="dispatch-result-header">
        <svg viewBox="0 0 24 24" fill="currentColor" class="dispatch-icon">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span>{{ lastDispatchResult.count }} task(s) dispatched</span>
      </div>
      <div class="dispatch-details">
        <div
          v-for="item in lastDispatchResult.dispatched"
          :key="item.task_id"
          class="dispatch-item"
        >
          Task {{ item.task_id.slice(0, 8) }}... → Instance {{ item.instance_id.slice(0, 8) }}...
        </div>
      </div>
    </div>

    <!-- Instances Grid -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Connected Instances</h2>
        <span class="section-count">{{ connectedInstances.length }}</span>
      </div>

      <div class="instances-grid" v-if="connectedInstances.length > 0">
        <InstanceCard
          v-for="instance in connectedInstances"
          :key="instance.id"
          :instance="instance"
          :project-id="projectId"
        />
      </div>
      <div class="empty-state" v-else>
        <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        <p>No instances connected</p>
        <span class="empty-hint">Start an agent with this project to see instances here</span>
      </div>
    </div>

    <!-- Activity Feed -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Recent Activity</h2>
      </div>
      <ActivityFeed
        :activities="activityLogs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useOrchestratorStore } from '@/stores/orchestrator';
import { useProjectsStore } from '@/stores/projects';
import InstanceCard from '@/components/multiagent/InstanceCard.vue';
import ActivityFeed from '@/components/multiagent/ActivityFeed.vue';

const route = useRoute();
const orchestratorStore = useOrchestratorStore();
const projectsStore = useProjectsStore();

const projectId = computed(() => route.params.id as string);
const project = computed(() => projectsStore.selectedProject);
const stats = computed(() => orchestratorStore.stats);
const connectedInstances = computed(() => orchestratorStore.connectedInstances);
const isLoading = computed(() => orchestratorStore.isLoading);
const isDispatching = computed(() => orchestratorStore.isDispatching);
const hasAvailableCapacity = computed(() => orchestratorStore.hasAvailableCapacity);
const lastDispatchResult = computed(() => orchestratorStore.lastDispatchResult);
const activityLogs = computed(() => projectsStore.activityLogs);
const isOrchestratorRunning = computed(() =>
  orchestratorStore.orchestratorStatus?.status === 'running'
);
const isOrchestratorLoading = computed(() => orchestratorStore.isOrchestratorLoading);

async function refreshAll(): Promise<void> {
  await Promise.all([
    orchestratorStore.fetchStats(projectId.value),
    orchestratorStore.fetchInstances(projectId.value),
    orchestratorStore.fetchOrchestratorStatus(projectId.value),
    projectsStore.fetchActivity(projectId.value),
  ]);
}

async function handleDispatch(): Promise<void> {
  await orchestratorStore.dispatch(projectId.value);
}

async function handleStartOrchestrator(): Promise<void> {
  await orchestratorStore.startOrchestrator(projectId.value);
}

async function handleStopOrchestrator(): Promise<void> {
  await orchestratorStore.stopOrchestrator(projectId.value);
}

onMounted(async () => {
  if (!project.value || project.value.id !== projectId.value) {
    await projectsStore.fetchProject(projectId.value);
  }
  orchestratorStore.fetchOrchestratorStatus(projectId.value);
  orchestratorStore.startPolling(projectId.value);
  projectsStore.fetchActivity(projectId.value);
});

onUnmounted(() => {
  orchestratorStore.stopPolling();
});
</script>

<style scoped>
.orchestration-page {
  @apply space-y-8;
}

.page-header {
  @apply flex items-center justify-between;
}

.header-info {
  @apply space-y-1;
}

.page-title {
  @apply text-2xl font-bold text-white;
}

.page-subtitle {
  @apply text-sm text-gray-400;
}

.header-actions {
  @apply flex items-center gap-3;
}

.btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-brand-purple text-white hover:bg-brand-purple/80;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-secondary {
  @apply bg-dark-3 text-gray-300 hover:bg-dark-4 hover:text-white;
}

.btn-secondary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.btn-danger:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-icon {
  @apply w-4 h-4;
}

/* Stats Grid */
.stats-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply flex items-start gap-4 bg-dark-2 rounded-xl border border-dark-4 p-5;
}

.stat-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0;
}

.stat-icon svg {
  @apply w-5 h-5;
}

.instances-icon {
  @apply bg-blue-500/10 text-blue-400;
}

.tasks-icon {
  @apply bg-brand-purple/10 text-brand-purple;
}

.completed-icon {
  @apply bg-green-500/10 text-green-400;
}

.total-icon {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.stat-content {
  @apply space-y-1;
}

.stat-value {
  @apply text-2xl font-bold text-white;
}

.stat-label {
  @apply text-sm text-gray-400 block;
}

.stat-breakdown {
  @apply flex items-center gap-2 mt-1;
}

.badge {
  @apply text-xs px-2 py-0.5 rounded-full;
}

.badge-idle {
  @apply bg-blue-500/10 text-blue-400;
}

.badge-busy {
  @apply bg-brand-purple/10 text-brand-purple;
}

.badge-progress {
  @apply bg-yellow-500/10 text-yellow-400;
}

.badge-blocked {
  @apply bg-red-500/10 text-red-400;
}

/* Dispatch Result */
.dispatch-result {
  @apply bg-green-500/5 border border-green-500/20 rounded-xl p-4;
}

.dispatch-result-header {
  @apply flex items-center gap-2 text-green-400 font-medium;
}

.dispatch-icon {
  @apply w-5 h-5;
}

.dispatch-details {
  @apply mt-2 space-y-1;
}

.dispatch-item {
  @apply text-sm text-gray-400 font-mono pl-7;
}

/* Sections */
.section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-center gap-3;
}

.section-title {
  @apply text-lg font-semibold text-white;
}

.section-count {
  @apply text-sm text-gray-400 bg-dark-3 px-2 py-0.5 rounded-full;
}

/* Instances Grid */
.instances-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.empty-icon {
  @apply w-12 h-12 mb-3 opacity-50;
}

.empty-state p {
  @apply text-base font-medium;
}

.empty-hint {
  @apply text-sm text-gray-600 mt-1;
}
</style>
