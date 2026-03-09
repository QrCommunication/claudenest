/**
 * FileWatcher — Monitors project directories for changes and emits context updates.
 * Uses Node.js native fs.watch with recursive option (Node 20+).
 */

import { EventEmitter } from 'events';
import { watch, type FSWatcher } from 'fs';
import { stat } from 'fs/promises';
import { join, relative, extname } from 'path';
import type { Logger } from '../utils/logger.js';

export interface FileChangeEvent {
  projectId: string;
  projectPath: string;
  filePath: string;
  relativePath: string;
  changeType: 'change' | 'rename';
}

interface FileWatcherOptions {
  logger: Logger;
  debounceMs?: number;
  ignorePatterns?: string[];
}

const DEFAULT_IGNORE = [
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build',
  '__pycache__', '.cache', '.turbo', 'vendor', 'storage',
  '.DS_Store', 'Thumbs.db',
];

const WATCHED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
  '.php', '.py', '.rb', '.go', '.rs', '.java',
  '.json', '.yaml', '.yml', '.toml',
  '.css', '.scss', '.less',
  '.md', '.txt',
  '.sql', '.graphql',
  '.env', '.env.local',
]);

export class FileWatcher extends EventEmitter {
  private watchers = new Map<string, FSWatcher>();
  private logger: Logger;
  private debounceMs: number;
  private ignorePatterns: string[];
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(options: FileWatcherOptions) {
    super();
    this.logger = options.logger.child({ component: 'FileWatcher' });
    this.debounceMs = options.debounceMs ?? 500;
    this.ignorePatterns = options.ignorePatterns ?? DEFAULT_IGNORE;
  }

  /**
   * Start watching a project directory.
   */
  watchProject(projectId: string, projectPath: string): void {
    if (this.watchers.has(projectId)) {
      this.logger.debug({ projectId }, 'Already watching project');
      return;
    }

    try {
      const watcher = watch(projectPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        this.handleChange(projectId, projectPath, filename, eventType as 'change' | 'rename');
      });

      watcher.on('error', (error) => {
        this.logger.error({ err: error, projectId }, 'Watcher error');
        this.unwatchProject(projectId);
      });

      this.watchers.set(projectId, watcher);
      this.logger.info({ projectId, projectPath }, 'Watching project directory');
    } catch (error) {
      this.logger.error({ err: error, projectId, projectPath }, 'Failed to watch project');
    }
  }

  /**
   * Stop watching a project directory.
   */
  unwatchProject(projectId: string): void {
    const watcher = this.watchers.get(projectId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(projectId);
      this.logger.info({ projectId }, 'Stopped watching project');
    }
  }

  /**
   * Stop all watchers.
   */
  async stop(): Promise<void> {
    for (const [projectId] of this.watchers) {
      this.unwatchProject(projectId);
    }
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  private handleChange(
    projectId: string,
    projectPath: string,
    filename: string,
    changeType: 'change' | 'rename',
  ): void {
    // Check ignore patterns
    if (this.shouldIgnore(filename)) return;

    // Check file extension
    const ext = extname(filename);
    if (ext && !WATCHED_EXTENSIONS.has(ext)) return;

    // Debounce per-file
    const key = `${projectId}:${filename}`;
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(key, setTimeout(async () => {
      this.debounceTimers.delete(key);

      const fullPath = join(projectPath, filename);

      // Verify the file exists (rename events fire for both create and delete)
      try {
        await stat(fullPath);
      } catch {
        // File was deleted — still emit event
      }

      const event: FileChangeEvent = {
        projectId,
        projectPath,
        filePath: fullPath,
        relativePath: relative(projectPath, fullPath),
        changeType,
      };

      this.emit('fileChanged', event);
    }, this.debounceMs));
  }

  private shouldIgnore(filename: string): boolean {
    const parts = filename.split('/');
    return parts.some(part => this.ignorePatterns.includes(part));
  }
}
