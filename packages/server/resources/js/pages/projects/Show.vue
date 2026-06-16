<template>
  <div class="project-show-page">
    <!-- Loading State -->
    <div v-if="projectsStore.isLoading" class="loading-state">
      <div class="spinner" />
      <p>{{ t('projectsShow.loadingProject') }}</p>
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
              {{ t('projectsShow.projects') }}
            </router-link>
            <h1>{{ project.name }}</h1>
            <p class="project-path">{{ project.project_path }}</p>
          </div>
          <div class="header-actions">
            <div class="token-usage">
              <span class="token-label">{{ t('projectsShow.tokenUsage') }}</span>
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
            @click="handleTabClick(tab.id)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="tab.icon" />
            </svg>
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- Main content with optional Planning sidebar -->
      <div class="content-with-sidebar">
      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <div class="overview-grid">
            <Card :title="t('projectsShow.projectInfo')" class="info-card">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">{{ t('projectsShow.machine') }}</span>
                  <span class="info-value">{{ machineName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('projectsShow.path') }}</span>
                  <span class="info-value">{{ project.project_path }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('projectsShow.created') }}</span>
                  <span class="info-value">{{ formatDate(project.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('projectsShow.updated') }}</span>
                  <span class="info-value">{{ formatDate(project.updated_at) }}</span>
                </div>
              </div>
            </Card>

            <Card :title="t('projectsShow.statistics')" class="stats-card">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.total_tasks ?? 0 }}</span>
                  <span class="stat-label">{{ t('projectsShow.totalTasks') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.pending_tasks ?? 0 }}</span>
                  <span class="stat-label">{{ t('projectsShow.pending') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.completed_tasks ?? 0 }}</span>
                  <span class="stat-label">{{ t('projectsShow.completed') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.active_instances ?? 0 }}</span>
                  <span class="stat-label">{{ t('projectsShow.instances') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.active_locks ?? 0 }}</span>
                  <span class="stat-label">{{ t('projectsShow.fileLocks') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ projectStats?.activity_last_24h ?? 0 }}</span>
                  <span class="stat-label">{{ t('projectsShow.activity24h') }}</span>
                </div>
              </div>
            </Card>

            <Card :title="t('projectsShow.activeInstances')" class="instances-card">
              <div v-if="instances.length === 0" class="empty-instances">
                {{ t('projectsShow.noActiveInstances') }}
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

            <Card :title="t('projectsShow.recentActivity')" class="activity-card">
              <div v-if="activityLogs.length === 0" class="empty-activity">
                {{ t('projectsShow.noRecentActivity') }}
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
          <Card :title="t('projectsShow.currentFocus')" class="focus-card mt-6">
            <div v-if="project.current_focus" class="context-preview">
              {{ project.current_focus }}
            </div>
            <div v-else class="empty-context">
              {{ t('projectsShow.noCurrentFocus') }}
              <button @click="activeTab = 'context'">{{ t('projectsShow.updateContext') }}</button>
            </div>
          </Card>
        </div>

        <!-- Tasks Tab (enriched with epic/sprint filters) -->
        <div v-else-if="activeTab === 'tasks'" class="tab-panel">
          <div class="tasks-filters">
            <select v-model="epicFilter" class="filter-select">
              <option value="">{{ t('projectsShow.allEpics') }}</option>
              <option v-for="epic in epicsStore.epics" :key="epic.id" :value="epic.id">
                {{ epic.title }}
              </option>
            </select>
            <select v-model="sprintFilter" class="filter-select">
              <option value="">{{ t('projectsShow.allSprints') }}</option>
              <option v-for="sprint in sprintsStore.sprints" :key="sprint.id" :value="sprint.id">
                {{ sprint.name }}
              </option>
            </select>
          </div>
          <TasksBoard :project-id="projectId" />
        </div>

        <!-- Planning Tab (merged Epics + Sprints) -->
        <div v-else-if="activeTab === 'planning'" class="tab-panel">
          <div class="planning-segments" role="tablist" :aria-label="t('projectsShow.tabPlanning')">
            <button
              type="button"
              class="segment"
              :class="{ active: planningSegment === 'epics' }"
              role="tab"
              :aria-selected="planningSegment === 'epics'"
              @click="planningSegment = 'epics'"
            >
              {{ t('projectsShow.tabEpics') }}
              <span class="segment-count">{{ epicsStore.epics.length }}</span>
            </button>
            <button
              type="button"
              class="segment"
              :class="{ active: planningSegment === 'sprints' }"
              role="tab"
              :aria-selected="planningSegment === 'sprints'"
              @click="planningSegment = 'sprints'"
            >
              {{ t('projectsShow.tabSprints') }}
              <span class="segment-count">{{ sprintsStore.sprints.length }}</span>
            </button>
          </div>

          <!-- Epics segment -->
          <div v-if="planningSegment === 'epics'">
            <EpicBoard
              :epics="epicsStore.showArchived ? epicsStore.archivedEpics : epicsStore.epics"
              :selected-epic-id="epicsStore.selectedEpic?.id || ''"
              :show-archived="epicsStore.showArchived"
              @select="epicsStore.selectEpic($event)"
              @create="showCreateEpicModal = true"
              @delete="handleDeleteEpic"
              @finalize="handleFinalizeEpic"
              @archive="handleArchiveEpic"
              @unarchive="handleUnarchiveEpic"
              @toggle-archived="handleToggleArchivedEpics"
            />
          </div>

          <!-- Sprints segment -->
          <div v-else>
            <SprintBoard
              :sprint="sprintsStore.currentSprint || null"
              @create-sprint="showCreateEpicModal = true"
            >
              <TasksBoard :project-id="projectId" />
            </SprintBoard>
            <BurndownChart
              v-if="sprintsStore.burndownData.length > 0"
              :data="sprintsStore.burndownData"
              class="mt-6"
            />
          </div>
        </div>

        <!-- Context Tab -->
        <div v-else-if="activeTab === 'context'" class="tab-panel">
          <ContextViewer :project-id="projectId" />
        </div>

        <!-- Locks Tab -->
        <div v-else-if="activeTab === 'locks'" class="tab-panel">
          <LocksPanel :project-id="projectId" />
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
                    <span class="metric-label">{{ t('projectsShow.status') }}</span>
                    <span class="metric-value" :class="instance.status">{{ instance.status }}</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">{{ t('projectsShow.contextUsage') }}</span>
                    <div class="metric-bar">
                      <div 
                        class="metric-progress" 
                        :style="{ width: `${instance.context_usage_percent}%` }"
                      />
                    </div>
                    <span class="metric-value">{{ Math.round(instance.context_usage_percent) }}%</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">{{ t('projectsShow.tasksCompleted') }}</span>
                    <span class="metric-value">{{ instance.tasks_completed }}</span>
                  </div>
                  <div class="metric" v-if="instance.current_task">
                    <span class="metric-label">{{ t('projectsShow.currentTask') }}</span>
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

        <!-- Tokens Tab (cost + budget) -->
        <div v-else-if="activeTab === 'tokens'" class="tab-panel">
          <TokenBudgetPanel :project-id="projectId" />
        </div>

        <!-- Activity Tab -->
        <div v-else-if="activeTab === 'activity'" class="tab-panel">
          <Card :title="t('projectsShow.activityLog')">
            <div v-if="activityLogs.length === 0" class="empty-activity">
              {{ t('projectsShow.noActivityRecorded') }}
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

      </div><!-- /tab-content -->

      <!-- Planning Chat Sidebar -->
      <PlanningChat
        :project-id="projectId"
        @send-message="handlePlanningMessage"
        @approve-actions="handleApproveActions"
        ref="planningChatRef"
      />
      </div><!-- /content-with-sidebar -->
    </template>

    <!-- Not Found -->
    <div v-else class="not-found">
      <h2>{{ t('projectsShow.projectNotFound') }}</h2>
      <router-link to="/projects" class="btn-primary">
        {{ t('projectsShow.backToProjects') }}
      </router-link>
    </div>

    <!-- Epic from PRD → decomposition → sprints + tasks -->
    <EpicDecompositionModal
      v-model="showCreateEpicModal"
      :project-id="projectId"
      @started="handleDecomposeStarted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useProjectsStore } from '@/stores/projects';
