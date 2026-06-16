/**
 * Epic message handlers.
 *
 * epic:finalize — open a pull request for the work produced during an epic
 * (git branch + commit + push + `gh pr create`) in the project's work tree,
 * then report the outcome back to the server (epic:finalized).
 *
 * Mirror of {@link createSprintHandlers} at the epic granularity: the PR work
 * is identical (it reuses {@link finalizeSprint}), only the message envelope
 * and the id field (`epicId`) differ. Without this handler the server's
 * EpicFinalizeService dispatch is silently dropped — the epic keeps its
 * `pr_branch`/`finalized_at` intent stamp forever but never gets a PR.
 */

import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import { finalizeSprint } from '../sessions/sprint-finalize.js';

interface HandlerContext {
  wsClient: WebSocketClient;
  logger: Logger;
}

interface EpicFinalizePayload {
  epicId: string;
  projectId: string;
  projectPath: string;
  branch: string;
  title: string;
  body: string;
}

export function createEpicHandlers(context: HandlerContext) {
  const { wsClient, logger } = context;

  async function handleFinalize(payload: EpicFinalizePayload): Promise<void> {
    const { epicId, projectId, projectPath, branch, title, body } = payload ?? ({} as EpicFinalizePayload);

    if (!epicId || !projectPath || !branch) {
      logger.warn({ payload }, 'epic:finalize ignored — missing fields');
      return;
    }

    logger.info({ epicId, branch }, 'Finalizing epic — opening pull request');

    // The PR flow is branch-scoped and identical to a sprint's, so we reuse the
    // sprint finalizer rather than duplicate the git/gh + sandbox logic.
    const result = finalizeSprint({ projectPath, branch, title, body }, logger);

    wsClient.send('epic:finalized', {
      epicId,
      projectId,
      success: result.success,
      branch: result.branch,
      committed: result.committed,
      sandboxed: result.sandboxed,
      ...(result.prUrl ? { prUrl: result.prUrl } : {}),
      ...(result.error ? { error: result.error } : {}),
    });
  }

  return {
    'epic:finalize': handleFinalize,
  };
}
