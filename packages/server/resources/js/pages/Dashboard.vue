<template>
  <div class="dashboard-page p-4 sm:p-6 space-y-6 lg:space-y-8 min-h-screen">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Dashboard
        </h1>
        <p class="text-gray-400 mt-1 text-sm sm:text-base">
          System overview and quick actions
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="refresh-btn"
          :disabled="isRefreshing"
          @click="refreshAll"
          aria-label="Refresh dashboard data"
        >
          <svg class="w-5 h-5" :class="{ 'animate-spin': isRefreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
        <span class="text-xs text-gray-500 hidden sm:inline">
          {{ lastRefreshLabel }}
        </span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- SECTION 1: Stats Overview                                     -->
    <!-- ============================================================ -->
    <section class="stats-grid" aria-label="System statistics">
      <!-- Machines Online -->
      <div class="stat-card group" @click="navigateTo('/machines')">
        <div class="stat-card-inner">
          <div class="stat-icon stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
          <div class="stat-content">
            <template v-if="machinesStore.isLoading && machinesStore.machines.length === 0">
              <div class="skeleton-number" />
              <div class="skeleton-label" />
            </template>
            <template v-else>
              <span class="stat-number">{{ machinesStore.onlineMachines.length }}</span>
              <span class="stat-label">
                Machines Online
                <span class="stat-sub">/ {{ machinesStore.machines.length }} total</span>
              </span>
            </template>
          </div>
        </div>
        <div class="stat-border stat-border--purple" />
      </div>

      <!-- Active Sessions -->
      <div class="stat-card group" @click="navigateTo('/sessions')">
        <div class="stat-card-inner">
          <div class="stat-icon stat-icon--cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <div class="stat-content">
            <template v-if="machinesStore.isLoading && machinesStore.machines.length === 0">
              <div class="skeleton-number" />
              <div class="skeleton-label" />
            </template>
            <template v-else>
              <span class="stat-number">{{ machinesStore.totalActiveSessions }}</span>
              <span class="stat-label">Active Sessions</span>
            </template>
          </div>
        </div>
        <div class="stat-border stat-border--cyan" />
      </div>

      <!-- Projects -->
      <div class="stat-card group" @click="navigateTo('/projects')">
        <div class="stat-card-inner">
          <div class="stat-icon stat-icon--indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div class="stat-content">
            <template v-if="isLoadingProjects">
              <div class="skeleton-number" />
              <div class="skeleton-label" />
            </template>
            <template v-else>
              <span class="stat-number">{{ totalProjects }}</span>
              <span class="stat-label">Projects</span>
            </template>
          </div>
        </div>
        <div class="stat-border stat-border--indigo" />
      </div>

      <!-- Pending Tasks -->
      <div class="stat-card group" @click="navigateTo('/projects')">
        <div class="stat-card-inner">
          <div class="stat-icon stat-icon--warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div class="stat-content">
            <template v-if="isLoadingProjects">
              <div class="skeleton-number" />
              <div class="skeleton-label" />
            </template>
            <template v-else>
              <span class="stat-number">{{ totalPendingTasks }}</span>
              <span class="stat-label">Tasks Pending</span>
            </template>
          </div>
        </div>
        <div class="stat-border stat-border--warning" />
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- SECTION 2: Quick Actions + System Status                      -->
    <!-- ============================================================ -->
    <section class="grid grid-cols-1 lg:grid-cols-5 gap-6" aria-label="Quick actions and system status">
      <!-- Quick Actions (left, 3 cols) -->
      <div class="lg:col-span-3 card">
        <h2 class="card-title">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button
            class="action-btn action-btn--primary"
            @click="navigateTo('/sessions/new')"
          >
            <span class="action-icon action-icon--purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </span>
            <span class="action-text">
              <span class="action-name">New Session</span>
              <span class="action-desc">Start a Claude Code session</span>
            </span>
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            class="action-btn"
            @click="navigateTo('/machines')"
          >
            <span class="action-icon action-icon--cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </span>
            <span class="action-text">
              <span class="action-name">Connect Machine</span>
              <span class="action-desc">Register a new machine</span>
            </span>
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            class="action-btn"
            @click="navigateTo('/projects')"
          >
            <span class="action-icon action-icon--indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </span>
            <span class="action-text">
              <span class="action-name">Create Project</span>
              <span class="action-desc">Set up multi-agent project</span>
            </span>
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            class="action-btn"
            @click="navigateTo('/docs')"
          >
            <span class="action-icon action-icon--gray">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span class="action-text">
              <span class="action-name">View Docs</span>
              <span class="action-desc">API reference & guides</span>
            </span>
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- System Health (right, 2 cols) -->
      <div class="lg:col-span-2 card">
        <h2 class="card-title">System Health</h2>
        <div class="mt-4 space-y-4">
          <div class="health-row">
            <div class="health-indicator">
              <span
                class="health-dot"
                :class="systemHealth.api ? 'health-dot--ok' : 'health-dot--error'"
              />
              <span class="health-name">API Server</span>
            </div>
            <span
              class="health-status"
              :class="systemHealth.api ? 'text-green-400' : 'text-red-400'"
            >
              {{ systemHealth.api ? 'Operational' : 'Unreachable' }}
            </span>
          </div>

          <div class="health-row">
            <div class="health-indicator">
              <span
                class="health-dot"
                :class="systemHealth.websocket ? 'health-dot--ok' : 'health-dot--warn'"
              />
              <span class="health-name">WebSocket</span>
            </div>
            <span
              class="health-status"
              :class="systemHealth.websocket ? 'text-green-400' : 'text-yellow-400'"
            >
              {{ systemHealth.websocket ? 'Connected' : 'Checking...' }}
            </span>
          </div>

          <div class="health-row">
            <div class="health-indicator">
              <span
                class="health-dot"
                :class="systemHealth.database ? 'health-dot--ok' : 'health-dot--error'"
              />
              <span class="health-name">Database</span>
            </div>
            <span
              class="health-status"
              :class="systemHealth.database ? 'text-green-400' : 'text-red-400'"
            >
              {{ systemHealth.database ? 'Healthy' : 'Unknown' }}
            </span>
          </div>

          <div class="health-divider" />

          <div class="health-row">
            <span class="text-gray-400 text-sm">Last sync</span>
            <span class="text-gray-300 text-sm font-mono">
              {{ lastRefreshLabel }}
            </span>
          </div>

          <div class="health-row">
            <span class="text-gray-400 text-sm">Uptime</span>
            <span class="text-gray-300 text-sm font-mono">
              {{ uptimeLabel }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- SECTION 3: Recent Activity Feed                               -->
    <!-- ============================================================ -->
    <section class="card" aria-label="Recent activity">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title mb-0">Recent Activity</h2>
        <span class="text-xs text-gray-500">
          {{ activityFeed.length }} events
        </span>
      </div>

      <!-- Empty State -->
      <div
        v-if="activityFeed.length === 0"
        class="empty-state"
      >
        <svg class="w-12 h-12 text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p class="text-gray-500 text-sm">No recent activity</p>
        <p class="text-gray-600 text-xs mt-1">
          Activity will appear here as machines connect and sessions run.
        </p>
      </div>

      <!-- Activity Timeline -->
      <div v-else class="activity-timeline">
        <div
          v-for="(event, index) in activityFeed"
          :key="event.id"
          class="activity-item"
          :class="{ 'activity-item--last': index === activityFeed.length - 1 }"
        >
          <div class="activity-dot-wrapper">
            <span
              class="activity-dot"
              :class="activityDotClass(event.type)"
            />
            <span
              v-if="index < activityFeed.length - 1"
              class="activity-line"
            />
          </div>
          <div class="activity-body">
            <div class="activity-header">
              <span class="activity-icon" :class="activityIconClass(event.type)">
                <component :is="activityIconComponent(event.type)" />
              </span>
              <span class="activity-description">{{ event.description }}</span>
              <span
                class="activity-badge"
                :class="activityBadgeClass(event.type)"
              >
                {{ activityBadgeLabel(event.type) }}
              </span>
            </div>
            <span class="activity-time">{{ formatTimeAgo(event.timestamp) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- SECTION 4: Resource Cards                                     -->
    <!-- ============================================================ -->
    <section class="resource-grid" aria-label="Quick navigation">
      <!-- Machines Card -->
      <router-link to="/machines" class="resource-card group">
        <div class="resource-top">
          <div class="resource-icon resource-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
          <span
            v-if="machinesStore.onlineMachines.length > 0"
            class="resource-badge resource-badge--purple"
          >
            {{ machinesStore.onlineMachines.length }} online
          </span>
        </div>
        <h3 class="resource-title">Machines</h3>
        <p class="resource-desc">
          Manage your connected machines and agents
        </p>
        <div class="resource-footer">
          <span class="resource-count">
            {{ machinesStore.machines.length }} registered
          </span>
          <svg class="resource-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </router-link>

      <!-- Sessions Card -->
      <router-link to="/sessions" class="resource-card group">
        <div class="resource-top">
          <div class="resource-icon resource-icon--cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <span
            v-if="machinesStore.totalActiveSessions > 0"
            class="resource-badge resource-badge--cyan"
          >
            {{ machinesStore.totalActiveSessions }} active
          </span>
        </div>
        <h3 class="resource-title">Sessions</h3>
        <p class="resource-desc">
          View and manage Claude Code sessions
        </p>
        <div class="resource-footer">
          <span class="resource-count">
            {{ machinesStore.totalActiveSessions }} running
          </span>
          <svg class="resource-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </router-link>

      <!-- Projects Card -->
      <router-link to="/projects" class="resource-card group">
        <div class="resource-top">
          <div class="resource-icon resource-icon--indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span
            v-if="totalPendingTasks > 0"
            class="resource-badge resource-badge--warning"
          >
            {{ totalPendingTasks }} tasks
          </span>
        </div>
        <h3 class="resource-title">Projects</h3>
        <p class="resource-desc">
          Multi-agent coordination and task management
        </p>
        <div class="resource-footer">
          <span class="resource-count">
            {{ totalProjects }} projects
          </span>
          <svg class="resource-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </router-link>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h, type FunctionalComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useMachinesStore } from '@/stores/machines';
import { useProjectsStore } from '@/stores/projects';

// ============================================================================
// Stores & Router
// ============================================================================

const router = useRouter();
const machinesStore = useMachinesStore();
const projectsStore = useProjectsStore();

// ============================================================================
// State
// ============================================================================

const isRefreshing = ref(false);
const isLoadingProjects = ref(false);
const lastRefreshTime = ref<Date>(new Date());
const lastRefreshLabel = ref('just now');
const pageLoadTime = Date.now();
const uptimeTick = ref(0);

interface ActivityEvent {
  id: string;
  type: 'session_start' | 'session_end' | 'machine_connect' | 'machine_disconnect' | 'task_complete' | 'file_lock';
  description: string;
  timestamp: string;
}

const activityFeed = ref<ActivityEvent[]>([]);

const systemHealth = ref({
  api: true,
  websocket: true,
  database: true,
});

// ============================================================================
// Computed
// ============================================================================

const totalProjects = computed(() => projectsStore.projects.length);

const totalPendingTasks = computed(() => {
  return projectsStore.projects.reduce(
    (sum, p) => sum + (p.pending_tasks_count || 0),
    0
  );
});

const uptimeLabel = computed(() => {
  uptimeTick.value; // read to establish reactive dependency
  const elapsed = Math.floor((Date.now() - pageLoadTime) / 1000);
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  return `${hours}h ${mins}m`;
});

// ============================================================================
// Methods
// ============================================================================

function navigateTo(path: string): void {
  router.push(path);
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function updateRefreshLabel(): void {
  lastRefreshLabel.value = formatTimeAgo(lastRefreshTime.value.toISOString());
}

// Activity feed helpers
function activityDotClass(type: ActivityEvent['type']): string {
  const map: Record<ActivityEvent['type'], string> = {
    session_start: 'activity-dot--cyan',
    session_end: 'activity-dot--gray',
    machine_connect: 'activity-dot--green',
    machine_disconnect: 'activity-dot--red',
    task_complete: 'activity-dot--purple',
    file_lock: 'activity-dot--warning',
  };
  return map[type] || 'activity-dot--gray';
}

function activityIconClass(type: ActivityEvent['type']): string {
  const map: Record<ActivityEvent['type'], string> = {
    session_start: 'text-brand-cyan',
    session_end: 'text-gray-400',
    machine_connect: 'text-green-400',
    machine_disconnect: 'text-red-400',
    task_complete: 'text-brand-purple',
    file_lock: 'text-yellow-400',
  };
  return map[type] || 'text-gray-400';
}

function activityBadgeClass(type: ActivityEvent['type']): string {
  const map: Record<ActivityEvent['type'], string> = {
    session_start: 'activity-badge--cyan',
    session_end: 'activity-badge--gray',
    machine_connect: 'activity-badge--green',
    machine_disconnect: 'activity-badge--red',
    task_complete: 'activity-badge--purple',
    file_lock: 'activity-badge--warning',
  };
  return map[type] || 'activity-badge--gray';
}

function activityBadgeLabel(type: ActivityEvent['type']): string {
  const map: Record<ActivityEvent['type'], string> = {
    session_start: 'Session',
    session_end: 'Session',
    machine_connect: 'Machine',
    machine_disconnect: 'Machine',
    task_complete: 'Task',
    file_lock: 'Lock',
  };
  return map[type] || 'Event';
}

// Functional icon components for activity events
const TerminalIcon: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'w-3.5 h-3.5' }, [
    h('polyline', { points: '4 17 10 11 4 5' }),
    h('line', { x1: '12', y1: '19', x2: '20', y2: '19' }),
  ]);

const ServerIcon: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'w-3.5 h-3.5' }, [
    h('rect', { x: '2', y: '2', width: '20', height: '8', rx: '2', ry: '2' }),
    h('rect', { x: '2', y: '14', width: '20', height: '8', rx: '2', ry: '2' }),
  ]);

