/**
 * Session message handlers
 */

import type { SessionManager } from '../sessions/manager.js';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import type { SessionConfig, PTYSize } from '../types/index.js';

interface HandlerContext {
  sessionManager: SessionManager;
  wsClient: WebSocketClient;
  logger: Logger;
}

export function createSessionHandlers(context: HandlerContext) {
  const { sessionManager, wsClient, logger } = context;

  /**
   * Handle session:create
   */
  async function handleCreateSession(payload: { 
    sessionId: string; 
    config?: SessionConfig;
  }): Promise<void> {
    logger.debug('Handling session:create', { sessionId: payload.sessionId });

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

      const session = await sessionManager.createSession(
        payload.sessionId,
        payload.config || {}
      );

      wsClient.send('session:status', {
        sessionId: session.id,
        status: session.status,
        pid: session.pid,
      });
    } catch (error) {
      logger.error('Failed to create session', { error });
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
    logger.debug('Handling session:terminate', { sessionId: payload.sessionId });

    try {
      await sessionManager.terminateSession(payload.sessionId, payload.force);
      
      wsClient.send('session:status', {
        sessionId: payload.sessionId,
        status: 'terminated',
      });
    } catch (error) {
      logger.error('Failed to terminate session', { error });
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
      logger.error('Failed to send input', { error, sessionId: payload.sessionId });
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
      logger.error('Failed to resize session', { error, sessionId: payload.sessionId });
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
      logger.error('Failed to get session info', { error });
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
      logger.error('Failed to list sessions', { error });
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
