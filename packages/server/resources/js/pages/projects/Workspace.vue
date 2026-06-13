<template>
  <div class="workspace-page">
    <!-- ── Header (48px) ──────────────────────────────────────────────────── -->
    <header class="ws-header">
      <div class="ws-header-left">
        <h1 class="ws-title">{{ project?.name ?? t('projectsWorkspace.title') }}</h1>
        <span class="ws-pill" :class="{ 'is-running': isOrchestratorRunning }">
          <span class="ws-pill-dot" />
          {{ t('projectsWorkspace.workersPill', { count: workerCount }) }}
        </span>
        <button
          v-if="pendingMergeCount > 0"
          class="ws-pill ws-pill--merge"
          :title="t('projectsWorkspace.header.pendingMergeHint')"
          @click="openGitRail"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="6" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 9v6" /><path d="M18 6a9 9 0 0 1-9 9" /><circle cx="18" cy="6" r="3" /></svg>
          {{ t('projectsWorkspace.header.pendingMerge', { count: pendingMergeCount }) }}
        </button>
      </div>

      <div class="ws-header-actions">
        <button class="ws-btn" @click="openSpawnModal">
          {{ t('projectsWorkspace.header.spawnWorker') }}
        </button>
        <button
          v-if="!isOrchestratorRunning"
          class="ws-btn ws-btn--primary"
          :disabled="orchestratorStore.isOrchestratorLoading"
          @click="openSpawnModal"
        >
          {{ t('projectsWorkspace.header.startOrchestrator') }}
        </button>
        <button
          v-else
          class="ws-btn ws-btn--danger"
          :disabled="orchestratorStore.isOrchestratorLoading"
          @click="handleStopOrchestrator"
        >
          {{ t('projectsWorkspace.header.stopOrchestrator') }}
        </button>

        <div class="ws-grid-select" role="group" :aria-label="t('projectsWorkspace.header.gridLabel')">
          <button
            v-for="option in GRID_OPTIONS"
            :key="option"
            class="ws-grid-option"
            :class="{ active: grid === option }"
            :title="t('projectsWorkspace.header.gridOption', { count: option })"
            @click="grid = option"
          >
            {{ option }}
          </button>
        </div>

        <button
          class="ws-btn ws-btn--icon"
          :title="t('projectsWorkspace.header.toggleRail')"
          :aria-label="t('projectsWorkspace.header.toggleRail')"
          @click="railOpen = !railOpen"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 4v16m6-16v16M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
        </button>
      </div>
    </header>

    <!-- ── Reconnect banner ───────────────────────────────────────────────── -->
    <div v-if="hasDisconnectedPane" class="ws-reconnect">
      {{ t('projectsWorkspace.reconnecting') }}
    </div>

    <!-- ── Mobile hint ────────────────────────────────────────────────────── -->
    <div class="ws-mobile-banner">
      {{ t('projectsWorkspace.mobileBanner') }}
    </div>

    <!-- ── Pane strip (sessions > slots, or zoomed) ───────────────────────── -->
    <div v-if="showStrip" class="ws-strip">
      <button
        v-for="session in paneSessions"
        :key="session.id"
        class="ws-strip-tab"
        :class="{ active: displayedIds.includes(session.id) }"
        @click="swapIn(session.id)"
      >
        <span class="ws-strip-dot" :style="{ backgroundColor: paneColor(session) }" />
        <span class="ws-strip-name">{{ paneName(session) }}</span>
        <span v-if="needsInputIds.has(session.id)" class="ws-strip-alert" :title="t('projectsWorkspace.pane.needsInput')" />
      </button>
    </div>

    <!-- ── Body: grid + rail ──────────────────────────────────────────────── -->
    <div class="ws-body" :class="{ 'rail-open': railOpen }">
      <!-- Loading skeletons -->
      <div v-if="isInitialLoading" class="ws-grid" data-grid="2">
        <div v-for="n in 2" :key="n" class="ws-skeleton-pane">
          <div class="ws-skeleton-bar" />
          <div class="ws-skeleton-body" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="paneSessions.length === 0" class="ws-empty">
        <svg class="ws-empty-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="4" y="6" width="18" height="14" rx="2" />
          <rect x="26" y="6" width="18" height="14" rx="2" />
          <rect x="4" y="24" width="18" height="14" rx="2" />
          <rect x="26" y="24" width="18" height="14" rx="2" />
          <path stroke-linecap="round" d="M8 11l3 2.5L8 16M14 16h4M30 11l3 2.5-3 2.5M36 16h4" />
        </svg>
        <h2 class="ws-empty-title">{{ t('projectsWorkspace.empty.title') }}</h2>
        <p class="ws-empty-text">{{ t('projectsWorkspace.empty.text') }}</p>
        <div class="ws-empty-actions">
          <button class="ws-btn ws-btn--primary" @click="openSpawnModal">
            {{ t('projectsWorkspace.empty.start') }}
          </button>
          <button class="ws-btn" @click="openSpawnModal">
            {{ t('projectsWorkspace.empty.spawn') }}
          </button>
        </div>
        <a href="/docs/quickstart" target="_blank" rel="noopener" class="ws-empty-docs">
          {{ t('projectsWorkspace.empty.docs') }}
        </a>
      </div>

      <!-- Terminal grid (max 4 mounted xterm) -->
      <div v-else class="ws-grid" :data-grid="zoomedId ? 1 : effectiveSlots">
        <WorkspacePane
          v-for="(session, index) in displayedSessions"
          :key="session.id"
          :ref="(el) => registerPane(session.id, el)"
          :session="session"
          :worker-name="paneName(session)"
          :color="paneColor(session)"
          :task-title="paneTask(session)"
          :state="paneState(session)"
          :focused="focusedIndex === index"
          @zoom="toggleZoom(session.id)"
          @detach="detachSession(session)"
          @kill="killSession(session)"
          @close="closePane(session.id)"
          @focus-task="openRailTasks"
          @focus-pane="focusedIndex = index"
          @connected="disconnectedIds.delete(session.id)"
          @disconnected="markDisconnected(session)"
          @status-change="(status) => handlePaneStatus(session, status)"
        />
      </div>

      <!-- Right rail (320px / overlay <1280) -->
      <template v-if="railOpen">
        <div class="ws-rail-backdrop" @click="railOpen = false" />
        <div v-if="isInitialLoading" class="ws-rail-skeleton">
          <div v-for="n in 5" :key="n" class="ws-skeleton-bar" />
        </div>
        <WorkspaceRail
          v-else
          v-model="railTab"
          class="ws-rail-slot"
          :project-id="projectId"
          :tasks="tasksStore.tasks"
          :locks="locksStore.locks"
          :instances="orchestratorStore.instances"
          :activities="projectsStore.activityLogs"
          @spawn="openSpawnModal"
          @force-release="handleForceRelease"
        />
      </template>
    </div>

    <!-- ── Spawn / start orchestrator modal (same contract as Orchestration) ── -->
    <Modal v-model="showSpawnModal" :title="t('projectsWorkspace.modal.title')">
      <form class="ws-spawn-form" @submit.prevent="handleStartOrchestrator">
        <div class="ws-form-group">
          <label for="ws-max-workers">{{ t('projectsOrchestration.maxWorkers') }}</label>
          <input
            id="ws-max-workers"
            v-model.number="spawnForm.maxWorkers"
            type="number"
            min="1"
            max="10"
            step="1"
            required
          />
          <span class="ws-form-hint">{{ t('projectsOrchestration.maxWorkersHint') }}</span>
        </div>

        <div class="ws-form-group">
          <label for="ws-permission-mode">{{ t('projectsOrchestration.permissionMode') }}</label>
          <select id="ws-permission-mode" v-model="spawnForm.permissionMode">
            <option v-for="option in PERMISSION_MODE_OPTIONS" :key="option.value" :value="option.value">
              {{ t(option.labelKey) }}
            </option>
          </select>
        </div>

        <div class="ws-form-group">
          <label class="ws-checkbox" for="ws-coordinator">
            <input id="ws-coordinator" v-model="spawnForm.coordinator" type="checkbox" />
            <span>{{ t('projectsOrchestration.coordinatorLabel') }}</span>
          </label>
        </div>

        <div v-if="spawnError" class="ws-spawn-error" role="alert">{{ spawnError }}</div>

        <div class="ws-form-actions">
          <Button type="button" variant="secondary" @click="showSpawnModal = false">
            {{ t('projectsOrchestration.cancel') }}
          </Button>
          <Button type="submit" variant="primary" :loading="orchestratorStore.isOrchestratorLoading">
            {{ t('projectsOrchestration.start') }}
          </Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import WorkspacePane, { type PaneState } from '@/components/workspace/WorkspacePane.vue';
