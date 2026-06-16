#!/usr/bin/env node
/**
 * Stop hook — heartbeat (status: idle) + token-usage report.
 *
 * Fired when Claude Code finishes a response and enters an idle state.
 * Two fire-and-forget responsibilities:
 *   1. Send a single heartbeat (status: idle) — no throttle, idle events are
 *      infrequent and the server needs to know promptly.
 *   2. Parse the session transcript (`transcript_path` from stdin) and report
 *      the cumulative token usage to /api/sessions/{sessionId}/token-usage.
 *      The endpoint is idempotent (absolute overwrite), so re-reporting the
 *      growing cumulative count on every Stop is safe and keeps the dashboard
 *      live without any extra polling.
 *
 * Never blocks, never throws — fail-open.
 * exit 0 always.
 */

import { resolveEnv, readStdinJson, postSilent, touchHeartbeatFile } from './lib.js';
import { parseTokenUsage } from './token-usage.js';

// ── Stdin event shape ──────────────────────────────────────────────────────

interface StopEvent {
  session_id?: string;
  hook_event_name?: string;
  stop_hook_active?: boolean;
  /** Path to the Claude Code session JSONL transcript. */
  transcript_path?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────

const env = resolveEnv();
if (!env) process.exit(0);

// Consume stdin.
const event = await readStdinJson<StopEvent>();

if (!env.instanceId) process.exit(0);

// Update the sentinel so the next PostToolUse throttle window starts fresh.
touchHeartbeatFile(env.runtimeDir);

const requests: Promise<unknown>[] = [
  postSilent(
    `${env.apiUrl}/api/instances/${env.instanceId}/heartbeat`,
    env.token,
    { status: 'idle' },
    2000,
  ),
];

// Report cumulative token usage if we can read the transcript and know which
// ClaudeNest session to attribute it to. Fail-open: any gap simply skips it.
const transcriptPath = event?.transcript_path;
if (transcriptPath && env.sessionId) {
  const usage = parseTokenUsage(transcriptPath);
  if (usage) {
    requests.push(
      postSilent(
        `${env.apiUrl}/api/sessions/${env.sessionId}/token-usage`,
        env.token,
        {
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          total_tokens: usage.totalTokens,
        },
        2000,
      ),
    );
  }
}

await Promise.allSettled(requests);

process.exit(0);
