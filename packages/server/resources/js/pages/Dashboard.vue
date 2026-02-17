<template>
  <div class="dashboard">
    <!-- ================================================================ -->
    <!-- GREETING BANNER                                                   -->
    <!-- ================================================================ -->
    <header class="greeting">
      <div class="greeting-bg" />
      <div class="greeting-inner">
        <div class="greeting-copy">
          <h1 class="greeting-title">
            {{ greetingText }}
          </h1>
          <p class="greeting-sub">
            <span class="health-pill" :class="overallHealthClass">
              <span class="health-pill-dot" />
              {{ overallHealthLabel }}
            </span>
            <span class="greeting-sep">&middot;</span>
            <span>{{ lastRefreshLabel }}</span>
          </p>
        </div>
        <button
          class="refresh-btn"
          :disabled="isRefreshing"
          @click="refreshAll"
          aria-label="Refresh dashboard data"
        >
          <svg class="refresh-icon" :class="{ spinning: isRefreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </header>

    <!-- ================================================================ -->
    <!-- BENTO GRID                                                        -->
    <!-- ================================================================ -->
    <section class="bento" aria-label="Dashboard overview">
      <!-- ROW 1: Stats strip -->
      <div class="bento-stats">
        <button
          v-for="stat in stats"
          :key="stat.key"
          class="stat-chip"
          :class="`stat-chip--${stat.color}`"
          @click="navigateTo(stat.route)"
        >
          <span class="stat-chip-icon" :class="`stat-chip-icon--${stat.color}`">
            <component :is="stat.icon" />
          </span>
          <span class="stat-chip-body">
            <template v-if="stat.loading">
              <span class="skel skel--num" />
              <span class="skel skel--lbl" />
            </template>
            <template v-else>
              <span class="stat-chip-num">{{ stat.value }}</span>
              <span class="stat-chip-lbl">{{ stat.label }}</span>
            </template>
          </span>
          <span v-if="stat.sub" class="stat-chip-sub">{{ stat.sub }}</span>
        </button>
      </div>

      <!-- ROW 2: Main content grid -->
      <div class="bento-main">
        <!-- LEFT: Quick Actions (large card) -->
        <div class="bento-card bento-card--actions">
          <div class="bento-card-head">
            <h2 class="bento-card-title">Quick Actions</h2>
          </div>
          <div class="actions-grid">
            <button
              v-for="action in quickActions"
              :key="action.route"
              class="action-tile"
              :class="{ 'action-tile--primary': action.primary }"
              @click="navigateTo(action.route)"
            >
              <span class="action-tile-icon" :class="`action-tile-icon--${action.color}`">
                <component :is="action.icon" />
              </span>
              <span class="action-tile-copy">
                <span class="action-tile-name">{{ action.name }}</span>
                <span class="action-tile-desc">{{ action.desc }}</span>
              </span>
              <svg class="action-tile-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <!-- RIGHT: System Health + Uptime -->
        <div class="bento-card bento-card--health">
          <div class="bento-card-head">
            <h2 class="bento-card-title">System Health</h2>
          </div>
          <div class="health-list">
            <div
              v-for="svc in healthServices"
              :key="svc.name"
              class="health-row"
            >
              <div class="health-row-left">
                <span class="health-dot" :class="svc.dotClass" />
                <span class="health-name">{{ svc.name }}</span>
              </div>
              <span class="health-status" :class="svc.statusClass">
                {{ svc.statusLabel }}
              </span>
            </div>
          </div>
          <div class="health-divider" />
          <div class="health-meta">
            <div class="health-meta-row">
              <span class="health-meta-lbl">Last sync</span>
              <span class="health-meta-val">{{ lastRefreshLabel }}</span>
            </div>
            <div class="health-meta-row">
              <span class="health-meta-lbl">Uptime</span>
              <span class="health-meta-val">{{ uptimeLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 3: Activity feed (full width) -->
      <div class="bento-card bento-card--activity">
        <div class="bento-card-head">
          <h2 class="bento-card-title">Recent Activity</h2>
          <span class="bento-card-badge">{{ activityFeed.length }} events</span>
        </div>

        <!-- Empty State -->
        <div v-if="activityFeed.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p class="empty-title">No recent activity</p>
          <p class="empty-sub">Activity will appear here as machines connect and sessions run.</p>
        </div>

        <!-- Activity Timeline -->
        <div v-else class="activity-feed">
          <div
            v-for="(event, index) in activityFeed"
            :key="event.id"
            class="act-row"
          >
            <div class="act-dot-col">
              <span class="act-dot" :class="activityDotClass(event.type)" />
              <span v-if="index < activityFeed.length - 1" class="act-line" />
            </div>
            <div class="act-body">
              <div class="act-header">
                <component :is="activityIconComponent(event.type)" class="act-icon" :class="activityIconClass(event.type)" />
                <span class="act-desc">{{ event.description }}</span>
                <span class="act-badge" :class="activityBadgeClass(event.type)">
                  {{ activityBadgeLabel(event.type) }}
                </span>
              </div>
              <span class="act-time">{{ formatTimeAgo(event.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 4: Resource nav cards -->
      <div class="bento-resources">
        <router-link
          v-for="res in resources"
          :key="res.route"
          :to="res.route"
          class="res-card"
          :class="`res-card--${res.color}`"
        >
          <div class="res-card-top">
            <span class="res-card-icon" :class="`res-card-icon--${res.color}`">
              <component :is="res.icon" />
            </span>
            <span v-if="res.badge" class="res-card-pill" :class="`res-card-pill--${res.badgeColor}`">
              {{ res.badge }}
            </span>
          </div>
          <h3 class="res-card-title">{{ res.title }}</h3>
          <p class="res-card-desc">{{ res.desc }}</p>
          <div class="res-card-foot">
            <span class="res-card-count">{{ res.count }}</span>
            <svg class="res-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </router-link>
      </div>
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
// Greeting
// ============================================================================

const greetingText = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
});

// ============================================================================
// Overall health
// ============================================================================

const overallHealthy = computed(() =>
  systemHealth.value.api && systemHealth.value.websocket && systemHealth.value.database
);

const overallHealthClass = computed(() =>
  overallHealthy.value ? 'health-pill--ok' : 'health-pill--warn'
);

const overallHealthLabel = computed(() =>
  overallHealthy.value ? 'All systems operational' : 'Issues detected'
);

// ============================================================================
// Functional icon components
// ============================================================================

const ServerSvg: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('rect', { x: '2', y: '2', width: '20', height: '8', rx: '2', ry: '2' }),
    h('rect', { x: '2', y: '14', width: '20', height: '8', rx: '2', ry: '2' }),
    h('line', { x1: '6', y1: '6', x2: '6.01', y2: '6' }),
    h('line', { x1: '6', y1: '18', x2: '6.01', y2: '18' }),
  ]);

const TerminalSvg: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('polyline', { points: '4 17 10 11 4 5' }),
    h('line', { x1: '12', y1: '19', x2: '20', y2: '19' }),
  ]);