import WorkspaceRail, { type RailTab } from '@/components/workspace/WorkspaceRail.vue';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import { api, getApiErrorCode } from '@/composables/useApi';
import { useProjectChannel } from '@/composables/useProjectChannel';
import { useProjectNotifications } from '@/composables/useProjectNotifications';
import { useTabs } from '@/composables/useTabs';
import { useToast } from '@/composables/useToast';
import { useProjectsStore } from '@/stores/projects';
import { useTasksStore } from '@/stores/tasks';
import { useLocksStore } from '@/stores/locks';
import { useOrchestratorStore, type PermissionMode } from '@/stores/orchestrator';
import { useSessionsStore } from '@/stores/sessions';
import { useGitStore } from '@/stores/git';
import { workerColor, workerShortName } from '@/utils/workerColor';
import type { ApiResponse, Session } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const GRID_OPTIONS = [1, 2, 4] as const;
type GridSize = (typeof GRID_OPTIONS)[number];

const ACTIVE_STATUS_CSV = 'created,starting,running,waiting_input';
const ENDED_STATUSES = ['completed', 'error', 'terminated'];

const PERMISSION_MODE_OPTIONS: ReadonlyArray<{ value: PermissionMode; labelKey: string }> = [
  { value: 'acceptEdits', labelKey: 'projectsOrchestration.permissionModeAcceptEdits' },
  { value: 'default', labelKey: 'projectsOrchestration.permissionModeDefault' },
  { value: 'plan', labelKey: 'projectsOrchestration.permissionModePlan' },
  { value: 'bypassPermissions', labelKey: 'projectsOrchestration.permissionModeBypass' },
];