import { useMachinesStore } from '@/stores/machines';
import { useEpicsStore } from '@/stores/epics';
import { useSprintsStore } from '@/stores/sprints';
import { useTasksStore } from '@/stores/tasks';
import { useToast } from '@/composables/useToast';
import { getEchoClient } from '@/services/echo';
import { api } from '@/composables/useApi';
import Card from '@/components/common/Card.vue';
import InstanceBadge from '@/components/projects/InstanceBadge.vue';
import TasksBoard from './Tasks.vue';
import ContextViewer from './Context.vue';
import OrchestrationPanel from './Orchestration.vue';
import LocksPanel from './Locks.vue';
import EpicBoard from '@/components/multiagent/EpicBoard.vue';
import SprintBoard from '@/components/multiagent/SprintBoard.vue';
import EpicDecompositionModal from '@/components/multiagent/EpicDecompositionModal.vue';
import BurndownChart from '@/components/multiagent/BurndownChart.vue';
import PlanningChat from '@/components/multiagent/PlanningChat.vue';
import TokenBudgetPanel from '@/components/multiagent/TokenBudgetPanel.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const machinesStore = useMachinesStore();
const epicsStore = useEpicsStore();
const sprintsStore = useSprintsStore();
const tasksStore = useTasksStore();
const toast = useToast();

