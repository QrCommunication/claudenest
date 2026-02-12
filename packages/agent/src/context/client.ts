/**
 * Context client for syncing with ClaudeNest server
 */

import { EventEmitter } from 'events';
import type { Logger } from '../utils/logger.js';
import type { 
  ContextChunk, 
  ContextQuery, 
  ContextUpdate, 
  ProjectContext,
  Task,
  FileLock 
} from '../types/index.js';

interface ContextClientOptions {
  serverUrl: string;
  token: string;
  machineId: string;
  cachePath?: string;
  logger: Logger;
}

interface ContextCache {
  projects: Map<string, ProjectContext>;
  chunks: Map<string, ContextChunk>;
  tasks: Map<string, Task>;
  locks: Map<string, FileLock>;
  lastSync: number;
}

export class ContextClient extends EventEmitter {
  private options: ContextClientOptions;
  private logger: Logger;
  private cache: ContextCache;
  private syncQueue: ContextUpdate[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(options: ContextClientOptions) {
    super();
    this.options = options;
    this.logger = options.logger.child({ component: 'ContextClient' });
    
    this.cache = {
      projects: new Map(),
      chunks: new Map(),
      tasks: new Map(),
      locks: new Map(),
      lastSync: 0,
    };
  }

  /**
   * Initialize the context client
   */
  async initialize(): Promise<void> {
    this.logger.info({}, 'Initializing context client');

    // Load cache if exists
    await this.loadCache();

    // Start periodic sync
    this.startPeriodicSync();
  }

  /**
   * Query context from the server
   */
  async queryContext(query: ContextQuery): Promise<ContextChunk[]> {
    this.logger.debug({ query }, 'Querying context');

    try {
      const response = await this.fetchApi(`/projects/${query.projectId}/context`, {
        method: 'POST',
        body: JSON.stringify({
          query: query.query,
          limit: query.limit || 10,
          type: query.type,
          instance_id: query.instanceId,
        }),
      });

      const chunks = response.data as ContextChunk[];
      
      // Update cache
      for (const chunk of chunks) {
        this.cache.chunks.set(chunk.id, chunk);
      }

      return chunks;
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to query context');

      // Fall back to local cache
      return this.queryLocalCache(query);
    }
  }

  /**
   * Update context on the server
   */
  async updateContext(update: ContextUpdate): Promise<ContextChunk> {
    this.logger.debug({ update }, 'Updating context');

    // Add to sync queue
    this.syncQueue.push(update);

    // Try immediate sync
    this.sync().catch(error => {
      this.logger.error({ err: error }, 'Immediate sync failed, queued for later');
    });

    // Create local chunk immediately
    const chunk: ContextChunk = {
      id: `local-${Date.now()}`,
      content: update.content,
      type: update.type,
      projectId: update.projectId,
      files: update.files || [],
      importanceScore: update.importanceScore || 0.5,
      createdAt: new Date(),
    };

    this.cache.chunks.set(chunk.id, chunk);
    
    return chunk;
  }

  /**
   * Get project context
   */
  async getProjectContext(projectId: string): Promise<ProjectContext | null> {
    // Check cache first
    const cached = this.cache.projects.get(projectId);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchApi(`/projects/${projectId}`);
      const context = response.data as ProjectContext;
      
      this.cache.projects.set(projectId, context);
      
      return context;
    } catch (error) {
      this.logger.error({ err: error, projectId }, 'Failed to get project context');
      return null;
    }
  }

