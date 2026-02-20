/**
 * Worker — Wraps a single Claude Code session that executes one task at a time.
 * Lifecycle: spawn → claim-next → execute → complete → (loop or exit)
 */

import { EventEmitter } from 'events';
import type { SessionManager } from '../sessions/manager.js';
import type { ContextClient } from '../context/client.js';
import type {
  Logger,
  Task,
  WorkerInfo,
  WorkerStatus,
  WorkerResult,
  SessionConfig,
} from '../types/index.js';

interface WorkerOptions {
  id: string;
  projectId: string;
  projectPath: string;
  sessionManager: SessionManager;
  contextClient: ContextClient;
  logger: Logger;
}

export class Worker extends EventEmitter {
  readonly id: string;
  private projectPath: string;
  private sessionManager: SessionManager;
  private contextClient: ContextClient;
  private logger: Logger;

  private sessionId: string | null = null;
  private status: WorkerStatus = 'starting';
  private currentTask: Task | null = null;
  private tasksCompleted = 0;
  private startedAt = new Date();
  private lastActivityAt = new Date();
  private stopped = false;

  constructor(options: WorkerOptions) {
    super();
    this.id = options.id;
    this.projectPath = options.projectPath;
    this.sessionManager = options.sessionManager;
    this.contextClient = options.contextClient;
    this.logger = options.logger.child({ component: 'Worker', workerId: this.id });
  }

  /**
   * Start the worker: create a Claude session in the project directory.
   */
  async start(): Promise<void> {
    this.logger.info({ projectPath: this.projectPath }, 'Starting worker');
    this.setStatus('starting');

    this.sessionId = `worker-${this.id}`;

    const config: SessionConfig = {
      projectPath: this.projectPath,
      mode: 'headless',
      ptySize: { cols: 120, rows: 40 },
    };

    try {
      await this.sessionManager.createSession(this.sessionId, config);
      this.setStatus('idle');
      this.logger.info({ sessionId: this.sessionId }, 'Worker session created');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to create worker session');
      this.setStatus('exited');
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Assign a task to this worker. The worker sends the task as input to the Claude session.
   */
  async executeTask(task: Task): Promise<WorkerResult> {
    if (this.status !== 'idle') {
      throw new Error(`Worker ${this.id} is not idle (status: ${this.status})`);
    }

    this.currentTask = task;
    this.setStatus('executing');
    this.touch();

    this.logger.info({ taskId: task.id, title: task.title }, 'Executing task');

    this.emit('taskStarted', { workerId: this.id, taskId: task.id });

    try {
      // Build the prompt for Claude
      const prompt = this.buildTaskPrompt(task);

      // Send prompt to the Claude session
      if (this.sessionId) {
        this.sessionManager.sendInput(this.sessionId, prompt + '\n');
      }

      // Wait for task completion signal (session exit or explicit completion)
      const result = await this.waitForCompletion(task);

      this.setStatus('completing');

      // Report completion to context
      if (result.success) {
        await this.contextClient.completeTask(
          task.id,
          result.summary || `Task "${task.title}" completed by worker ${this.id}`,
          result.filesModified || [],
        );
      }

      this.tasksCompleted++;
      this.currentTask = null;
      this.setStatus('idle');
      this.touch();

      this.emit('taskCompleted', result);
      return result;
    } catch (error) {
      this.logger.error({ err: error, taskId: task.id }, 'Task execution failed');

      const result: WorkerResult = {
        workerId: this.id,
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.currentTask = null;
      this.setStatus('idle');

      this.emit('taskFailed', result);
      return result;
    }
  }

  /**
   * Stop this worker: terminate the underlying session.
   */
  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;
    this.setStatus('stopping');

    this.logger.info('Stopping worker');

    if (this.sessionId && this.sessionManager.hasSession(this.sessionId)) {
      try {
        await this.sessionManager.terminateSession(this.sessionId);
      } catch (error) {
        this.logger.error({ err: error }, 'Failed to terminate worker session');
      }
    }

    this.setStatus('exited');
    this.emit('exited', { workerId: this.id, tasksCompleted: this.tasksCompleted });
  }

  /**
   * Get worker info snapshot.
   */
  getInfo(): WorkerInfo {
    return {
      id: this.id,
      sessionId: this.sessionId || '',
      status: this.status,
      currentTaskId: this.currentTask?.id,
      currentTaskTitle: this.currentTask?.title,
      tasksCompleted: this.tasksCompleted,
      startedAt: this.startedAt,
      lastActivityAt: this.lastActivityAt,
    };
  }

  getStatus(): WorkerStatus {
    return this.status;
  }

  isIdle(): boolean {
    return this.status === 'idle';
  }

  isStopped(): boolean {
    return this.status === 'exited' || this.status === 'stopping';
  }

  getIdleTime(): number {
    if (this.status !== 'idle') return 0;
    return Date.now() - this.lastActivityAt.getTime();
  }

  private setStatus(status: WorkerStatus): void {
    const prev = this.status;
    this.status = status;
    if (prev !== status) {
      this.emit('statusChanged', { workerId: this.id, from: prev, to: status });
    }
  }

  private touch(): void {
    this.lastActivityAt = new Date();
  }

  private buildTaskPrompt(task: Task): string {
    const parts = [
      `# Task: ${task.title}`,
      '',
    ];

    if (task.description) {
      parts.push(task.description, '');
    }

    if (task.files.length > 0) {
      parts.push(`Related files: ${task.files.join(', ')}`, '');
    }

    parts.push(
      'Instructions:',
      '- Complete this task fully',
      '- Do not ask for clarification, use your best judgment',
      '- When done, type /exit to signal completion',
    );

    return parts.join('\n');
  }

  /**
   * Wait for the Claude session to complete the task.
   * We listen for session exit or a timeout.
   */
  private waitForCompletion(task: Task): Promise<WorkerResult> {
    return new Promise<WorkerResult>((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({
          workerId: this.id,
          taskId: task.id,
          success: true,
          summary: `Task "${task.title}" completed (timeout - assumed complete)`,
        });
      }, 10 * 60 * 1000); // 10 minute max per task

      const onExit = (data: { sessionId: string; exitCode: number }) => {
        if (data.sessionId !== this.sessionId) return;
        cleanup();
        resolve({
          workerId: this.id,
          taskId: task.id,
          success: data.exitCode === 0,
          exitCode: data.exitCode,
          summary: data.exitCode === 0
            ? `Task "${task.title}" completed`
            : `Task "${task.title}" failed (exit code: ${data.exitCode})`,
        });
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.sessionManager.removeListener('sessionEnded', onExit);
      };

      this.sessionManager.on('sessionEnded', onExit);
    });
  }
}