const CheckIcon: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'w-3.5 h-3.5' }, [
    h('path', { d: 'M9 11l3 3L22 4' }),
    h('path', { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' }),
  ]);

const LockIcon: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'w-3.5 h-3.5' }, [
    h('rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' }),
    h('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }),
  ]);

function activityIconComponent(type: ActivityEvent['type']): FunctionalComponent {
  const map: Record<ActivityEvent['type'], FunctionalComponent> = {
    session_start: TerminalIcon,
    session_end: TerminalIcon,
    machine_connect: ServerIcon,
    machine_disconnect: ServerIcon,
    task_complete: CheckIcon,
    file_lock: LockIcon,
  };
  return map[type] || TerminalIcon;
}

// Build activity feed from store data
function buildActivityFeed(): void {
  const events: ActivityEvent[] = [];

  // Machine events: use machines that have connected_at or last_seen_at
  for (const machine of machinesStore.machines) {
    if (machine.status === 'online' && machine.connected_at) {
      events.push({
        id: `mc-${machine.id}`,
        type: 'machine_connect',
        description: `${machine.display_name || machine.name} connected`,
        timestamp: machine.connected_at,
      });
    } else if (machine.status === 'offline' && machine.last_seen_at) {
      events.push({
        id: `md-${machine.id}`,
        type: 'machine_disconnect',
        description: `${machine.display_name || machine.name} went offline`,
        timestamp: machine.last_seen_at,
      });
    }
  }

  // Project events: projects with recent activity
  for (const project of projectsStore.projects) {
    if (project.active_instances_count > 0) {
      events.push({
        id: `pa-${project.id}`,
        type: 'session_start',
        description: `${project.name}: ${project.active_instances_count} active instance(s)`,
        timestamp: project.updated_at,
      });
    }
  }

  // Sort by timestamp descending, take the 8 most recent
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  activityFeed.value = events.slice(0, 8);
}

