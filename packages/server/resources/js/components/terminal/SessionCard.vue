<template>
  <div class="session-card" :class="{ 'is-running': session.is_running }">
    <div class="card-header">
      <div class="session-id">
        <svg class="terminal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="4" width="20" height="16" rx="2" stroke-width="2"/>
          <path d="M6 8l4 4-4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 16h6" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="id-text">{{ shortId }}</span>
      </div>
      
      <div class="status-badge" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusLabel }}</span>
      </div>
    </div>
    
    <div class="card-body">
      <div v-if="session.project_path" class="info-row">
        <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span class="info-text" :title="session.project_path">
          {{ projectPathDisplay }}
        </span>
      </div>
      
      <div class="info-row">
        <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        <span class="info-text">{{ startTimeDisplay }}</span>
      </div>
      
      <div class="info-row">
        <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        <span class="info-text">{{ durationDisplay }}</span>
      </div>
      
      <div v-if="session.machine" class="info-row">
        <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
        </svg>
        <span class="info-text">{{ session.machine.name }}</span>
        <span class="machine-status" :class="session.machine.status"></span>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="mode-badge" :class="session.mode">
        {{ modeLabel }}
      </div>
      
      <div class="actions">
        <button 
          v-if="canConnect"
          class="action-btn primary"
          @click="handleConnect"
        >
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          Connect
        </button>
        
        <button 
          v-if="canTerminate"
          class="action-btn danger"
          @click="handleTerminate"
        >
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          Stop
        </button>
        
        <button 
          v-if="session.is_completed"
          class="action-btn secondary"
          @click="handleViewLogs"
        >
          <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
          Logs
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Session, SessionMode, SessionStatus } from '@/types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  session: Session;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  connect: [sessionId: string];
  terminate: [sessionId: string];
  viewLogs: [sessionId: string];
}>();

// ============================================================================
// Computed
// ============================================================================

const shortId = computed(() => {
  return props.session.id.slice(0, 8);
});

const statusClass = computed(() => {
  const classes: Record<SessionStatus, string> = {
    created: 'status-pending',
    starting: 'status-pending',
    running: 'status-running',
    waiting_input: 'status-running',
    completed: 'status-completed',
    error: 'status-error',
    terminated: 'status-error',
  };
  return classes[props.session.status] || 'status-pending';
});

const statusLabel = computed(() => {
  const labels: Record<SessionStatus, string> = {
    created: 'Created',
    starting: 'Starting',
    running: 'Running',
    waiting_input: 'Waiting',
    completed: 'Completed',
    error: 'Error',
    terminated: 'Stopped',
  };
  return labels[props.session.status] || props.session.status;
});

const modeLabel = computed(() => {
  const labels: Record<SessionMode, string> = {
    interactive: 'Interactive',
    headless: 'Headless',
    oneshot: 'One-shot',
  };
  return labels[props.session.mode] || props.session.mode;
});

const projectPathDisplay = computed(() => {
  if (!props.session.project_path) return 'No project';
  
  const path = props.session.project_path;
  if (path.length > 30) {
    return '...' + path.slice(-27);
  }
  return path;
});

const startTimeDisplay = computed(() => {
  if (!props.session.started_at) {
    return 'Not started';
  }
  
  const date = new Date(props.session.started_at);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const durationDisplay = computed(() => {
  return props.session.formatted_duration || 'N/A';
});

const canConnect = computed(() => {
  return ['running', 'waiting_input'].includes(props.session.status);
});

const canTerminate = computed(() => {
  return ['created', 'starting', 'running', 'waiting_input'].includes(props.session.status);
});

// ============================================================================
// Methods
// ============================================================================

function handleConnect(): void {
  emit('connect', props.session.id);
}

function handleTerminate(): void {
  if (confirm('Are you sure you want to terminate this session?')) {
    emit('terminate', props.session.id);
  }
}

function handleViewLogs(): void {
  emit('viewLogs', props.session.id);
}
</script>

<style scoped>
.session-card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, color-mix(in srgb, var(--surface-2) 80%, transparent), color-mix(in srgb, var(--surface-3) 60%, transparent));
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.session-card:hover {
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.1);
}

.session-card.is-running {
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.05);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.session-id {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal-icon {
  width: 20px;
  height: 20px;
  color: var(--accent-purple, #a855f7);
}

.id-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Status Badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-pending {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-pending .status-dot {
  background: #f59e0b;
  animation: pulse 2s infinite;
}

.status-running {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-running .status-dot {
  background: #22c55e;
  animation: pulse 2s infinite;
}

.status-completed {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 15%, transparent);
  color: var(--accent-cyan, #22d3ee);
}

.status-completed .status-dot {
  background: var(--accent-cyan, #22d3ee);
}

.status-error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-error .status-dot {
  background: #ef4444;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Card Body */
.card-body {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.info-text {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.machine-status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 4px;
}

.machine-status.online {
  background: #22c55e;
}

.machine-status.offline {
  background: #ef4444;
}

.machine-status.connecting {
  background: #f59e0b;
}

/* Card Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 40%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.mode-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mode-badge.interactive {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
}

.mode-badge.headless {
  background: color-mix(in srgb, var(--accent-indigo, #6366f1) 15%, transparent);
  color: var(--accent-indigo, #6366f1);
}

.mode-badge.oneshot {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 15%, transparent);
  color: var(--accent-cyan, #22d3ee);
}

/* Actions */
.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.action-btn.secondary {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--text-secondary);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.action-btn.secondary:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--text-primary);
}

.btn-icon {
  width: 14px;
  height: 14px;
}
</style>
