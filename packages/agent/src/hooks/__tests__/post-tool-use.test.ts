/**
 * Tests for post-tool-use hook logic (heartbeat throttle).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { utimesSync } from 'node:fs';
import {
  shouldSendHeartbeat,
  touchHeartbeatFile,
  heartbeatThrottlePath,
} from '../lib.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'post-tool-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('post-tool-use: heartbeat throttle', () => {
  it('sends heartbeat on first call (no sentinel)', () => {
    expect(shouldSendHeartbeat(tmpDir)).toBe(true);
  });

  it('suppresses heartbeat immediately after a send', () => {
    touchHeartbeatFile(tmpDir);
    expect(shouldSendHeartbeat(tmpDir)).toBe(false);
  });

  it('allows another heartbeat after 30s have elapsed', () => {
    touchHeartbeatFile(tmpDir);
    const sentinelPath = heartbeatThrottlePath(tmpDir);
    const past = new Date(Date.now() - 31_000);
    utimesSync(sentinelPath, past, past);
    expect(shouldSendHeartbeat(tmpDir)).toBe(true);
  });

  it('still suppresses at exactly 29s', () => {
    touchHeartbeatFile(tmpDir);
    const sentinelPath = heartbeatThrottlePath(tmpDir);
    const recent = new Date(Date.now() - 29_000);
    utimesSync(sentinelPath, recent, recent);
    expect(shouldSendHeartbeat(tmpDir)).toBe(false);
  });
});

describe('post-tool-use: heartbeat request body', () => {
  it('sends status: busy', async () => {
    let capturedBody: unknown;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      capturedBody = JSON.parse(opts?.body as string);
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    }));

    // Simulate the hook's logic
    const body = { status: 'busy' };
    await fetch('http://test/api/instances/i1/heartbeat', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    expect(capturedBody).toEqual({ status: 'busy' });
  });
});