// ============================================================================
// Data fetching
// ============================================================================

async function fetchDashboardData(): Promise<void> {
  // 1. Fetch machines (gives us machine counts + active session counts)
  try {
    await machinesStore.fetchMachines(1, 100);
    systemHealth.value.api = true;
    systemHealth.value.database = true;
  } catch {
    systemHealth.value.api = false;
    systemHealth.value.database = false;
  }

  // 2. Fetch projects per online machine
  isLoadingProjects.value = true;
  try {
    const machineIds = machinesStore.machines.map(m => m.id);
    const fetchPromises = machineIds.map(id =>
      projectsStore.fetchProjects(id).catch(() => {
        // Silently skip machines whose projects fail to load
      })
    );
    await Promise.allSettled(fetchPromises);
  } finally {
    isLoadingProjects.value = false;
  }

  // 3. Build activity feed from the fetched data
  buildActivityFeed();

  // 4. Update refresh time
  lastRefreshTime.value = new Date();
  updateRefreshLabel();
}

async function refreshAll(): Promise<void> {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await fetchDashboardData();
  } finally {
    isRefreshing.value = false;
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

let refreshLabelInterval: ReturnType<typeof setInterval> | null = null;
let uptimeInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  // Initial data fetch
  await fetchDashboardData();

  // Update "last refresh" label every 15s
  refreshLabelInterval = setInterval(updateRefreshLabel, 15000);

  // Increment uptimeTick every second to trigger uptimeLabel recomputation
  uptimeInterval = setInterval(() => {
    uptimeTick.value++;
  }, 1000);

  // Assume WebSocket is healthy if page loads
  systemHealth.value.websocket = true;
});