// ── Setup ────────────────────────────────────────────────────────────────────

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const { openTab } = useTabs();

const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();
const locksStore = useLocksStore();
const orchestratorStore = useOrchestratorStore();
const sessionsStore = useSessionsStore();
const gitStore = useGitStore();

const projectId = computed(() => route.params.id as string);
const project = computed(() => projectsStore.selectedProject);

// Pending merges (open PRs) for this project — surfaced as a header pill so it
// stays visible even when the rail is collapsed.
const pendingMergeCount = computed(() => gitStore.pulls.length);
function openGitRail(): void {
  railOpen.value = true;
  railTab.value = 'git';
}

// ── Layout state (persisted per project) ─────────────────────────────────────

const grid = ref<GridSize>(2);
const railOpen = ref(true);
const railTab = ref<RailTab>('tasks');
const orderedIds = ref<string[]>([]);

const storageKey = computed(() => `cn-workspace-layout-${projectId.value}`);

function restoreLayout(): void {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (!raw) return;
    const data = JSON.parse(raw) as Partial<{
      grid: number;
      railOpen: boolean;
      railTab: RailTab;
      order: string[];
    }>;
    if (data.grid === 1 || data.grid === 2 || data.grid === 4) grid.value = data.grid;
    if (typeof data.railOpen === 'boolean') railOpen.value = data.railOpen;
    if (data.railTab === 'tasks' || data.railTab === 'locks' || data.railTab === 'workers') {
      railTab.value = data.railTab;
    }
    if (Array.isArray(data.order)) orderedIds.value = data.order.filter((id) => typeof id === 'string');
  } catch {
    // Corrupted layout — defaults apply.
  }
}

