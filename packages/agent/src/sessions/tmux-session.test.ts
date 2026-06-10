/**
 * Regression tests for credential isolation (web bug 2026-06-10: "Claude asks
 * to log in again on every session").
 *
 * Root cause: the isolated CLAUDE_CONFIG_DIR had no `.claude.json` — that
 * file lives at the CONFIG ROOT (not inside ~/.claude/), so the symlinking of
 * ~/.claude entries never covered it. Every session booted with virgin
 * onboarding state and an unapproved API key → login screen each time.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TmuxSession } from './tmux-session.js';
import { createLogger } from '../utils/logger.js';

process.env.NODE_ENV = 'production';

const logger = createLogger('fatal');

function makeSession(credentialEnv: Record<string, string>): TmuxSession {
  return new TmuxSession({
    sessionId: 'test-session',
    claudePath: '/usr/bin/false',
    mode: 'interactive',
    logger,
    credentialEnv,
  });
}

/** Invoke the private isolation step without starting tmux. */
function prepareIsolation(session: TmuxSession): void {
  (
    session as unknown as { prepareCredentialIsolation: () => void }
  ).prepareCredentialIsolation();
}

describe('TmuxSession — credential isolation', () => {
  let configDir: string;

  beforeEach(() => {
    configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cn-cred-test-'));
  });

  afterEach(() => {
    fs.rmSync(configDir, { recursive: true, force: true });
  });

  it('seeds .claude.json so Claude Code skips onboarding/login (API key)', () => {
    const apiKey = 'sk-ant-api03-test-0123456789abcdefghij';
    const credentialEnv: Record<string, string> = {
      ANTHROPIC_API_KEY: apiKey,
      CLAUDE_CONFIG_DIR: configDir,
    };

    prepareIsolation(makeSession(credentialEnv));

    const stateFile = path.join(configDir, '.claude.json');
    expect(fs.existsSync(stateFile)).toBe(true);

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    expect(state.hasCompletedOnboarding).toBe(true);
    // Claude Code identifies approved API keys by their last 20 characters.
    expect(state.customApiKeyResponses.approved).toContain(apiKey.slice(-20));
  });

  it('writes a complete .credentials.json for OAuth and strips transport vars', () => {
    const credentialEnv: Record<string, string> = {
      CLAUDE_CODE_OAUTH_TOKEN: 'access-token-abc',
      CLAUDE_CODE_OAUTH_REFRESH_TOKEN: 'refresh-token-def',
      CLAUDE_CODE_OAUTH_EXPIRES_AT: '1781200000000',
      CLAUDE_CONFIG_DIR: configDir,
    };

    prepareIsolation(makeSession(credentialEnv));

    const creds = JSON.parse(
      fs.readFileSync(path.join(configDir, '.credentials.json'), 'utf8'),
    );
    expect(creds.claudeAiOauth.accessToken).toBe('access-token-abc');
    expect(creds.claudeAiOauth.refreshToken).toBe('refresh-token-def');
    expect(creds.claudeAiOauth.expiresAt).toBe(1781200000000);
    expect(Array.isArray(creds.claudeAiOauth.scopes)).toBe(true);

    // Transport-only vars must not leak into the session environment.
    expect(credentialEnv.CLAUDE_CODE_OAUTH_TOKEN).toBeUndefined();
    expect(credentialEnv.CLAUDE_CODE_OAUTH_REFRESH_TOKEN).toBeUndefined();
    expect(credentialEnv.CLAUDE_CODE_OAUTH_EXPIRES_AT).toBeUndefined();
    expect(credentialEnv.CLAUDE_CONFIG_DIR).toBe(configDir);

    // OAuth sessions also need the onboarding seed.
    const state = JSON.parse(
      fs.readFileSync(path.join(configDir, '.claude.json'), 'utf8'),
    );
    expect(state.hasCompletedOnboarding).toBe(true);
  });

  it('omits refreshToken/expiresAt when the credential has none', () => {
    const credentialEnv: Record<string, string> = {
      CLAUDE_CODE_OAUTH_TOKEN: 'access-only',
      CLAUDE_CONFIG_DIR: configDir,
    };

    prepareIsolation(makeSession(credentialEnv));

    const creds = JSON.parse(
      fs.readFileSync(path.join(configDir, '.credentials.json'), 'utf8'),
    );
    expect(creds.claudeAiOauth.accessToken).toBe('access-only');
    expect(creds.claudeAiOauth).not.toHaveProperty('refreshToken');
    expect(creds.claudeAiOauth).not.toHaveProperty('expiresAt');
  });

  it('preserves existing approved keys when seeding on top of prior state', () => {
    fs.writeFileSync(
      path.join(configDir, '.claude.json'),
      JSON.stringify({
        theme: 'dark',
        customApiKeyResponses: { approved: ['previously-approved-1'], rejected: [] },
      }),
    );
    const apiKey = 'sk-ant-api03-test-zzzzzzzzzzzzzzzzzzzz';

    prepareIsolation(
      makeSession({ ANTHROPIC_API_KEY: apiKey, CLAUDE_CONFIG_DIR: configDir }),
    );

    const state = JSON.parse(
      fs.readFileSync(path.join(configDir, '.claude.json'), 'utf8'),
    );
    expect(state.theme).toBe('dark');
    expect(state.customApiKeyResponses.approved).toContain('previously-approved-1');
    expect(state.customApiKeyResponses.approved).toContain(apiKey.slice(-20));
  });
});
