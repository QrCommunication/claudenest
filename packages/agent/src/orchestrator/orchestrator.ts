/**
 * Orchestrator — Manages a pool of Worker instances for multi-agent task execution.
 * Auto-scales workers based on pending task count:
 *   1-3 tasks → 1 worker, 4-8 → 2, 9+ → ceil(n/3)
 */

import { EventEmitter } from 'events';
import { Worker } from './worker.js';
import type { SessionManager } from '../sessions/manager.js';
import type { ContextClient } from '../context/client.js';
import type { WebSocketClient } from '../websocket/client.js';
import type {
  Logger,
  OrchestratorConfig,
  OrchestratorState,
  OrchestratorStatus,
  WorkerResult,
} from '../types/index.js';
import { generateId } from '../utils/index.js';

interface OrchestratorOptions {
  sessionManager: SessionManager;
  contextClient: ContextClient;
  wsClient: WebSocketClient;
  logger: Logger;
}

export class Orchestrator extends EventEmitter {
  private sessionManager: SessionManager;
  private contextClient: ContextClient;
  private wsClient: WebSocketClient;
  private logger: Logger;

  private config: OrchestratorConfig | null = null;
  private workers = new Map<string, Worker>();
  private status: OrchestratorStatus = 'idle';
  private pollTimer: NodeJS.Timeout | null = null;
  private scaleTimer: NodeJS.Timeout | null = null;
  private completedTasks = 0;
  private startedAt: Date | null = null;

  constructor(options: OrchestratorOptions) {
    super();
    this.sessionManager = options.sessionManager;
    this.contextClient = options.contextClient;
    this.wsClient = options.wsClient;
    this.logger = options.logger.child({ component: 'Orchestrator' });
  }

  /**
   * Start orchestration for a project.
   */
  async start(config: OrchestratorConfig): Promise<void> {
    if (this.status === 'running') {
      throw new Error('Orchestrator is already running');
    }

    this.config = config;
    this.status = 'running';
    this.startedAt = new Date();
    this.completedTasks = 0;

    this.logger.info({
      projectId: config.projectId,
      minWorkers: config.minWorkers,
      maxWorkers: config.maxWorkers,
    }, 'Starting orchestrator');

    // Spawn minimum workers
    for (let i = 0; i < config.minWorkers; i++) {
      await this.spawnWorker();
    }

    // Start polling for tasks
    this.startPolling();

    // Start auto-scale check
    if (config.autoScale) {
      this.startAutoScale();
    }

    this.wsClient.send('orchestrator:started', {
      projectId: config.projectId,
      workers: this.workers.size,
    });

    this.emit('started', { projectId: config.projectId });
  }

  /**
   * Stop orchestration: drain workers gracefully.
   */
  async stop(): Promise<void> {
    if (this.status !== 'running') return;

    this.status = 'stopping';
    this.logger.info('Stopping orchestrator');

    this.stopPolling();
    this.stopAutoScale();

    // Stop all workers
    const stops = Array.from(this.workers.values()).map(w => w.stop());
    await Promise.allSettled(stops);
    this.workers.clear();

    this.status = 'stopped';

    this.wsClient.send('orchestrator:stopped', {
      projectId: this.config?.projectId,
      completedTasks: this.completedTasks,
    });

    this.emit('stopped');
    this.logger.info({ completedTasks: this.completedTasks }, 'Orchestrator stopped');
  }

  /**
   * Get current orchestrator state.
   */
  getState(): OrchestratorState {
    return {
      status: this.status,
      projectId: this.config?.projectId || '',
      workers: Array.from(this.workers.values()).map(w => w.getInfo()),
      pendingTasks: 0, // Updated on poll
      completedTasks: this.completedTasks,
      startedAt: this.startedAt || undefined,
    };
  }

  /**
   * Manually set desired worker count.
   */
  async scaleTo(count: number): Promise<void> {
    if (!this.config) return;

    const clamped = Math.max(
      this.config.minWorkers,
      Math.min(count, this.config.maxWorkers),
    );

    this.logger.info({ current: this.workers.size, target: clamped }, 'Scaling workers');

    if (clamped > this.workers.size) {
      const toSpawn = clamped - this.workers.size;
      for (let i = 0; i < toSpawn; i++) {
        await this.spawnWorker();
      }
    } else if (clamped < this.workers.size) {
      await this.shrinkTo(clamped);
    }
  }

