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
        <span>Loading session...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-overlay">
        <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadSession">
          Retry
        </button>
        <button class="back-btn" @click="handleBack">
          Back to Sessions
        </button>
      </div>
      
      <!-- Session Not Running -->
      <div v-else-if="session && !session.is_running && !hasConnected" class="not-running-overlay">
        <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <h3>Session {{ session.status }}</h3>
        <p>This session is not currently running.</p>
        <div class="session-details">
          <div class="detail-item">
            <span class="detail-label">Mode:</span>
            <span class="detail-value">{{ session.mode }}</span>
          </div>
          <div v-if="session.formatted_duration" class="detail-item">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">{{ session.formatted_duration }}</span>
          </div>
          <div v-if="session.exit_code !== null" class="detail-item">
            <span class="detail-label">Exit Code:</span>
            <span class="detail-value" :class="{ 'text-error': session.exit_code !== 0 }">
              {{ session.exit_code }}
            </span>
          </div>
        </div>
        <button class="back-btn" @click="handleBack">
          Back to Sessions
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
        <span>Connection lost. Reconnecting...</span>
        <button class="reconnect-btn" @click="handleManualReconnect">
          Reconnect Now
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import XtermTerminal from '@/components/terminal/XtermTerminal.vue';
import TerminalHeader from '@/components/terminal/TerminalHeader.vue';
import { useSessionsStore } from '@/stores/sessions';
import type { Session } from '@/types';

// ============================================================================
// Router & Route
// ============================================================================

const route = useRoute();
const router = useRouter();
const sessionsStore = useSessionsStore();

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
    
    // If session has recent logs, they will be loaded
    const currentSession = sessionsStore.currentSession;
    if (currentSession?.recent_logs && currentSession.recent_logs.length > 0) {
      // Logs are already in the session object
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load session';
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
    alert('Failed to terminate session. Please try again.');
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
    error.value = 'Connection failed after multiple attempts. Please try again later.';
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
  
  // Poll for session status updates
  const interval = setInterval(async () => {
    if (session.value?.is_running) {
      try {
        await sessionsStore.fetchSession(sessionId.value);
      } catch (e) {
        // Ignore errors during polling
      }
    }
  }, 5000);
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(interval);
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
</script>

<style scoped>
/* Page Layout */
.terminal-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f1a;
  overflow: hidden;
}

/* Skeleton Header */
.header-skeleton {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 56px;
  padding: 0 16px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1));
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
}

.skeleton-back {
  width: 36px;
  height: 36px;
  background: rgba(168, 85, 247, 0.2);
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
  background: rgba(168, 85, 247, 0.2);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

.skeleton-meta {
  width: 200px;
  height: 12px;
  background: rgba(168, 85, 247, 0.15);
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
  background: #0f0f1a;
  color: #565f89;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(168, 85, 247, 0.2);
  border-top-color: #a855f7;
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
  background: #0f0f1a;
  text-align: center;
  padding: 32px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.error-overlay p {
  margin: 0;
  color: #ef4444;
  font-size: 14px;
  max-width: 400px;
}

.retry-btn {
  padding: 10px 24px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: rgba(239, 68, 68, 0.25);
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
  background: #0f0f1a;
  text-align: center;
  padding: 32px;
}

.info-icon {
  width: 48px;
  height: 48px;
  color: #a855f7;
}

.not-running-overlay h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #c0caf5;
}

.not-running-overlay p {
  margin: 0;
  color: #565f89;
  font-size: 14px;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
  padding: 16px 24px;
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 8px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-label {
  color: #565f89;
}

.detail-value {
  color: #c0caf5;
  font-family: 'JetBrains Mono', monospace;
}

.text-error {
  color: #ef4444;
}

.back-btn {
  padding: 10px 24px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  color: #a855f7;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(168, 85, 247, 0.25);
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
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #f59e0b;
  font-size: 14px;
  z-index: 1000;
}

.reconnect-btn {
  padding: 6px 12px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 6px;
  color: #f59e0b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reconnect-btn:hover {
  background: rgba(245, 158, 11, 0.3);
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
