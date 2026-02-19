import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type {
  SessionOutputEvent,
  SessionInputEvent,
  SessionStatusEvent,
  WebSocketConfig,
  ConnectionStatus
} from '@/types';

// Make Pusher available globally for Laravel Echo
(window as unknown as Record<string, unknown>).Pusher = Pusher;

// ============================================================================
// Types
// ============================================================================

export interface WebSocketCallbacks {
  onOutput?: (event: SessionOutputEvent) => void;
  onInput?: (event: SessionInputEvent) => void;
  onStatusChange?: (event: SessionStatusEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface WebSocketService {
  connect: (config: WebSocketConfig) => void;
  disconnect: () => void;
  sendInput: (data: string) => void;
  getStatus: () => ConnectionStatus;
}

// ============================================================================
// WebSocket Manager
// ============================================================================

class WebSocketManager {
  private echo: Echo<"reverb"> | null = null;
  private terminalWs: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private status: ConnectionStatus = 'disconnected';
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private terminalReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private terminalReconnectAttempts = 0;

  /**
   * Initialize Laravel Echo with Reverb configuration
   */
  private initializeEcho(_config: WebSocketConfig): void {
    const reverbConfig = window.ClaudeNest?.reverb;

    if (!reverbConfig) {
      throw new Error('Reverb configuration not found');
    }

    // Use the Sanctum auth token for Reverb private channel authentication
    const authToken = localStorage.getItem('auth_token') || '';

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: reverbConfig.key,
      wsHost: reverbConfig.host,
      wsPort: reverbConfig.port,
      wssPort: reverbConfig.port,
      useTLS: reverbConfig.scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      auth: {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      },
    });
  }

  /**
   * Subscribe to session channel
   */
  private subscribeToSession(sessionId: string): void {
    if (!this.echo) return;

    const channel = this.echo.private(`sessions.${sessionId}`);

    // Listen for output events (only when terminal WS is not connected — avoids double output)
    channel.listen('.session.output', (event: SessionOutputEvent) => {
      if (this.terminalWs && this.terminalWs.readyState === WebSocket.OPEN) return;
      this.callbacks.onOutput?.(event);
    });

    // Listen for input events
    channel.listen('.session.input', (event: SessionInputEvent) => {
      this.callbacks.onInput?.(event);
    });

    // Listen for status changes
    channel.listen('.session.status', (event: SessionStatusEvent) => {
      this.callbacks.onStatusChange?.(event);
    });

    // Handle connection events
    this.echo.connector.pusher.connection.bind('connected', () => {
      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    });

    this.echo.connector.pusher.connection.bind('disconnected', () => {
      this.status = 'disconnected';
      this.callbacks.onDisconnect?.();
    });

    this.echo.connector.pusher.connection.bind('error', (error: Error) => {
      this.status = 'error';
      this.callbacks.onError?.(error);
    });
  }

  /**
   * Connect the direct terminal WebSocket for low-latency input.
   * Falls back to HTTP POST if this connection fails.
   */
  private connectTerminalWs(sessionId: string): void {
    const authToken = localStorage.getItem('auth_token') || '';
    if (!authToken) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/terminal?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(authToken)}`;

    try {
      this.terminalWs = new WebSocket(url);
    } catch {
      return;
    }

    this.terminalWs.onopen = () => {
      this.terminalReconnectAttempts = 0;
      console.debug('[Terminal WS] Connected');
    };

    this.terminalWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output') {
          this.callbacks.onOutput?.({
            session_id: sessionId,
            data: msg.data,
            timestamp: msg.timestamp,
          } as SessionOutputEvent);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.terminalWs.onclose = () => {
      this.terminalWs = null;
      this.reconnectTerminalWs(sessionId);
    };

    this.terminalWs.onerror = () => {
      // onclose will fire after this
    };
  }

  private reconnectTerminalWs(sessionId: string): void {
    if (this.terminalReconnectAttempts >= 5) return;
    if (this.status === 'disconnected') return;

    this.terminalReconnectAttempts++;
    const delay = Math.min(1000 * this.terminalReconnectAttempts, 5000);

    this.terminalReconnectTimer = setTimeout(() => {
      if (this.config) {
        this.connectTerminalWs(sessionId);
      }
    }, delay);
  }

  /**
   * Connect to WebSocket
   */
  connect(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}): void {
    this.config = config;
    this.callbacks = callbacks;
    this.status = 'connecting';

    try {
      this.initializeEcho(config);
      this.subscribeToSession(config.session_id);
      this.connectTerminalWs(config.session_id);
    } catch (error) {
      this.status = 'error';
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.terminalReconnectTimer) {
      clearTimeout(this.terminalReconnectTimer);
      this.terminalReconnectTimer = null;
    }

    if (this.terminalWs) {
      this.terminalWs.close();
      this.terminalWs = null;
    }

    if (this.echo) {
      if (this.config) {
        this.echo.leave(`private-sessions.${this.config.session_id}`);
      }
      this.echo.disconnect();
      this.echo = null;
    }

    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.terminalReconnectAttempts = 0;
  }

  /**
   * Send input to the session.
   * Uses direct WebSocket for low latency, falls back to HTTP POST.
   */
  sendInput(data: string): void {
    // Fast path: direct WebSocket to AgentServe (no HTTP/PHP overhead)
    if (this.terminalWs && this.terminalWs.readyState === WebSocket.OPEN) {
      this.terminalWs.send(JSON.stringify({ type: 'input', data }));
      return;
    }

    // Fallback: HTTP POST (works but slower due to TrimStrings bypass)
    import('./api').then(({ sessionsApi }) => {
      if (this.config) {
        sessionsApi.sendInput(this.config.session_id, data);
      }
    });
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Attempt to reconnect
   */
  reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.status = 'error';
      this.callbacks.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.status = 'reconnecting';
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (this.config) {
        this.connect(this.config, this.callbacks);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

// Create singleton instance
export const websocketManager = new WebSocketManager();

// Export reactive composable
export function useWebSocket() {
  return {
    connect: websocketManager.connect.bind(websocketManager),
    disconnect: websocketManager.disconnect.bind(websocketManager),
    sendInput: websocketManager.sendInput.bind(websocketManager),
    getStatus: websocketManager.getStatus.bind(websocketManager),
    reconnect: websocketManager.reconnect.bind(websocketManager),
  };
}

export default websocketManager;

// ============================================================================
// Global Type Declaration
// ============================================================================

declare global {
  interface Window {
    ClaudeNest?: {
      reverb?: {
        key: string;
        host: string;
        port: number;
        scheme: string;
      };
    };
  }
}
