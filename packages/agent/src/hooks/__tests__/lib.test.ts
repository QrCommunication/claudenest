import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync, utimesSync } from 'node:fs';
import {
  resolveEnv,
  readLockCache,
  writeLockCache,
  isCacheHit,
  evictLockCache,
  purgeLockCache,
  lockCachePath,
  shouldSendHeartbeat,
  touchHeartbeatFile,
  heartbeatThrottlePath,
  toRelPath,
} from '../lib.js';

// ── helpers ────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'hook-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ── resolveEnv ─────────────────────────────────────────────────────────────

describe('resolveEnv', () => {
  it('returns null when CLAUDENEST_PROJECT_ID is absent', () => {
    const saved = process.env['CLAUDENEST_PROJECT_ID'];
    delete process.env['CLAUDENEST_PROJECT_ID'];
    expect(resolveEnv()).toBeNull();
    if (saved !== undefined) process.env['CLAUDENEST_PROJECT_ID'] = saved;
  });

  it('returns env when CLAUDENEST_PROJECT_ID is set', () => {
    process.env['CLAUDENEST_PROJECT_ID'] = 'proj-123';
    process.env['CLAUDENEST_API_URL'] = 'https://api.test.io/';
    process.env['CLAUDENEST_TOKEN'] = 'tok-abc';
    const env = resolveEnv();
    expect(env).not.toBeNull();
    expect(env?.projectId).toBe('proj-123');
    // Trailing slash stripped
    expect(env?.apiUrl).toBe('https://api.test.io');
    expect(env?.token).toBe('tok-abc');
    delete process.env['CLAUDENEST_PROJECT_ID'];
    delete process.env['CLAUDENEST_API_URL'];
    delete process.env['CLAUDENEST_TOKEN'];
  });

  it('falls back to os.tmpdir() when CLAUDENEST_RUNTIME_DIR absent', () => {
    process.env['CLAUDENEST_PROJECT_ID'] = 'proj-x';
    delete process.env['CLAUDENEST_RUNTIME_DIR'];
    const env = resolveEnv();
    expect(env?.runtimeDir).toBe(tmpdir());
    delete process.env['CLAUDENEST_PROJECT_ID'];
  });
});

// ── lock cache ─────────────────────────────────────────────────────────────

describe('lock cache', () => {
  it('readLockCache returns empty object when file absent', () => {
    expect(readLockCache(tmpDir)).toEqual({});
  });

  it('writeLockCache + readLockCache round-trips correctly', () => {
    const cache = { 'src/foo.ts': '2099-01-01T00:00:00.000Z' };
    writeLockCache(tmpDir, cache);
    expect(readLockCache(tmpDir)).toEqual(cache);
  });

  it('isCacheHit returns false for absent key', () => {
    expect(isCacheHit({}, 'src/foo.ts')).toBe(false);
  });

  it('isCacheHit returns true for future expiry > 60s', () => {
    const future = new Date(Date.now() + 120_000).toISOString();
    expect(isCacheHit({ 'src/foo.ts': future }, 'src/foo.ts')).toBe(true);
  });

  it('isCacheHit returns false when within 60s margin', () => {
    // Expires 30s from now — within the 60s safety margin.
    const almostExpired = new Date(Date.now() + 30_000).toISOString();
    expect(isCacheHit({ 'src/foo.ts': almostExpired }, 'src/foo.ts')).toBe(false);
  });

  it('isCacheHit returns false for past expiry', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isCacheHit({ 'src/foo.ts': past }, 'src/foo.ts')).toBe(false);
  });

  it('evictLockCache removes only the targeted key', () => {
    writeLockCache(tmpDir, {
      'src/a.ts': '2099-01-01T00:00:00.000Z',
      'src/b.ts': '2099-01-01T00:00:00.000Z',
    });
    evictLockCache(tmpDir, 'src/a.ts');
    const cache = readLockCache(tmpDir);
    expect(cache['src/a.ts']).toBeUndefined();
    expect(cache['src/b.ts']).toBe('2099-01-01T00:00:00.000Z');
  });

  it('purgeLockCache clears all entries', () => {
    writeLockCache(tmpDir, {
      'src/a.ts': '2099-01-01T00:00:00.000Z',
      'src/b.ts': '2099-01-01T00:00:00.000Z',
    });
    purgeLockCache(tmpDir);
    expect(readLockCache(tmpDir)).toEqual({});
  });

  it('lockCachePath returns expected path', () => {
    expect(lockCachePath('/tmp/rt')).toBe('/tmp/rt/lock-cache.json');
  });
});

// ── heartbeat throttle ─────────────────────────────────────────────────────

describe('heartbeat throttle', () => {
  it('shouldSendHeartbeat returns true when sentinel absent', () => {
    expect(shouldSendHeartbeat(tmpDir)).toBe(true);
  });

  it('shouldSendHeartbeat returns false immediately after touch', () => {
    touchHeartbeatFile(tmpDir);
    expect(shouldSendHeartbeat(tmpDir)).toBe(false);
  });

  it('shouldSendHeartbeat returns true after 30s have passed', () => {
    // Back-date the mtime to 31 seconds ago.
    const sentinelPath = heartbeatThrottlePath(tmpDir);
    touchHeartbeatFile(tmpDir);
    const past = new Date(Date.now() - 31_000);
    utimesSync(sentinelPath, past, past);
    expect(shouldSendHeartbeat(tmpDir)).toBe(true);
  });

  it('heartbeatThrottlePath returns expected path', () => {
    expect(heartbeatThrottlePath('/tmp/rt')).toBe('/tmp/rt/last-heartbeat');
  });
});

// ── toRelPath ─────────────────────────────────────────────────────────────

describe('toRelPath', () => {
  it('strips the project prefix', () => {
    expect(toRelPath('/home/user/project/src/foo.ts', '/home/user/project')).toBe('src/foo.ts');
  });

  it('returns the path as-is when outside project', () => {
    expect(toRelPath('/etc/passwd', '/home/user/project')).toBe('/etc/passwd');
  });

  it('handles trailing slash in file path', () => {
    expect(toRelPath('/home/user/project/src/foo.ts', '/home/user/project/')).toBe('src/foo.ts');
  });
});