const FolderSvg: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
  ]);

const FolderPlusSvg: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
    h('line', { x1: '12', y1: '11', x2: '12', y2: '17' }),
    h('line', { x1: '9', y1: '14', x2: '15', y2: '14' }),
  ]);

const CheckSvg: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M9 11l3 3L22 4' }),
    h('path', { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' }),
  ]);

const LockSvg: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' }),
    h('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }),
  ]);

const DocSvg: FunctionalComponent = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
    h('polyline', { points: '14 2 14 8 20 8' }),
    h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
    h('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
  ]);

// ============================================================================
// Stats data
// ============================================================================

const stats = computed(() => {
  const ml = machinesStore.isLoading && machinesStore.machines.length === 0;
  return [
    {
      key: 'machines',
      icon: ServerSvg,
      value: machinesStore.onlineMachines.length,
      label: 'Machines Online',
      sub: `/ ${machinesStore.machines.length}`,
      color: 'purple',
      route: '/machines',
      loading: ml,
    },
    {
      key: 'sessions',
      icon: TerminalSvg,
      value: machinesStore.totalActiveSessions,
      label: 'Active Sessions',
      sub: null,
      color: 'cyan',
      route: '/sessions',
      loading: ml,
    },
    {
      key: 'projects',
      icon: FolderSvg,
      value: totalProjects.value,
      label: 'Projects',
      sub: null,
      color: 'indigo',
      route: '/projects',
      loading: isLoadingProjects.value,
    },
    {
      key: 'tasks',
      icon: CheckSvg,
      value: totalPendingTasks.value,
      label: 'Tasks Pending',
      sub: null,
      color: 'warning',
      route: '/projects',
      loading: isLoadingProjects.value,
    },
  ];
});

