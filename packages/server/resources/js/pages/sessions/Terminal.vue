<template>
  <div class="terminal-page">
    <!-- Terminal Header -->
    <TerminalHeader
      v-if="session"
      :session-id="session.id"
      :machine-name="session.machine?.name"
      :project-path="session.project_path"
      :status="session.status"
      :mode="session.mode"
      :search-active="isSearchActive"
      @back="handleBack"
      @terminate="handleTerminate"
      @disconnect="handleDisconnect"
      @toggle-search="toggleSearch"
      @fit="handleFit"
    />
    
    <!-- Skeleton Header while loading -->
    <div v-else class="header-skeleton">
      <div class="skeleton-back"></div>
      <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    </div>
    
    <!-- Terminal Container -->
    <main class="terminal-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span>{{ $t('sessions.terminal.loading_session') }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-overlay">
        <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadSession">
          {{ $t('sessions.terminal.retry') }}
        </button>
        <button class="back-btn" @click="handleBack">
          {{ $t('sessions.terminal.back_to_sessions') }}
        </button>
      </div>

      <!-- Session Completed/Terminated -->
      <div v-else-if="session && session.is_completed && !hasConnected" class="not-running-overlay">
        <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <h3>{{ $t('sessions.terminal.session_status', { status: session.status }) }}</h3>
        <p>{{ $t('sessions.terminal.not_running') }}</p>
        <div class="session-details">
          <div class="detail-item">
            <span class="detail-label">{{ $t('sessions.terminal.mode_label') }}</span>
            <span class="detail-value">{{ session.mode }}</span>
          </div>
          <div v-if="session.formatted_duration" class="detail-item">
            <span class="detail-label">{{ $t('sessions.terminal.duration_label') }}</span>
            <span class="detail-value">{{ session.formatted_duration }}</span>
          </div>
          <div v-if="session.exit_code !== null" class="detail-item">
            <span class="detail-label">{{ $t('sessions.terminal.exit_code_label') }}</span>
            <span class="detail-value" :class="{ 'text-error': session.exit_code !== 0 }">
              {{ session.exit_code }}
            </span>
          </div>
        </div>
        <button class="back-btn" @click="handleBack">
          {{ $t('sessions.terminal.back_to_sessions') }}
        </button>
      </div>
      
      <!-- Xterm Terminal -->
      <XtermTerminal
        v-else-if="session"
        ref="terminalRef"
        :session-id="sessionId"
        :auto-connect="true"
        @connected="handleConnected"
        @disconnected="handleDisconnected"
        @error="handleTerminalError"
        @status-change="handleStatusChange"
      />
    </main>
    
    <!-- Reconnect Toast -->
    <Transition name="slide-up">
      <div v-if="showReconnectToast" class="reconnect-toast">
        <span>{{ $t('sessions.terminal.connection_lost') }}</span>
        <button class="reconnect-btn" @click="handleManualReconnect">
          {{ $t('sessions.terminal.reconnect_now') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import XtermTerminal from '@/components/terminal/XtermTerminal.vue';
import TerminalHeader from '@/components/terminal/TerminalHeader.vue';
import { useSessionsStore } from '@/stores/sessions';
import { useTabs } from '@/composables/useTabs';
import type { Session } from '@/types';

// ============================================================================
// Router & Route
// ============================================================================

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const sessionsStore = useSessionsStore();
const { openTab } = useTabs();

// ============================================================================
// State
// ============================================================================

const terminalRef = ref<InstanceType<typeof XtermTerminal> | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const hasConnected = ref(false);
const isSearchActive = ref(false);
const showReconnectToast = ref(false);
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 5;

// ============================================================================
// Computed
// ============================================================================

const sessionId = computed(() => route.params.id as string);

const session = computed<Session | null>(() => {
  return sessionsStore.getSessionById(sessionId.value) || sessionsStore.currentSession;
});

// ============================================================================
// Methods
// ============================================================================

async function loadSession(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  
  try {
    await sessionsStore.fetchSession(sessionId.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('sessions.terminal.loading_session');
  } finally {
    isLoading.value = false;
  }
}

function handleBack(): void {
  router.push('/sessions');
}

async function handleTerminate(): Promise<void> {
  if (!session.value) return;
  
  try {
    await sessionsStore.terminateSession(sessionId.value);
  } catch (err) {
    console.error('Failed to terminate session:', err);
    alert(t('sessions.terminal.terminate_failed'));
  }
}

function handleDisconnect(): void {
  terminalRef.value?.disconnect();
  handleBack();
}

function toggleSearch(): void {
  isSearchActive.value = !isSearchActive.value;
  
  if (isSearchActive.value) {
    terminalRef.value?.openSearch();
  } else {
    terminalRef.value?.closeSearch();
  }
}

function handleFit(): void {
  terminalRef.value?.fit();
}

function handleConnected(): void {
  // Replay recent_logs into terminal on first connection
  if (!hasConnected.value) {
    const logs = sessionsStore.currentSession?.recent_logs;
    if (logs && logs.length > 0) {
      terminalRef.value?.writeInitialLogs(logs);
    }
  }

  hasConnected.value = true;
  showReconnectToast.value = false;
  reconnectAttempts.value = 0;
}

function handleDisconnected(): void {
  if (hasConnected.value && reconnectAttempts.value < maxReconnectAttempts) {
    showReconnectToast.value = true;
    reconnectAttempts.value++;
    
    // Auto-reconnect after 3 seconds
    setTimeout(() => {
      if (showReconnectToast.value) {
        terminalRef.value?.connect();
      }
    }, 3000);
  }
}

function handleTerminalError(err: Error): void {
  console.error('Terminal error:', err);
  
  if (reconnectAttempts.value < maxReconnectAttempts) {
    showReconnectToast.value = true;
    reconnectAttempts.value++;
  } else {
    error.value = t('sessions.terminal.connection_failed');
  }
}

function handleManualReconnect(): void {
  showReconnectToast.value = false;
  terminalRef.value?.connect();
}

function handleStatusChange(status: string): void {
  // Update local session status
  sessionsStore.updateSessionStatus(sessionId.value, status as Session['status']);
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadSession();

  // Register as a terminal tab in the IDE tab bar
  openTab({
    type: 'terminal',
    label: `Terminal ${sessionId.value.slice(0, 8)}`,
    icon: 'terminal',
    path: `/sessions/${sessionId.value}`,
    closable: true,
    meta: { sessionId: sessionId.value },
  });

  // Poll for session status updates
  // Fast poll (2s) during startup, normal (5s) when running
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  function schedulePoll(): void {
    const s = session.value;
    if (!s || s.is_completed) return;

    const isStarting = ['created', 'starting'].includes(s.status);
    const delay = isStarting ? 2000 : 5000;

    pollTimer = setTimeout(async () => {
      try {
        await sessionsStore.fetchSession(sessionId.value);
      } catch (e) {
        // Ignore errors during polling
      }
      schedulePoll();
    }, delay);
  }

  schedulePoll();

  // Cleanup
  onUnmounted(() => {
    if (pollTimer) clearTimeout(pollTimer);
    terminalRef.value?.disconnect();
    sessionsStore.clearCurrentSession();
  });
});

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId && newId !== sessionId.value) {
    hasConnected.value = false;
    reconnectAttempts.value = 0;
    showReconnectToast.value = false;
    loadSession();
  }
});

