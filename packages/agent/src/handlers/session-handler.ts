/**
 * Session message handlers
 */

import type { SessionManager } from '../sessions/manager.js';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import type { SessionConfig } from '../types/index.js';

interface HandlerContext {
  sessionManager: SessionManager;
  wsClient: WebSocketClient;
  logger: Logger;
}

export function createSessionHandlers(context: HandlerContext) {
  const { sessionManager, wsClient, logger } = context;

  /**
   * Handle session:create
   * Backend sends flat fields (sessionId, mode, projectPath, etc.)
   * but we also support a nested config object for flexibility.
   */
  async function handleCreateSession(payload: {
    sessionId: string;
    config?: SessionConfig;
    mode?: string;
    projectPath?: string;
    initialPrompt?: string;
    ptySize?: { cols: number; rows: number };
    credentialEnv?: Record<string, string>;
    env?: Record<string, string>;
  }): Promise<void> {
    logger.debug({ sessionId: payload.sessionId }, 'Handling session:create');

    try {
      // Check capacity
      if (sessionManager.isAtCapacity()) {
        wsClient.send('error', {
          originalType: 'session:create',
          code: 'SESSION_CAPACITY_REACHED',
          message: `Maximum sessions (${sessionManager.getAvailableSlots()}) reached`,
        });
        return;
      }

      // Build config from nested config or flat payload fields
      const config: SessionConfig = payload.config || {
        mode: (payload.mode as SessionConfig['mode']) || 'interactive',
        projectPath: payload.projectPath,
        initialPrompt: payload.initialPrompt,
        ptySize: payload.ptySize,
        credentialEnv: payload.credentialEnv,
        env: payload.env,
      };

      const session = await sessionManager.createSession(
        payload.sessionId,
        config,
      );

      wsClient.send('session:status', {
        sessionId: session.id,
        status: session.status,
        pid: session.pid,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to create session');
      wsClient.send('error', {
        originalType: 'session:create',
        code: 'SESSION_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle session:terminate
   */
  async function handleTerminateSession(payload: {
    sessionId: string;
    force?: boolean;
  }): Promise<void> {
    logger.debug({ sessionId: payload.sessionId }, 'Handling session:terminate');

    try {
      await sessionManager.terminateSession(payload.sessionId, payload.force);
      
      wsClient.send('session:status', {
        sessionId: payload.sessionId,
        status: 'terminated',
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to terminate session');
      wsClient.send('error', {
        originalType: 'session:terminate',
        sessionId: payload.sessionId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle session:input
   */
  function handleSessionInput(payload: {
    sessionId: string;
    data: string;
  }): void {
    try {
      sessionManager.sendInput(payload.sessionId, payload.data);
    } catch (error) {
      logger.error({ err: error, sessionId: payload.sessionId }, 'Failed to send input');
      wsClient.send('error', {
        originalType: 'session:input',
        sessionId: payload.sessionId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle session:resize
   */
  function handleSessionResize(payload: { 
    sessionId: string; 
    cols: number;
    rows: number;
  }): void {
    try {
      sessionManager.resize(payload.sessionId, payload.cols, payload.rows);
      
      wsClient.send('session:status', {
        sessionId: payload.sessionId,
        ptySize: { cols: payload.cols, rows: payload.rows },
      });
    } catch (error) {
      logger.error({ err: error, sessionId: payload.sessionId }, 'Failed to resize session');
      wsClient.send('error', {
        originalType: 'session:resize',
        sessionId: payload.sessionId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle session:get_info
   */
  function handleGetSessionInfo(payload: { sessionId: string }): void {
    try {
      const info = sessionManager.getSessionInfo(payload.sessionId);
      
      if (!info) {
        wsClient.send('error', {
          originalType: 'session:get_info',
          sessionId: payload.sessionId,
          code: 'SESSION_NOT_FOUND',
          message: `Session ${payload.sessionId} not found`,
        });
        return;
      }

      wsClient.send('session:info', info);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get session info');
      wsClient.send('error', {
        originalType: 'session:get_info',
        sessionId: payload.sessionId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle session:list
   */
  function handleListSessions(): void {
    try {
      const sessions = sessionManager.getAllSessions();
      
      wsClient.send('session:list', { sessions });
    } catch (error) {
      logger.error({ err: error }, 'Failed to list sessions');
      wsClient.send('error', {
        originalType: 'session:list',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    'session:create': handleCreateSession,
    'session:terminate': handleTerminateSession,
    'session:input': handleSessionInput,
    'session:resize': handleSessionResize,
    'session:get_info': handleGetSessionInfo,
    'session:list': handleListSessions,
  };
}
