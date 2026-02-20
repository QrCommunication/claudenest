import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { SearchAddon } from '@xterm/addon-search';
import type { 
  TerminalTheme, 
  TerminalOptions,
  SessionOutputEvent,
  SessionInputEvent,
  SessionStatusEvent,
  ConnectionStatus,
  WebSocketConfig
} from '@/types';
import { websocketManager } from '@/services/websocket';
import { sessionsApi } from '@/services/api';

// Import xterm.css styles
import '@xterm/xterm/css/xterm.css';

// ============================================================================
// Constants
// ============================================================================

export const CLAUDENEST_THEME: TerminalTheme = {
  background: '#1a1b26',
  foreground: '#c0caf5',
  cursor: '#22d3ee',
  selectionBackground: 'rgba(168, 85, 247, 0.3)',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
  brightBlack: '#414868',
  brightRed: '#ff899d',
  brightGreen: '#9fe044',
  brightYellow: '#faba4a',
  brightBlue: '#8db0ff',
  brightMagenta: '#c7a9ff',
  brightCyan: '#7ee1ff',
  brightWhite: '#c0caf5',
};

export const DEFAULT_TERMINAL_OPTIONS: TerminalOptions = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
  cursorBlink: true,
  cursorStyle: 'underline',
  scrollback: 10000,
  theme: CLAUDENEST_THEME,
};

// ============================================================================
// Composable
// ============================================================================

export interface UseTerminalOptions {
  sessionId: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

export interface UseTerminalReturn {
  terminal: Ref<Terminal | null>;
  containerRef: Ref<HTMLElement | null>;
  fitAddon: Ref<FitAddon | null>;
  searchAddon: Ref<SearchAddon | null>;
  connectionStatus: Ref<ConnectionStatus>;
  isReady: Ref<boolean>;
  
  // Methods
  initialize: (container: HTMLElement) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  fit: () => void;
  sendInput: (data: string) => void;
  clear: () => void;
  search: (query: string, options?: { backwards?: boolean }) => boolean;
  findNext: (query: string) => boolean;
  findPrevious: (query: string) => boolean;
}

export function useTerminal(options: UseTerminalOptions): UseTerminalReturn {
  const { sessionId, autoConnect = true } = options;
  
  // Refs
  const terminal = ref<Terminal | null>(null);
  const containerRef = ref<HTMLElement | null>(null);
  const fitAddon = ref<FitAddon | null>(null);
  const searchAddon = ref<SearchAddon | null>(null);
  const connectionStatus = ref<ConnectionStatus>('disconnected');
  const isReady = ref(false);
  
  // Internal state
  let webglAddon: WebglAddon | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let wsConfig: WebSocketConfig | null = null;
  let inputBuffer = '';
  let connectRetryTimer: ReturnType<typeof setTimeout> | null = null;
  let connectRetryCount = 0;
  const MAX_CONNECT_RETRIES = 15; // Up to 30s of retrying (2s intervals)

  // ============================================================================
  // Terminal Initialization
  // ============================================================================
  
  function initialize(container: HTMLElement): void {
    containerRef.value = container;
    
    // Create terminal instance
    const term = new Terminal({
      ...DEFAULT_TERMINAL_OPTIONS,
      allowProposedApi: true,
    });
    
    terminal.value = term;
    
    // Add addons
    const fit = new FitAddon();
    fitAddon.value = fit;
    term.loadAddon(fit);
    
    const search = new SearchAddon();
    searchAddon.value = search;
    term.loadAddon(search);
    
    // Try to load WebGL addon for better performance
    try {
      webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
      
      // Handle WebGL context loss
      webglAddon.onContextLoss(() => {
        console.warn('WebGL context lost, falling back to canvas');
        webglAddon?.dispose();
        webglAddon = null;
      });
    } catch (e) {
      console.warn('WebGL addon not available, using canvas renderer');
    }
    
    // Open terminal in container
    term.open(container);
    
    // Initial fit
    fit.fit();
    
    // Handle input from terminal
    term.onData((data) => {
      handleTerminalInput(data);
    });
    
    // Handle key events for special keys
    term.onKey(({ key, domEvent }) => {
      // Handle Ctrl+C, Ctrl+D, etc.
      if (domEvent.ctrlKey) {
        const ctrlCodes: Record<string, string> = {
          'c': '\x03',
          'd': '\x04',
          'l': '\x0c',
          'z': '\x1a',
        };
        
        if (ctrlCodes[key.toLowerCase()]) {
          domEvent.preventDefault();
          sendInput(ctrlCodes[key.toLowerCase()]);
        }
      }
    });
    
    // Handle resize
    term.onResize(({ cols, rows }) => {
      handleResize(cols, rows);
    });
    
    // Setup resize observer
    setupResizeObserver(container);
    
    isReady.value = true;
    
    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }
  }

  // ============================================================================
  // Resize Handling
  // ============================================================================
  
