#!/usr/bin/env node
/**
 * Stop hook — heartbeat (status: idle).
 *
 * Fired when Claude Code finishes a response and enters an idle state.
 * Sends a single heartbeat unconditionally (no throttle — idle events
 * are infrequent and the server needs to know promptly).
 *
 * Never blocks, never throws — fail-open.
 * exit 0 always.
 */

import { resolveEnv, readStdinJson, postSilent, touchHeartbeatFile } from './lib.js';

// ── Stdin event shape ──────────────────────────────────────────────────────

interface StopEvent {
  session_id?: string;
  hook_event_name?: string;
  stop_hook_active?: boolean;
}

// ── Main ──────────────────────────────────────────────────────────────────

const env = resolveEnv();
if (!env) process.exit(0);

// Consume stdin.
await readStdinJson<StopEvent>();

if (!env.instanceId) process.exit(0);

// Update the sentinel so the next PostToolUse throttle window starts fresh.
touchHeartbeatFile(env.runtimeDir);

const url = `${env.apiUrl}/api/instances/${env.instanceId}/heartbeat`;
await postSilent(url, env.token, { status: 'idle' }, 2000);

process.exit(0);