watch([grid, railOpen, railTab, orderedIds], () => {
  localStorage.setItem(
    storageKey.value,
    JSON.stringify({
      grid: grid.value,
      railOpen: railOpen.value,
      railTab: railTab.value,
      order: orderedIds.value,
    }),
  );
}, { deep: true });

// ── Sessions (new GET /projects/{id}/sessions endpoint) ──────────────────────

const sessions = ref<Session[]>([]);
const isInitialLoading = ref(true);

async function loadSessions(): Promise<void> {
  const response = await api.get<ApiResponse<Session[]>>(
    `/projects/${projectId.value}/sessions`,
    { params: { status: ACTIVE_STATUS_CSV } },
  );
  const fetched = response.data.data;
  const fetchedIds = new Set(fetched.map((session) => session.id));

  // Ended-but-displayed panes stay mounted (overlay) until explicitly closed —
  // a refresh must never make a terminal vanish silently.
  const keptEnded = sessions.value.filter(
    (session) => ENDED_STATUSES.includes(session.status) && !fetchedIds.has(session.id),
  );

  sessions.value = [...fetched, ...keptEnded];
}

const paneSessions = computed<Session[]>(() => {
  const byId = new Map(sessions.value.map((session) => [session.id, session]));
  const ordered: Session[] = [];

  for (const id of orderedIds.value) {
    const session = byId.get(id);
    if (session) {
      ordered.push(session);
      byId.delete(id);
    }
  }
  // Newly discovered sessions append at the end.
  ordered.push(...byId.values());
  return ordered;
});

// Keep the persisted ordering in sync with reality.
watch(paneSessions, (list) => {
  const ids = list.map((session) => session.id);
  if (ids.join('|') !== orderedIds.value.join('|')) {
    orderedIds.value = ids;
  }
});

// ── Responsive slots (max 4 mounted terminals, fewer on small screens) ──────

const windowWidth = ref(window.innerWidth);
function handleWindowResize(): void {
  windowWidth.value = window.innerWidth;
}

const viewportCap = computed(() => {
  if (windowWidth.value < 768) return 1;
  if (windowWidth.value < 1024) return 2;
  return 4;
});

const effectiveSlots = computed(() => Math.min(grid.value, viewportCap.value));

const zoomedId = ref<string | null>(null);

const displayedSessions = computed<Session[]>(() => {
  if (zoomedId.value) {
    const zoomed = paneSessions.value.find((session) => session.id === zoomedId.value);
    if (zoomed) return [zoomed];
  }
  return paneSessions.value.slice(0, effectiveSlots.value);
});

const displayedIds = computed(() => displayedSessions.value.map((session) => session.id));

const showStrip = computed(() =>
  paneSessions.value.length > 0
  && (paneSessions.value.length > effectiveSlots.value || zoomedId.value !== null),
);

// ── Worker mapping (orchestrator status → pane metadata) ─────────────────────

const workersBySession = computed(() => {
  const map = new Map<string, { id: string; status: string; taskTitle: string | null }>();
  for (const worker of orchestratorStore.orchestratorStatus?.workers ?? []) {
    map.set(worker.sessionId, {
      id: worker.id,
      status: worker.status,
      taskTitle: worker.currentTaskTitle,
    });
  }
  return map;
});

const workerCount = computed(() => orchestratorStore.orchestratorStatus?.workers.length ?? 0);
const isOrchestratorRunning = computed(() => orchestratorStore.orchestratorStatus?.status === 'running');

const needsInputIds = ref(new Set<string>());
const disconnectedIds = ref(new Set<string>());

function paneName(session: Session): string {
  return workerShortName(workersBySession.value.get(session.id)?.id ?? null, session.id);
}

function paneColor(session: Session): string {
  return workerColor(workersBySession.value.get(session.id)?.id ?? session.id);
}

