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
    /** Multi-agent: shared project this session belongs to. */
    sharedProjectId?: string;
    /** Multi-agent: identifier for this specific Claude instance. */
    instanceId?: string;
    /** Extra env vars for MCP servers (merged into tmux session env). */
    mcpEnv?: Record<string, string>;
    /** Appended to Claude's system prompt via --append-system-prompt. */
    appendSystemPrompt?: string;
    /** Claude permission mode (`--permission-mode`). */
    permissionMode?: 'default' | 'plan' | 'acceptEdits' | 'bypassPermissions';
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

      // Build config from nested config or flat payload fields.
      // Flat fields take precedence over the nested config object so that
      // the backend can always override individual settings at call time.
      const config: SessionConfig = payload.config
        ? {
            ...payload.config,
            // Overlay flat fields that override the nested config when present
            ...(payload.mode !== undefined && { mode: payload.mode as SessionConfig['mode'] }),
            ...(payload.projectPath !== undefined && { projectPath: payload.projectPath }),
            ...(payload.initialPrompt !== undefined && { initialPrompt: payload.initialPrompt }),
            ...(payload.ptySize !== undefined && { ptySize: payload.ptySize }),
            ...(payload.credentialEnv !== undefined && { credentialEnv: payload.credentialEnv }),
            ...(payload.env !== undefined && { env: payload.env }),
            ...(payload.sharedProjectId !== undefined && { sharedProjectId: payload.sharedProjectId }),
            ...(payload.instanceId !== undefined && { instanceId: payload.instanceId }),
            ...(payload.mcpEnv !== undefined && { mcpEnv: payload.mcpEnv }),
            ...(payload.appendSystemPrompt !== undefined && { appendSystemPrompt: payload.appendSystemPrompt }),
            ...(payload.permissionMode !== undefined && { permissionMode: payload.permissionMode }),
          }
        : {
            mode: (payload.mode as SessionConfig['mode']) || 'interactive',
            projectPath: payload.projectPath,
            initialPrompt: payload.initialPrompt,
            ptySize: payload.ptySize,
            credentialEnv: payload.credentialEnv,
            env: payload.env,
            sharedProjectId: payload.sharedProjectId,
            instanceId: payload.instanceId,
            mcpEnv: payload.mcpEnv,
            appendSystemPrompt: payload.appendSystemPrompt,
            permissionMode: payload.permissionMode,
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
      logger.error({ err: error, sessionId: payload.sessionId }, 'Failed to create session');
      wsClient.send('error', {
        originalType: 'session:create',
        sessionId: payload.sessionId,
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
