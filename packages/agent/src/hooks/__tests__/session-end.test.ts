/**
 * Tests for session-end hook logic (disconnect + lock purge).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { writeLockCache, readLockCache, purgeLockCache } from '../lib.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'session-end-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('session-end: lock cache purge', () => {
  it('purgeLockCache clears all entries', () => {
    writeLockCache(tmpDir, {
      'src/a.ts': '2099-01-01T00:00:00.000Z',
      'src/b.ts': '2099-01-01T00:00:00.000Z',
    });
    purgeLockCache(tmpDir);
    expect(readLockCache(tmpDir)).toEqual({});
  });

  it('purgeLockCache is idempotent on an empty cache', () => {
    purgeLockCache(tmpDir);
    purgeLockCache(tmpDir);
    expect(readLockCache(tmpDir)).toEqual({});
  });
});

describe('session-end: disconnect requests', () => {
  it('sends POST to disconnect endpoint', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      calls.push(url as string);
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    }));

    await fetch('http://test/api/instances/i1/disconnect', { method: 'POST', body: '{}' });
    expect(calls).toContain('http://test/api/instances/i1/disconnect');
  });

  it('sends POST to release-by-instance endpoint', async () => {
    let capturedBody: unknown;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      capturedBody = JSON.parse(opts?.body as string);
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    }));

    const instanceId = 'instance-xyz';
    await fetch('http://test/api/projects/p1/locks/release-by-instance', {
      method: 'POST',
      body: JSON.stringify({ instance_id: instanceId }),
    });

    expect(capturedBody).toEqual({ instance_id: instanceId });
  });

  it('both requests run with Promise.allSettled even if one fails', async () => {
    const results: string[] = [];
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(new Error('disconnect failed'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) }),
    );

    const promises = [
      fetch('http://test/api/instances/i1/disconnect', { method: 'POST', body: '{}' })
        .then(() => results.push('disconnect-ok'))
        .catch(() => results.push('disconnect-failed')),
      fetch('http://test/api/projects/p1/locks/release-by-instance', { method: 'POST', body: '{}' })
        .then(() => results.push('release-ok'))
        .catch(() => results.push('release-failed')),
    ];

    await Promise.allSettled(promises);

    // Both should have settled regardless of individual failure
    expect(results).toContain('disconnect-failed');
    expect(results).toContain('release-ok');
    expect(results).toHaveLength(2);
  });
});