function paneTask(session: Session): string | null {
  return workersBySession.value.get(session.id)?.taskTitle ?? null;
}

function paneState(session: Session): PaneState {
  if (session.status === 'waiting_input' || needsInputIds.value.has(session.id)) {
    return 'needs-input';
  }
  return workersBySession.value.get(session.id)?.status === 'busy' ? 'busy' : 'idle';
}

const hasDisconnectedPane = computed(() =>
  displayedSessions.value.some(
    (session) => disconnectedIds.value.has(session.id) && !ENDED_STATUSES.includes(session.status),
  ),
);

function markDisconnected(session: Session): void {
  if (!ENDED_STATUSES.includes(session.status)) {
    disconnectedIds.value.add(session.id);
  }
}

// ── Pane interactions ────────────────────────────────────────────────────────

const focusedIndex = ref(0);

type PaneInstance = InstanceType<typeof WorkspacePane>;
const paneRefs = new Map<string, PaneInstance>();

function registerPane(sessionId: string, el: unknown): void {
  if (el) {
    paneRefs.set(sessionId, el as PaneInstance);
  } else {
    paneRefs.delete(sessionId);
  }
}

function toggleZoom(sessionId: string): void {
  zoomedId.value = zoomedId.value === sessionId ? null : sessionId;
}

function swapIn(sessionId: string): void {
  if (zoomedId.value) {
    zoomedId.value = sessionId;
    return;
  }

  const ids = [...orderedIds.value];
  const index = ids.indexOf(sessionId);
  if (index === -1 || index < effectiveSlots.value) {
    focusedIndex.value = Math.max(0, displayedIds.value.indexOf(sessionId));
    return;
  }

  // Swap the hidden session with the last visible slot — the outgoing pane is
  // unmounted (terminal disposed) and replays its logs when it comes back.
  const slot = effectiveSlots.value - 1;
  [ids[slot], ids[index]] = [ids[index], ids[slot]];
  orderedIds.value = ids;
  focusedIndex.value = slot;
}

function detachSession(session: Session): void {
  openTab({
    type: 'terminal',
    label: `Terminal ${session.id.slice(0, 8)}`,
    icon: 'terminal',
    path: `/sessions/${session.id}`,
    closable: true,
    meta: { sessionId: session.id },
  });
}

async function killSession(session: Session): Promise<void> {
  if (!window.confirm(t('projectsWorkspace.confirmKill'))) return;

  try {
    await sessionsStore.terminateSession(session.id);
    const local = sessions.value.find((item) => item.id === session.id);
    if (local) local.status = 'terminated';
    toast.success(t('projectsWorkspace.toasts.sessionKilled'));
  } catch {
    toast.error(t('projectsWorkspace.toasts.sessionKillFailed'));
  }
}

function closePane(sessionId: string): void {
  sessions.value = sessions.value.filter((session) => session.id !== sessionId);
  if (zoomedId.value === sessionId) zoomedId.value = null;
  disconnectedIds.value.delete(sessionId);
  needsInputIds.value.delete(sessionId);
}

function handlePaneStatus(session: Session, status: string): void {
  const local = sessions.value.find((item) => item.id === session.id);
  if (local) local.status = status as Session['status'];

  if (status === 'waiting_input') {
    needsInputIds.value.add(session.id);
    needsInputIds.value = new Set(needsInputIds.value);
    toast.warning(
      t('projectsWorkspace.toasts.needsInputTitle', { name: paneName(session) }),
      t('projectsWorkspace.toasts.needsInputMessage'),
    );
  } else if (status === 'running') {
    if (needsInputIds.value.delete(session.id)) {
      needsInputIds.value = new Set(needsInputIds.value);
    }
  }

  if (ENDED_STATUSES.includes(status)) {
    disconnectedIds.value.delete(session.id);
    scheduleRefresh();
  }
}

function openRailTasks(): void {
  railOpen.value = true;
  railTab.value = 'tasks';
}

// ── Orchestrator / spawn (same contract as Orchestration.vue) ───────────────

