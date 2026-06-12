/**
 * Shared library for Claude Code hook scripts.
 *
 * GOLDEN RULE: hooks must NEVER crash or slow down a session.
 *   - fail-open on every network error
 *   - short timeouts (2-3s max)
 *   - always exit 0
 *   - if CLAUDENEST_PROJECT_ID is absent → no-op immediately
 */

import { tmpdir } from 'node:os';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ── Env helpers ────────────────────────────────────────────────────────────

export interface HookEnv {
  apiUrl: string;
  token: string;
  projectId: string;
  instanceId: string;
  sessionId: string;
  projectPath: string;
  runtimeDir: string;
}

/**
 * Resolve hook environment variables.
 * Returns null if CLAUDENEST_PROJECT_ID is absent → caller should exit 0.
 */
export function resolveEnv(): HookEnv | null {
  const projectId = process.env['CLAUDENEST_PROJECT_ID'] ?? '';
  if (!projectId) return null;

  return {
    apiUrl: (process.env['CLAUDENEST_API_URL'] ?? 'http://localhost').replace(/\/$/, ''),
    token: process.env['CLAUDENEST_TOKEN'] ?? '',
    projectId,
    instanceId: process.env['CLAUDENEST_INSTANCE_ID'] ?? '',
    sessionId: process.env['CLAUDENEST_SESSION_ID'] ?? '',
    projectPath: process.env['CLAUDENEST_PROJECT_PATH'] ?? process.cwd(),
    runtimeDir: process.env['CLAUDENEST_RUNTIME_DIR'] ?? tmpdir(),
  };
}

// ── stdin reader ───────────────────────────────────────────────────────────

/**
 * Read all of stdin with a 1-second timeout guard.
 * Returns empty string if nothing arrives in time (prevents hanging hooks).
 */
export async function readStdin(): Promise<string> {
  return new Promise<string>((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    const timer = setTimeout(() => {
      process.stdin.destroy();
      resolve('');
    }, 1000);

    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => { buf += chunk; });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(buf);
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve('');
    });
  });
}

/**
 * Parse JSON from stdin; returns null on any error (fail-open).
 */
export async function readStdinJson<T>(): Promise<T | null> {
  try {
    const raw = await readStdin();
    if (!raw.trim()) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ── Minimal fetch client ───────────────────────────────────────────────────

/**
 * Fire-and-forget HTTP POST.
 * Never throws — fail-silent on any network/timeout error.
 * Default timeout: 2000ms.
 */
export async function postSilent(
  url: string,
  token: string,
  body: Record<string, unknown>,
  timeoutMs = 2000,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const responseBody: unknown = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body: responseBody };
  } catch {
    return { ok: false, status: 0, body: null };
  } finally {
    clearTimeout(timer);
  }
}

// ── Lock cache ─────────────────────────────────────────────────────────────

/** Lock cache entry: maps relative path → ISO expiry string */
export type LockCache = Record<string, string>;

/** Safety margin in seconds — re-check the API this many seconds before actual expiry */
const LOCK_CACHE_MARGIN_S = 60;

export function lockCachePath(runtimeDir: string): string {
  return join(runtimeDir, 'lock-cache.json');
}

export function readLockCache(runtimeDir: string): LockCache {
  try {
    const raw = readFileSync(lockCachePath(runtimeDir), 'utf8');
    return JSON.parse(raw) as LockCache;
  } catch {
    return {};
  }
}

export function writeLockCache(runtimeDir: string, cache: LockCache): void {
  try {
    writeFileSync(lockCachePath(runtimeDir), JSON.stringify(cache), 'utf8');
  } catch {
    // fail-silent — disk issues should not block the hook
  }
}

/**
 * Check whether our own lock for `relPath` is still warm in the cache
 * (i.e., we previously acquired it and the expiry - margin is still in the future).
 */
export function isCacheHit(cache: LockCache, relPath: string): boolean {
  const expiresAt = cache[relPath];
  if (!expiresAt) return false;
  const expiresMs = new Date(expiresAt).getTime();
  if (isNaN(expiresMs)) return false;
  return Date.now() < expiresMs - LOCK_CACHE_MARGIN_S * 1000;
}

/** Remove a single entry from the lock cache. */
export function evictLockCache(runtimeDir: string, relPath: string): void {
  const cache = readLockCache(runtimeDir);
  delete cache[relPath];
  writeLockCache(runtimeDir, cache);
}

/** Purge the entire lock cache file. */
export function purgeLockCache(runtimeDir: string): void {
  writeLockCache(runtimeDir, {});
}

// ── Heartbeat throttle ─────────────────────────────────────────────────────

const HEARTBEAT_MIN_INTERVAL_MS = 30_000;

export function heartbeatThrottlePath(runtimeDir: string): string {
  return join(runtimeDir, 'last-heartbeat');
}

/**
 * Returns true if enough time has passed since the last heartbeat file was touched.
 */
export function shouldSendHeartbeat(runtimeDir: string): boolean {
  try {
    const st = statSync(heartbeatThrottlePath(runtimeDir));
    return Date.now() - st.mtimeMs > HEARTBEAT_MIN_INTERVAL_MS;
  } catch {
    // file doesn't exist yet → send
    return true;
  }
}

export function touchHeartbeatFile(runtimeDir: string): void {
  try {
    writeFileSync(heartbeatThrottlePath(runtimeDir), String(Date.now()), 'utf8');
  } catch {
    // fail-silent
  }
}

// ── Relative path helper ───────────────────────────────────────────────────

/**
 * Convert an absolute file path to a path relative to projectPath.
 * Falls back to the absolute path if it's outside the project.
 */
export function toRelPath(absPath: string, projectPath: string): string {
  if (absPath.startsWith(projectPath)) {
    const rel = absPath.slice(projectPath.length);
    return rel.startsWith('/') ? rel.slice(1) : rel;
  }
  return absPath;
}
