<template>
  <header class="terminal-header">
    <div class="header-left">
      <!-- Back Button -->
      <button class="icon-btn" @click="handleBack" title="Back to Sessions">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- Session Info -->
      <div class="session-info">
        <h1 class="session-title">
          Session {{ shortId }}
        </h1>
        <div class="session-meta">
          <span v-if="machineName" class="machine-badge">
            <svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
            </svg>
            {{ machineName }}
          </span>
          <span v-if="projectPath" class="project-badge">
            <svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            {{ projectPath }}
          </span>
        </div>
      </div>
      
      <!-- Status Badge -->
      <div class="status-badge" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-label">{{ statusLabel }}</span>
      </div>
    </div>
    
    <div class="header-right">
      <!-- Mode Badge -->
      <div class="mode-badge" :class="mode">
        {{ modeLabel }}
      </div>
      
      <!-- Actions -->
      <div class="actions">
        <button 
          class="action-btn" 
          :class="{ active: props.searchActive }"
          @click="emit('toggleSearch')"
          title="Search"
        >
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <button 
          class="action-btn" 
          @click="emit('fit')"
          title="Fit to Window"
        >
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <button 
          class="action-btn danger" 
          :disabled="!canTerminate"
          @click="handleTerminate"
          title="Terminate Session"
        >
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <button 
          class="action-btn" 
          @click="handleDisconnect"
          title="Disconnect"
        >
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SessionMode, SessionStatus } from '@/types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  sessionId: string;
  machineName?: string;
  projectPath?: string | null;
  status: SessionStatus;
  mode: SessionMode;
  searchActive?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  back: [];
  terminate: [];
  disconnect: [];
  toggleSearch: [];
  fit: [];
}>();

// ============================================================================
// Computed
// ============================================================================

const shortId = computed(() => {
  return props.sessionId.slice(0, 8);
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
  return classes[props.status] || 'status-pending';
});

const statusLabel = computed(() => {
  const labels: Record<SessionStatus, string> = {
    created: 'Created',
    starting: 'Starting',
    running: 'Running',
    waiting_input: 'Waiting',
    completed: 'Completed',
    error: 'Error',
    terminated: 'Terminated',
  };
  return labels[props.status] || props.status;
});

const modeLabel = computed(() => {
  const labels: Record<SessionMode, string> = {
    interactive: 'Interactive',
    headless: 'Headless',
    oneshot: 'One-shot',
    bash: 'Bash',
  };
  return labels[props.mode] || props.mode;
});

const canTerminate = computed(() => {
  return ['created', 'starting', 'running', 'waiting_input'].includes(props.status);
});

// ============================================================================
// Methods
// ============================================================================

function handleBack(): void {
  emit('back');
}

function handleTerminate(): void {
  if (canTerminate.value && confirm('Are you sure you want to terminate this session?')) {
    emit('terminate');
  }
}

function handleDisconnect(): void {
  emit('disconnect');
}
</script>

<style scoped>
.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent), color-mix(in srgb, var(--accent-indigo, #6366f1) 10%, transparent));
  border-bottom: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Icon Button */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 50%, transparent);
  color: var(--text-primary);
}

/* Session Info */
.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.machine-badge,
.project-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-icon {
  width: 14px;
  height: 14px;
}

/* Status Badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
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

/* Mode Badge */
.mode-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
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
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: color-mix(in srgb, var(--bg-secondary, var(--surface-2)) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 40%, transparent);
  color: var(--text-primary);
}

.action-btn.active {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-color: var(--accent-purple, #a855f7);
  color: var(--accent-purple, #a855f7);
}

.action-btn.danger {
  border-color: rgba(239, 68, 68, 0.3);
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 18px;
  height: 18px;
}
</style>
