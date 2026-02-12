/**
 * WebSocket client with auto-reconnect and message queuing
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import type { Logger } from '../utils/logger.js';
import type { WebSocketConfig, WebSocketMessage } from '../types/index.js';
import { generateId } from '../utils/index.js';

interface WebSocketClientOptions {
  serverUrl: string;
  token: string;
  machineId: string;
  config?: Partial<WebSocketConfig>;
  logger: Logger;
}

const DEFAULT_CONFIG: WebSocketConfig = {
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  messageTimeout: 10000,
};

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private config: WebSocketConfig;
  private logger: Logger;
  
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private isConnecting = false;
  
  private messageQueue: WebSocketMessage[] = [];
  private pendingMessages = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }>();

  constructor(options: WebSocketClientOptions) {
    super();
    this.options = options;
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.logger = options.logger.child({ component: 'WebSocketClient' });
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      this.logger.debug({}, 'Already connected or connecting');
      return;
    }

    this.isIntentionallyClosed = false;
    this.isConnecting = true;

    const wsUrl = this.buildWebSocketUrl();
    this.logger.info({ url: wsUrl }, `Connecting to ${wsUrl}`);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.isConnecting = false;
        reject(new Error('Connection timeout'));
      }, this.config.messageTimeout);

      try {
        this.ws = new WebSocket(wsUrl, {
          headers: {
            'X-Machine-Token': this.options.token,
            'X-Machine-ID': this.options.machineId,
          },
        });

        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.onOpen();
          resolve();
        });

        this.ws.on('message', (data) => {
          this.onMessage(data);
        });

        this.ws.on('close', (code, reason) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.onClose(code, reason);
        });

        this.ws.on('error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.onError(error);
          reject(error);
        });
      } catch (error) {
        clearTimeout(timeout);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    this.logger.info({}, 'Disconnecting...');
    this.isIntentionallyClosed = true;
    
    this.clearTimers();
    
    // Reject all pending messages
    for (const [id, pending] of this.pendingMessages) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Connection closed'));
      this.pendingMessages.delete(id);
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnecting');
      }
      this.ws = null;
    }

    this.emit('disconnected');
  }

  /**
   * Send a message to the server
   */
  send(type: string, payload: unknown, expectResponse = false): Promise<unknown> | void {
    if (!this.isConnected()) {
      this.logger.debug({ type }, `Queueing message: ${type}`);
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
        id: generateId(),
      };
      this.messageQueue.push(message);
      
      if (expectResponse) {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Message queued but not sent')), 5000);
        });
      }
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: generateId(),
    };

    this.sendMessage(message);

    if (expectResponse) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pendingMessages.delete(message.id);
          reject(new Error('Response timeout'));
        }, this.config.messageTimeout);

        this.pendingMessages.set(message.id, { resolve, reject, timer });
      });
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.isConnected()) return 'connected';
    return 'disconnected';
  }

  private buildWebSocketUrl(): string {
    const baseUrl = this.options.serverUrl.replace(/^http/, 'ws');
    return `${baseUrl}/ws/agent`;
  }

  private onOpen(): void {
    this.logger.info({}, 'WebSocket connected');
    this.reconnectAttempts = 0;
    
    this.startHeartbeat();
    this.flushMessageQueue();
    
    this.emit('connected');
  }

  private onMessage(data: WebSocket.RawData): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;
      this.logger.debug({ type: message.type, messageId: message.id }, `Received: ${message.type}`);

      // Check if this is a response to a pending message
      const pending = this.pendingMessages.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        pending.resolve(message.payload);
        this.pendingMessages.delete(message.id);
        return;
      }

      // Emit for general handling
      this.emit('message', { type: message.type, payload: message.payload });
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to parse message');
    }
  }

  private onClose(code: number, reason: Buffer): void {
    this.logger.warn({ code, reason: reason.toString() }, `WebSocket closed: ${code} - ${reason.toString()}`);
    this.clearTimers();
    
    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
    
    this.emit('disconnected');
  }

  private onError(error: Error): void {
    this.logger.error({ err: error }, 'WebSocket error');
    this.emit('error', error);
  }

  private sendMessage(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.logger.debug({ type: message.type, messageId: message.id }, `Sent: ${message.type}`);
    } catch (error) {
      this.logger.error({ err: error, messageId: message.id }, 'Failed to send message');
      throw error;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.logger.error({ attempts: this.reconnectAttempts }, 'Max reconnection attempts reached');
      this.emit('maxReconnectReached');
      return;
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    this.reconnectAttempts++;
    this.logger.info({ delayMs: delay, attempt: this.reconnectAttempts }, `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        this.logger.error({ err: error }, 'Reconnection failed');
      }
    }, delay);
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    this.logger.info({ count: this.messageQueue.length }, `Flushing ${this.messageQueue.length} queued messages`);
    
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of queue) {
      try {
        this.sendMessage(message);
      } catch (error) {
        this.logger.error({ err: error, messageType: message.type }, 'Failed to flush message');
        // Put it back for next time
        this.messageQueue.push(message);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