const showSpawnModal = ref(false);
const spawnError = ref<string | null>(null);
const spawnForm = ref<{ maxWorkers: number; permissionMode: PermissionMode; coordinator: boolean }>({
  maxWorkers: 3,
  permissionMode: 'acceptEdits',
  coordinator: true,
});

function openSpawnModal(): void {
  spawnError.value = null;
  showSpawnModal.value = true;
}

async function handleStartOrchestrator(): Promise<void> {
  spawnError.value = null;

  try {
    const status = await orchestratorStore.startOrchestrator(projectId.value, {
      max_workers: spawnForm.value.maxWorkers,
      permission_mode: spawnForm.value.permissionMode,
      coordinator: spawnForm.value.coordinator,
    });
    showSpawnModal.value = false;
    toast.success(t('projectsWorkspace.toasts.started', { count: status.workers.length }));
    await Promise.all([loadSessions(), orchestratorStore.fetchInstances(projectId.value)]);
  } catch (err: unknown) {
    const code = getApiErrorCode(err);
    if (code === 'PLAN_001') {
      spawnError.value = t('projectsOrchestration.planLimitReached');
    } else if (code === 'MACHINE_OFFLINE') {
      spawnError.value = t('projectsOrchestration.machineOffline');
    } else {
      spawnError.value = t('projectsWorkspace.toasts.startFailed');
    }
    toast.error(spawnError.value);
  }
}

async function handleStopOrchestrator(): Promise<void> {
  try {
    await orchestratorStore.stopOrchestrator(projectId.value);
    toast.success(t('projectsWorkspace.toasts.stopped'));
    scheduleRefresh();
  } catch {
    toast.error(t('projectsWorkspace.toasts.stopFailed'));
  }
}

async function handleForceRelease(path: string): Promise<void> {
  try {
    await locksStore.forceUnlock(projectId.value, path);
    toast.success(t('projectsWorkspace.toasts.lockReleased'));
  } catch {
    toast.error(t('projectsWorkspace.toasts.lockReleaseFailed'));
  }
}

// ── Real-time (private projects.{id} channel) ────────────────────────────────

const { on } = useProjectChannel(projectId);
useProjectNotifications(projectId);

let refreshTimer: number | null = null;

function scheduleRefresh(): void {
  if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    void loadSessions();
    void orchestratorStore.fetchOrchestratorStatus(projectId.value);
    void orchestratorStore.fetchInstances(projectId.value);
  }, 400);
}

let tasksRefreshTimer: number | null = null;

function scheduleTasksRefresh(): void {
  if (tasksRefreshTimer !== null) window.clearTimeout(tasksRefreshTimer);
  tasksRefreshTimer = window.setTimeout(() => {
    tasksRefreshTimer = null;
    void tasksStore.fetchTasks(projectId.value).catch(() => {});
    void orchestratorStore.fetchOrchestratorStatus(projectId.value);
  }, 400);
}

on('instance.updated', (payload) => {
  orchestratorStore.applyInstanceUpdate(payload);
  if (payload.session_id && payload.status === 'busy') {
    if (needsInputIds.value.delete(payload.session_id)) {
      needsInputIds.value = new Set(needsInputIds.value);
    }
  }
  scheduleRefresh();
});

on('task.created', scheduleTasksRefresh);
on('task.claimed', scheduleTasksRefresh);
on('task.released', scheduleTasksRefresh);
on('task.completed', scheduleTasksRefresh);

on('file.locked', (payload) => {
  locksStore.addLockLocal({
    id: payload.lock_id,
    path: payload.path,
    locked_by: payload.locked_by,
    reason: payload.reason,
    locked_at: new Date().toISOString(),
    expires_at: payload.expires_at,
    remaining_seconds: Math.max(
      0,
      Math.floor((new Date(payload.expires_at).getTime() - Date.now()) / 1000),
    ),
  });
});

on('file.unlocked', (payload) => {
  locksStore.removeLockLocal(payload.path);
});

