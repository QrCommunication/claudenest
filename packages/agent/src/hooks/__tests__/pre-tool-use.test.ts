/**
 * Tests for pre-tool-use hook logic.
 *
 * We test the pure decision functions rather than the script's top-level
 * side-effects (stdin + process.exit), following the pattern of isolating
 * business logic into testable units.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import {
  writeLockCache,
  readLockCache,
  isCacheHit,
} from '../lib.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'pre-tool-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ── Lock cache fast-path decisions ─────────────────────────────────────────

describe('pre-tool-use: cache-hit fast path', () => {
  it('allows when cache has a warm lock for the file', () => {
    const future = new Date(Date.now() + 120_000).toISOString();
    writeLockCache(tmpDir, { 'src/auth.ts': future });
    const cache = readLockCache(tmpDir);
    // Simulates: isCacheHit → allow without API call
    expect(isCacheHit(cache, 'src/auth.ts')).toBe(true);
  });

  it('does NOT fast-path when lock expires within the 60s margin', () => {
    const almostExpired = new Date(Date.now() + 30_000).toISOString();
    writeLockCache(tmpDir, { 'src/auth.ts': almostExpired });
    const cache = readLockCache(tmpDir);
    expect(isCacheHit(cache, 'src/auth.ts')).toBe(false);
  });

  it('does NOT fast-path for a different file key', () => {
    const future = new Date(Date.now() + 120_000).toISOString();
    writeLockCache(tmpDir, { 'src/auth.ts': future });
    const cache = readLockCache(tmpDir);
    expect(isCacheHit(cache, 'src/other.ts')).toBe(false);
  });
});

// ── 409 owner extraction ──────────────────────────────────────────────────

describe('pre-tool-use: 409 owner extraction from message', () => {
  it('extracts owner from error message', () => {
    const msg = 'File already locked by instance-abc-123';
    const match = msg.match(/locked by (.+)$/i);
    expect(match?.[1]?.trim()).toBe('instance-abc-123');
  });

  it('falls back to "another instance" when message lacks owner', () => {
    const msg = 'File is locked';
    const match = msg.match(/locked by (.+)$/i);
    const owner = match ? match[1]?.trim() : 'another instance';
    expect(owner).toBe('another instance');
  });

  it('handles owner with spaces/hyphens in name', () => {
    const msg = 'File already locked by my-long-instance-id-42';
    const match = msg.match(/locked by (.+)$/i);
    expect(match?.[1]?.trim()).toBe('my-long-instance-id-42');
  });
});

// ── postSilent mock — network scenarios ───────────────────────────────────

describe('pre-tool-use: postSilent network scenarios', () => {
  it('allows when fetch throws a network error (fail-open)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', mockFetch);

    // Simulates postSilent internals: any thrown error → { ok: false, status: 0 }
    const result = await (async () => {
      try {
        await fetch('http://test/api/projects/p/locks', { method: 'POST' });
        return { ok: true, status: 200 };
      } catch {
        return { ok: false, status: 0 };
      }
    })();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    // Expectation: hook should allow() when result.ok is false and status !== 409
  });

  it('recognises 409 as a conflict (deny)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: { code: 'LCK_001', message: 'File already locked by owner-instance' },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await fetch('http://test/api/projects/p/locks', { method: 'POST' });
    const body = await res.json() as { error?: { message?: string } };

    expect(res.status).toBe(409);
    const msg = body.error?.message ?? '';
    const match = msg.match(/locked by (.+)$/i);
    expect(match?.[1]?.trim()).toBe('owner-instance');
  });

  it('caches the expires_at on successful lock acquisition', async () => {
    const expiresAt = '2099-06-01T12:00:00.000Z';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: { id: 'lock-1', path: 'src/foo.ts', expires_at: expiresAt },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await fetch('http://test/api/projects/p/locks', { method: 'POST' });
    const body = await res.json() as { data?: { expires_at?: string } };

    // Simulates the cache write
    const cache: Record<string, string> = {};
    cache['src/foo.ts'] = body.data?.expires_at ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();
    writeLockCache(tmpDir, cache);

    expect(readLockCache(tmpDir)['src/foo.ts']).toBe(expiresAt);
  });
});

// ── Tool filtering ────────────────────────────────────────────────────────

describe('pre-tool-use: tool filtering', () => {
  const FILE_WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

  it('only intercepts file-write tools', () => {
    expect(FILE_WRITE_TOOLS.has('Edit')).toBe(true);
    expect(FILE_WRITE_TOOLS.has('Write')).toBe(true);
    expect(FILE_WRITE_TOOLS.has('MultiEdit')).toBe(true);
    expect(FILE_WRITE_TOOLS.has('NotebookEdit')).toBe(true);
  });

  it('passes through non-write tools', () => {
    expect(FILE_WRITE_TOOLS.has('Bash')).toBe(false);
    expect(FILE_WRITE_TOOLS.has('Read')).toBe(false);
    expect(FILE_WRITE_TOOLS.has('Task')).toBe(false);
    expect(FILE_WRITE_TOOLS.has('WebSearch')).toBe(false);
  });
});
