/**
 * Sprint message handlers.
 *
 * sprint:finalize — open a pull request for the work produced during a sprint
 * (git branch + commit + push + `gh pr create`) in the project's work tree,
 * then report the outcome back to the server (sprint:finalized).
 */

import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import { finalizeSprint } from '../sessions/sprint-finalize.js';

interface HandlerContext {
  wsClient: WebSocketClient;
  logger: Logger;
}

interface SprintFinalizePayload {
  sprintId: string;
  projectId: string;
  projectPath: string;
  branch: string;
  title: string;
  body: string;
}

export function createSprintHandlers(context: HandlerContext) {
  const { wsClient, logger } = context;

  async function handleFinalize(payload: SprintFinalizePayload): Promise<void> {
    const { sprintId, projectId, projectPath, branch, title, body } = payload ?? ({} as SprintFinalizePayload);

    if (!sprintId || !projectPath || !branch) {
      logger.warn({ payload }, 'sprint:finalize ignored — missing fields');
      return;
    }

    logger.info({ sprintId, branch }, 'Finalizing sprint — opening pull request');

    const result = finalizeSprint({ projectPath, branch, title, body }, logger);

    wsClient.send('sprint:finalized', {
      sprintId,
      projectId,
      success: result.success,
      branch: result.branch,
      committed: result.committed,
      ...(result.prUrl ? { prUrl: result.prUrl } : {}),
      ...(result.error ? { error: result.error } : {}),
    });
  }

  return {
    'sprint:finalize': handleFinalize,
  };
}
