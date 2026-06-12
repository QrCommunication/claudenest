<template>
  <section
    class="ws-pane"
    :class="{
      'is-needs-input': state === 'needs-input' && !isEnded,
      'is-focused': focused,
    }"
    @mousedown="emit('focusPane')"
  >
    <!-- Header (32px) -->
    <header class="pane-header" @dblclick="emit('zoom')">
      <span
        class="pane-dot"
        :class="{ 'is-busy': state === 'busy' && !isEnded, 'is-ended': isEnded }"
        :style="{ backgroundColor: isEnded ? 'var(--text-muted)' : color }"
      />
      <span class="pane-name">{{ workerName }}</span>

      <button
        v-if="taskTitle"
        class="pane-task"
        :title="taskTitle"
        @click="emit('focusTask')"
      >
        {{ truncatedTask }}
      </button>

      <span v-if="state === 'needs-input' && !isEnded" class="pane-badge-input">
        {{ t('projectsWorkspace.pane.needsInput') }}
      </span>
      <span v-else class="pane-state">{{ stateLabel }}</span>

      <div class="pane-actions">
        <button
          class="pane-action"
          :title="t('projectsWorkspace.pane.zoom')"
          :aria-label="t('projectsWorkspace.pane.zoom')"
          @click.stop="emit('zoom')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          class="pane-action"
          :title="t('projectsWorkspace.pane.detach')"
          :aria-label="t('projectsWorkspace.pane.detach')"
          @click.stop="emit('detach')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
        <button
          class="pane-action pane-action--danger"
          :title="t('projectsWorkspace.pane.kill')"
          :aria-label="t('projectsWorkspace.pane.kill')"
          @click.stop="emit('kill')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Terminal body -->
    <div class="pane-body">
      <XtermTerminal
        ref="terminalRef"
        :session-id="session.id"
        :auto-connect="!isEnded"
        @connected="handleConnected"
        @disconnected="emit('disconnected')"
        @error="handleError"
        @status-change="handleStatusChange"
      />

      <!-- Session ended overlay — never silently removed -->
      <div v-if="isEnded" class="pane-ended">
        <p class="pane-ended-title">
          {{ t('projectsWorkspace.pane.sessionEnded', { code: session.exit_code ?? 0 }) }}
        </p>
        <div class="pane-ended-actions">
          <button class="pane-ended-btn" @click="emit('detach')">
            {{ t('projectsWorkspace.pane.viewLogs') }}
          </button>
          <button class="pane-ended-btn pane-ended-btn--primary" @click="emit('close')">
            {{ t('projectsWorkspace.pane.closePane') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import XtermTerminal from '@/components/terminal/XtermTerminal.vue';
import { api } from '@/composables/useApi';
import type { ApiResponse, Session, SessionLog } from '@/types';

export type PaneState = 'busy' | 'idle' | 'needs-input';

interface Props {
  session: Session;
  workerName: string;
  color: string;
  taskTitle?: string | null;
  state: PaneState;
  focused?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  taskTitle: null,
  focused: false,
});

const emit = defineEmits<{
  zoom: [];
  detach: [];
  kill: [];
  close: [];
  focusTask: [];
  focusPane: [];
  connected: [];
  disconnected: [];
  statusChange: [status: string];
}>();

const { t } = useI18n();

const terminalRef = ref<InstanceType<typeof XtermTerminal> | null>(null);
const hasConnected = ref(false);
const replayLogs = ref<SessionLog[]>([]);

const ENDED_STATUSES = ['completed', 'error', 'terminated'];

const isEnded = computed(() => ENDED_STATUSES.includes(props.session.status));

const truncatedTask = computed(() => {
  const title = props.taskTitle ?? '';
  return title.length > 24 ? `${title.slice(0, 24)}…` : title;
});

const stateLabel = computed(() => {
  if (isEnded.value) return t('projectsWorkspace.pane.stateEnded');
  if (props.state === 'busy') return t('projectsWorkspace.pane.stateBusy');
  return t('projectsWorkspace.pane.stateIdle');
});

// Swap-in replay: fetch the session detail (includes recent_logs) so the
// terminal does not come back blank after being demoted to the strip.
async function loadReplayLogs(): Promise<void> {
  try {
    const response = await api.get<ApiResponse<Session>>(`/sessions/${props.session.id}`);
    replayLogs.value = response.data.data.recent_logs ?? [];
  } catch {
    // Replay is best-effort — live output still streams in.
  }
}

function handleConnected(): void {
  if (!hasConnected.value && replayLogs.value.length > 0) {
    terminalRef.value?.writeInitialLogs(replayLogs.value);
  }
  hasConnected.value = true;
  emit('connected');
}

function handleStatusChange(status: string): void {
  emit('statusChange', status);
}

function handleError(): void {
  emit('disconnected');
}

function focusTerminal(): void {
  terminalRef.value?.terminal?.focus();
}

defineExpose({ focusTerminal });

onMounted(() => {
  void loadReplayLogs();
});
</script>

<style scoped>
.ws-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}

.ws-pane.is-focused {
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 55%, transparent);
}

/* Critical signal: waiting for input/permission */
.ws-pane.is-needs-input {
  border-color: #fbbf24;
  animation: needs-input-pulse 2s ease-in-out infinite;
}

@keyframes needs-input-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.35); }
  50% { box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.12); }
}

/* Header */
.pane-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  user-select: none;
}

.pane-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pane-dot.is-busy {
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.pane-name {
  font-size: 12px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
  white-space: nowrap;
}

.pane-task {
  font-size: 11px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border: none;
  border-radius: 9999px;
  padding: 1px 8px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  min-width: 0;
  transition: background-color 0.15s ease;
}

.pane-task:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--text-primary);
}

.pane-state {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.pane-badge-input {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border-radius: 9999px;
  padding: 1px 8px;
  white-space: nowrap;
}

.pane-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.pane-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 5px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pane-action:active {
  transform: scale(0.97);
}

.pane-action svg {
  width: 14px;
  height: 14px;
}

.pane-action:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.pane-action--danger:hover {
  background-color: color-mix(in srgb, #ef4444 12%, transparent);
  color: #ef4444;
}

/* Body */
.pane-body {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* Ended overlay */
.pane-ended {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: color-mix(in srgb, var(--bg-primary) 82%, transparent);
  backdrop-filter: blur(2px);
  z-index: 5;
}

.pane-ended-title {
  font-size: 14px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
}

.pane-ended-actions {
  display: flex;
  gap: 8px;
}

.pane-ended-btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pane-ended-btn:active {
  transform: scale(0.97);
}

.pane-ended-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.pane-ended-btn--primary {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  border-color: transparent;
  color: white;
}

.pane-ended-btn--primary:hover {
  opacity: 0.9;
  color: white;
}

@media (prefers-reduced-motion: reduce) {
  .ws-pane.is-needs-input {
    animation: none;
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3);
  }

  .pane-dot.is-busy {
    animation: none;
  }
}
</style>
