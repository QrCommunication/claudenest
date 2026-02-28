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
import { execFileSync, spawn, type ChildProcess } from 'child_process';
import { TmuxOutputParser, type TmuxOutputEvent } from './tmux-parser.js';
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
    const cleanEnv = buildCleanProcessEnv();

    try {
      checkTmuxAvailable();

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
    if (!this.controller) return;

    this.logger.debug({ cols, rows }, `Resizing to ${cols}x${rows}`);
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

    if (this.options.mode === 'headless') {
      args.push('--headless');
    } else if (this.options.mode === 'oneshot') {
      args.push('--oneshot');
    }

    if (this.options.initialPrompt) {
      args.push('--prompt', this.options.initialPrompt);
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
