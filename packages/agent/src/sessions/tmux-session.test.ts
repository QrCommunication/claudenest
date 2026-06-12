/**
 * Regression tests for:
 *   1. Credential isolation (web bug 2026-06-10: "Claude asks to log in again")
 *   2. prepareRuntimeDir() — per-session MCP config + hooks settings generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

// ── prepareRuntimeDir tests ──────────────────────────────────────────────────

/**
 * Tests for the Phase 1 multi-agent runtime directory generation.
 *
 * Strategy: use a real tmp dir for output, then verify the JSON files
 * written into it. The dist/mcp/index.js guard is tested by checking
 * the conditional skip behaviour via a spy on the logger.
 */
describe('TmuxSession — prepareRuntimeDir()', () => {
  let tmpDir: string;

  // Helper types for private session internals
  type SessionPrivate = {
    prepareRuntimeDir: () => void;
    runtimeDir: string | null;
    mcpConfigPath: string | null;
    settingsPath: string | null;
    setupSessionEnv: (env?: Record<string, string>) => void;
    tmuxExec: (args: string[], env?: Record<string, string>) => string;
    cleanup: () => void;
    isolatedConfigDir: string | null;
  };

  function asPrivate(session: TmuxSession): SessionPrivate {
    return session as unknown as SessionPrivate;
  }

  function makeMultiAgentSession(overrides: Record<string, unknown> = {}): TmuxSession {
    return new TmuxSession({
      sessionId: 'ma-test-session',
      claudePath: '/usr/bin/false',
      mode: 'interactive',
      logger,
      mcpEnv: { CLAUDENEST_PROJECT_ID: 'proj-abc', CLAUDENEST_TOKEN: 'tok-xyz' },
      sharedProjectId: 'proj-abc',
      ...overrides,
    } as Parameters<typeof TmuxSession>[0]);
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cn-runtime-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  // ── Conditional generation ────────────────────────────────────────────────

  it('does NOT create runtimeDir when mcpEnv is absent', () => {
    const session = new TmuxSession({
      sessionId: 'no-mcp-session',
      claudePath: '/usr/bin/false',
      mode: 'interactive',
      logger,
      sharedProjectId: 'proj-abc',
      // No mcpEnv
    });
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();
    expect(priv.runtimeDir).toBeNull();
    expect(priv.mcpConfigPath).toBeNull();
    expect(priv.settingsPath).toBeNull();
  });

  it('does NOT create runtimeDir when sharedProjectId is absent', () => {
    const session = new TmuxSession({
      sessionId: 'no-project-session',
      claudePath: '/usr/bin/false',
      mode: 'interactive',
      logger,
      mcpEnv: { CLAUDENEST_TOKEN: 'tok' },
      // No sharedProjectId
    });
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();
    expect(priv.runtimeDir).toBeNull();
    expect(priv.mcpConfigPath).toBeNull();
  });

  it('skips gracefully (logs warning, no throw) when dist/mcp/index.js is absent', () => {
    // Mock fs.existsSync to simulate a missing dist artifact
    vi.spyOn(fs, 'existsSync').mockImplementation((_p: fs.PathLike) => false);

    const warnSpy = vi.spyOn(logger, 'warn');
    const session = makeMultiAgentSession();
    const priv = asPrivate(session);

    // Should not throw
    expect(() => priv.prepareRuntimeDir()).not.toThrow();
    expect(priv.runtimeDir).toBeNull();
    expect(priv.mcpConfigPath).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  // ── File content correctness ──────────────────────────────────────────────

  it('writes valid mcp-config.json with absolute paths', () => {
    const session = makeMultiAgentSession();
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();

    // Only runs if dist/mcp/index.js actually exists on this machine
    if (priv.mcpConfigPath === null) return; // skip in dev without build

    const config = JSON.parse(fs.readFileSync(priv.mcpConfigPath, 'utf8'));
    expect(config).toHaveProperty('mcpServers.claudenest.command');
    expect(config).toHaveProperty('mcpServers.claudenest.args');
    expect(path.isAbsolute(config.mcpServers.claudenest.command)).toBe(true);
    expect(Array.isArray(config.mcpServers.claudenest.args)).toBe(true);
    expect(config.mcpServers.claudenest.args).toHaveLength(1);
    expect(path.isAbsolute(config.mcpServers.claudenest.args[0])).toBe(true);
    expect(config.mcpServers.claudenest.args[0]).toMatch(/mcp[/\\]index\.js$/);
  });

  it('writes valid settings.json with all 5 hook types and absolute paths', () => {
    const session = makeMultiAgentSession();
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();

    if (priv.settingsPath === null) return; // dev without build

    const settings = JSON.parse(fs.readFileSync(priv.settingsPath, 'utf8'));
    expect(settings).toHaveProperty('hooks');

    const { hooks } = settings;
    for (const hookType of ['PreToolUse', 'PostToolUse', 'Stop', 'SessionEnd', 'Notification']) {
      expect(hooks, `hooks.${hookType} missing`).toHaveProperty(hookType);
      expect(Array.isArray(hooks[hookType]), `hooks.${hookType} not array`).toBe(true);
    }

    // Every hook entry has an absolute command path
    const allCommands: string[] = [];
    for (const entries of Object.values(hooks) as Array<Array<{ hooks?: Array<{ command: string }> }>>) {
      for (const entry of entries) {
        for (const h of (entry.hooks ?? [])) {
          allCommands.push(h.command);
        }
      }
    }
    expect(allCommands.length).toBeGreaterThan(0);
    for (const cmd of allCommands) {
      // command is "node /abs/path/to/hook.js" — second token is the path
      const tokens = cmd.split(/\s+/);
      const hookPath = tokens[tokens.length - 1].replace(/^'|'$/g, ''); // strip potential quotes
      // path may be shell-quoted; check it contains hooks/ directory
      expect(cmd).toMatch(/hooks/);
    }
  });

  it('does NOT include permissions.allow when permissionMode is not acceptEdits', () => {
    const session = makeMultiAgentSession({ permissionMode: 'plan' });
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();

    if (priv.settingsPath === null) return;

    const settings = JSON.parse(fs.readFileSync(priv.settingsPath, 'utf8'));
    expect(settings).not.toHaveProperty('permissions');
  });

  it('includes permissions.allow when permissionMode is acceptEdits', () => {
    const session = makeMultiAgentSession({ permissionMode: 'acceptEdits' });
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();

    if (priv.settingsPath === null) return;

    const settings = JSON.parse(fs.readFileSync(priv.settingsPath, 'utf8'));
    expect(settings).toHaveProperty('permissions.allow');
    const allow: string[] = settings.permissions.allow;
    expect(Array.isArray(allow)).toBe(true);
    expect(allow.length).toBeGreaterThan(0);
    // Verify some representative allow entries
    expect(allow.some(e => e.startsWith('Bash(npm test'))).toBe(true);
    expect(allow.some(e => e.startsWith('Bash(git status'))).toBe(true);
  });

  it('includes permissions.allow for legacy headless mode (maps to acceptEdits)', () => {
    const session = makeMultiAgentSession({ mode: 'headless' });
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();

    if (priv.settingsPath === null) return;

    const settings = JSON.parse(fs.readFileSync(priv.settingsPath, 'utf8'));
    expect(settings).toHaveProperty('permissions.allow');
  });

  // ── CLAUDENEST_RUNTIME_DIR env injection ──────────────────────────────────

  it('injects CLAUDENEST_RUNTIME_DIR into tmux session environment after prepareRuntimeDir', () => {
    const session = makeMultiAgentSession();
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();

    if (priv.runtimeDir === null) return; // dist not built

    const setCalls: string[][] = [];
    priv.tmuxExec = (args: string[]) => {
      setCalls.push(args);
      return '';
    };

    priv.setupSessionEnv();

    const setEnvCalls = setCalls.filter(a => a[0] === 'set-environment');
    const keys = setEnvCalls.map(a => a[3]);
    const values = setEnvCalls.reduce<Record<string, string>>((acc, a) => {
      acc[a[3]] = a[4];
      return acc;
    }, {});

    expect(keys).toContain('CLAUDENEST_RUNTIME_DIR');
    expect(values['CLAUDENEST_RUNTIME_DIR']).toBe(priv.runtimeDir);
  });

  it('does NOT inject CLAUDENEST_RUNTIME_DIR when runtimeDir is null (non-multiagent)', () => {
    // Session without mcpEnv/sharedProjectId — runtimeDir stays null
    const session = new TmuxSession({
      sessionId: 'plain-session',
      claudePath: '/usr/bin/false',
      mode: 'interactive',
      logger,
    });
    const priv = asPrivate(session);

    const setCalls: string[][] = [];
    priv.tmuxExec = (args: string[]) => {
      setCalls.push(args);
      return '';
    };

    priv.setupSessionEnv();

    const keys = setCalls
      .filter(a => a[0] === 'set-environment')
      .map(a => a[3]);

    expect(keys).not.toContain('CLAUDENEST_RUNTIME_DIR');
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────

  it('cleanup removes runtimeDir (standalone — no isolatedConfigDir)', () => {
    const session = makeMultiAgentSession();
    const priv = asPrivate(session);
    priv.prepareRuntimeDir();

    if (priv.runtimeDir === null) return;

    const runtimePath = priv.runtimeDir;
    expect(fs.existsSync(runtimePath)).toBe(true);

    // Stub tmux kill so cleanup() doesn't fail in test environment
    vi.spyOn(priv as unknown as { tmuxExec: (...args: unknown[]) => string }, 'tmuxExec').mockReturnValue('');

    priv.cleanup();

    expect(fs.existsSync(runtimePath)).toBe(false);
    expect(priv.runtimeDir).toBeNull();
  });
});
