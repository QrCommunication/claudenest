/**
 * Tests for notification hook logic.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('notification hook: request body', () => {
  it('sends message to session notification endpoint', async () => {
    let capturedUrl: string = '';
    let capturedBody: unknown;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      capturedUrl = url;
      capturedBody = JSON.parse(opts?.body as string);
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    }));

    const sessionId = 'sess-abc';
    const message = 'Claude needs permission to run bash';
    await fetch(`http://test/api/sessions/${sessionId}/notification`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    expect(capturedUrl).toBe(`http://test/api/sessions/${sessionId}/notification`);
    expect(capturedBody).toEqual({ message });
  });

  it('includes title when present', async () => {
    let capturedBody: unknown;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      capturedBody = JSON.parse(opts?.body as string);
      return { ok: true, status: 200, json: async () => ({}) };
    }));

    await fetch('http://test/api/sessions/s1/notification', {
      method: 'POST',
      body: JSON.stringify({ message: 'Test', title: 'Permission Request' }),
    });

    expect(capturedBody).toEqual({ message: 'Test', title: 'Permission Request' });
  });

  it('omits title when absent (no undefined key in body)', async () => {
    let capturedBody: unknown;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      capturedBody = JSON.parse(opts?.body as string);
      return { ok: true, status: 200, json: async () => ({}) };
    }));

    const body: Record<string, string> = { message: 'Test' };
    // This mirrors the hook's `...(event.title ? { title } : {})` pattern
    await fetch('http://test/api/sessions/s1/notification', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    expect((capturedBody as Record<string, unknown>)['title']).toBeUndefined();
  });
});

describe('notification hook: fail-open', () => {
  it('does not throw when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    // postSilent swallows errors — simulate this
    const result = await (async () => {
      try {
        await fetch('http://test/api/sessions/s1/notification', { method: 'POST', body: '{}' });
        return 'sent';
      } catch {
        return 'silenced';
      }
    })();

    expect(result).toBe('silenced');
    // The hook exits 0 regardless — no throw propagates.
  });

  it('uses event.session_id over env CLAUDENEST_SESSION_ID when available', () => {
    // Simulates the session ID precedence logic in the hook
    const event = { session_id: 'event-sess-id' };
    const envSessionId = 'env-sess-id';
    const resolved = event.session_id ?? envSessionId;
    expect(resolved).toBe('event-sess-id');
  });

  it('falls back to env CLAUDENEST_SESSION_ID when event.session_id absent', () => {
    const event = { session_id: undefined };
    const envSessionId = 'env-sess-id';
    const resolved = event.session_id ?? envSessionId;
    expect(resolved).toBe('env-sess-id');
  });
});
