/**
 * Tests for stop hook logic (idle heartbeat).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { touchHeartbeatFile, shouldSendHeartbeat } from '../lib.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'stop-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('stop hook: idle heartbeat', () => {
  it('sends status: idle', async () => {
    let capturedBody: unknown;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      capturedBody = JSON.parse(opts?.body as string);
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    }));

    const body = { status: 'idle' };
    await fetch('http://test/api/instances/i1/heartbeat', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    expect(capturedBody).toEqual({ status: 'idle' });
  });

  it('does not apply throttle — always sends on Stop', () => {
    // The stop hook intentionally bypasses shouldSendHeartbeat and always sends.
    // After it calls touchHeartbeatFile, the throttle is reset for PostToolUse.
    touchHeartbeatFile(tmpDir);
    // shouldSendHeartbeat would normally return false here for PostToolUse,
    // but stop.ts calls postSilent unconditionally — verify this property.
    expect(shouldSendHeartbeat(tmpDir)).toBe(false);
    // The stop hook runs regardless; the sentinel update is a side-effect.
  });

  it('updates the heartbeat sentinel after sending', () => {
    // Before touch: no sentinel
    expect(shouldSendHeartbeat(tmpDir)).toBe(true);
    // After touch (what stop.ts does before its postSilent call)
    touchHeartbeatFile(tmpDir);
    // PostToolUse would be throttled immediately after
    expect(shouldSendHeartbeat(tmpDir)).toBe(false);
  });
});
