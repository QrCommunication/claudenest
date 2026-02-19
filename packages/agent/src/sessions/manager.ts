/**
 * Session manager - handles multiple Claude Code sessions via tmux.
 */

import { EventEmitter } from 'events';
import { TmuxSession } from './tmux-session.js';
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
  private sessions = new Map<string, TmuxSession>();
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

    const session = new TmuxSession({
      claudePath: this.options.claudePath,
      sessionId: id,
      logger: this.logger,
      ...config,
    });

    this.setupSessionEvents(id, session, config);

    await session.start();

    this.sessions.set(id, session);
    this.sessionConfigs.set(id, config);

    const info: Session = {
      id,
      status: 'running',
      pid: session.pid,
      projectPath: config.projectPath,
      initialPrompt: config.initialPrompt,
      mode: config.mode || 'interactive',
      ptySize: config.ptySize || { cols: 120, rows: 40 },
      createdAt: new Date(),
      startedAt: new Date(),
    };

    this.emit('sessionCreated', info);

    return info;
  }

  /**
   * Terminate a session
   */
  async terminateSession(id: string, force = false): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    this.logger.info({ sessionId: id, force }, `Terminating session ${id}${force ? ' (force)' : ''}`);

    const signal = force ? 'SIGKILL' : 'SIGTERM';
    await session.terminate(signal);

    this.sessions.delete(id);
    this.sessionConfigs.delete(id);
  }

  /**
   * Send input to a session
   */
  sendInput(id: string, data: string): void {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    session.write(data);
  }

  /**
   * Resize a session's PTY
   */
  resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    session.resize(cols, rows);
    
    // Update stored config
    const config = this.sessionConfigs.get(id);
    if (config) {
      config.ptySize = { cols, rows };
    }
  }

  /**
   * Get a session
   */
  getSession(id: string): TmuxSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get session info
   */
  getSessionInfo(id: string): Partial<Session> | undefined {
    const session = this.sessions.get(id);
    const config = this.sessionConfigs.get(id);

    if (!session) return undefined;

    return {
      id,
      status: session.getStatus(),
      pid: session.pid,
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
    return this.sessions.get(id)?.getOutputBuffer();
  }

  /**
   * Clear session output buffer
   */
  clearSessionOutput(id: string): void {
    this.sessions.get(id)?.clearBuffer();
  }

  /**
   * Terminate all sessions
   */
  async terminateAll(force = false): Promise<void> {
    this.logger.info({ count: this.sessions.size, force }, `Terminating all ${this.sessions.size} sessions`);

    const terminations = Array.from(this.sessions.entries()).map(
      async ([id, session]) => {
        try {
          const signal = force ? 'SIGKILL' : 'SIGTERM';
          await session.terminate(signal);
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
   * Recover orphaned tmux sessions after an agent crash.
   * Returns the list of recovered session IDs.
   */
  async recoverSessions(): Promise<string[]> {
    const orphans = TmuxSession.listOrphanSessions();
    if (orphans.length === 0) return [];

    this.logger.info({ count: orphans.length }, 'Found orphan tmux sessions');

    const recovered: string[] = [];

    for (const tmuxName of orphans) {
      const id = TmuxSession.sessionIdFromTmuxName(tmuxName);

      if (this.sessions.has(id)) continue;
      if (this.sessions.size >= this.options.maxSessions) {
        this.logger.warn({ sessionId: id }, 'Cannot recover session: at capacity');
        break;
      }

      try {
        const session = new TmuxSession({
          claudePath: this.options.claudePath,
          sessionId: id,
          logger: this.logger,
        });

        this.setupSessionEvents(id, session);
        await session.reattach();

        this.sessions.set(id, session);
        recovered.push(id);

        this.logger.info({ sessionId: id }, 'Recovered orphan tmux session');
        this.emit('sessionRecovered', { sessionId: id });
      } catch (error) {
        this.logger.error({ err: error, sessionId: id }, 'Failed to recover session');
      }
    }

    return recovered;
  }

  // ── Private ───────────────────────────────────────

  private setupSessionEvents(id: string, session: TmuxSession, _config?: SessionConfig): void {
    session.on('output', (data: SessionOutput) => {
      this.emit('output', data);
    });

    session.on('status', (data: { sessionId: string; status: SessionStatus }) => {
      this.emit('status', { sessionId: id, status: data.status });
    });

    session.on('exit', (data: { sessionId: string; exitCode: number }) => {
      this.logger.info({ sessionId: id, exitCode: data.exitCode }, `Session ${id} exited`);
      this.sessions.delete(id);
      this.sessionConfigs.delete(id);
      this.emit('sessionEnded', { sessionId: id, exitCode: data.exitCode });
    });
  }
}
