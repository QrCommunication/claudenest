#!/usr/bin/env node
/**
 * SessionEnd hook — disconnect + purge lock cache.
 *
 * Two responsibilities (both fire-and-forget):
 *   1. POST /api/instances/{instanceId}/disconnect — tells the server this
 *      instance is gone so it can release resources.
 *   2. POST /api/projects/{projectId}/locks/release-by-instance — bulk-release
 *      any file locks still held by this instance.
 *   3. Purge the local lock-cache.json so a future session starts clean.
 *
 * Never blocks the session shutdown — all requests race with a 3s timeout.
 * exit 0 always.
 */

import {
  resolveEnv,
  readStdinJson,
  postSilent,
  purgeLockCache,
} from './lib.js';

// ── Stdin event shape ──────────────────────────────────────────────────────

interface SessionEndEvent {
  session_id?: string;
  hook_event_name?: string;
  reason?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────

const env = resolveEnv();
if (!env) process.exit(0);

// Consume stdin.
await readStdinJson<SessionEndEvent>();

// Fire both network requests in parallel — neither blocks the other.
const requests: Promise<unknown>[] = [];

if (env.instanceId) {
  requests.push(
    postSilent(
      `${env.apiUrl}/api/instances/${env.instanceId}/disconnect`,
      env.token,
      {},
      3000,
    ),
  );

  requests.push(
    postSilent(
      `${env.apiUrl}/api/projects/${env.projectId}/locks/release-by-instance`,
      env.token,
      { instance_id: env.instanceId },
      3000,
    ),
  );
}

// Run requests + cache purge concurrently.
await Promise.allSettled([
  ...requests,
  Promise.resolve().then(() => purgeLockCache(env.runtimeDir)),
]);

process.exit(0);