const projectId = computed(() => route.params.id as string);
const project = computed(() => projectsStore.selectedProject);
const projectStats = computed(() => projectsStore.projectStats);
const instances = computed(() => projectsStore.instances);
const activityLogs = computed(() => projectsStore.activityLogs);

const activeTab = ref('overview');
const planningSegment = ref<'epics' | 'sprints'>('epics');
const epicFilter = ref('');
const sprintFilter = ref('');
const showCreateEpicModal = ref(false);
const planningChatRef = ref<InstanceType<typeof PlanningChat> | null>(null);

// Delete an epic and its generated sprints + tasks (cascade server-side).
async function handleDeleteEpic(epicId: string): Promise<void> {
  const epic = epicsStore.epics.find((e) => e.id === epicId);
  if (!window.confirm(t('projectsShow.deleteEpicConfirm', { name: epic?.title ?? '' }))) return;
  try {
    await epicsStore.deleteEpic(epicId);
    toast.success(t('projectsShow.epicDeleted'));
    await Promise.all([
      sprintsStore.fetchSprints(projectId.value),
      tasksStore.fetchTasks(projectId.value),
    ]);
  } catch {
    toast.error(t('projectsShow.epicDeleteFailed'));
  }
}

// Finalize a 100%-complete epic — request its pull request (moved here from the
// SprintBoard "create PR" button). The dispatch is best-effort: `dispatched`
// is false when the machine is offline. The real PR (pr_url/pr_state) lands
// later over the `.epic.updated` `finalized` broadcast, which refetches the
// board and fires `prGenerated` below.
async function handleFinalizeEpic(epicId: string): Promise<void> {
  try {
    const { dispatched } = await epicsStore.finalizeEpic(epicId);
    if (dispatched) {
      toast.info(t('projectsShow.prGenerating'));
    } else {
      toast.error(t('projectsShow.prGenerationFailed'));
    }
  } catch {
    toast.error(t('projectsShow.prGenerationFailed'));
  }
}

