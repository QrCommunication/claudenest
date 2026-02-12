/**
 * Session manager - handles multiple Claude Code sessions
 */

import { EventEmitter } from 'events';
import { ClaudeProcess } from './claude-process.js';
import type { Logger } from '../utils/logger.js';
import type {
  Session,
  SessionConfig,
  SessionStatus,
  SessionOutput
} from '../types/index.js';

interface SessionManagerOptions {
  claudePath: string;
  maxSessions?: number;
  logger: Logger;
}

export class SessionManager extends EventEmitter {
  private sessions = new Map<string, ClaudeProcess>();
  private sessionConfigs = new Map<string, SessionConfig>();
  private options: Required<SessionManagerOptions>;
  private logger: Logger;

  constructor(options: SessionManagerOptions) {
    super();
    this.options = {
      maxSessions: 10,
      ...options,
    };
    this.logger = options.logger.child({ component: 'SessionManager' });
  }

  /**
   * Create a new session
   */
  async createSession(id: string, config: SessionConfig): Promise<Session> {
    // Check session limit
    if (this.sessions.size >= this.options.maxSessions) {
      throw new Error(`Maximum sessions (${this.options.maxSessions}) reached`);
    }

    // Check if session already exists
    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }

    this.logger.info({
      projectPath: config.projectPath,
      mode: config.mode || 'interactive'
    }, `Creating session ${id}`);

    const process = new ClaudeProcess({
      claudePath: this.options.claudePath,
      sessionId: id,
      logger: this.logger,
      ...config,
    });

    // Setup event forwarding
    process.on('output', (data: SessionOutput) => {
      this.emit('output', data);
    });

    process.on('status', (data: { sessionId: string; status: SessionStatus }) => {
      this.emit('status', { sessionId: id, status: data.status });
    });

    process.on('exit', (data: { sessionId: string; exitCode: number }) => {
      this.logger.info({ sessionId: data.sessionId, exitCode: data.exitCode }, `Session ${data.sessionId} exited with code ${data.exitCode}`);
      this.sessions.delete(id);
      this.sessionConfigs.delete(id);
      this.emit('sessionEnded', { sessionId: data.sessionId, exitCode: data.exitCode });
    });

    // Start the process
    await process.start();
    
    this.sessions.set(id, process);
    this.sessionConfigs.set(id, config);

    const session: Session = {
      id,
      status: 'running',
      pid: process.pid,
      projectPath: config.projectPath,
      initialPrompt: config.initialPrompt,
      mode: config.mode || 'interactive',
      ptySize: config.ptySize || { cols: 120, rows: 40 },
      createdAt: new Date(),
      startedAt: new Date(),
    };

    this.emit('sessionCreated', session);
    
    return session;
  }

  /**
   * Terminate a session
   */
  async terminateSession(id: string, force = false): Promise<void> {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }

    this.logger.info({ sessionId: id, force }, `Terminating session ${id}${force ? ' (force)' : ''}`);
    
    const signal = force ? 'SIGKILL' : 'SIGTERM';
    await process.terminate(signal);
    
    this.sessions.delete(id);
    this.sessionConfigs.delete(id);
  }

  /**
   * Send input to a session
   */
  sendInput(id: string, data: string): void {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }

    process.write(data);
  }

  /**
   * Resize a session's PTY
   */
  resize(id: string, cols: number, rows: number): void {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }

    process.resize(cols, rows);
    
    // Update stored config
    const config = this.sessionConfigs.get(id);
    if (config) {
      config.ptySize = { cols, rows };
    }
  }

  /**
   * Get a session
   */
  getSession(id: string): ClaudeProcess | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get session info
   */
  getSessionInfo(id: string): Partial<Session> | undefined {
    const process = this.sessions.get(id);
    const config = this.sessionConfigs.get(id);
    
    if (!process) return undefined;

    return {
      id,
      status: process.getStatus(),
      pid: process.pid,
      projectPath: config?.projectPath,
      mode: config?.mode || 'interactive',
      ptySize: config?.ptySize,
    };
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get all sessions info
   */
  getAllSessions(): Partial<Session>[] {
    return this.getActiveSessions().map(id => this.getSessionInfo(id)!);
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Check if a session exists
   */
  hasSession(id: string): boolean {
    return this.sessions.has(id);
  }

  /**
   * Get session output buffer
   */
  getSessionOutput(id: string): string[] | undefined {
    const process = this.sessions.get(id);
    return process?.getOutputBuffer();
  }

  /**
   * Clear session output buffer
   */
  clearSessionOutput(id: string): void {
    const process = this.sessions.get(id);
    process?.clearBuffer();
  }

  /**
   * Terminate all sessions
   */
  async terminateAll(force = false): Promise<void> {
    this.logger.info({ count: this.sessions.size, force }, `Terminating all ${this.sessions.size} sessions`);

    const terminations = Array.from(this.sessions.entries()).map(
      async ([id, process]) => {
        try {
          const signal = force ? 'SIGKILL' : 'SIGTERM';
          await process.terminate(signal);
        } catch (error) {
          this.logger.error({ err: error, sessionId: id }, `Failed to terminate session ${id}`);
        }
      }
    );

    await Promise.all(terminations);
    this.sessions.clear();
    this.sessionConfigs.clear();
  }

  /**
   * Check if at capacity
   */
  isAtCapacity(): boolean {
    return this.sessions.size >= this.options.maxSessions;
  }

  /**
   * Get available slots
   */
  getAvailableSlots(): number {
    return this.options.maxSessions - this.sessions.size;
  }

  /**
   * Pause a session (SIGSTOP)
   */
  async pauseSession(id: string): Promise<void> {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }

    this.logger.info({ sessionId: id }, `Pausing session ${id}`);
    await process.terminate('SIGSTOP');
  }

  /**
   * Resume a session (SIGCONT)
   */
  async resumeSession(id: string): Promise<void> {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }

    this.logger.info({ sessionId: id }, `Resuming session ${id}`);
    await process.terminate('SIGCONT');
  }
}
