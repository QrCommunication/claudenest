import { describe, it, expect, beforeEach } from 'vitest';
import { isAuthError, shouldSignalAuthError, forgetAuthError } from './auth-error.js';

describe('auth-error detection', () => {
  it('matches the Claude 401 / login signatures', () => {
    expect(isAuthError('● Please run /login · API Error: 401 Invalid authentication credentials')).toBe(true);
    expect(isAuthError('Invalid authentication credentials')).toBe(true);
    expect(isAuthError('OAuth token has expired')).toBe(true);
  });

  it('ignores normal output', () => {
    expect(isAuthError('Editing file src/app.ts')).toBe(false);
    expect(isAuthError('')).toBe(false);
    expect(isAuthError('200 OK')).toBe(false);
  });

  describe('shouldSignalAuthError (debounced)', () => {
    beforeEach(() => {
      forgetAuthError('s1');
    });

    it('signals once then debounces within the window', () => {
      const t0 = 1_000_000;
      expect(shouldSignalAuthError('s1', 'Please run /login', t0)).toBe(true);
      // Repeated errors in the same window are suppressed.
      expect(shouldSignalAuthError('s1', 'Please run /login', t0 + 5_000)).toBe(false);
      // After the debounce window it signals again.
      expect(shouldSignalAuthError('s1', 'Please run /login', t0 + 61_000)).toBe(true);
    });

    it('does not signal on non-auth output', () => {
      expect(shouldSignalAuthError('s1', 'all good', 2_000_000)).toBe(false);
    });

    it('tracks sessions independently', () => {
      const t = 3_000_000;
      expect(shouldSignalAuthError('a', 'Please run /login', t)).toBe(true);
      expect(shouldSignalAuthError('b', 'Please run /login', t)).toBe(true);
    });
  });
});