// ============================================================================
// Quick Actions
// ============================================================================

const quickActions = computed(() => [
  { name: 'New Session', desc: 'Start a Claude Code session', icon: TerminalSvg, route: '/sessions/new', color: 'purple', primary: true },
  { name: 'Connect Machine', desc: 'Register a new machine', icon: ServerSvg, route: '/machines', color: 'cyan', primary: false },
  { name: 'Create Project', desc: 'Set up multi-agent project', icon: FolderPlusSvg, route: '/projects', color: 'indigo', primary: false },
  { name: 'View Docs', desc: 'API reference & guides', icon: DocSvg, route: '/docs', color: 'gray', primary: false },
]);

// ============================================================================
// Health services
// ============================================================================

const healthServices = computed(() => [
  {
    name: 'API Server',
    dotClass: systemHealth.value.api ? 'dot--ok' : 'dot--error',
    statusLabel: systemHealth.value.api ? 'Operational' : 'Unreachable',
    statusClass: systemHealth.value.api ? 'st--ok' : 'st--error',
  },
  {
    name: 'WebSocket',
    dotClass: systemHealth.value.websocket ? 'dot--ok' : 'dot--warn',
    statusLabel: systemHealth.value.websocket ? 'Connected' : 'Checking...',
    statusClass: systemHealth.value.websocket ? 'st--ok' : 'st--warn',
  },
  {
    name: 'Database',
    dotClass: systemHealth.value.database ? 'dot--ok' : 'dot--error',
    statusLabel: systemHealth.value.database ? 'Healthy' : 'Unknown',
    statusClass: systemHealth.value.database ? 'st--ok' : 'st--error',
  },
]);

// ============================================================================
// Resources
// ============================================================================

const resources = computed(() => [
  {
    title: 'Machines',
    desc: 'Manage your connected machines and agents',
    icon: ServerSvg,
    route: '/machines',
    color: 'purple',
    badge: machinesStore.onlineMachines.length > 0 ? `${machinesStore.onlineMachines.length} online` : null,
    badgeColor: 'purple',
    count: `${machinesStore.machines.length} registered`,
  },
  {
    title: 'Sessions',
    desc: 'View and manage Claude Code sessions',
    icon: TerminalSvg,
    route: '/sessions',
    color: 'cyan',
    badge: machinesStore.totalActiveSessions > 0 ? `${machinesStore.totalActiveSessions} active` : null,
    badgeColor: 'cyan',
    count: `${machinesStore.totalActiveSessions} running`,
  },
  {
    title: 'Projects',
    desc: 'Multi-agent coordination and task management',
    icon: FolderSvg,
    route: '/projects',
    color: 'indigo',
    badge: totalPendingTasks.value > 0 ? `${totalPendingTasks.value} tasks` : null,
    badgeColor: 'warning',
    count: `${totalProjects.value} projects`,
  },
]);

// ============================================================================
// Computed
// ============================================================================

const totalProjects = computed(() => projectsStore.projects.length);

const totalPendingTasks = computed(() =>
  projectsStore.projects.reduce((sum, p) => sum + (p.pending_tasks_count || 0), 0)
);

