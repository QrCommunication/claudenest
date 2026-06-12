#!/usr/bin/env node
/**
 * Notification hook — forward Claude Code notifications to the server.
 *
 * Fired when Claude Code emits a user-facing notification (e.g. permission
 * request, tool result summary). Forwards the message to the session's
 * notification endpoint so the web/mobile dashboard can surface it.
 *
 * Never blocks — 3s timeout, fail-open.
 * exit 0 always.
 */

import { resolveEnv, readStdinJson, postSilent } from './lib.js';

// ── Stdin event shape ──────────────────────────────────────────────────────

interface NotificationEvent {
  session_id?: string;
  hook_event_name?: string;
  message?: string;
  title?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────

const env = resolveEnv();
if (!env) process.exit(0);

const event = await readStdinJson<NotificationEvent>();

// Nothing to forward.
if (!event?.message) process.exit(0);

// The session ID comes from the event itself (most reliable source),
// falling back to the env var.
const sessionId = event.session_id ?? env.sessionId;
if (!sessionId) process.exit(0);

const url = `${env.apiUrl}/api/sessions/${sessionId}/notification`;
await postSilent(
  url,
  env.token,
  {
    message: event.message,
    ...(event.title ? { title: event.title } : {}),
  },
  3000,
);

process.exit(0);