  /**
   * Get active worker count.
   */
  getWorkerCount(): number {
    return this.workers.size;
  }

  isRunning(): boolean {
    return this.status === 'running';
  }

  // ── Private: Worker management ──────────────────────

  private async spawnWorker(): Promise<Worker> {
    if (!this.config) throw new Error('Orchestrator not configured');

    // Check session capacity
    const available = this.sessionManager.getAvailableSlots();
    if (available <= 0) {
      this.logger.warn('No session slots available, cannot spawn worker');
      throw new Error('No session slots available');
    }

    const workerId = generateId();
    const worker = new Worker({
      id: workerId,
      projectId: this.config.projectId,
      projectPath: this.config.projectPath,
      sessionManager: this.sessionManager,
      contextClient: this.contextClient,
      logger: this.logger,
    });

    this.setupWorkerEvents(worker);
    this.workers.set(workerId, worker);

    await worker.start();

    this.wsClient.send('orchestrator:worker_spawned', {
      workerId,
      projectId: this.config.projectId,
      totalWorkers: this.workers.size,
    });

    this.emit('workerSpawned', { workerId });
    return worker;
  }

  private setupWorkerEvents(worker: Worker): void {
    worker.on('taskCompleted', (result: WorkerResult) => {
      this.completedTasks++;
      this.logger.info({
        workerId: result.workerId,
        taskId: result.taskId,
        success: result.success,
      }, 'Worker completed task');

      this.wsClient.send('orchestrator:task_completed', result);
      this.emit('taskCompleted', result);

      // Feed idle worker with next task
      if (this.status === 'running') {
        this.assignNextTask(worker).catch(err => {
          this.logger.error({ err }, 'Failed to assign next task after completion');
        });
      }
    });

    worker.on('taskFailed', (result: WorkerResult) => {
      this.logger.warn({
        workerId: result.workerId,
        taskId: result.taskId,
        error: result.error,
      }, 'Worker task failed');

      this.wsClient.send('orchestrator:error', {
        type: 'task_failed',
        ...result,
      });

      // Still try to assign next task
      if (this.status === 'running') {
        this.assignNextTask(worker).catch(err => {
          this.logger.error({ err }, 'Failed to assign next task after failure');
        });
      }
    });

    worker.on('exited', (data: { workerId: string; tasksCompleted: number }) => {
      this.workers.delete(data.workerId);
      this.logger.info(data, 'Worker exited');

      this.wsClient.send('orchestrator:worker_exited', {
        ...data,
        remainingWorkers: this.workers.size,
      });

      this.emit('workerExited', data);
    });

    worker.on('error', (error: Error) => {
      this.logger.error({ err: error, workerId: worker.id }, 'Worker error');
    });
  }

  private async shrinkTo(target: number): Promise<void> {
    // Remove idle workers first
    const idleWorkers = Array.from(this.workers.values())
      .filter(w => w.isIdle())
      .sort((a, b) => b.getIdleTime() - a.getIdleTime()); // longest idle first

    let removed = 0;
    for (const worker of idleWorkers) {
      if (this.workers.size <= target) break;
      await worker.stop();
      this.workers.delete(worker.id);
      removed++;
    }

    this.logger.info({ removed, currentSize: this.workers.size }, 'Shrunk worker pool');
  }

  // ── Private: Task polling ───────────────────────────