// Toggle the EpicBoard between the active and archived views. Lazily fetches
// the archived set the first time it is shown (the store keeps the two flows
// separate so the active board is never polluted by archived epics).
async function handleToggleArchivedEpics(archived: boolean): Promise<void> {
  epicsStore.setShowArchived(archived);
  if (archived) {
    try {
      await epicsStore.fetchArchivedEpics(projectId.value);
    } catch {
      toast.error(t('projectsShow.epicArchiveFailed'));
    }
  }
}

// Archive an epic (reversible — the backend stamps archived_at, deletes nothing).
// The store moves it from the active board to the archived flow on success.
async function handleArchiveEpic(epicId: string): Promise<void> {
  try {
    await epicsStore.archiveEpic(epicId);
    toast.success(t('projectsShow.epicArchived'));
  } catch {
    toast.error(t('projectsShow.epicArchiveFailed'));
  }
}

// Restore an archived epic back to the active board.
async function handleUnarchiveEpic(epicId: string): Promise<void> {
  try {
    await epicsStore.unarchiveEpic(epicId);
    toast.success(t('projectsShow.epicUnarchived'));
  } catch {
    toast.error(t('projectsShow.epicUnarchiveFailed'));
  }
}

// The async "Decompose with AI" flow launched: the epic exists (pending) but
// its sprints/tasks arrive later, on the realtime `completed` signal below.
// Show a transient toast and surface the new pending epic immediately.
async function handleDecomposeStarted(): Promise<void> {
  toast.info(t('projectsShow.decompositionStarted'));
  await epicsStore.fetchEpics(projectId.value);
}

// ── Decomposition realtime ───────────────────────────────────────────────────
// The async epic decomposition reports its lifecycle through the dedicated
// `.epic.decomposition` broadcast (see app/Events/EpicDecompositionUpdated).
// `action`/`decomposition_status` carry the canonical Epic status values
// (pending|running|completed|failed). On `completed` we pull the freshly
// generated sprints + tasks; on `failed` we surface the reason. Only OUR
// handler is detached on teardown (never leave(), since the epics/sprints
// stores share this channel).
interface EpicDecompositionPayload {
  epic_id: string;
  action: string;
  decomposition_status?: string | null;
  decomposition_error?: string | null;
}

const lastDecompositionStatus = new Map<string, string | null>();
let detachDecompositionRealtime: (() => void) | null = null;

function onEpicDecomposition(payload: EpicDecompositionPayload): void {
  const status = payload.decomposition_status ?? payload.action ?? null;
  const previous = lastDecompositionStatus.get(payload.epic_id) ?? null;
  lastDecompositionStatus.set(payload.epic_id, status);

  // Only act on a genuine transition into a terminal decomposition state.
  if (status === previous) return;

  if (status === 'completed') {
    toast.success(t('projectsShow.decompositionReady'));
    void Promise.all([
      epicsStore.fetchEpics(projectId.value),
      sprintsStore.fetchSprints(projectId.value),
      tasksStore.fetchTasks(projectId.value),
    ]);
  } else if (status === 'failed') {
    const base = t('projectsShow.decompositionFailed');
    toast.error(payload.decomposition_error ? `${base} — ${payload.decomposition_error}` : base);
  }
}

// `.epic.updated` carries no PR fields (pr_url/pr_state). On the `finalized`
// action — emitted once the agent has opened the epic's PR (see
// AgentServe::onEpicFinalized) — refetch so the board flips the "Generate PR"
// button to the live PR link, and confirm with the success toast.
interface EpicUpdatedPayload {
  epic_id: string;
  action: string;
}

function onEpicUpdated(payload: EpicUpdatedPayload): void {
  if (payload.action === 'finalized') {
    toast.success(t('projectsShow.prGenerated'));
    void epicsStore.fetchEpics(projectId.value);
  }
}