onUnmounted(() => {
  if (refreshLabelInterval) clearInterval(refreshLabelInterval);
  if (uptimeInterval) clearInterval(uptimeInterval);
});
</script>

<style scoped>
/* ============================================================
   PAGE HEADER
   ============================================================ */
.page-header {
  @apply flex items-start sm:items-center justify-between;
}

.refresh-btn {
  @apply p-2 rounded-lg text-gray-400
    hover:text-white hover:bg-dark-3
    transition-all duration-200 cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed;
}

/* ============================================================
   SECTION 1: STAT CARDS
   ============================================================ */
.stats-grid {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4;
}

.stat-card {
  @apply relative rounded-xl overflow-hidden cursor-pointer
    transition-all duration-200;
  background: rgba(26, 27, 38, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card-inner {
  @apply relative z-10 flex items-center gap-3 sm:gap-4 p-4 sm:p-5;
}

.stat-icon {
  @apply w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0;
}

.stat-icon svg {
  @apply w-5 h-5 sm:w-6 sm:h-6;
}

.stat-icon--purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2));
  color: #a855f7;
}

.stat-icon--cyan {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(99, 102, 241, 0.15));
  color: #22d3ee;
}

.stat-icon--indigo {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15));
  color: #6366f1;
}

.stat-icon--warning {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15));
  color: #fbbf24;
}