on('session.notification', (payload) => {
  if (!payload.session_id) return;
  needsInputIds.value.add(payload.session_id);
  needsInputIds.value = new Set(needsInputIds.value);
});

// ── Keyboard shortcuts (never when typing inside an xterm/input) ────────────

function isTypingTarget(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.closest('.xterm')) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function handleKeydown(event: KeyboardEvent): void {
  if (isTypingTarget()) return;

  if (event.key === 'Escape' && zoomedId.value) {
    zoomedId.value = null;
    return;
  }

  if (!event.ctrlKey && !event.metaKey) return;

  if (event.shiftKey && (event.key === 'F' || event.key === 'f')) {
    event.preventDefault();
    const target = displayedSessions.value[focusedIndex.value] ?? displayedSessions.value[0];
    if (target) toggleZoom(target.id);
    return;
  }

  if (event.key === 'l' || event.key === 'L') {
    event.preventDefault();
    railOpen.value = !railOpen.value;
    return;
  }

  const slot = Number.parseInt(event.key, 10);
  if (slot >= 1 && slot <= 4) {
    const session = displayedSessions.value[slot - 1];
    if (session) {
      event.preventDefault();
      focusedIndex.value = slot - 1;
      paneRefs.get(session.id)?.focusTerminal();
    }
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

async function loadAll(): Promise<void> {
  isInitialLoading.value = true;

  try {
    if (!project.value || project.value.id !== projectId.value) {
      await projectsStore.fetchProject(projectId.value);
    }
    await Promise.all([
      loadSessions(),
      orchestratorStore.fetchOrchestratorStatus(projectId.value),
      orchestratorStore.fetchInstances(projectId.value).catch(() => {}),
      tasksStore.fetchTasks(projectId.value).catch(() => {}),
      locksStore.fetchLocks(projectId.value).catch(() => {}),
      projectsStore.fetchActivity(projectId.value).catch(() => {}),
    ]);
  } catch {
    toast.error(t('projectsWorkspace.toasts.loadFailed'));
  } finally {
    isInitialLoading.value = false;
  }
}

onMounted(() => {
  restoreLayout();
  void loadAll();
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleWindowResize);
  if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  if (tasksRefreshTimer !== null) window.clearTimeout(tasksRefreshTimer);
});

watch(projectId, () => {
  zoomedId.value = null;
  orderedIds.value = [];
  sessions.value = [];
  restoreLayout();
  void loadAll();
});
</script>

<style scoped>
.workspace-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: var(--bg-primary);
}

/* ── Header ── */
.ws-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 48px;
  padding: 0 16px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.ws-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.ws-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ws-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  background: var(--bg-hover);
  border-radius: 9999px;
  padding: 2px 10px;
  white-space: nowrap;
}

.ws-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--text-muted);
}

.ws-pill.is-running .ws-pill-dot {
  background-color: #22c55e;
}

.ws-pill--merge {
  border: none;
  cursor: pointer;
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 14%, transparent);
  font-weight: 600;
}
.ws-pill--merge:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 24%, transparent);
}

.ws-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ws-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.ws-btn:active {
  transform: scale(0.97);
}

.ws-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.ws-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ws-btn--primary {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  border-color: transparent;
  color: white;
}

.ws-btn--primary:hover {
  color: white;
  opacity: 0.9;
}

