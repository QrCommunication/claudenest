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
  private callbacks: WebSocketCallbacks = {};
  private status: ConnectionStatus = 'disconnected';
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize Laravel Echo with Reverb configuration
   */
  private initializeEcho(config: WebSocketConfig): void {
    const reverbConfig = window.ClaudeNest?.reverb;

    if (!reverbConfig) {
      throw new Error('Reverb configuration not found');
    }

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
          'Authorization': `Bearer ${config.token}`,
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

    // Listen for output events
    channel.listen('.session.output', (event: SessionOutputEvent) => {
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
   * Connect to WebSocket
   */
  connect(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}): void {
    this.config = config;
    this.callbacks = callbacks;
    this.status = 'connecting';

    try {
      this.initializeEcho(config);
      this.subscribeToSession(config.session_id);
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

    if (this.echo) {
      if (this.config) {
        this.echo.leave(`private-sessions.${this.config.session_id}`);
      }
      this.echo.disconnect();
      this.echo = null;
    }

    this.status = 'disconnected';
    this.reconnectAttempts = 0;
  }

  /**
   * Send input to the session
   */
  sendInput(data: string): void {
    if (!this.echo || this.status !== 'connected') {
      console.warn('Cannot send input: WebSocket not connected');
      return;
    }

    // Input is sent via HTTP API, not WebSocket
    // The WebSocket is for receiving output only
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