.stat-content {
  @apply flex flex-col min-w-0;
}

.stat-number {
  @apply text-2xl sm:text-3xl font-bold text-white leading-none;
}

.stat-label {
  @apply text-xs sm:text-sm text-gray-400 mt-1 truncate;
}

.stat-sub {
  @apply text-gray-600;
}

/* Gradient border effect */
.stat-border {
  @apply absolute inset-x-0 bottom-0 h-0.5 opacity-0 transition-opacity duration-200;
}

.stat-card:hover .stat-border {
  @apply opacity-100;
}

.stat-border--purple {
  background: linear-gradient(90deg, #a855f7, #6366f1);
}

.stat-border--cyan {
  background: linear-gradient(90deg, #22d3ee, #6366f1);
}

.stat-border--indigo {
  background: linear-gradient(90deg, #6366f1, #a855f7);
}

.stat-border--warning {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

/* Outer border */
.stat-card::before {
  content: '';
  @apply absolute inset-0 rounded-xl pointer-events-none;
  border: 1px solid rgba(59, 66, 97, 0.6);
  transition: border-color 0.2s;
}

.stat-card:hover::before {
  border-color: rgba(168, 85, 247, 0.3);
}

/* Skeletons */
.skeleton-number {
  @apply h-8 w-12 rounded-md animate-pulse;
  background: rgba(59, 66, 97, 0.5);
}

.skeleton-label {
  @apply h-4 w-24 rounded mt-2 animate-pulse;
  background: rgba(59, 66, 97, 0.3);
}

/* ============================================================
   SHARED CARD STYLE
   ============================================================ */
.card {
  @apply rounded-xl p-5 sm:p-6 border;
  background-color: #1a1b26;
  border-color: rgba(59, 66, 97, 0.6);
}

.card-title {
  @apply text-base sm:text-lg font-semibold text-white mb-0;
}

/* ============================================================
   SECTION 2: QUICK ACTIONS
   ============================================================ */
.action-btn {
  @apply flex items-center gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer
    transition-all duration-200 text-left w-full;
  background-color: rgba(36, 40, 59, 0.5);
  border-color: rgba(59, 66, 97, 0.5);
}

.action-btn:hover {
  background-color: rgba(36, 40, 59, 0.8);
  border-color: rgba(168, 85, 247, 0.3);
}

.action-btn--primary {
  border-color: rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(99, 102, 241, 0.05));
}

.action-btn--primary:hover {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1));
  border-color: rgba(168, 85, 247, 0.5);
}

.action-icon {
  @apply w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0;
}

.action-icon svg {
  width: 18px;
  height: 18px;
}

.action-icon--purple {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.action-icon--cyan {
  background: rgba(34, 211, 238, 0.15);
  color: #22d3ee;
}

.action-icon--indigo {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
}

.action-icon--gray {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.action-text {
  @apply flex flex-col flex-1 min-w-0;
}

.action-name {
  @apply text-sm font-medium text-white;
}

.action-desc {
  @apply text-xs text-gray-500 mt-0.5 truncate;
}

.action-arrow {
  @apply w-4 h-4 text-gray-600 flex-shrink-0
    transition-transform duration-200;
}

.action-btn:hover .action-arrow {
  @apply text-gray-400;
  transform: translateX(2px);
}

/* ============================================================
   SECTION 2: SYSTEM HEALTH
   ============================================================ */
.health-row {
  @apply flex items-center justify-between;
}

.health-indicator {
  @apply flex items-center gap-2.5;
}

.health-dot {
  @apply w-2 h-2 rounded-full flex-shrink-0;
}

.health-dot--ok {
  @apply bg-green-400;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
}

.health-dot--warn {
  @apply bg-yellow-400;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.4);
}

.health-dot--error {
  @apply bg-red-400;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}

.health-name {
  @apply text-sm text-gray-300;
}

.health-status {
  @apply text-sm font-medium;
}

.health-divider {
  @apply border-t;
  border-color: rgba(59, 66, 97, 0.4);
}

/* ============================================================
   SECTION 3: ACTIVITY TIMELINE
   ============================================================ */
.empty-state {
  @apply flex flex-col items-center justify-center py-10;
}

.activity-skeleton {
  @apply flex items-center gap-3 p-3;
}

.skeleton-circle {
  @apply w-8 h-8 rounded-full flex-shrink-0 animate-pulse;
  background: rgba(59, 66, 97, 0.5);
}

.skeleton-text {
  @apply h-3 rounded animate-pulse;
  background: rgba(59, 66, 97, 0.4);
}

.activity-timeline {
  @apply space-y-0;
}

.activity-item {
  @apply flex gap-3 py-2.5;
}

.activity-dot-wrapper {
  @apply flex flex-col items-center flex-shrink-0;
  width: 16px;
}

.activity-dot {
  @apply w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1;
}

.activity-dot--cyan {
  @apply bg-brand-cyan;
  box-shadow: 0 0 6px rgba(34, 211, 238, 0.3);
}

.activity-dot--green {
  @apply bg-green-400;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.3);
}

.activity-dot--red {
  @apply bg-red-400;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.3);
}

