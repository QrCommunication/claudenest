<template>
  <div class="terminal-wrapper">
    <div ref="terminalContainer" class="terminal-container"></div>
    
    <!-- Connection Status Overlay -->
    <div v-if="showStatusOverlay" class="status-overlay" :class="connectionStatus">
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
      <button v-if="canReconnect" class="reconnect-btn" @click="handleReconnect">
        Reconnect
      </button>
    </div>
    
    <!-- Search Bar -->
    <Transition name="slide-down">
      <div v-if="showSearch" class="search-bar">
        <div class="search-input-wrapper">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="search-input"
            @keydown.enter="handleSearch"
            @keydown.esc="closeSearch"
          />
          <button class="search-btn" @click="handleSearch">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="search-actions">
          <button class="action-btn" @click="() => findPrevious(searchQuery)" title="Previous">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <button class="action-btn" @click="() => findNext(searchQuery)" title="Next">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <button class="action-btn close" @click="closeSearch" title="Close">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useTerminal } from '@/composables/useTerminal';
import type { ConnectionStatus } from '@/types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  sessionId: string;
  autoConnect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoConnect: true,
});

const emit = defineEmits<{
  connected: [];
  disconnected: [];
  error: [error: Error];
  statusChange: [status: string];
}>();

// ============================================================================
// Refs
// ============================================================================

const terminalContainer = ref<HTMLElement | null>(null);
const showSearch = ref(false);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

// ============================================================================
// Terminal Composable
// ============================================================================

const {
  terminal,
  connectionStatus,
  isReady,
  initialize,
  connect,
  disconnect,
  fit,
  writeInitialLogs,
  search,
  findNext,
  findPrevious,
} = useTerminal({
  sessionId: props.sessionId,
  autoConnect: props.autoConnect,
  onConnect: () => emit('connected'),
  onDisconnect: () => emit('disconnected'),
  onError: (error) => emit('error', error),
  onStatusChange: (status) => emit('statusChange', status),
});

// ============================================================================
// Computed
// ============================================================================

const showStatusOverlay = computed(() => {
  return connectionStatus.value !== 'connected';
});

const canReconnect = computed(() => {
  return ['disconnected', 'error'].includes(connectionStatus.value);
});

const statusText = computed(() => {
  const texts: Record<ConnectionStatus, string> = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    reconnecting: 'Reconnecting...',
    error: 'Connection Error',
  };
  return texts[connectionStatus.value];
});

// ============================================================================
// Methods
// ============================================================================

function handleReconnect(): void {
  connect();
}

function openSearch(): void {
  showSearch.value = true;
  nextTick(() => {
    searchInput.value?.focus();
  });
}

function closeSearch(): void {
  showSearch.value = false;
  searchQuery.value = '';
  terminal.value?.focus();
}

function handleSearch(): void {
  if (searchQuery.value) {
    search(searchQuery.value);
  }
}

// ============================================================================
// Expose
// ============================================================================

defineExpose({
  terminal,
  connectionStatus,
  isReady,
  fit,
  connect,
  disconnect,
  writeInitialLogs,
  openSearch,
  closeSearch,
});

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  if (terminalContainer.value) {
    initialize(terminalContainer.value);
  }
  
  // Handle window resize
  window.addEventListener('resize', fit);
});

onUnmounted(() => {
  window.removeEventListener('resize', fit);
  disconnect();
});

// Watch for container changes
watch(terminalContainer, (container) => {
  if (container && !terminal.value) {
    initialize(container);
  }
});
</script>

<style scoped>
.terminal-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary, var(--surface-2));
  border-radius: 8px;
  overflow: hidden;
}

.terminal-container {
  width: 100%;
  height: 100%;
  padding: 8px;
}

.terminal-container :deep(.xterm) {
  height: 100%;
}

/* Status Overlay */
.status-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-overlay.connecting .status-dot {
  background: #f59e0b;
}

.status-overlay.connected .status-dot {
  background: #22c55e;
}

.status-overlay.disconnected .status-dot,
.status-overlay.error .status-dot {
  background: #ef4444;
}

.status-overlay.reconnecting .status-dot {
  background: #f59e0b;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.reconnect-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reconnect-btn:hover {
  opacity: 0.9;
}

/* Search Bar */
.search-bar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 95%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
  padding: 6px 12px;
  background: color-mix(in srgb, var(--bg-secondary, var(--surface-2)) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--accent-purple, #a855f7);
}

.search-input::placeholder {
  color: #565f89;
}

.search-btn,
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover,
.action-btn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--text-primary);
}

.action-btn.close:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.search-actions {
  display: flex;
  gap: 4px;
  padding-left: 8px;
  border-left: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.icon {
  width: 16px;
  height: 16px;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