const uptimeLabel = computed(() => {
  uptimeTick.value;
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

// Activity helpers
function activityDotClass(type: ActivityEvent['type']): string {
  const map: Record<ActivityEvent['type'], string> = {
    session_start: 'act-dot--cyan',
    session_end: 'act-dot--gray',
    machine_connect: 'act-dot--green',
    machine_disconnect: 'act-dot--red',
    task_complete: 'act-dot--purple',
    file_lock: 'act-dot--warning',
  };
  return map[type] || 'act-dot--gray';
}

function activityIconClass(type: ActivityEvent['type']): string {
  const map: Record<ActivityEvent['type'], string> = {
    session_start: 'ic--cyan',
    session_end: 'ic--gray',
    machine_connect: 'ic--green',
    machine_disconnect: 'ic--red',
    task_complete: 'ic--purple',
    file_lock: 'ic--warning',
  };
  return map[type] || 'ic--gray';
}

function activityBadgeClass(type: ActivityEvent['type']): string {
  const map: Record<ActivityEvent['type'], string> = {
    session_start: 'badge--cyan',
    session_end: 'badge--gray',
    machine_connect: 'badge--green',
    machine_disconnect: 'badge--red',
    task_complete: 'badge--purple',
    file_lock: 'badge--warning',
  };
  return map[type] || 'badge--gray';
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

function activityIconComponent(type: ActivityEvent['type']): FunctionalComponent {
  const map: Record<ActivityEvent['type'], FunctionalComponent> = {
    session_start: TerminalSvg,
    session_end: TerminalSvg,
    machine_connect: ServerSvg,
    machine_disconnect: ServerSvg,
    task_complete: CheckSvg,
    file_lock: LockSvg,
  };
  return map[type] || TerminalSvg;
}

// Build activity feed from store data
function buildActivityFeed(): void {
  const events: ActivityEvent[] = [];
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
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  activityFeed.value = events.slice(0, 8);
}

// ============================================================================
// Data fetching
// ============================================================================

async function fetchDashboardData(): Promise<void> {
  try {
    await machinesStore.fetchMachines(1, 100);
    systemHealth.value.api = true;
    systemHealth.value.database = true;
  } catch {
    systemHealth.value.api = false;
    systemHealth.value.database = false;
  }

  isLoadingProjects.value = true;
  try {
    const machineIds = machinesStore.machines.map(m => m.id);
    const fetchPromises = machineIds.map(id =>
      projectsStore.fetchProjects(id).catch(() => {})
    );
    await Promise.allSettled(fetchPromises);
  } finally {
    isLoadingProjects.value = false;
  }

  buildActivityFeed();
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
  await fetchDashboardData();
  refreshLabelInterval = setInterval(updateRefreshLabel, 15000);
  uptimeInterval = setInterval(() => { uptimeTick.value++; }, 1000);
  systemHealth.value.websocket = true;
});

onUnmounted(() => {
  if (refreshLabelInterval) clearInterval(refreshLabelInterval);
  if (uptimeInterval) clearInterval(uptimeInterval);
});
</script>

<style scoped>
/* ============================================================
   LAYOUT
   ============================================================ */
.dashboard {
  min-height: 100%;
}

/* ============================================================
   GREETING BANNER
   ============================================================ */
.greeting {
  position: relative;
  padding: 2rem 1.5rem 1.5rem;
  overflow: hidden;
}

@media (min-width: 640px) {
  .greeting { padding: 2.5rem 2rem 2rem; }
}

.greeting-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(168, 85, 247, 0.06) 0%,
    rgba(99, 102, 241, 0.04) 50%,
    transparent 100%
  );
  pointer-events: none;
}

