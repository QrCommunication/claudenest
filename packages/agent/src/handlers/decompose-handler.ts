/**
 * Decomposition handler — PRD → Master Plan via oneshot Claude session.
 *
 * Receives decompose:start from the server, creates a oneshot Claude session
 * with the decomposition prompt, accumulates the output, parses the JSON
 * master plan, and sends the result back.
 */

import type { SessionManager } from '../sessions/manager.js';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import type {
  DecomposeStartPayload,
  MasterPlan,
  SessionConfig,
} from '../types/index.js';

interface HandlerContext {
  sessionManager: SessionManager;
  wsClient: WebSocketClient;
  logger: Logger;
}

export function createDecomposeHandlers(context: HandlerContext) {
  const { sessionManager, wsClient, logger } = context;

  async function handleDecomposeStart(payload: DecomposeStartPayload): Promise<void> {
    const { projectId, projectPath, prompt, credentialEnv } = payload;
    const decomposeSessionId = `decompose-${projectId}-${Date.now()}`;

    logger.info({ projectId, decomposeSessionId }, 'Starting PRD decomposition');

    let outputBuffer = '';
    let lastProgressSent = 0;

    try {
      const config: SessionConfig = {
        mode: 'oneshot',
        projectPath,
        initialPrompt: prompt,
        credentialEnv,
        ptySize: { cols: 200, rows: 50 },
      };

      await sessionManager.createSession(decomposeSessionId, config);

      // Listen for output and accumulate
      const onOutput = (data: { sessionId: string; data: string }) => {
        if (data.sessionId !== decomposeSessionId) return;
        outputBuffer += data.data;

        // Send progress every 500ms to avoid flooding
        const now = Date.now();
        if (now - lastProgressSent > 500) {
          lastProgressSent = now;
          wsClient.send('decompose:progress', {
            projectId,
            output: data.data,
          });
        }
      };

      const onExit = (data: { sessionId: string; exitCode: number }) => {
        if (data.sessionId !== decomposeSessionId) return;

        // Clean up listeners
        sessionManager.removeListener('output', onOutput);
        sessionManager.removeListener('exit', onExit);

        logger.info(
          { projectId, exitCode: data.exitCode, outputLength: outputBuffer.length },
          'Decomposition session exited',
        );

        // Parse the output for a JSON master plan
        const result = parseDecompositionOutput(outputBuffer);

        if (result.success && result.plan) {
          logger.info({ projectId, waves: result.plan.waves.length }, 'Master plan parsed successfully');
          wsClient.send('decompose:result', {
            projectId,
            success: true,
            plan: result.plan,
          });
        } else {
          logger.warn({ projectId, error: result.error }, 'Failed to parse master plan');
          wsClient.send('decompose:result', {
            projectId,
            success: false,
            error: result.error || 'Failed to parse master plan from Claude output',
          });
        }
      };

      sessionManager.on('output', onOutput);
      sessionManager.on('exit', onExit);

    } catch (error) {
      logger.error({ err: error, projectId }, 'Failed to start decomposition session');
      wsClient.send('decompose:result', {
        projectId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error starting decomposition',
      });
    }
  }

  return {
    'decompose:start': handleDecomposeStart,
  } as Record<string, (payload: unknown) => Promise<void> | void>;
}

/**
 * Parse Claude's output to extract the JSON master plan.
 */
function parseDecompositionOutput(raw: string): {
  success: boolean;
  plan?: MasterPlan;
  error?: string;
} {
  // Strip ANSI escape codes
  let clean = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  clean = clean.replace(/\x1b\].*?\x07/g, '');

  // Try to find JSON in ```json ... ``` block
  let jsonStr: string | null = null;

  const codeBlockMatch = clean.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    // Fallback: find raw JSON starting with {"version"
    const rawMatch = clean.match(/(\{"version"\s*:\s*1[\s\S]*\})/);
    if (rawMatch) {
      jsonStr = rawMatch[1];
    }
  }

  if (!jsonStr) {
    return { success: false, error: 'No JSON block found in Claude output' };
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Basic validation
    if (parsed.version !== 1) {
      return { success: false, error: 'Invalid version (expected 1)' };
    }
    if (!Array.isArray(parsed.waves) || parsed.waves.length === 0) {
      return { success: false, error: 'No waves found in plan' };
    }

    // Normalize
    const plan: MasterPlan = {
      version: 1,
      prd_summary: parsed.prd_summary || '',
      waves: parsed.waves.map((w: Record<string, unknown>, i: number) => ({
        id: (w.id as number) ?? i,
        name: (w.name as string) || `Wave ${i}`,
        description: (w.description as string) || '',
        tasks: Array.isArray(w.tasks)
          ? (w.tasks as Record<string, unknown>[]).map((t) => ({
              title: (t.title as string) || '',
              description: (t.description as string) || '',
              priority: normalizePriority((t.priority as string) || 'medium'),
              files: Array.isArray(t.files) ? (t.files as string[]) : [],
              estimated_tokens: typeof t.estimated_tokens === 'number' ? t.estimated_tokens : undefined,
              depends_on: Array.isArray(t.depends_on) ? (t.depends_on as string[]) : [],
            }))
          : [],
      })),
    };

    return { success: true, plan };
  } catch (e) {
    return {
      success: false,
      error: `JSON parse error: ${e instanceof Error ? e.message : 'Unknown'}`,
    };
  }
}

function normalizePriority(p: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (p.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'low': return 'low';
    default: return 'medium';
  }
}