  function setupResizeObserver(container: HTMLElement): void {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          fitTerminal();
        }
      }
    });
    
    resizeObserver.observe(container);
  }

  function fitTerminal(): void {
    if (fitAddon.value) {
      try {
        fitAddon.value.fit();
      } catch (e) {
        console.warn('Failed to fit terminal:', e);
      }
    }
  }

  async function handleResize(cols: number, rows: number): Promise<void> {
    try {
      await sessionsApi.resize(sessionId, cols, rows);
    } catch (e) {
      console.error('Failed to resize session:', e);
    }
  }

  // ============================================================================
  // Input Handling
  // ============================================================================
  
  function handleTerminalInput(data: string): void {
    // Buffer input for line-based modes or send immediately
    sendInput(data);
  }

  function sendInput(data: string): void {
    if (connectionStatus.value !== 'connected') {
      console.warn('Cannot send input: not connected');
      return;
    }

    // Fast path: direct WebSocket to AgentServe (no HTTP/Redis overhead)
    websocketManager.sendInput(data);
  }

  // ============================================================================
  // WebSocket Connection
  // ============================================================================
  
  async function connect(): Promise<void> {
    if (connectionStatus.value === 'connected' || connectionStatus.value === 'connecting') {
      return;
    }

    connectionStatus.value = 'connecting';

    try {
      // Get WebSocket configuration (attach requires session to be running)
      const config = await sessionsApi.attach(sessionId);
      wsConfig = config;
      connectRetryCount = 0;

      // Connect to WebSocket using Sanctum auth (not ws_token)
      websocketManager.connect(
        {
          session_id: sessionId,
          token: localStorage.getItem('auth_token') || '',
          ws_url: config.ws_url || '',
        },
        {
          onOutput: handleOutput,
          onInput: handleInputEcho,
          onStatusChange: handleStatusChange,
          onConnect: () => {
            connectionStatus.value = 'connected';
            options.onConnect?.();
          },
          onDisconnect: () => {
            connectionStatus.value = 'disconnected';
            options.onDisconnect?.();
          },
          onError: (error) => {
            connectionStatus.value = 'error';
            options.onError?.(error);
          },
        }
      );
    } catch (e) {
      // If attach fails (session not yet running), retry with backoff
      if (connectRetryCount < MAX_CONNECT_RETRIES) {
        connectRetryCount++;
        connectionStatus.value = 'connecting';

        if (terminal.value) {
          terminal.value.write(`\r\n\x1b[90m[Waiting for session to start... (${connectRetryCount}/${MAX_CONNECT_RETRIES})]\x1b[0m\r\n`);
        }

        connectRetryTimer = setTimeout(() => {
          connectionStatus.value = 'disconnected'; // Reset so connect() can proceed
          connect();
        }, 2000);
      } else {
        connectionStatus.value = 'error';
        const error = e instanceof Error ? e : new Error(String(e));
        options.onError?.(error);
      }
    }
  }

  function disconnect(): void {
    websocketManager.disconnect();
    connectionStatus.value = 'disconnected';
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  function handleOutput(event: SessionOutputEvent): void {
    if (terminal.value) {
      terminal.value.write(event.data);
    }
  }

  function handleInputEcho(event: SessionInputEvent): void {
    // Optionally echo input locally (usually not needed as server echoes)
    console.debug('Input echo:', event.data);
  }

  function handleStatusChange(event: SessionStatusEvent): void {
    options.onStatusChange?.(event.status);
    
    // Handle session end
    if (['completed', 'error', 'terminated'].includes(event.status)) {
      if (terminal.value) {
        terminal.value.writeln(`\r\n\x1b[90m[Session ${event.status}]\x1b[0m`);
      }
    }
  }

  // ============================================================================
  // Terminal Methods
  // ============================================================================
  
  function clear(): void {
    terminal.value?.clear();
  }

  function search(query: string, options?: { backwards?: boolean }): boolean {
    if (!searchAddon.value) return false;
    
    return searchAddon.value.findNext(query, {
      ...options,
      caseSensitive: false,
      wholeWord: false,
    });
  }

  function findNext(query: string): boolean {
    return search(query, { backwards: false });
  }

  function findPrevious(query: string): boolean {
    return search(query, { backwards: true });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================
  
  function cleanup(): void {
    if (connectRetryTimer) {
      clearTimeout(connectRetryTimer);
      connectRetryTimer = null;
    }

    disconnect();

    resizeObserver?.disconnect();
    resizeObserver = null;
    
    try { webglAddon?.dispose(); } catch { /* already disposed */ }
    webglAddon = null;

    try { fitAddon.value?.dispose(); } catch { /* already disposed */ }
    fitAddon.value = null;

    try { searchAddon.value?.dispose(); } catch { /* already disposed */ }
    searchAddon.value = null;

    try { terminal.value?.dispose(); } catch { /* already disposed */ }
    terminal.value = null;
    
    isReady.value = false;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================
  
  onUnmounted(() => {
    cleanup();
  });

  // Watch for container changes
  watch(containerRef, (newContainer) => {
    if (newContainer && !terminal.value) {
      initialize(newContainer);
    }
  });

  // ============================================================================
  // Return
  // ============================================================================
  
  return {
    terminal,
    containerRef,
    fitAddon,
    searchAddon,
    connectionStatus,
    isReady,
    initialize,
    connect,
    disconnect,
    fit: fitTerminal,
    sendInput,
    clear,
    search,
    findNext,
    findPrevious,
  };
}

export default useTerminal;
