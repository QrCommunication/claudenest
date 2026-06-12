#!/usr/bin/env node
/**
 * PreToolUse hook — file lock check / acquire.
 *
 * Intercepts Edit, Write, MultiEdit, NotebookEdit tools.
 * For each target file:
 *   1. Check the local lock cache (fast path).
 *   2. If cache miss → POST to the API to acquire the lock.
 *   3. 409 conflict → deny with a clear message.
 *   4. Any network error → allow (fail-open).
 *
 * Output contract (PreToolUse):
 *   stdout: JSON with hookSpecificOutput.permissionDecision = "allow" | "deny"
 *   exit 0 always.
 */

import { resolveEnv, readStdinJson, postSilent, readLockCache, writeLockCache, isCacheHit, toRelPath } from './lib.js';

// ── Stdin event shape ──────────────────────────────────────────────────────

interface PreToolUseEvent {
  session_id?: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    path?: string;
  };
}

// ── API response shapes ────────────────────────────────────────────────────

interface LockSuccessData {
  expires_at?: string;
  locked_by?: string;
}

interface LockSuccessResponse {
  success: true;
  data: LockSuccessData;
}

interface LockErrorResponse {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
}

type LockApiResponse = LockSuccessResponse | LockErrorResponse;

// ── File-writing tools ─────────────────────────────────────────────────────

const FILE_WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

// ── Output helpers ─────────────────────────────────────────────────────────

function allow(): void {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  }));
}

function deny(reason: string): void {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────

const env = resolveEnv();
if (!env) {
  // No project ID — pass through silently.
  allow();
  process.exit(0);
}

const event = await readStdinJson<PreToolUseEvent>();

// Not a file-write tool → allow immediately.
const toolName = event?.tool_name ?? '';
if (!FILE_WRITE_TOOLS.has(toolName)) {
  allow();
  process.exit(0);
}

// Extract the target file path (handles both Edit/Write `file_path` and MultiEdit `path`).
const absPath = event?.tool_input?.file_path ?? event?.tool_input?.path ?? '';
if (!absPath) {
  allow();
  process.exit(0);
}

const relPath = toRelPath(absPath, env.projectPath);
const cache = readLockCache(env.runtimeDir);

// Fast path: we already hold a warm lock for this file.
if (isCacheHit(cache, relPath)) {
  allow();
  process.exit(0);
}

// Slow path: attempt to acquire the lock via the API.
const url = `${env.apiUrl}/api/projects/${env.projectId}/locks`;
const result = await postSilent(
  url,
  env.token,
  {
    path: relPath,
    instance_id: env.instanceId,
    reason: `Claude Code ${toolName}`,
    duration_minutes: 30,
  },
  2000,
);

if (!result.ok) {
  if (result.status === 409) {
    // Extract the owner from the error message: "File already locked by <instanceId>"
    const body = result.body as LockErrorResponse | null;
    const msg = body?.error?.message ?? '';
    const ownerMatch = msg.match(/locked by (.+)$/i);
    const owner = ownerMatch ? ownerMatch[1]?.trim() : 'another instance';
    deny(
      `File "${relPath}" is locked by ${owner}. ` +
      `Pick a different file or wait for the lock to be released.`,
    );
    process.exit(0);
  }
  // Any other error (network, 5xx, timeout) → fail-open.
  allow();
  process.exit(0);
}

// Lock acquired — cache the expiry.
const body = result.body as LockApiResponse | null;
const expiresAt =
  body && 'data' in body && body.data?.expires_at
    ? body.data.expires_at
    : new Date(Date.now() + 30 * 60 * 1000).toISOString();

cache[relPath] = expiresAt;
writeLockCache(env.runtimeDir, cache);

allow();
process.exit(0);
