/**
 * WebSocket Client Service
 * Real-time communication with ClaudeNest server
 */

import { io, Socket } from 'socket.io-client';
import type {
  WebSocketMessage,
  WebSocketMessageType,
  Session,
  SessionLog,
  MachineStatus,
} from '@/types';

// Connection configuration
const WS_URL = process.env.CLAUDENEST_WS_URL || 'wss://api.claudenest.app';

// Event callbacks registry
type EventCallback = (payload: unknown) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private token: string | null = null;

  // Connection status
  public isConnected = false;
  public connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';

  /**
   * Initialize WebSocket connection
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.token = token;
    this.connectionState = 'connecting';

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.isConnected = true;
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.emit('connection:connected', {});
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.isConnected = false;
      this.connectionState = 'disconnected';
      this.emit('connection:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.connectionState = 'error';
      this.reconnectAttempts++;
      this.emit('connection:error', { error: error.message });
    });

    // Session events
    this.socket.on('session:output', (payload: { sessionId: string; data: string }) => {
      this.emit('session:output', payload);
    });

    this.socket.on('session:status', (payload: { sessionId: string; status: string }) => {
      this.emit('session:status', payload);
    });

    this.socket.on('session:created', (payload: Session) => {
      this.emit('session:created', payload);
    });

    this.socket.on('session:ended', (payload: { sessionId: string; exitCode: number }) => {
      this.emit('session:ended', payload);
    });

    // Machine events
    this.socket.on('machine:status', (payload: { machineId: string; status: MachineStatus }) => {
      this.emit('machine:status', payload);
    });

    // Project events
    this.socket.on('project:broadcast', (payload: { projectId: string; message: string; instanceId: string }) => {
      this.emit('project:broadcast', payload);
    });

    // Task events
    this.socket.on('task:updated', (payload: { taskId: string; status: string; assignedTo?: string }) => {
      this.emit('task:updated', payload);
    });

    this.socket.on('task:created', (payload: { taskId: string; projectId: string }) => {
      this.emit('task:created', payload);
    });

    // Context events
    this.socket.on('context:updated', (payload: { projectId: string; type: string }) => {
      this.emit('context:updated', payload);
    });

    // File lock events
    this.socket.on('file:locked', (payload: { projectId: string; path: string; lockedBy: string }) => {
      this.emit('file:locked', payload);
    });

    this.socket.on('file:unlocked', (payload: { projectId: string; path: string }) => {
      this.emit('file:unlocked', payload);
    });

    // Instance events
    this.socket.on('instance:connected', (payload: { instanceId: string; projectId: string }) => {
      this.emit('instance:connected', payload);
    });

    this.socket.on('instance:disconnected', (payload: { instanceId: string; projectId: string }) => {
      this.emit('instance:disconnected', payload);
    });

    // Error handling
    this.socket.on('error', (payload: { message: string; code: string }) => {
      console.error('[WebSocket] Server error:', payload);
      this.emit('error', payload);
    });
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to local listeners
   */
  private emit(event: string, payload: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[WebSocket] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Send message to server
   */
  send(event: string, payload?: unknown): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot send - not connected');
      return;
    }

    this.socket.emit(event, payload);
  }

  // Session-specific methods
  subscribeToSession(sessionId: string): void {
    this.send('session:subscribe', { sessionId });
  }

  unsubscribeFromSession(sessionId: string): void {
    this.send('session:unsubscribe', { sessionId });
  }

  sendSessionInput(sessionId: string, data: string): void {
    this.send('session:input', { sessionId, data });
  }

  resizeSession(sessionId: string, cols: number, rows: number): void {
    this.send('session:resize', { sessionId, cols, rows });
  }

  // Project-specific methods
  subscribeToProject(projectId: string): void {
    this.send('project:subscribe', { projectId });
  }

  unsubscribeFromProject(projectId: string): void {
    this.send('project:unsubscribe', { projectId });
  }

  broadcastToProject(projectId: string, message: string): void {
    this.send('project:broadcast', { projectId, message });
  }

  // Machine-specific methods
  subscribeToMachine(machineId: string): void {
    this.send('machine:subscribe', { machineId });
  }

  unsubscribeFromMachine(machineId: string): void {
    this.send('machine:unsubscribe', { machineId });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionState = 'disconnected';
      this.eventListeners.clear();
    }
  }

  /**
   * Reconnect with new token
   */
  reconnect(token: string): void {
    this.disconnect();
    this.connect(token);
  }
}

// Export singleton instance
export const websocket = new WebSocketService();

// Hook for using WebSocket in components
export const useWebSocket = () => {
  return {
    connect: (token: string) => websocket.connect(token),
    disconnect: () => websocket.disconnect(),
    on: (event: string, callback: EventCallback) => websocket.on(event, callback),
    send: (event: string, payload?: unknown) => websocket.send(event, payload),
    isConnected: websocket.isConnected,
    connectionState: websocket.connectionState,
    subscribeToSession: (sessionId: string) => websocket.subscribeToSession(sessionId),
    unsubscribeFromSession: (sessionId: string) => websocket.unsubscribeFromSession(sessionId),
    sendSessionInput: (sessionId: string, data: string) => websocket.sendSessionInput(sessionId, data),
    resizeSession: (sessionId: string, cols: number, rows: number) => websocket.resizeSession(sessionId, cols, rows),
    subscribeToProject: (projectId: string) => websocket.subscribeToProject(projectId),
    unsubscribeFromProject: (projectId: string) => websocket.unsubscribeFromProject(projectId),
    broadcastToProject: (projectId: string, message: string) => websocket.broadcastToProject(projectId, message),
    subscribeToMachine: (machineId: string) => websocket.subscribeToMachine(machineId),
    unsubscribeFromMachine: (machineId: string) => websocket.unsubscribeFromMachine(machineId),
  };
};

export default websocket;