.ws-btn--danger:hover {
  border-color: #ef4444;
  color: #ef4444;
  background-color: color-mix(in srgb, #ef4444 8%, transparent);
}

.ws-btn--icon {
  padding: 6px;
}

.ws-btn--icon svg {
  width: 16px;
  height: 16px;
}

.ws-grid-select {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.ws-grid-option {
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-weight: 600;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.ws-grid-option + .ws-grid-option {
  border-left: 1px solid var(--border-color);
}

.ws-grid-option.active {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 16%, transparent);
  color: var(--accent-purple, #a855f7);
}

/* ── Reconnect banner ── */
.ws-reconnect {
  flex-shrink: 0;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border-bottom: 1px solid rgba(251, 191, 36, 0.25);
}

/* ── Mobile banner ── */
.ws-mobile-banner {
  display: none;
  flex-shrink: 0;
  padding: 6px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 8%, transparent);
  border-bottom: 1px solid var(--border-color);
}

/* ── Pane strip ── */
.ws-strip {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 12px;
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.ws-strip::-webkit-scrollbar {
  display: none;
}

.ws-strip-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid transparent;
  border-radius: 9999px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.ws-strip-tab:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.ws-strip-tab.active {
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 45%, transparent);
  color: var(--text-primary);
}

.ws-strip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.ws-strip-alert {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #fbbf24;
  animation: strip-alert-pulse 2s ease-in-out infinite;
}

@keyframes strip-alert-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ── Body ── */
.ws-body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}

.ws-body.rail-open {
  grid-template-columns: minmax(0, 1fr) 320px;
}

.ws-rail-backdrop {
  display: none;
}

/* ── Terminal grid ── */
.ws-grid {
  display: grid;
  gap: 10px;
  padding: 12px;
  min-height: 0;
  overflow: hidden;
  transition: grid-template-columns 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}

.ws-grid[data-grid='1'] {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}

.ws-grid[data-grid='2'] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr);
}

.ws-grid[data-grid='4'] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

/* ── Empty state ── */
.ws-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  text-align: center;
}

.ws-empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-muted);
  opacity: 0.6;
  margin-bottom: 6px;
}

.ws-empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.ws-empty-text {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 380px;
}

.ws-empty-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.ws-empty-docs {
  font-size: 12px;
  color: var(--accent-purple, #a855f7);
  text-decoration: none;
  margin-top: 4px;
}

.ws-empty-docs:hover {
  text-decoration: underline;
}

/* ── Skeletons ── */
.ws-skeleton-pane {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  min-height: 280px;
}

.ws-skeleton-bar {
  height: 32px;
  flex-shrink: 0;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.ws-skeleton-body {
  flex: 1;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  opacity: 0.6;
}

.ws-rail-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-left: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.ws-rail-skeleton .ws-skeleton-bar {
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ws-skeleton-bar,
  .ws-skeleton-body,
  .ws-strip-alert {
    animation: none;
  }
}

/* ── Responsive ── */
@media (max-width: 1279px) {
  /* Rail becomes a right overlay (280px) */
  .ws-body.rail-open {
    grid-template-columns: minmax(0, 1fr);
  }

  .ws-body.rail-open .ws-rail-slot,
  .ws-body.rail-open .ws-rail-skeleton {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    z-index: 30;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.25);
  }

  .ws-body.rail-open .ws-rail-backdrop {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 25;
    background: color-mix(in srgb, var(--bg-primary) 45%, transparent);
  }
}

@media (max-width: 1023px) {
  /* Single column, panes stack with a minimum readable height */
  .ws-grid[data-grid='2'],
  .ws-grid[data-grid='4'] {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-auto-rows: minmax(320px, 1fr);
    overflow-y: auto;
  }
}

@media (max-width: 767px) {
  .ws-mobile-banner {
    display: block;
  }

  .ws-header {
    overflow-x: auto;
    scrollbar-width: none;
  }

  /* Rail becomes a bottom sheet */
  .ws-body.rail-open .ws-rail-slot,
  .ws-body.rail-open .ws-rail-skeleton {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: 60vh;
    border-left: none;
    border-top: 1px solid var(--border-color);
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.3);
  }
}

/* ── Spawn modal form ── */
.ws-spawn-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ws-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ws-form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.ws-form-group input:not([type='checkbox']),
.ws-form-group select {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s ease;
}

.ws-form-group input:focus,
.ws-form-group select:focus {
  border-color: var(--accent-purple, #a855f7);
}

.ws-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.ws-checkbox input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: var(--accent-purple, #a855f7);
  cursor: pointer;
}

.ws-form-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.ws-spawn-error {
  padding: 10px 12px;
  font-size: 12px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
}

.ws-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}
</style>
