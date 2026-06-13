/**
 * Detect a Claude credential authentication failure in a session's output.
 *
 * When the OAuth token a worker was launched with is revoked (Claude rotates
 * tokens on refresh, so a worker spawned before another refresh ends up holding
 * a dead token), Claude Code prints "Please run /login · API Error: 401 Invalid
 * authentication credentials" and stalls. We surface that to the server so it
 * can renew the credential and relaunch the worker.
 *
 * Detection is debounced per session: a single stalled worker keeps reprinting
 * the error, but the server only needs to act once.
 */

const AUTH_ERROR_PATTERNS: RegExp[] = [
  /Please run \/login/i,
  /401 Invalid authentication credentials/i,
  /Invalid authentication credentials/i,
  /OAuth token has expired/i,
];

/** True when the text contains a Claude auth-failure signature. */
export function isAuthError(text: string): boolean {
  if (!text) return false;
  return AUTH_ERROR_PATTERNS.some((re) => re.test(text));
}

const DEBOUNCE_MS = 60_000;
const lastSignalled = new Map<string, number>();

/**
 * Returns true at most once per session per debounce window when the output
 * carries an auth error — i.e. when the server should be signalled.
 */
export function shouldSignalAuthError(sessionId: string, text: string, now: number): boolean {
  if (!sessionId || !isAuthError(text)) return false;
  const last = lastSignalled.get(sessionId) ?? 0;
  if (now - last < DEBOUNCE_MS) return false;
  lastSignalled.set(sessionId, now);
  return true;
}

/** Clear debounce state for a session (call on session end). */
export function forgetAuthError(sessionId: string): void {
  lastSignalled.delete(sessionId);
}
