/**
 * Claude session discovery handlers — surface and mirror the user's own
 * Claude Code sessions (scanned, not agent-spawned), and optionally "adopt"
 * one into the agent's tmux for full remote control via `claude --resume`.
 */

import type { WebSocketClient } from '../websocket/client.js';
import type { SessionManager } from '../sessions/manager.js';
import type { ClaudeSessionDiscovery } from '../sessions/discovery.js';
import type { Logger } from '../types/index.js';
import type {
  ClaudeSessionsDiscoverRequest,
  ClaudeSessionsDiscoverResult,
  ClaudeSessionOpenRequest,
  ClaudeSessionOpenResult,
  ClaudeSessionCloseRequest,
  ClaudeSessionAdoptRequest,
  ClaudeSessionAdoptResult,
} from '../types/index.js';

interface HandlerContext {
  discovery: ClaudeSessionDiscovery;
  sessionManager: SessionManager;
  wsClient: WebSocketClient;
  logger: Logger;
}

export function createDiscoveryHandlers(context: HandlerContext) {
  const { discovery, sessionManager, wsClient, logger } = context;

  async function handleDiscover(payload: ClaudeSessionsDiscoverRequest): Promise<void> {
    const { requestId, includeHistory = true } = payload;
    try {
      const sessions = await discovery.discoverAll(includeHistory);
      wsClient.send('claude_sessions:discover_result', {
        requestId,
        sessions,
      } satisfies ClaudeSessionsDiscoverResult);
    } catch (error) {
      logger.error({ err: error, requestId }, 'Claude session discovery failed');
      wsClient.send('claude_sessions:discover_result', {
        requestId,
        sessions: [],
        error: error instanceof Error ? error.message : 'Discovery failed',
      } satisfies ClaudeSessionsDiscoverResult);
    }
  }

  async function handleOpen(payload: ClaudeSessionOpenRequest): Promise<void> {
    const { requestId, sessionId, transcriptPath, historyLimit } = payload;
    try {
      const resolved =
        transcriptPath ?? (await discovery.resolveTranscriptPath(sessionId));
      if (!resolved) {
        throw new Error(`Transcript not found for session ${sessionId}`);
      }

      const history = await discovery.openSession(sessionId, resolved, historyLimit);
      wsClient.send('claude_sessions:open_result', {
        requestId,
        sessionId,
        history,
      } satisfies ClaudeSessionOpenResult);
    } catch (error) {
      logger.error({ err: error, requestId, sessionId }, 'Failed to open Claude session');
      wsClient.send('claude_sessions:open_result', {
        requestId,
        sessionId,
        history: [],
        error: error instanceof Error ? error.message : 'Open failed',
      } satisfies ClaudeSessionOpenResult);
    }
  }

  function handleClose(payload: ClaudeSessionCloseRequest): void {
    discovery.closeSession(payload.sessionId);
  }

  async function handleAdopt(payload: ClaudeSessionAdoptRequest): Promise<void> {
    const { requestId, sessionId, cwd, credentialEnv } = payload;
    try {
      // Relaunch the existing session under the agent's tmux so it becomes
      // fully interactive online. `claude --resume <id>` preserves history.
      // The server provides the Session id so terminal I/O binds to a row it
      // can find in onSessionOutput (falls back to a synthetic id otherwise).
      const agentSessionId =
        payload.agentSessionId ?? `adopt-${sessionId.slice(0, 8)}-${Date.now().toString(36)}`;
      await sessionManager.createSession(agentSessionId, {
        projectPath: cwd,
        mode: 'interactive',
        resumeSessionId: sessionId,
        ...(credentialEnv ? { credentialEnv } : {}),
      });

      logger.info({ sessionId, agentSessionId }, 'Adopted Claude session into tmux');
      wsClient.send('claude_sessions:adopted', {
        requestId,
        sessionId,
        agentSessionId,
      } satisfies ClaudeSessionAdoptResult);
    } catch (error) {
      logger.error({ err: error, requestId, sessionId }, 'Failed to adopt Claude session');
      wsClient.send('claude_sessions:adopted', {
        requestId,
        sessionId,
        error: error instanceof Error ? error.message : 'Adopt failed',
      } satisfies ClaudeSessionAdoptResult);
    }
  }

  return {
    'claude_sessions:discover': handleDiscover,
    'claude_sessions:open': handleOpen,
    'claude_sessions:close': handleClose,
    'claude_sessions:adopt': handleAdopt,
  };
}