.greeting-inner {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.greeting-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

@media (min-width: 640px) {
  .greeting-title { font-size: 1.75rem; }
}

.greeting-sub {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.greeting-sep {
  color: var(--text-disabled, #4b5563);
}

/* Health pill */
.health-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.health-pill--ok {
  background: rgba(34, 197, 94, 0.1);
  color: var(--status-success, #22c55e);
}

.health-pill--warn {
  background: rgba(251, 191, 36, 0.1);
  color: var(--status-warning, #fbbf24);
}

.health-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-dot 2s ease-in-out infinite;
}

/* Refresh button */
.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-color, var(--border));
  background: var(--bg-card, var(--surface-2));
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.refresh-btn:hover {
  background: var(--bg-hover, var(--surface-3));
  color: var(--text-primary);
  border-color: var(--accent-purple, #a855f7);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 18px;
  height: 18px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

/* ============================================================
   BENTO GRID
   ============================================================ */
.bento {
  padding: 0 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .bento { padding: 0 2rem 2.5rem; gap: 1.25rem; }
}

/* ---- Stats strip ---- */
.bento-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 1024px) {
  .bento-stats { grid-template-columns: repeat(4, 1fr); }
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid var(--border-color, var(--border));
  background: var(--bg-card, var(--surface-2));
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.stat-chip:hover {
  transform: translateY(-2px);
  border-color: rgba(168, 85, 247, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stat-chip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-chip-icon svg {
  width: 22px;
  height: 22px;
}

.stat-chip-icon--purple { background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.1)); color: var(--accent-purple, #a855f7); }
.stat-chip-icon--cyan   { background: linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.08)); color: var(--accent-cyan, #22d3ee); }
.stat-chip-icon--indigo { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.08)); color: var(--accent-indigo, #6366f1); }
.stat-chip-icon--warning{ background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08)); color: var(--status-warning, #fbbf24); }

.stat-chip-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-chip-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

@media (min-width: 640px) {
  .stat-chip-num { font-size: 1.75rem; }
}

.stat-chip-lbl {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-chip-sub {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-left: auto;
  white-space: nowrap;
}

/* ---- Skeletons ---- */
.skel {
  display: block;
  border-radius: 6px;
  background: var(--surface-3, rgba(59,66,97,0.4));
  animation: pulse 1.5s ease-in-out infinite;
}

.skel--num { width: 48px; height: 28px; }
.skel--lbl { width: 80px; height: 14px; margin-top: 4px; }

/* ---- Main content grid ---- */
.bento-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .bento-main { grid-template-columns: 3fr 2fr; gap: 1.25rem; }
}

/* ---- Bento cards ---- */
.bento-card {
  border-radius: 16px;
  border: 1px solid var(--border-color, var(--border));
  background: var(--bg-card, var(--surface-2));
  overflow: hidden;
}

.bento-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0;
}

.bento-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.bento-card-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ---- Actions grid ---- */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.625rem;
  padding: 1rem 1.5rem 1.5rem;
}

@media (min-width: 640px) {
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
}

.action-tile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-color, var(--border));
  background: var(--bg-hover, var(--surface-3));
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.action-tile:hover {
  border-color: rgba(168, 85, 247, 0.3);
  background: var(--surface-4, rgba(36, 40, 59, 0.8));
}

.action-tile--primary {
  border-color: rgba(168, 85, 247, 0.25);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(99, 102, 241, 0.03));
}

.action-tile--primary:hover {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(99, 102, 241, 0.06));
  border-color: rgba(168, 85, 247, 0.4);
}

.action-tile-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
}

.action-tile-icon svg {
  width: 18px;
  height: 18px;
}

.action-tile-icon--purple { background: rgba(168,85,247,0.12); color: var(--accent-purple, #a855f7); }
.action-tile-icon--cyan   { background: rgba(34,211,238,0.12); color: var(--accent-cyan, #22d3ee); }
.action-tile-icon--indigo { background: rgba(99,102,241,0.12); color: var(--accent-indigo, #6366f1); }
.action-tile-icon--gray   { background: rgba(148,163,184,0.08); color: var(--text-secondary); }

.action-tile-copy {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.action-tile-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.action-tile-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-tile-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.action-tile:hover .action-tile-arrow {
  color: var(--text-secondary);
  transform: translateX(2px);
}

/* ---- System Health ---- */
.health-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.5rem 0;
}

.health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.health-row-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--ok    { background: var(--status-success, #22c55e); box-shadow: 0 0 6px rgba(34,197,94,0.4); }
.dot--warn  { background: var(--status-warning, #fbbf24); box-shadow: 0 0 6px rgba(251,191,36,0.4); }
.dot--error { background: var(--status-error, #ef4444);   box-shadow: 0 0 6px rgba(239,68,68,0.4); }

.health-name {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.health-status {
  font-size: 0.875rem;
  font-weight: 500;
}

.st--ok    { color: var(--status-success, #22c55e); }
.st--warn  { color: var(--status-warning, #fbbf24); }
.st--error { color: var(--status-error, #ef4444); }

.health-divider {
  margin: 1rem 1.5rem 0;
  border-top: 1px solid var(--border-color, var(--border));
  opacity: 0.5;
}

.health-meta {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.health-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.health-meta-lbl {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.health-meta-val {
  font-size: 0.8125rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-secondary);
}

/* ---- Activity feed ---- */
.bento-card--activity {
  padding-bottom: 0.5rem;
}

.activity-feed {
  padding: 0.75rem 1.5rem 1rem;
}

.act-row {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.act-dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
}

.act-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.act-dot--cyan    { background: var(--accent-cyan, #22d3ee);    box-shadow: 0 0 6px rgba(34,211,238,0.3); }
.act-dot--green   { background: var(--status-success, #22c55e); box-shadow: 0 0 6px rgba(34,197,94,0.3); }
.act-dot--red     { background: var(--status-error, #ef4444);   box-shadow: 0 0 6px rgba(239,68,68,0.3); }
.act-dot--purple  { background: var(--accent-purple, #a855f7);  box-shadow: 0 0 6px rgba(168,85,247,0.3); }
.act-dot--warning { background: var(--status-warning, #fbbf24); box-shadow: 0 0 6px rgba(251,191,36,0.3); }
.act-dot--gray    { background: var(--text-muted, #6b7280); }

.act-line {
  flex: 1;
  width: 1px;
  margin-top: 4px;
  background: var(--border-color, var(--border));
  min-height: 16px;
  opacity: 0.5;
}

.act-body {
  flex: 1;
  min-width: 0;
}

.act-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.act-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.ic--cyan    { color: var(--accent-cyan, #22d3ee); }
.ic--green   { color: var(--status-success, #22c55e); }
.ic--red     { color: var(--status-error, #ef4444); }
.ic--purple  { color: var(--accent-purple, #a855f7); }
.ic--warning { color: var(--status-warning, #fbbf24); }
.ic--gray    { color: var(--text-muted); }

.act-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.act-badge {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.badge--cyan    { background: rgba(34,211,238,0.1);  color: var(--accent-cyan, #22d3ee); }
.badge--green   { background: rgba(34,197,94,0.1);   color: var(--status-success, #22c55e); }
.badge--red     { background: rgba(239,68,68,0.1);   color: var(--status-error, #ef4444); }
.badge--purple  { background: rgba(168,85,247,0.1);  color: var(--accent-purple, #a855f7); }
.badge--warning { background: rgba(251,191,36,0.1);  color: var(--status-warning, #fbbf24); }
.badge--gray    { background: rgba(148,163,184,0.08); color: var(--text-muted); }

.act-time {
  display: block;
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ---- Empty state ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.empty-title {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.empty-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* ---- Resource nav cards ---- */
.bento-resources {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .bento-resources { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .bento-resources { grid-template-columns: repeat(3, 1fr); }
}

.res-card {
  display: block;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  border: 1px solid var(--border-color, var(--border));
  background: var(--bg-card, var(--surface-2));
  text-decoration: none;
  transition: all 0.2s;
}

.res-card:hover {
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.res-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.res-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.res-card-icon svg {
  width: 20px;
  height: 20px;
}

.res-card-icon--purple { background: rgba(168,85,247,0.1);  color: var(--accent-purple, #a855f7); }
.res-card-icon--cyan   { background: rgba(34,211,238,0.1);  color: var(--accent-cyan, #22d3ee); }
.res-card-icon--indigo { background: rgba(99,102,241,0.1);  color: var(--accent-indigo, #6366f1); }

.res-card-pill {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 9999px;
}

.res-card-pill--purple  { background: rgba(168,85,247,0.1);  color: var(--accent-purple, #a855f7); }
.res-card-pill--cyan    { background: rgba(34,211,238,0.1);  color: var(--accent-cyan, #22d3ee); }
.res-card-pill--warning { background: rgba(251,191,36,0.1);  color: var(--status-warning, #fbbf24); }

.res-card-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.res-card-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.res-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, var(--border));
  opacity: 0.7;
}

.res-card:hover .res-card-foot {
  opacity: 1;
}

.res-card-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.res-card-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform 0.2s, color 0.2s;
}

.res-card:hover .res-card-arrow {
  color: var(--accent-purple, #a855f7);
  transform: translateX(3px);
}

/* ============================================================
   ANIMATIONS
   ============================================================ */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ============================================================
   RESPONSIVE - Mobile (< 640px)
   ============================================================ */
@media (max-width: 639px) {
  .stat-chip-sub { display: none; }
  .act-badge { display: none; }
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .stat-chip:hover,
  .res-card:hover { transform: none; }
  .refresh-icon.spinning { animation: none; }
  .health-pill-dot { animation: none; }
}
</style>