  /**
   * Update project context
   */
  async updateProjectContext(
    projectId: string, 
    updates: Partial<Omit<ProjectContext, 'projectId'>>
  ): Promise<ProjectContext> {
    try {
      const response = await this.fetchApi(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      const context = response.data as ProjectContext;
      this.cache.projects.set(projectId, context);

      this.emit('projectUpdated', { projectId });
      
      return context;
    } catch (error) {
      this.logger.error({ err: error, projectId }, 'Failed to update project context');
      throw error;
    }
  }

  /**
   * Get tasks for a project
   */
  async getTasks(projectId: string): Promise<Task[]> {
    try {
      const response = await this.fetchApi(`/projects/${projectId}/tasks`);
      const tasks = response.data as Task[];
      
      for (const task of tasks) {
        this.cache.tasks.set(task.id, task);
      }
      
      return tasks;
    } catch (error) {
      this.logger.error({ err: error, projectId }, 'Failed to get tasks');

      // Return cached tasks
      return Array.from(this.cache.tasks.values())
        .filter(t => t.projectId === projectId);
    }
  }

  /**
   * Claim a task
   */
  async claimTask(taskId: string, instanceId: string): Promise<Task> {
    try {
      const response = await this.fetchApi(`/tasks/${taskId}/claim`, {
        method: 'POST',
        body: JSON.stringify({ assigned_to: instanceId }),
      });

      const task = response.data as Task;
      this.cache.tasks.set(taskId, task);
      
      this.emit('taskClaimed', task);
      
      return task;
    } catch (error) {
      this.logger.error({ err: error, taskId }, 'Failed to claim task');
      throw error;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(
    taskId: string, 
    summary: string, 
    filesModified: string[]
  ): Promise<Task> {
    try {
      const response = await this.fetchApi(`/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          completion_summary: summary,
          files_modified: filesModified,
        }),
      });

      const task = response.data as Task;
      this.cache.tasks.set(taskId, task);
      
      // Also update context with completion
      await this.updateContext({
        projectId: task.projectId,
        content: `Task completed: ${task.title}\n${summary}`,
        type: 'task_completion',
        files: filesModified,
        importanceScore: 0.8,
      });
      
      this.emit('taskCompleted', task);

      return task;
    } catch (error) {
      this.logger.error({ err: error, taskId }, 'Failed to complete task');
      throw error;
    }
  }

  /**
   * Get file locks for a project
   */
  async getFileLocks(projectId: string): Promise<FileLock[]> {
    try {
      const response = await this.fetchApi(`/projects/${projectId}/locks`);
      const locks = response.data as FileLock[];
      
      for (const lock of locks) {
        this.cache.locks.set(lock.path, lock);
      }
      
      return locks;
    } catch (error) {
      this.logger.error({ err: error, projectId }, 'Failed to get file locks');

      // Return cached locks
      return Array.from(this.cache.locks.values())
        .filter(l => l.projectId === projectId);
    }
  }

  /**
   * Lock a file
   */
  async lockFile(
    projectId: string, 
    filePath: string, 
    instanceId: string,
    reason?: string,
    durationMinutes = 30
  ): Promise<FileLock> {
    try {
      const response = await this.fetchApi(`/projects/${projectId}/locks`, {
        method: 'POST',
        body: JSON.stringify({
          path: filePath,
          locked_by: instanceId,
          reason,
          expires_at: new Date(Date.now() + durationMinutes * 60000).toISOString(),
        }),
      });

      const lock = response.data as FileLock;
      this.cache.locks.set(filePath, lock);
      
      this.emit('fileLocked', lock);

      return lock;
    } catch (error) {
      this.logger.error({ err: error, projectId, filePath }, 'Failed to lock file');
      throw error;
    }
  }

  /**
   * Unlock a file
   */
  async unlockFile(projectId: string, filePath: string): Promise<void> {
    try {
      await this.fetchApi(`/projects/${projectId}/locks/${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      this.cache.locks.delete(filePath);

      this.emit('fileUnlocked', { projectId, path: filePath });
    } catch (error) {
      this.logger.error({ err: error, projectId, filePath }, 'Failed to unlock file');
      throw error;
    }
  }

  /**
   * Check if a file is locked
   */
  isFileLocked(projectId: string, filePath: string): FileLock | undefined {
    return Array.from(this.cache.locks.values()).find(
      l => l.projectId === projectId && l.path === filePath
    );
  }

  /**
   * Broadcast a message to all instances in a project
   */
  async broadcast(projectId: string, message: string, instanceId?: string): Promise<void> {
    try {
      await this.fetchApi(`/projects/${projectId}/broadcast`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          instance_id: instanceId,
        }),
      });

      // Also add to local context
      await this.updateContext({
        projectId,
        content: `Broadcast: ${message}`,
        type: 'broadcast',
        importanceScore: 0.7,
      });
    } catch (error) {
      this.logger.error({ err: error, projectId }, 'Failed to broadcast');
      throw error;
    }
  }

  /**
   * Manual sync with server
   */
  async sync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const updates = [...this.syncQueue];
    this.syncQueue = [];

    try {
      this.logger.debug({ updateCount: updates.length }, `Syncing ${updates.length} context updates`);

      await this.fetchApi('/context/batch', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });

      this.cache.lastSync = Date.now();
      this.emit('synced');

      this.logger.debug({}, 'Context sync completed');
    } catch (error) {
      this.logger.error({ err: error }, 'Context sync failed');

      // Put updates back in queue
      this.syncQueue.unshift(...updates);

      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force full sync - pull all data from server
   */
  async fullSync(): Promise<void> {
    this.logger.info({}, 'Performing full sync');

    try {
      // Sync pending updates first
      await this.sync();
      
      // Clear cache
      this.cache.projects.clear();
      this.cache.chunks.clear();
      this.cache.tasks.clear();
      this.cache.locks.clear();
      
      // TODO: Implement full sync endpoint
      this.cache.lastSync = Date.now();

      this.emit('fullSync');
    } catch (error) {
      this.logger.error({ err: error }, 'Full sync failed');
      throw error;
    }
  }

  /**
   * Stop the context client
   */
  async stop(): Promise<void> {
    this.logger.info({}, 'Stopping context client');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Final sync attempt
    try {
      await this.sync();
    } catch (error) {
      this.logger.error({ err: error }, 'Final sync failed');
    }

    // Save cache
    await this.saveCache();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    pendingUpdates: number;
    lastSync: number;
    isSyncing: boolean;
  } {
    return {
      pendingUpdates: this.syncQueue.length,
      lastSync: this.cache.lastSync,
      isSyncing: this.isSyncing,
    };
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}): Promise<{ data: unknown }> {
    const url = `${this.options.serverUrl}/api${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.token}`,
        'X-Machine-ID': this.options.machineId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<{ data: unknown }>;
  }

  private queryLocalCache(query: ContextQuery): ContextChunk[] {
    this.logger.debug({}, 'Querying local cache');

    const chunks = Array.from(this.cache.chunks.values())
      .filter(c => c.projectId === query.projectId);

    if (query.type) {
      return chunks.filter(c => c.type === query.type).slice(0, query.limit || 10);
    }

    // Simple keyword matching for local search
    if (query.query) {
      const keywords = query.query.toLowerCase().split(' ');
      return chunks
        .filter(c => keywords.some(kw => c.content.toLowerCase().includes(kw)))
        .slice(0, query.limit || 10);
    }

    return chunks.slice(0, query.limit || 10);
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      this.sync().catch(error => {
        this.logger.error({ err: error }, 'Periodic sync failed');
      });
    }, 30000); // Sync every 30 seconds
  }

  private async loadCache(): Promise<void> {
    if (!this.options.cachePath) return;

    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.options.cachePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Restore cache
      if (parsed.projects) {
        for (const [id, project] of Object.entries(parsed.projects)) {
          this.cache.projects.set(id, project as ProjectContext);
        }
      }
      
      this.cache.lastSync = parsed.lastSync || 0;

      this.logger.debug({}, 'Cache loaded');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error({ err: error }, 'Failed to load cache');
      }
    }
  }

  private async saveCache(): Promise<void> {
    if (!this.options.cachePath) return;

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      await fs.mkdir(path.dirname(this.options.cachePath), { recursive: true });

      const data = {
        projects: Object.fromEntries(this.cache.projects),
        lastSync: this.cache.lastSync,
      };

      await fs.writeFile(this.options.cachePath, JSON.stringify(data, null, 2));

      this.logger.debug({}, 'Cache saved');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to save cache');
    }
  }
}
