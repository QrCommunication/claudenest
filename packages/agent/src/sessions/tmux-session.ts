/**
 * Claude Code session via tmux control mode.
 *
 * Replaces node-pty with pure child_process pipes:
 *   - Zero native modules (no node-gyp, no N-API bridge)
 *   - Sessions survive agent crashes (tmux persistence)
 *   - Input via send-keys -H (hex-encoded, binary safe)
 *   - Output via %output events (structured, no raw PTY parsing)
 *   - Dedicated socket (-L claudenest) isolates from user's tmux
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, spawn, type ChildProcess } from 'child_process';
import { TmuxOutputParser, type TmuxOutputEvent } from './tmux-parser.js';
import { getCacheDir } from '../utils/index.js';
import type { Logger } from '../utils/logger.js';
import type { SessionConfig, SessionStatus } from '../types/index.js';

export const TMUX_SOCKET = 'claudenest';
export const SESSION_PREFIX = 'cn-';

interface TmuxSessionOptions extends SessionConfig {
  claudePath: string;
  sessionId: string;
  logger: Logger;
}

export class TmuxSession extends EventEmitter {
  private controller: ChildProcess | null = null;
  private parser: TmuxOutputParser;
  private options: TmuxSessionOptions;
  private logger: Logger;
  private status: SessionStatus = 'created';
  private exitCode: number | null = null;
  private outputBuffer: string[] = [];
  private readonly maxBufferSize = 10000;
  private tmuxName: string;
  private isolatedConfigDir: string | null = null;
  /** Last requested terminal size, re-applied to the control client on attach. */
  private clientSize: { cols: number; rows: number } | null = null;
  /**
   * Path to the generated MCP config JSON (`--mcp-config`).
   * Null in Phase 0; populated by prepareRuntimeDir in Phase 1.
   */
  private mcpConfigPath: string | null = null;
  /**
   * Path to the generated Claude settings JSON (`--settings`).
   * Null in Phase 0; populated by prepareRuntimeDir in Phase 1.
   */
  private settingsPath: string | null = null;

  /**
   * Per-session runtime directory (~/.cache/claudenest/sessions/{id}/runtime).
   * Created by prepareRuntimeDir() only when mcpEnv + sharedProjectId are both set.
   * May overlap with isolatedConfigDir's parent — cleanup handles both independently.
   */
  private runtimeDir: string | null = null;

  pid?: number;

  constructor(options: TmuxSessionOptions) {
    super();
    this.options = options;
    this.tmuxName = `${SESSION_PREFIX}${options.sessionId}`;
    this.parser = new TmuxOutputParser();
    this.logger = options.logger.child({
      component: 'TmuxSession',
      sessionId: options.sessionId,
    });
    this.setupParserEvents();
  }

  async start(): Promise<void> {
    if (this.controller) {
      throw new Error('Session already started');
    }

    this.logger.info('Starting tmux session');
    this.setStatus('starting');

    const cols = this.options.ptySize?.cols || 120;
    const rows = this.options.ptySize?.rows || 40;
    this.clientSize = { cols, rows };
    const cleanEnv = buildCleanProcessEnv();

    try {
      checkTmuxAvailable();

      // 0. Prepare credential isolation (creates isolated CLAUDE_CONFIG_DIR)
      this.prepareCredentialIsolation();

      // 0b. Prepare per-session runtime dir (MCP config + hooks + env injection)
      //     Only runs when both mcpEnv and sharedProjectId are present (multi-agent).
      this.prepareRuntimeDir();

      // 1. Create detached tmux session
      //    If the tmux server for this socket isn't running yet,
      //    it starts with cleanEnv (no Claude/Anthropic vars).
      const newArgs = [
        'new-session', '-d',
        '-s', this.tmuxName,
        '-x', String(cols),
        '-y', String(rows),
      ];
      if (this.options.projectPath) {
        newArgs.push('-c', this.options.projectPath);
      }
      this.tmuxExec(newArgs, cleanEnv);

      // 2. Set session-specific environment variables.
      //    These override the server's global env for this session
      //    and are inherited by respawn-pane below.
      this.setupSessionEnv(cleanEnv);

      // 3. Start claude via respawn-pane (replaces the default shell).
      //    exec ensures claude IS the pane process (clean exit).
      const shellCmd = this.buildShellCommand();
      this.logger.info({ cmd: shellCmd }, 'Starting claude in tmux pane');

      const respawnArgs = ['respawn-pane', '-k', '-t', this.tmuxName];
      if (this.options.projectPath) {
        respawnArgs.push('-c', this.options.projectPath);
      }
      respawnArgs.push(shellCmd);
      this.tmuxExec(respawnArgs, cleanEnv);

      // 4. Get the PID of the claude process running inside the pane
      const pidStr = this.tmuxExec(
        ['display-message', '-t', this.tmuxName, '-p', '#{pane_pid}'],
        cleanEnv,
      ).trim();
      this.pid = parseInt(pidStr, 10) || undefined;

      this.logger.info({ pid: this.pid, tmux: this.tmuxName }, 'tmux session created');

      // 5. Attach in control mode for structured I/O
      this.attachControlMode();

      this.setStatus('running');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to start tmux session');
      this.setStatus('error');
      this.cleanup();
      throw error;
    }
  }

  async terminate(signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
    if (!this.controller && this.status === 'terminated') {
      return;
    }

    this.logger.info({ signal }, 'Terminating tmux session');
    this.setStatus('terminated');

    if (signal !== 'SIGKILL') {
      // Graceful: send C-c to claude and wait briefly
      try {
        this.controller?.stdin?.write(`send-keys -t ${this.tmuxName} C-c\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch {
        // Ignore errors during graceful shutdown
      }
    }

    this.cleanup();
  }

  write(data: string): void {
    if (!this.controller) {
      throw new Error('Session not started');
    }

    if (this.status !== 'running' && this.status !== 'waiting_input') {
      this.logger.warn({ status: this.status }, `Cannot write in status: ${this.status}`);
      return;
    }

    // Hex-encode every byte for binary-safe transmission
    const hex = Buffer.from(data)
      .toString('hex')
      .match(/../g)!
      .join(' ');

    this.controller.stdin?.write(`send-keys -H -t ${this.tmuxName} ${hex}\n`);
  }

  resize(cols: number, rows: number): void {
    this.clientSize = { cols, rows };
    if (!this.controller) return;

    this.logger.debug({ cols, rows }, `Resizing to ${cols}x${rows}`);

    // In tmux control mode the WINDOW size is driven by the attached control
    // client's reported size — `resize-window` alone is overridden by it, so the
    // pane (and Claude Code inside it) stays at the control client's default
    // width while the mobile xterm displays a different width. That mismatch is
    // what makes Ink's in-place redraws stack ("input multiplies") and floods
    // the wire with mis-aligned full-frame redraws (the latency).
    //
    // `refresh-client -C <cols>x<rows>` sets the control client's size so tmux
    // resizes the window+pane to match. resize-window is kept as a belt-and-
    // suspenders for `window-size manual` setups.
    this.controller.stdin?.write(`refresh-client -C ${cols}x${rows}\n`);
    this.controller.stdin?.write(
      `resize-window -t ${this.tmuxName} -x ${cols} -y ${rows}\n`,
    );
  }

  getStatus(): SessionStatus {
    return this.status;
  }

  getExitCode(): number | null {
    return this.exitCode;
  }

  getOutputBuffer(): string[] {
    return [...this.outputBuffer];
  }

  clearBuffer(): void {
    this.outputBuffer = [];
  }

  /**
   * Reattach to an existing tmux session (after agent crash).
   */
  async reattach(): Promise<void> {
    if (this.controller) {
      throw new Error('Already attached');
    }

    this.logger.info({ tmux: this.tmuxName }, 'Reattaching to existing tmux session');

    try {
      const pidStr = this.tmuxExec(
        ['display-message', '-t', this.tmuxName, '-p', '#{pane_pid}'],
      ).trim();
      this.pid = parseInt(pidStr, 10) || undefined;
    } catch {
      this.setStatus('error');
      throw new Error(`tmux session ${this.tmuxName} not found`);
    }

    // Capture current visible pane content for output buffer
    try {
      const content = this.tmuxExec(
        ['capture-pane', '-t', this.tmuxName, '-p', '-e'],
      );
      if (content.trim()) {
        this.outputBuffer.push(content);
      }
    } catch {
      // Non-critical
    }

    this.attachControlMode();
    this.setStatus('running');
  }

  /**
   * List orphaned tmux sessions on the claudenest socket.
   */
  static listOrphanSessions(): string[] {
    try {
      const output = execFileSync('tmux', [
        '-L', TMUX_SOCKET,
        'list-sessions', '-F', '#{session_name}',
      ]).toString().trim();
      if (!output) return [];
      return output.split('\n').filter(n => n.startsWith(SESSION_PREFIX));
    } catch {
      return [];
    }
  }

  static sessionIdFromTmuxName(tmuxName: string): string {
    return tmuxName.slice(SESSION_PREFIX.length);
  }

  // ── Private ───────────────────────────────────────

  /**
   * When credentialEnv is provided, create an isolated config directory
   * so Claude Code cannot read the machine's default ~/.claude/.credentials.json.
   *
   * - For API keys: the empty config dir forces Claude to fall back to ANTHROPIC_API_KEY env var.
   * - For OAuth: writes a synthetic .credentials.json in Claude Code's expected format.
   */
  private prepareCredentialIsolation(): void {
    const credEnv = this.options.credentialEnv;
    if (!credEnv) return;

    const hasApiKey = !!credEnv['ANTHROPIC_API_KEY'];
    const hasOAuth = !!credEnv['CLAUDE_CODE_OAUTH_TOKEN'];

    if (!hasApiKey && !hasOAuth) return;

    // Use existing CLAUDE_CONFIG_DIR if already set, otherwise create a session-specific one
    let configDir = credEnv['CLAUDE_CONFIG_DIR'];
    if (!configDir) {
      configDir = path.join(getCacheDir(), 'sessions', this.options.sessionId);
    }

    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    this.isolatedConfigDir = configDir;

    // Isolating CLAUDE_CONFIG_DIR also hides the user's skills, plugins,
    // settings and CLAUDE.md (all under the real ~/.claude). Symlink them into
    // the isolated dir so the session keeps full functionality — only the
    // credentials stay isolated (we write our own .credentials.json below).
    this.linkUserConfigInto(configDir);

    // For OAuth: write .credentials.json in Claude Code's native format.
    // An accessToken alone is treated as a degraded login; refreshToken and
    // expiresAt (forwarded by the server when the credential has them) let
    // Claude Code see a complete, non-expired session instead of prompting
    // for /login.
    if (hasOAuth) {
      const expiresAtMs = Number(credEnv['CLAUDE_CODE_OAUTH_EXPIRES_AT']);
      const credsFile = path.join(configDir, '.credentials.json');
      const credsData = JSON.stringify({
        claudeAiOauth: {
          accessToken: credEnv['CLAUDE_CODE_OAUTH_TOKEN'],
          ...(credEnv['CLAUDE_CODE_OAUTH_REFRESH_TOKEN']
            ? { refreshToken: credEnv['CLAUDE_CODE_OAUTH_REFRESH_TOKEN'] }
            : {}),
          ...(Number.isFinite(expiresAtMs) && expiresAtMs > 0
            ? { expiresAt: expiresAtMs }
            : {}),
          scopes: ['user:inference', 'user:profile'],
        },
      });
      fs.writeFileSync(credsFile, credsData, { mode: 0o600 });
      // Remove transport-only env vars — Claude Code reads the file
      delete credEnv['CLAUDE_CODE_OAUTH_TOKEN'];
      delete credEnv['CLAUDE_CODE_OAUTH_REFRESH_TOKEN'];
      delete credEnv['CLAUDE_CODE_OAUTH_EXPIRES_AT'];
    }

    // Seed the onboarding/approval state — without it Claude Code re-runs
    // onboarding and shows the login screen on EVERY session.
    this.seedClaudeState(
      configDir,
      hasApiKey ? credEnv['ANTHROPIC_API_KEY'] : undefined,
    );

    // Force Claude Code to use the isolated config directory
    credEnv['CLAUDE_CONFIG_DIR'] = configDir;

    this.logger.info(
      { configDir, hasApiKey, hasOAuth },
      'Credential isolation: created isolated config dir',
    );
  }

  /**
   * Creates a per-session runtime directory and writes the MCP server config
   * and Claude Code hooks settings JSON into it.
   *
   * Only runs when BOTH `mcpEnv` and `sharedProjectId` are set (multi-agent
   * sessions). In all other cases the method returns immediately — fail-open:
   * the session launches without MCP or hooks rather than refusing to start.
   *
   * If the compiled `dist/mcp/index.js` artifact is absent (e.g. a dev machine
   * that hasn't run `npm run build` yet) the method also bails with a warning
   * so that the session still starts.
   *
   * Layout written under runtimeDir:
   *   mcp-config.json   → declares the ClaudeNest MCP stdio server
   *   settings.json     → declares PreToolUse/PostToolUse/Stop/SessionEnd/Notification hooks
   *                       + optional permissions.allow block for acceptEdits mode
   */
  private prepareRuntimeDir(): void {
    if (!this.options.mcpEnv || !this.options.sharedProjectId) return;

    // Resolve compiled dist root from this file's location.
    // At runtime:  dist/sessions/tmux-session.js
    //   dirname  → dist/sessions
    //   resolve(..) → dist
    const selfDir = path.dirname(fileURLToPath(import.meta.url));
    const distRoot = path.resolve(selfDir, '..');
    const mcpEntry = path.join(distRoot, 'mcp', 'index.js');
    const hooksDir = path.join(distRoot, 'hooks');

    // Guard: bail out if the compiled MCP server isn't present on disk.
    if (!fs.existsSync(mcpEntry)) {
      this.logger.warn(
        { mcpEntry },
        'prepareRuntimeDir: dist/mcp/index.js not found — skipping MCP/hooks setup (run npm run build)',
      );
      return;
    }

    // Create runtime dir at ~/.cache/claudenest/sessions/{sessionId}/runtime
    const runtimeDir = path.join(
      getCacheDir(), 'sessions', this.options.sessionId, 'runtime',
    );
    fs.mkdirSync(runtimeDir, { recursive: true, mode: 0o700 });
    this.runtimeDir = runtimeDir;

    // ── mcp-config.json ─────────────────────────────────────────────────────
    // Claude Code picks this up via --mcp-config and spawns the MCP server as
    // a child process. The session's tmux environment (including CLAUDENEST_*)
    // is inherited, so we don't need to duplicate any secrets here.
    const mcpConfig = {
      mcpServers: {
        claudenest: {
          command: process.execPath,
          args: [mcpEntry],
        },
      },
    };
    const mcpConfigPath = path.join(runtimeDir, 'mcp-config.json');
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), { mode: 0o600 });
    this.mcpConfigPath = mcpConfigPath;

    // ── settings.json ────────────────────────────────────────────────────────
    // Each hook command is a string: "node /path/to/hook.js"
    // shellQuote handles paths with spaces; process.execPath is usually safe
    // but we quote it for robustness.
    const cmd = (hookFile: string): string =>
      `${shellQuote(process.execPath)} ${shellQuote(path.join(hooksDir, hookFile))}`;

    const hooks: Record<string, unknown[]> = {
      PreToolUse: [
        {
          matcher: 'Edit|Write|MultiEdit|NotebookEdit',
          hooks: [{ type: 'command', command: cmd('pre-tool-use.js'), timeout: 10 }],
        },
      ],
      PostToolUse: [
        {
          matcher: '*',
          hooks: [{ type: 'command', command: cmd('post-tool-use.js'), timeout: 5 }],
        },
      ],
      Stop: [
        { hooks: [{ type: 'command', command: cmd('stop.js'), timeout: 5 }] },
      ],
      SessionEnd: [
        { hooks: [{ type: 'command', command: cmd('session-end.js'), timeout: 5 }] },
      ],
      Notification: [
        { hooks: [{ type: 'command', command: cmd('notification.js'), timeout: 5 }] },
      ],
    };

    const settings: Record<string, unknown> = { hooks };

    // In acceptEdits mode, inject an allow-list so the hooks (pre-tool-use in
    // particular) can run test/lint/build commands without an approval dialog.
    const permissionMode =
      this.options.permissionMode ??
      (this.options.mode === 'headless' || this.options.mode === 'oneshot'
        ? 'acceptEdits'
        : undefined);
    if (permissionMode === 'acceptEdits') {
      settings['permissions'] = {
        allow: [
          'Bash(npm test:*)',
          'Bash(npm run test:*)',
          'Bash(npm run lint:*)',
          'Bash(npm run build:*)',
          'Bash(pnpm test:*)',
          'Bash(pnpm run:*)',
          'Bash(php artisan test:*)',
          'Bash(composer test:*)',
          'Bash(git status:*)',
          'Bash(git diff:*)',
          'Bash(git log:*)',
          'Bash(git add:*)',
        ],
      };
    }

    const settingsPath = path.join(runtimeDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), { mode: 0o600 });
    this.settingsPath = settingsPath;

    this.logger.info(
      { runtimeDir, mcpConfigPath, settingsPath },
      'Runtime dir prepared (MCP config + hooks settings)',
    );
  }

  /**
   * Seed `.claude.json` in the isolated config dir. Claude Code keeps its
   * onboarding/approval state there — at the CONFIG ROOT, not inside
   * ~/.claude/, so linkUserConfigInto() never covers it. Without this file
   * every session boots with a virgin state: Claude re-runs onboarding and
   * shows the login screen each time, and an ANTHROPIC_API_KEY from the
   * environment requires interactive confirmation unless the key's last 20
   * characters are pre-approved in `customApiKeyResponses.approved`.
   *
   * Starts from the user's real ~/.claude.json when available (theme,
   * trusted projects), as a copy — never a symlink: concurrent sessions
   * writing the same state file through links would corrupt the user's own
   * config.
   */
  private seedClaudeState(configDir: string, apiKey?: string): void {
    const stateFile = path.join(configDir, '.claude.json');

    let state: Record<string, unknown> = {};
    const source = fs.existsSync(stateFile)
      ? stateFile
      : path.join(os.homedir(), '.claude.json');
    try {
      state = JSON.parse(fs.readFileSync(source, 'utf8')) as Record<string, unknown>;
    } catch {
      state = {};
    }

    state['hasCompletedOnboarding'] = true;

    if (apiKey) {
      const responses = (state['customApiKeyResponses'] ?? {}) as {
        approved?: string[];
        rejected?: string[];
      };
      const approved = new Set(responses.approved ?? []);
      approved.add(apiKey.slice(-20));
      state['customApiKeyResponses'] = {
        ...responses,
        approved: [...approved],
        rejected: responses.rejected ?? [],
      };
    }

    try {
      fs.writeFileSync(stateFile, JSON.stringify(state), { mode: 0o600 });
    } catch (error) {
      this.logger.warn({ err: error }, 'Could not seed .claude.json state');
    }
  }

  /**
   * Symlink the user's real Claude config (skills, plugins, settings, CLAUDE.md,
   * statsig, etc.) into an isolated config dir, EXCEPT `.credentials.json` which
   * stays isolated. Symlinks (not copies) keep it cheap and always up to date;
   * cleanup removes the links only, never the real config.
   */
  private linkUserConfigInto(configDir: string): void {
    const sourceHome =
      process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    if (path.resolve(sourceHome) === path.resolve(configDir)) return;

    let entries: string[];
    try {
      entries = fs.readdirSync(sourceHome);
    } catch {
      return; // no user config to share
    }

    for (const entry of entries) {
      if (entry === '.credentials.json') continue; // keep credentials isolated
      const dest = path.join(configDir, entry);
      if (fs.existsSync(dest)) continue; // don't clobber anything we wrote
      try {
        fs.symlinkSync(path.join(sourceHome, entry), dest);
      } catch (error) {
        this.logger.debug({ err: error, entry }, 'Could not link config entry');
      }
    }
  }

  private attachControlMode(): void {
    this.controller = spawn('tmux', [
      '-L', TMUX_SOCKET,
      '-C', 'attach-session',
      '-t', this.tmuxName,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.controller.stdout!.on('data', (chunk: Buffer) => {
      this.parser.feed(chunk.toString());
    });

    // Pin the control client's size so tmux sizes the window/pane to the
    // intended terminal size from the start (otherwise it defaults to ~80
    // cols and mismatches the mobile xterm width → stacked redraws).
    if (this.clientSize) {
      const { cols, rows } = this.clientSize;
      this.controller.stdin?.write(`refresh-client -C ${cols}x${rows}\n`);
      this.controller.stdin?.write(
        `resize-window -t ${this.tmuxName} -x ${cols} -y ${rows}\n`,
      );
    }

    this.controller.stderr!.on('data', (chunk: Buffer) => {
      this.logger.warn({ stderr: chunk.toString().trim() }, 'tmux stderr');
    });

    this.controller.on('exit', (code) => {
      this.logger.info({ code }, 'Control mode exited');
      if (this.status !== 'terminated') {
        this.exitCode = code ?? 1;
        this.setStatus(code === 0 ? 'completed' : 'error');
        this.emit('exit', {
          sessionId: this.options.sessionId,
          exitCode: this.exitCode,
        });
      }
      this.controller = null;
    });
  }

  private setupParserEvents(): void {
    this.parser.on('output', (event: TmuxOutputEvent) => {
      this.outputBuffer.push(event.data);
      if (this.outputBuffer.length > this.maxBufferSize) {
        this.outputBuffer.shift();
      }

      this.detectStatusFromOutput(event.data);

      this.emit('output', {
        sessionId: this.options.sessionId,
        type: 'output',
        data: event.data,
        timestamp: Date.now(),
      });
    });

    this.parser.on('exit', () => {
      this.logger.info('tmux session exited via %exit');
      if (this.status !== 'terminated') {
        this.exitCode = 0;
        this.setStatus('completed');
        this.emit('exit', { sessionId: this.options.sessionId, exitCode: 0 });
      }
    });
  }

  private setupSessionEnv(cleanEnv?: Record<string, string>): void {
    const sessionVars: Record<string, string> = {
      FORCE_COLOR: '1',
      TERM: 'xterm-256color',
      ...(this.options.env || {}),
      ...(this.options.credentialEnv || {}),
      ...(this.options.mcpEnv || {}),
      // Inject runtime dir so hooks can locate the lock cache and heartbeat file.
      ...(this.runtimeDir ? { CLAUDENEST_RUNTIME_DIR: this.runtimeDir } : {}),
    };

    for (const [key, value] of Object.entries(sessionVars)) {
      this.tmuxExec(
        ['set-environment', '-t', this.tmuxName, key, value],
        cleanEnv,
      );
    }
  }

  private buildShellCommand(): string {
    // Bash mode: launch a plain shell instead of Claude
    if (this.options.mode === 'bash') {
      const shell = process.env.SHELL || '/bin/bash';
      return `exec ${shellQuote(shell)} --login`;
    }

    const args = this.buildArgs();
    const parts = [this.options.claudePath, ...args];
    const escaped = parts.map(p => shellQuote(p)).join(' ');
    return `exec ${escaped}`;
  }

  private buildArgs(): string[] {
    const args: string[] = [];

    // Resume an existing Claude session (preserves conversation history).
    if (this.options.resumeSessionId) {
      args.push('--resume', this.options.resumeSessionId);
    }

    // Inject multi-agent context, task description, or system-level instructions.
    if (this.options.appendSystemPrompt) {
      args.push('--append-system-prompt', this.options.appendSystemPrompt);
    }

    // Permission mode: use explicit value if provided, otherwise map legacy
    // headless/oneshot modes to acceptEdits so they behave as auto-accept
    // interactive sessions (--headless and --oneshot flags do not exist).
    const permissionMode =
      this.options.permissionMode ??
      (this.options.mode === 'headless' || this.options.mode === 'oneshot'
        ? 'acceptEdits'
        : undefined);
    if (permissionMode) {
      args.push('--permission-mode', permissionMode);
    }

    // Phase 1 paths (null in Phase 0; populated by prepareRuntimeDir).
    if (this.mcpConfigPath) {
      args.push('--mcp-config', this.mcpConfigPath);
    }
    if (this.settingsPath) {
      args.push('--settings', this.settingsPath);
    }

    // Initial prompt is a positional argument — MUST be last.
    if (this.options.initialPrompt) {
      args.push(this.options.initialPrompt);
    }

    return args;
  }

  private tmuxExec(args: string[], env?: Record<string, string>): string {
    const opts: { env?: Record<string, string> } = {};
    if (env) opts.env = env;
    return execFileSync('tmux', ['-L', TMUX_SOCKET, ...args], opts).toString();
  }

  private cleanup(): void {
    try {
      execFileSync('tmux', ['-L', TMUX_SOCKET, 'kill-session', '-t', this.tmuxName]);
    } catch {
      // Session might already be gone
    }

    if (this.controller) {
      this.controller.kill();
      this.controller = null;
    }

    // Remove isolated credential config directory (parent dir for sessions/{id}).
    // If runtimeDir is a subdirectory of isolatedConfigDir, it is cleaned up here.
    if (this.isolatedConfigDir) {
      try {
        fs.rmSync(this.isolatedConfigDir, { recursive: true, force: true });
      } catch {
        // Non-critical: temp dir cleanup failure
      }
      this.isolatedConfigDir = null;
    }

    // Remove runtime dir when it was not already covered by isolatedConfigDir above.
    // (Sessions with mcpEnv+sharedProjectId but no credentialEnv fall here.)
    if (this.runtimeDir) {
      try {
        fs.rmSync(this.runtimeDir, { recursive: true, force: true });
      } catch {
        // Best-effort: ignore cleanup errors
      }
      this.runtimeDir = null;
    }
  }

  private setStatus(status: SessionStatus): void {
    if (this.status !== status) {
      this.logger.debug({ from: this.status, to: status }, `Status: ${this.status} -> ${status}`);
      this.status = status;
      this.emit('status', { sessionId: this.options.sessionId, status });
    }
  }

  private detectStatusFromOutput(data: string): void {
    const inputPatterns = [
      />\s*$/,
      /\$\s*$/,
      /:\s*$/,
      /\(y\/n\)/i,
      /\[Y\/n\]/i,
      /\[y\/N\]/i,
      /Enter\s+.+:/i,
      /Password:/i,
      /Continue\?/i,
      /Confirm\?/i,
    ];

    const isWaitingInput = inputPatterns.some(p => p.test(data));
    if (isWaitingInput && this.status === 'running') {
      this.setStatus('waiting_input');
    } else if (!isWaitingInput && this.status === 'waiting_input') {
      this.setStatus('running');
    }
  }
}

// ── Helpers ──────────────────────────────────────

function shellQuote(s: string): string {
  if (/^[a-zA-Z0-9_\-.\/:=@]+$/.test(s)) return s;
  return `'${s.replace(/'/g, "'\\''")}'`;
}

function buildCleanProcessEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (key === 'CLAUDECODE' || key.startsWith('CLAUDE_') || key.startsWith('ANTHROPIC_')) continue;
    env[key] = value;
  }
  return env;
}

function checkTmuxAvailable(): void {
  try {
    const output = execFileSync('tmux', ['-V']).toString().trim();
    const match = output.match(/(\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      if (major < 3) {
        throw new Error(`tmux >= 3.0 required, found: ${output}`);
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ENOENT') {
      throw new Error('tmux is not installed. Install with: sudo apt install tmux');
    }
    throw error;
  }
}
