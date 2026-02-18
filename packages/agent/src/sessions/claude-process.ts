/**
 * Claude Code process wrapper using node-pty
 */

import { EventEmitter } from 'events';
import * as pty from 'node-pty';
import type { Logger } from '../utils/logger.js';
import type { SessionConfig, SessionStatus } from '../types/index.js';

interface ClaudeProcessOptions extends SessionConfig {
  claudePath: string;
  sessionId: string;
  logger: Logger;
}

export class ClaudeProcess extends EventEmitter {
  private process: pty.IPty | null = null;
  private options: ClaudeProcessOptions;
  private logger: Logger;
  private status: SessionStatus = 'created';
  private exitCode: number | null = null;
  private outputBuffer: string[] = [];
  private readonly maxBufferSize = 10000;

  pid?: number;

  constructor(options: ClaudeProcessOptions) {
    super();
    this.options = options;
    this.logger = options.logger.child({ 
      component: 'ClaudeProcess',
      sessionId: options.sessionId 
    });
  }

  /**
   * Start the Claude Code process
   */
  async start(): Promise<void> {
    if (this.process) {
      throw new Error('Process already started');
    }

    this.logger.info('Starting Claude Code process');
    this.setStatus('starting');

    const args = this.buildArgs();
    const cwd = this.options.projectPath || process.cwd();
    const ptySize = this.options.ptySize || { cols: 120, rows: 40 };

    this.logger.debug({
      cwd,
      cols: ptySize.cols,
      rows: ptySize.rows,
      args
    }, 'PTY configuration');

    try {
      // Build a clean env by stripping ALL Claude-related variables.
      // When the agent runs inside a Claude Code session, the parent
      // sets CLAUDE_SESSION_ID, CLAUDE_CODE_ENTRYPOINT and others.
      // If any of these leak into the child PTY, Claude Code detects
      // nesting and refuses to start. We also strip ANTHROPIC_* to
      // avoid inheriting API config from the parent context.
      const cleanEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (value === undefined) continue;
        if (key === 'CLAUDECODE' || key.startsWith('CLAUDE_') || key.startsWith('ANTHROPIC_')) continue;
        cleanEnv[key] = value;
      }

      const env = {
        ...cleanEnv,
        ...this.options.env,
        ...(this.options.credentialEnv || {}),
        FORCE_COLOR: '1',
      };

      // Spawn an interactive shell, then inject the claude command as input.
      // This way Claude Code runs inside a regular terminal, not as a nested process.
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

      this.process = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: ptySize.cols,
        rows: ptySize.rows,
        cwd,
        env,
      });

      this.pid = this.process.pid;
      this.logger.info({ pid: this.pid }, `Process started with PID ${this.pid}`);

      // Setup event handlers
      this.process.onData((data) => this.onData(data));
      this.process.onExit(({ exitCode, signal }) => this.onExit(exitCode, signal));

      this.setStatus('running');

      // Wait for the shell to initialize, then inject the claude command
      await new Promise((resolve) => setTimeout(resolve, 300));

      const claudeCmd = [this.options.claudePath, ...args].join(' ');
      this.logger.info({ cmd: claudeCmd }, 'Injecting Claude command into shell');
      this.process.write(claudeCmd + '\n');
      
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to start process');
      this.setStatus('error');
      throw error;
    }
  }

  /**
   * Terminate the process
   */
  async terminate(signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
    if (!this.process) {
      return;
    }

    this.logger.info(`Terminating process with signal ${signal}`);
    this.setStatus('terminated');

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      // Kill the process
      this.process.kill(signal);

      // Force kill after timeout
      const timeout = setTimeout(() => {
        this.logger.warn({}, 'Process did not terminate gracefully, forcing kill');
        this.process?.kill('SIGKILL');
        resolve();
      }, 5000);

      this.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  /**
   * Write input to the process
   */
  write(data: string): void {
    if (!this.process) {
      throw new Error('Process not started');
    }

    if (this.status !== 'running' && this.status !== 'waiting_input') {
      this.logger.warn({ status: this.status }, `Cannot write to process in status: ${this.status}`);
      return;
    }

    this.process.write(data);
  }

  /**
   * Resize the PTY
   */
  resize(cols: number, rows: number): void {
    if (!this.process) {
      return;
    }

    this.logger.debug({ cols, rows }, `Resizing PTY to ${cols}x${rows}`);
    this.process.resize(cols, rows);
  }

  /**
   * Get current status
   */
  getStatus(): SessionStatus {
    return this.status;
  }

  /**
   * Get the exit code
   */
  getExitCode(): number | null {
    return this.exitCode;
  }

  /**
   * Get buffered output
   */
  getOutputBuffer(): string[] {
    return [...this.outputBuffer];
  }

  /**
   * Clear output buffer
   */
  clearBuffer(): void {
    this.outputBuffer = [];
  }

  private buildArgs(): string[] {
    const args: string[] = [];

    // Mode
    if (this.options.mode === 'headless') {
      args.push('--headless');
    } else if (this.options.mode === 'oneshot') {
      args.push('--oneshot');
    }

    // Initial prompt
    if (this.options.initialPrompt) {
      args.push('--prompt', this.options.initialPrompt);
    }

    return args;
  }

  private onData(data: string): void {
    // Add to buffer
    this.outputBuffer.push(data);
    if (this.outputBuffer.length > this.maxBufferSize) {
      this.outputBuffer.shift();
    }

    // Detect status changes based on output
    this.detectStatusFromOutput(data);

    // Emit output event
    this.emit('output', {
      sessionId: this.options.sessionId,
      type: 'output',
      data,
      timestamp: Date.now(),
    });
  }

  private onExit(exitCode: number, signal?: number): void {
    this.logger.info({ exitCode, signal }, `Process exited with code ${exitCode}, signal ${signal}`);
    this.exitCode = exitCode;
    this.setStatus(exitCode === 0 ? 'completed' : 'error');
    this.emit('exit', { sessionId: this.options.sessionId, exitCode });
    this.process = null;
  }

  private setStatus(status: SessionStatus): void {
    if (this.status !== status) {
      this.logger.debug({ from: this.status, to: status }, `Status changed: ${this.status} → ${status}`);
      this.status = status;
      this.emit('status', { sessionId: this.options.sessionId, status });
    }
  }

  private detectStatusFromOutput(data: string): void {
    // Detect waiting for input patterns
    const inputPatterns = [
      />\s*$/,                          // Prompt ending with >
      /\$\s*$/,                         // Prompt ending with $
      /:\s*$/,                         // Prompt ending with :
      /\(y\/n\)/i,                      // Yes/no question
      /\[Y\/n\]/i,                      // Default yes question
      /\[y\/N\]/i,                      // Default no question
      /Enter\s+.+:/i,                   // Input request
      /Password:/i,                     // Password prompt
      /Continue\?/i,                    // Continue question
      /Confirm\?/i,                     // Confirm question
    ];

    const isWaitingInput = inputPatterns.some(pattern => pattern.test(data));
    
    if (isWaitingInput && this.status === 'running') {
      this.setStatus('waiting_input');
    } else if (!isWaitingInput && this.status === 'waiting_input') {
      this.setStatus('running');
    }
  }
}