  private startPolling(): void {
    if (!this.config) return;

    this.pollTimer = setInterval(() => {
      this.pollAndAssign().catch(err => {
        this.logger.error({ err }, 'Poll cycle failed');
      });
    }, this.config.pollIntervalMs);

    // Immediate first poll
    this.pollAndAssign().catch(err => {
      this.logger.error({ err }, 'Initial poll failed');
    });
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollAndAssign(): Promise<void> {
    if (this.status !== 'running' || !this.config) return;

    // Find idle workers
    const idleWorkers = Array.from(this.workers.values()).filter(w => w.isIdle());
    if (idleWorkers.length === 0) return;

    // Assign tasks to each idle worker
    for (const worker of idleWorkers) {
      await this.assignNextTask(worker);
    }
  }

  private async assignNextTask(worker: Worker): Promise<void> {
    if (!this.config || !worker.isIdle()) return;

    try {
      // Fetch available tasks from server
      const tasks = await this.contextClient.getTasks(this.config.projectId);
      const pendingTasks = tasks.filter(t => t.status === 'pending');

      if (pendingTasks.length === 0) return;

      // Pick highest priority task
      const sorted = pendingTasks.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      });

      const task = sorted[0];

      // Claim it
      const claimed = await this.contextClient.claimTask(task.id, `worker-${worker.id}`);

      this.logger.info({
        workerId: worker.id,
        taskId: claimed.id,
        title: claimed.title,
      }, 'Assigned task to worker');

      this.wsClient.send('orchestrator:task_claimed', {
        workerId: worker.id,
        taskId: claimed.id,
        title: claimed.title,
      });

      // Execute (fire and forget — worker events handle result)
      worker.executeTask(claimed).catch(err => {
        this.logger.error({ err, taskId: claimed.id }, 'Task execution error');
      });
    } catch (error) {
      // No tasks or claim failed — worker stays idle
      this.logger.debug({ err: error, workerId: worker.id }, 'No task assigned');
    }
  }

  // ── Private: Auto-scaling ───────────────────────────

  private startAutoScale(): void {
    if (!this.config) return;

    // Check every 30s
    this.scaleTimer = setInterval(() => {
      this.autoScaleCheck().catch(err => {
        this.logger.error({ err }, 'Auto-scale check failed');
      });
    }, 30_000);
  }

  private stopAutoScale(): void {
    if (this.scaleTimer) {
      clearInterval(this.scaleTimer);
      this.scaleTimer = null;
    }
  }

  private async autoScaleCheck(): Promise<void> {
    if (!this.config || this.status !== 'running') return;

    try {
      const tasks = await this.contextClient.getTasks(this.config.projectId);
      const pendingCount = tasks.filter(t => t.status === 'pending').length;
      const desired = this.calculateDesiredWorkers(pendingCount);

      if (desired !== this.workers.size) {
        this.logger.info({
          pendingTasks: pendingCount,
          currentWorkers: this.workers.size,
          desiredWorkers: desired,
        }, 'Auto-scaling');

        await this.scaleTo(desired);
      }

      // Also terminate idle workers past timeout
      await this.reapIdleWorkers();
    } catch (error) {
      this.logger.error({ err: error }, 'Auto-scale failed');
    }
  }

  /**
   * Auto-scaling formula:
   *   0 tasks → minWorkers
   *   1-3 tasks → 1 worker
   *   4-8 tasks → 2 workers
   *   9+ tasks → ceil(n / 3)
   */
  private calculateDesiredWorkers(pendingTasks: number): number {
    if (!this.config) return 0;

    let desired: number;
    if (pendingTasks === 0) {
      desired = this.config.minWorkers;
    } else if (pendingTasks <= 3) {
      desired = 1;
    } else if (pendingTasks <= 8) {
      desired = 2;
    } else {
      desired = Math.ceil(pendingTasks / 3);
    }

    return Math.max(this.config.minWorkers, Math.min(desired, this.config.maxWorkers));
  }

  private async reapIdleWorkers(): Promise<void> {
    if (!this.config) return;

    const idleTimeout = this.config.workerIdleTimeoutMs;
    const toReap = Array.from(this.workers.values()).filter(
      w => w.isIdle() && w.getIdleTime() > idleTimeout,
    );

    // Keep at least minWorkers
    const canRemove = Math.max(0, this.workers.size - this.config.minWorkers);
    const toRemove = toReap.slice(0, canRemove);

    for (const worker of toRemove) {
      this.logger.info({ workerId: worker.id, idleMs: worker.getIdleTime() }, 'Reaping idle worker');
      await worker.stop();
      this.workers.delete(worker.id);
    }
  }
}
