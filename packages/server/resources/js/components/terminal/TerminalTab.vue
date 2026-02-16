<template>
  <div class="terminal-tab" :class="{ active: isActive }">
    <!-- Terminal Header Bar -->
    <div class="tab-header">
      <div class="tab-info">
        <span class="tab-status-dot" :class="statusClass"></span>
        <span class="tab-session-mode">{{ session?.mode || 'interactive' }}</span>
        <span v-if="session?.project_path" class="tab-project">
          {{ truncatedProjectPath }}
        </span>
      </div>
      <div class="tab-actions">
        <button class="tab-action-btn" title="Search" @click="toggleSearch">
          <svg viewBox="0 0 20 20" fill="currentColor" class="icon">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="tab-action-btn" title="Fit terminal" @click="handleFit">
          <svg viewBox="0 0 20 20" fill="currentColor" class="icon">
            <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
          </svg>
        </button>
        <button
          v-if="session?.is_running"
          class="tab-action-btn danger"
          title="Terminate session"
          @click="$emit('terminate', sessionId)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="icon">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Terminal Content -->
    <div class="tab-terminal-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="tab-loading">
        <div class="loading-spinner"></div>
        <span>{{ $t('sessions.terminal.connecting') }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="tab-error">
        <span>{{ error }}</span>
        <button class="retry-btn" @click="loadSession">{{ $t('sessions.terminal.retry') }}</button>
      </div>

      <!-- Xterm Terminal -->
      <XtermTerminal
        v-else-if="session"
        ref="terminalRef"
        :session-id="sessionId"
        :auto-connect="isActive"
        @connected="handleConnected"
        @disconnected="handleDisconnected"
        @error="handleError"
        @status-change="handleStatusChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import XtermTerminal from '@/components/terminal/XtermTerminal.vue';
import { useSessionsStore } from '@/stores/sessions';
import type { Session } from '@/types';

interface Props {
  sessionId: string;
  isActive: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const emit = defineEmits<{
  (e: 'connected', sessionId: string): void;
  (e: 'disconnected', sessionId: string): void;
  (e: 'error', sessionId: string, error: Error): void;
  (e: 'status-change', sessionId: string, status: string): void;
  (e: 'terminate', sessionId: string): void;
}>();

const sessionsStore = useSessionsStore();
const terminalRef = ref<InstanceType<typeof XtermTerminal> | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const hasConnected = ref(false);

const session = computed<Session | null>(() => {
  return sessionsStore.getSessionById(props.sessionId) || null;
});

const statusClass = computed(() => {
  if (!session.value) return 'offline';
  if (session.value.is_running) return 'running';
  if (session.value.status === 'completed') return 'completed';
  if (session.value.status === 'error') return 'error';
  return 'offline';
});

const truncatedProjectPath = computed(() => {
  const path = session.value?.project_path;
  if (!path) return '';
  const parts = path.split('/');
  if (parts.length > 3) {
    return '.../' + parts.slice(-2).join('/');
  }
  return path;
});

async function loadSession(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  try {
    await sessionsStore.fetchSession(props.sessionId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('sessions.terminal.loading_session');
  } finally {
    isLoading.value = false;
  }
}

function toggleSearch(): void {
  if (terminalRef.value) {
    terminalRef.value.openSearch();
  }
}

function handleFit(): void {
  terminalRef.value?.fit();
}

function handleConnected(): void {
  hasConnected.value = true;
  emit('connected', props.sessionId);
}

function handleDisconnected(): void {
  emit('disconnected', props.sessionId);
}

function handleError(err: Error): void {
  emit('error', props.sessionId, err);
}

function handleStatusChange(status: string): void {
  sessionsStore.updateSessionStatus(props.sessionId, status as Session['status']);
  emit('status-change', props.sessionId, status);
}

// Re-fit terminal when tab becomes active
watch(() => props.isActive, (active) => {
  if (active) {
    setTimeout(() => {
      terminalRef.value?.fit();
    }, 50);
  }
});

onMounted(() => {
  loadSession();
});
</script>

<style scoped>
.terminal-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f0f1a;
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 12px;
  background: rgba(26, 27, 38, 0.8);
  border-bottom: 1px solid rgba(168, 85, 247, 0.15);
  flex-shrink: 0;
}

.tab-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #565f89;
}

.tab-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.tab-status-dot.running {
  background: #22c55e;
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
}

.tab-status-dot.completed {
  background: #6366f1;
}

.tab-status-dot.error {
  background: #ef4444;
}

.tab-status-dot.offline {
  background: #565f89;
}

.tab-session-mode {
  color: #a9b1d6;
  font-weight: 500;
  text-transform: capitalize;
}

.tab-project {
  color: #565f89;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.tab-actions {
  display: flex;
  gap: 2px;
}

.tab-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #565f89;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-action-btn:hover {
  background: rgba(168, 85, 247, 0.1);
  color: #a9b1d6;
}

.tab-action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.tab-action-btn .icon {
  width: 14px;
  height: 14px;
}

.tab-terminal-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.tab-loading,
.tab-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #565f89;
  font-size: 13px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(168, 85, 247, 0.2);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 6px 16px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 6px;
  color: #a855f7;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: rgba(168, 85, 247, 0.25);
}
</style>