function subscribeDecompositionRealtime(id: string): void {
  detachDecompositionRealtime?.();
  detachDecompositionRealtime = null;
  lastDecompositionStatus.clear();
  if (!id) return;

  // Seed from current epics so only genuine transitions toast (a later cascade
  // re-broadcasting a still-failed/ready epic must not re-fire a toast).
  for (const epic of epicsStore.epics) {
    const s = (epic as { decomposition_status?: string | null }).decomposition_status ?? null;
    lastDecompositionStatus.set(epic.id, s);
  }

  let client: ReturnType<typeof getEchoClient>;
  try {
    client = getEchoClient();
  } catch {
    return; // Reverb config missing (tests / degraded boot) — realtime disabled.
  }

  const channel = `projects.${id}`;
  const handler = onEpicDecomposition as (p: unknown) => void;
  const updatedHandler = onEpicUpdated as (p: unknown) => void;
  client
    .private(channel)
    .listen('.epic.decomposition', handler)
    .listen('.epic.updated', updatedHandler);

  detachDecompositionRealtime = () => {
    try {
      client
        .private(channel)
        .stopListening('.epic.decomposition', handler)
        .stopListening('.epic.updated', updatedHandler);
    } catch {
      // Channel already gone.
    }
  };
}

// Standardized project tab order: Overview · Workspace · Tasks · Planning ·
// Context · Locks · Orchestration · Instances · Tokens · Activity.
// "workspace" is a navigating tab (dedicated multi-terminal route).
// "planning" merges the former Epics and Sprints tabs (internal segmented control).
const tabs = computed(() => [
  { id: 'overview', label: t('projectsShow.tabOverview'), icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
  { id: 'workspace', label: t('projectsShow.tabWorkspace'), icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-9.5-8L7 13.5l1.41 1.41L10.5 12.83l-2.09-2.08zm3 4.5h5v1.5h-5V14.5z' },
  { id: 'tasks', label: t('projectsShow.tabTasks'), icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z', count: projectStats.value?.total_tasks },
  { id: 'planning', label: t('projectsShow.tabPlanning'), icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z', count: epicsStore.epics.length + sprintsStore.sprints.length },
  { id: 'context', label: t('projectsShow.tabContext'), icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' },
  { id: 'locks', label: t('projectsShow.tabLocks'), icon: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z', count: projectStats.value?.active_locks },
  { id: 'orchestration', label: t('projectsShow.tabOrchestration'), icon: 'M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z' },
  { id: 'instances', label: t('projectsShow.tabInstances'), icon: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z' },
  // Reuses the shared projectsTokenbudget.title label (FR/EN symmetric), like WorkspaceRail.
  { id: 'tokens', label: t('projectsTokenbudget.title'), icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.31 13.75v1.5h-.62v-1.46c-1.06-.11-2.07-.56-2.5-1.65l1.04-.42c.27.7.86 1.08 1.79 1.08.78 0 1.39-.36 1.39-1.01 0-.59-.41-.89-1.5-1.21-1.27-.36-2.5-.78-2.5-2.18 0-1.06.81-1.74 1.78-1.91V7.25h.62v1.45c.93.14 1.62.66 1.95 1.46l-1 .43c-.23-.57-.69-.91-1.34-.91-.74 0-1.27.36-1.27.93 0 .56.45.82 1.5 1.12 1.36.38 2.5.83 2.5 2.27 0 1.13-.85 1.79-1.84 1.95z' },
  { id: 'activity', label: t('projectsShow.tabActivity'), icon: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' },
]);

function handleTabClick(tabId: string): void {
  if (tabId === 'workspace') {
    router.push(`/projects/${projectId.value}/workspace`);
    return;
  }
  activeTab.value = tabId;
}

// Legacy tab ids compat: "epics" and "sprints" are merged into "planning".
// Any code path that still targets the old ids lands on the right segment.
watch(activeTab, (tab) => {
  if (tab === 'epics' || tab === 'sprints') {
    planningSegment.value = tab;
    activeTab.value = 'planning';
  }
});

const machineName = computed(() => {
  if (!project.value) return t('projectsShow.unknown');
  const machine = machinesStore.machines.find(m => m.id === project.value?.machine_id);
  return machine?.name || t('projectsShow.unknown');
});

onMounted(async () => {
  await loadProject();
  subscribeDecompositionRealtime(projectId.value);
});

watch(projectId, async () => {
  await loadProject();
  subscribeDecompositionRealtime(projectId.value);
});

onUnmounted(() => {
  detachDecompositionRealtime?.();
  detachDecompositionRealtime = null;
});

async function loadProject() {
  if (!projectId.value) return;

  try {
    await Promise.all([
      projectsStore.fetchProject(projectId.value),
      projectsStore.fetchProjectStats(projectId.value),
      projectsStore.fetchInstances(projectId.value),
      projectsStore.fetchActivity(projectId.value, 100),
      epicsStore.fetchEpics(projectId.value),
      sprintsStore.fetchSprints(projectId.value),
    ]);

    // Load burndown for active sprint
    if (sprintsStore.currentSprint) {
      await sprintsStore.fetchBurndown(sprintsStore.currentSprint.id);
    }
  } catch (err) {
    toast.error(t('projectsShow.failedToLoadProject'));
  }
}

// Planning Chat handlers
async function handlePlanningMessage(message: string) {
  try {
    const response = await api.get(`/projects/${projectId.value}/planning/context`);
    // The actual LLM call would happen here via backend
    // For now, return context summary as placeholder
    planningChatRef.value?.receiveMessage(
      t('projectsShow.planningContextAnalyzed', {
        taskCount: response.data.data.stats.total_tasks,
        epicCount: response.data.data.epics.length,
      })
    );
  } catch {
    planningChatRef.value?.receiveMessage(t('projectsShow.planningContextFailed'));
  }
}

async function handleApproveActions(actions: Array<{ type: string; data: Record<string, unknown> }>) {
  try {
    const response = await api.post(`/projects/${projectId.value}/planning/execute`, { actions });
    const results = response.data.data.results;
    const successCount = results.filter((r: { success: boolean }) => r.success).length;
    toast.success(t('projectsShow.actionsApplied', { count: successCount }));

    // Refresh data
    await loadProject();
  } catch {
    toast.error(t('projectsShow.failedToExecuteActions'));
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
@reference "../../../css/tailwind.css";
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

.content-with-sidebar {
  @apply flex gap-0 mt-6;
}

.tab-content {
  @apply flex-1 min-w-0;
}

.tab-count {
  @apply text-xs bg-white/10 px-1.5 py-0 rounded-full ml-1;
  font-variant-numeric: tabular-nums;
}

.tab.active .tab-count {
  @apply bg-brand-purple/20 text-brand-purple;
}

.planning-segments {
  @apply inline-flex items-center gap-1 p-1 mb-4 bg-surface-3 border border-skin rounded-lg;
}

.segment {
  @apply flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-skin-secondary rounded-md cursor-pointer select-none;
  @apply transition-all duration-150 ease-out;
}

.segment:hover {
  @apply text-skin-primary;
}

.segment:active {
  @apply scale-[0.97];
}

.segment.active {
  @apply bg-brand-purple/10 text-brand-purple;
}

.segment-count {
  @apply text-xs bg-white/10 px-1.5 py-0 rounded-full;
  font-variant-numeric: tabular-nums;
}

.segment.active .segment-count {
  @apply bg-brand-purple/20 text-brand-purple;
}

.tasks-filters {
  @apply flex items-center gap-3 mb-4;
}

.filter-select {
  @apply bg-surface-3 border border-skin text-skin-primary text-sm rounded-md px-3 py-1.5;
  @apply focus:outline-none focus:border-brand-purple transition-colors;
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