// When session becomes running, trigger terminal connect
watch(() => session.value?.is_running, (isRunning, wasRunning) => {
  if (isRunning && !wasRunning && !hasConnected.value && terminalRef.value) {
    terminalRef.value.connect();
  }
});
</script>

<style scoped>
/* Page Layout */
.terminal-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary, var(--surface-1));
  overflow: hidden;
}

/* Skeleton Header */
.header-skeleton {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 56px;
  padding: 0 16px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent), color-mix(in srgb, var(--accent-indigo, #6366f1) 10%, transparent));
  border-bottom: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.skeleton-back {
  width: 36px;
  height: 36px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 8px;
  animation: pulse 2s infinite;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  width: 120px;
  height: 16px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

.skeleton-meta {
  width: 200px;
  height: 12px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Terminal Content */
.terminal-content {
  flex: 1;
  position: relative;
  padding: 16px;
  overflow: hidden;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-primary, var(--surface-1));
  color: var(--text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-top-color: var(--accent-purple, #a855f7);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error Overlay */
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-primary, var(--surface-1));
  text-align: center;
  padding: 32px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: var(--status-error, #ef4444);
}

.error-overlay p {
  margin: 0;
  color: var(--status-error, #ef4444);
  font-size: 14px;
  max-width: 400px;
}

.retry-btn {
  padding: 10px 24px;
  background: color-mix(in srgb, var(--status-error, #ef4444) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-error, #ef4444) 30%, transparent);
  border-radius: 8px;
  color: var(--status-error, #ef4444);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: color-mix(in srgb, var(--status-error, #ef4444) 25%, transparent);
}

/* Not Running Overlay */
.not-running-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-primary, var(--surface-1));
  text-align: center;
  padding: 32px;
}

.info-icon {
  width: 48px;
  height: 48px;
  color: var(--accent-purple, #a855f7);
}

.not-running-overlay h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.not-running-overlay p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
  padding: 16px 24px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  border-radius: 8px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-label {
  color: var(--text-muted);
}

.detail-value {
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
}

.text-error {
  color: var(--status-error, #ef4444);
}

.back-btn {
  padding: 10px 24px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  border-radius: 8px;
  color: var(--accent-purple, #a855f7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent);
}

/* Reconnect Toast */
.reconnect-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: color-mix(in srgb, var(--status-warning, #f59e0b) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-warning, #f59e0b) 30%, transparent);
  border-radius: 8px;
  color: var(--status-warning, #f59e0b);
  font-size: 14px;
  z-index: 1000;
}

.reconnect-btn {
  padding: 6px 12px;
  background: color-mix(in srgb, var(--status-warning, #f59e0b) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-warning, #f59e0b) 40%, transparent);
  border-radius: 6px;
  color: var(--status-warning, #f59e0b);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reconnect-btn:hover {
  background: color-mix(in srgb, var(--status-warning, #f59e0b) 30%, transparent);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
