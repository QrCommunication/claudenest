/**
 * Orchestrator message handlers
 */

import type { Orchestrator } from '../orchestrator/orchestrator.js';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import type { OrchestratorConfig } from '../types/index.js';

interface HandlerContext {
  orchestrator: Orchestrator;
  wsClient: WebSocketClient;
  logger: Logger;
}

export function createOrchestratorHandlers(context: HandlerContext) {
  const { orchestrator, wsClient, logger } = context;

  async function handleStart(payload: {
    requestId?: string;
    projectId: string;
    projectPath: string;
    minWorkers?: number;
    maxWorkers?: number;
    pollIntervalMs?: number;
    workerIdleTimeoutMs?: number;
    autoScale?: boolean;
  }): Promise<void> {
    logger.info({ projectId: payload.projectId }, 'Handling orchestrator:start');

    try {
      const config: OrchestratorConfig = {
        projectId: payload.projectId,
        projectPath: payload.projectPath,
        minWorkers: payload.minWorkers ?? 1,
        maxWorkers: payload.maxWorkers ?? 5,
        pollIntervalMs: payload.pollIntervalMs ?? 15_000,
        workerIdleTimeoutMs: payload.workerIdleTimeoutMs ?? 5 * 60_000,
        autoScale: payload.autoScale ?? true,
      };

      await orchestrator.start(config);

      const state = orchestrator.getState();
      wsClient.send('orchestrator:state', {
        ...state,
        requestId: payload.requestId,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to start orchestrator');
      wsClient.send('orchestrator:error', {
        requestId: payload.requestId,
        type: 'start_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function handleStop(payload: { requestId?: string; projectId?: string } = {}): Promise<void> {
    logger.info('Handling orchestrator:stop');

    try {
      await orchestrator.stop();
      wsClient.send('orchestrator:state', {
        status: 'stopped',
        requestId: payload.requestId,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to stop orchestrator');
      wsClient.send('orchestrator:error', {
        requestId: payload.requestId,
        type: 'stop_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  function handleStatus(payload: { requestId?: string; projectId?: string } = {}): void {
    const state = orchestrator.getState();
    wsClient.send('orchestrator:state', {
      ...state,
      requestId: payload.requestId,
    });
  }

  async function handleScale(payload: { workerCount: number }): Promise<void> {
    logger.info({ workerCount: payload.workerCount }, 'Handling orchestrator:scale');

    try {
      await orchestrator.scaleTo(payload.workerCount);
      handleStatus(); // Send updated state
    } catch (error) {
      logger.error({ err: error }, 'Failed to scale orchestrator');
      wsClient.send('orchestrator:error', {
        type: 'scale_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    'orchestrator:start': handleStart,
    'orchestrator:stop': handleStop,
    'orchestrator:status': handleStatus,
    'orchestrator:scale': handleScale,
  } as Record<string, (payload: unknown) => Promise<void> | void>;
}
