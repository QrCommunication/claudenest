/**
 * Context and task message handlers
 */

import type { ContextClient } from '../context/client.js';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import type { ContextQuery, ContextUpdate } from '../types/index.js';

interface HandlerContext {
  contextClient: ContextClient;
  wsClient: WebSocketClient;
  logger: Logger;
  instanceId: string;
}

export function createContextHandlers(context: HandlerContext) {
  const { contextClient, wsClient, logger, instanceId } = context;

  /**
   * Handle context:get
   */
  async function handleContextGet(payload: {
    projectId: string;
    query: string;
    limit?: number;
  }): Promise<void> {
    logger.debug({ projectId: payload.projectId }, 'Handling context:get');

    try {
      const query: ContextQuery = {
        projectId: payload.projectId,
        query: payload.query,
        limit: payload.limit || 10,
        instanceId,
      };

      const chunks = await contextClient.queryContext(query);

      wsClient.send('context:result', {
        projectId: payload.projectId,
        query: payload.query,
        count: chunks.length,
        chunks: chunks.map(c => ({
          id: c.id,
          type: c.type,
          content: c.content,
          files: c.files,
          importanceScore: c.importanceScore,
          createdAt: c.createdAt,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get context');
      wsClient.send('error', {
        originalType: 'context:get',
        projectId: payload.projectId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle context:update
   */
  async function handleContextUpdate(payload: {
    projectId: string;
    content: string;
    type: ContextUpdate['type'];
    files?: string[];
    importanceScore?: number;
  }): Promise<void> {
    logger.debug({ projectId: payload.projectId }, 'Handling context:update');

    try {
      const update: ContextUpdate = {
        projectId: payload.projectId,
        content: payload.content,
        type: payload.type,
        files: payload.files,
        importanceScore: payload.importanceScore,
      };

      const chunk = await contextClient.updateContext(update);

      wsClient.send('context:sync', {
        projectId: payload.projectId,
        chunkId: chunk.id,
        type: chunk.type,
        status: 'pending',
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to update context');
      wsClient.send('error', {
        originalType: 'context:update',
        projectId: payload.projectId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle context:get_project
   */
  async function handleGetProjectContext(payload: {
    projectId: string;
  }): Promise<void> {
    logger.debug({ projectId: payload.projectId }, 'Handling context:get_project');

    try {
      const projectContext = await contextClient.getProjectContext(payload.projectId);

      if (!projectContext) {
        wsClient.send('error', {
          originalType: 'context:get_project',
          code: 'PROJECT_NOT_FOUND',
          projectId: payload.projectId,
          message: `Project ${payload.projectId} not found`,
        });
        return;
      }

      wsClient.send('context:project', {
        projectId: payload.projectId,
        context: projectContext,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get project context');
      wsClient.send('error', {
        originalType: 'context:get_project',
        projectId: payload.projectId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle context:update_project
   */
  async function handleUpdateProjectContext(payload: {
    projectId: string;
    updates: {
      summary?: string;
      architecture?: string;
      conventions?: string;
      currentFocus?: string;
      recentChanges?: string;
    };
  }): Promise<void> {
    logger.debug({ projectId: payload.projectId }, 'Handling context:update_project');

    try {
      const updated = await contextClient.updateProjectContext(
        payload.projectId,
        payload.updates
      );

      wsClient.send('context:project_updated', {
        projectId: payload.projectId,
        context: updated,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to update project context');
      wsClient.send('error', {
        originalType: 'context:update_project',
        projectId: payload.projectId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle tasks:list
   */
  async function handleListTasks(payload: {
    projectId: string;
  }): Promise<void> {
    logger.debug({ projectId: payload.projectId }, 'Handling tasks:list');

    try {
      const tasks = await contextClient.getTasks(payload.projectId);

      wsClient.send('tasks:list', {
        projectId: payload.projectId,
        count: tasks.length,
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          assignedTo: t.assignedTo,
          files: t.files,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to list tasks');
      wsClient.send('error', {
        originalType: 'tasks:list',
        projectId: payload.projectId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle task:claim
   */
  async function handleTaskClaim(payload: {
    taskId: string;
  }): Promise<void> {
    logger.debug({ taskId: payload.taskId }, 'Handling task:claim');

    try {
      const task = await contextClient.claimTask(payload.taskId, instanceId);

      wsClient.send('task:update', {
        taskId: task.id,
        status: task.status,
        assignedTo: task.assignedTo,
        claimedAt: task.claimedAt,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to claim task');
      wsClient.send('error', {
        originalType: 'task:claim',
        taskId: payload.taskId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle task:complete
   */
  async function handleTaskComplete(payload: {
    taskId: string;
    summary: string;
    filesModified: string[];
  }): Promise<void> {
    logger.debug({ taskId: payload.taskId }, 'Handling task:complete');

    try {
      const task = await contextClient.completeTask(
        payload.taskId,
        payload.summary,
        payload.filesModified
      );

      wsClient.send('task:update', {
        taskId: task.id,
        status: task.status,
        completedAt: task.completedAt,
        completionSummary: task.completionSummary,
        filesModified: task.filesModified,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to complete task');
      wsClient.send('error', {
        originalType: 'task:complete',
        taskId: payload.taskId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle file:lock
   */
  async function handleFileLock(payload: {
    projectId: string;
    path: string;
    reason?: string;
    durationMinutes?: number;
  }): Promise<void> {
    logger.debug({
      projectId: payload.projectId,
      path: payload.path
    }, 'Handling file:lock');

    try {
      const lock = await contextClient.lockFile(
        payload.projectId,
        payload.path,
        instanceId,
        payload.reason,
        payload.durationMinutes
      );

      wsClient.send('file:lock_update', {
        projectId: payload.projectId,
        path: payload.path,
        locked: true,
        lockedBy: lock.lockedBy,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to lock file');
      wsClient.send('error', {
        originalType: 'file:lock',
        projectId: payload.projectId,
        path: payload.path,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle file:unlock
   */
  async function handleFileUnlock(payload: {
    projectId: string;
    path: string;
  }): Promise<void> {
    logger.debug({
      projectId: payload.projectId,
      path: payload.path
    }, 'Handling file:unlock');

    try {
      await contextClient.unlockFile(payload.projectId, payload.path);

      wsClient.send('file:lock_update', {
        projectId: payload.projectId,
        path: payload.path,
        locked: false,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to unlock file');
      wsClient.send('error', {
        originalType: 'file:unlock',
        projectId: payload.projectId,
        path: payload.path,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle file:check_lock
   */
  async function handleCheckFileLock(payload: {
    projectId: string;
    path: string;
  }): Promise<void> {
    logger.debug({
      projectId: payload.projectId,
      path: payload.path
    }, 'Handling file:check_lock');

    try {
      const lock = contextClient.isFileLocked(payload.projectId, payload.path);

      wsClient.send('file:lock_status', {
        projectId: payload.projectId,
        path: payload.path,
        locked: !!lock,
        lock: lock ? {
          lockedBy: lock.lockedBy,
          reason: lock.reason,
          lockedAt: lock.lockedAt,
          expiresAt: lock.expiresAt,
        } : null,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to check file lock');
      wsClient.send('error', {
        originalType: 'file:check_lock',
        projectId: payload.projectId,
        path: payload.path,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle broadcast
   */
  async function handleBroadcast(payload: {
    projectId: string;
    message: string;
  }): Promise<void> {
    logger.debug({ projectId: payload.projectId }, 'Handling broadcast');

    try {
      await contextClient.broadcast(payload.projectId, payload.message, instanceId);

      wsClient.send('broadcast:sent', {
        projectId: payload.projectId,
        message: payload.message,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to broadcast');
      wsClient.send('error', {
        originalType: 'broadcast',
        projectId: payload.projectId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    'context:get': handleContextGet,
    'context:update': handleContextUpdate,
    'context:get_project': handleGetProjectContext,
    'context:update_project': handleUpdateProjectContext,
    'tasks:list': handleListTasks,
    'task:claim': handleTaskClaim,
    'task:complete': handleTaskComplete,
    'file:lock': handleFileLock,
    'file:unlock': handleFileUnlock,
    'file:check_lock': handleCheckFileLock,
    'broadcast': handleBroadcast,
  };
}
