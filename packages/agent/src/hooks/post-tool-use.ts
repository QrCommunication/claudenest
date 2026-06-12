#!/usr/bin/env node
/**
 * PostToolUse hook — throttled heartbeat (status: busy).
 *
 * Sends a heartbeat to the server at most once every 30 seconds.
 * Uses the mtime of a sentinel file as the throttle gate.
 * Never blocks, never throws — fail-open on every error.
 *
 * exit 0 always.
 */

import {
  resolveEnv,
  readStdinJson,
  postSilent,
  shouldSendHeartbeat,
  touchHeartbeatFile,
} from './lib.js';

// ── Stdin event shape ──────────────────────────────────────────────────────

interface PostToolUseEvent {
  session_id?: string;
  hook_event_name?: string;
  tool_name?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────

const env = resolveEnv();
if (!env) process.exit(0);

// Consume stdin (required — Claude Code waits for the hook to drain it).
await readStdinJson<PostToolUseEvent>();

if (!env.instanceId) process.exit(0);

if (!shouldSendHeartbeat(env.runtimeDir)) {
  // Within throttle window — skip silently.
  process.exit(0);
}

// Touch the sentinel file *before* the network call so that even if the
// call takes the full 2s, concurrent hooks don't pile up.
touchHeartbeatFile(env.runtimeDir);

const url = `${env.apiUrl}/api/instances/${env.instanceId}/heartbeat`;
await postSilent(url, env.token, { status: 'busy' }, 2000);

process.exit(0);