.activity-dot--purple {
  @apply bg-brand-purple;
  box-shadow: 0 0 6px rgba(168, 85, 247, 0.3);
}

.activity-dot--warning {
  @apply bg-yellow-400;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.3);
}

.activity-dot--gray {
  @apply bg-gray-500;
}

.activity-line {
  @apply flex-1 w-px mt-1;
  background: rgba(59, 66, 97, 0.5);
  min-height: 16px;
}

.activity-item--last .activity-line {
  @apply hidden;
}

.activity-body {
  @apply flex-1 min-w-0;
}

.activity-header {
  @apply flex items-center gap-2 flex-wrap;
}

.activity-icon {
  @apply flex-shrink-0;
}

.activity-description {
  @apply text-sm text-gray-300 truncate;
}

.activity-badge {
  @apply text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0;
}

.activity-badge--cyan {
  background: rgba(34, 211, 238, 0.1);
  color: #22d3ee;
}

.activity-badge--green {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.activity-badge--red {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.activity-badge--purple {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.activity-badge--warning {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.activity-badge--gray {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.activity-time {
  @apply text-xs text-gray-600 mt-0.5 block;
}

/* ============================================================
   SECTION 4: RESOURCE CARDS
   ============================================================ */
.resource-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6;
}

.resource-card {
  @apply block rounded-xl p-5 sm:p-6 border
    transition-all duration-200 cursor-pointer;
  background-color: #1a1b26;
  border-color: rgba(59, 66, 97, 0.6);
  text-decoration: none;
}

.resource-card:hover {
  border-color: rgba(168, 85, 247, 0.35);
  transform: translateY(-2px);
}

.resource-top {
  @apply flex items-start justify-between mb-4;
}

.resource-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center;
}

.resource-icon svg {
  @apply w-5 h-5;
}

.resource-icon--purple {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
}

.resource-icon--cyan {
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
}

.resource-icon--indigo {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
}

.resource-badge {
  @apply text-xs font-medium px-2 py-0.5 rounded-full;
}

.resource-badge--purple {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
}

.resource-badge--cyan {
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
}

.resource-badge--warning {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.resource-title {
  @apply text-lg font-semibold text-white mb-1;
}

.resource-desc {
  @apply text-sm text-gray-400 leading-relaxed;
}

.resource-footer {
  @apply flex items-center justify-between mt-4 pt-4 border-t;
  border-color: rgba(59, 66, 97, 0.4);
}

.resource-count {
  @apply text-xs text-gray-500;
}

.resource-arrow {
  @apply w-4 h-4 text-gray-600 transition-transform duration-200;
}

.resource-card:hover .resource-arrow {
  @apply text-brand-purple;
  transform: translateX(3px);
}
</style>
