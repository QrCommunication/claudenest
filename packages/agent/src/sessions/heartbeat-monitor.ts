/**
 * Process-liveness heartbeat for orchestrated workers.
 *
 * The APPLICATION heartbeat (POST /api/instances/{id}/heartbeat) is only emitted
 * by Claude Code hooks (Stop / PostToolUse). During a long-running Bash command
 * — a test suite, a build — no hook fires, so the worker goes radio-silent and
 * the server's WorkerLoop can mistake it for dead. This timer provides a
 * "proof of process life" beat: as long as the tmux session exists AND the pane
 * process is alive, it POSTs `{status:'active'}` on a fixed cadence.
 *
 * It is deliberately deferential to the hooks: it shares the SAME throttle file
 * (`last-heartbeat`) via shouldSendHeartbeat/touchHeartbeatFile, so it never
 * double-counts a beat the hooks just sent. Both gates failing (no tmux session
 * or dead pane) means the pane is gone → the monitor stops itself.
 */

import { execFileSync } from 'node:child_process';
import {
  postSilent,
  shouldSendHeartbeat,
  touchHeartbeatFile,
} from '../hooks/lib.js';
import { TMUX_SOCKET } from './tmux-session.js';
import type { Logger } from '../utils/logger.js';

/** Cadence of the liveness beat. Matches the hooks' min interval (30s). */
const HEARTBEAT_INTERVAL_MS = 30_000;
/** Tight timeout for the POST — must never slow the agent's event loop. */
const HEARTBEAT_POST_TIMEOUT_MS = 2_000;

export interface HeartbeatMonitorOptions {
  /** tmux session name (e.g. `cn-<sessionId>`) on the claudenest socket. */
  tmuxName: string;
  /**
   * Resolve the pane PID. Re-read live so the monitor follows tmux respawns
   * (respawn-pane changes the pane process). Returns undefined when unknown.
   */
  getPanePid: () => number | undefined;
  /** ClaudeNest instance id (path segment of the heartbeat endpoint). */
  instanceId: string;
  /** Base API URL (no trailing slash assumed; normalised internally). */
  apiUrl: string;
  /** Bearer token (scoped MCP token) for the heartbeat request. */
  token: string;
  /** Per-session runtime dir holding the shared `last-heartbeat` sentinel. */
  runtimeDir: string;
  logger: Logger;
}

export class HeartbeatMonitor {
  private readonly opts: HeartbeatMonitorOptions;
  private readonly logger: Logger;
  private readonly endpoint: string;
  private timer: NodeJS.Timeout | null = null;

  constructor(opts: HeartbeatMonitorOptions) {
    this.opts = opts;
    this.logger = opts.logger.child({ component: 'HeartbeatMonitor' });
    const base = opts.apiUrl.replace(/\/$/, '');
    this.endpoint = `${base}/api/instances/${opts.instanceId}/heartbeat`;
  }

  /** Begin the periodic liveness beat. Idempotent. */
  start(): void {
    if (this.timer) return;
    this.logger.debug({ tmux: this.opts.tmuxName }, 'Heartbeat monitor started');
    this.timer = setInterval(() => {
      void this.tick();
    }, HEARTBEAT_INTERVAL_MS);
    // Never keep the agent process alive on this timer alone.
    this.timer.unref();
  }

  /** Stop the beat. Safe to call multiple times. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.debug({ tmux: this.opts.tmuxName }, 'Heartbeat monitor stopped');
    }
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private async tick(): Promise<void> {
    // Gate A: the tmux session must still exist on our socket.
    if (!this.tmuxSessionAlive()) {
      this.logger.debug({ tmux: this.opts.tmuxName }, 'tmux session gone — stopping monitor');
      this.stop();
      return;
    }

    // Gate B: the pane process must still be alive (re-read PID to follow respawns).
    const panePid = this.opts.getPanePid();
    if (!this.paneProcessAlive(panePid)) {
      this.logger.debug({ panePid }, 'pane process gone — stopping monitor');
      this.stop();
      return;
    }

    // Anti-double-count: only beat if the hooks/monitor haven't beaten recently.
    if (!shouldSendHeartbeat(this.opts.runtimeDir)) return;

    const res = await postSilent(
      this.endpoint,
      this.opts.token,
      { status: 'active' },
      HEARTBEAT_POST_TIMEOUT_MS,
    );
    // Mark the beat regardless of HTTP outcome: a transient network failure
    // shouldn't trigger a retry storm on the next 30s tick.
    touchHeartbeatFile(this.opts.runtimeDir);
    if (!res.ok) {
      this.logger.debug({ status: res.status }, 'liveness heartbeat POST not ok');
    }
  }

  /** `tmux has-session` exits 0 iff the session exists on our socket. */
  private tmuxSessionAlive(): boolean {
    try {
      execFileSync(
        'tmux',
        ['-L', TMUX_SOCKET, 'has-session', '-t', this.opts.tmuxName],
        { stdio: 'ignore' },
      );
      return true;
    } catch {
      return false;
    }
  }

  /** `kill(pid, 0)` is a liveness probe — throws iff the process is gone. */
  private paneProcessAlive(panePid: number | undefined): boolean {
    if (!panePid || panePid <= 0) return false;
    try {
      process.kill(panePid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
