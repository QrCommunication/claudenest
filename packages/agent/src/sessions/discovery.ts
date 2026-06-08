/**
 * Claude session discovery.
 *
 * Surfaces the Claude Code sessions that exist on the machine — both the ones
 * currently running in the user's own terminals (bare pts, tmux, screen…) and
 * the historical transcripts on disk — WITHOUT the agent having spawned them.
 *
 * Model: a *session* IS its transcript (the stable session UUID lives in the
 * filename). A running `claude` process only marks the freshest transcript(s)
 * of its cwd as "live" — Claude does not keep the .jsonl fd open, so there is
 * no fd-level pid→transcript link; we correlate by cwd (exact, via the encoded
 * project slug) and recency.
 *
 * Live sessions are observable in real time by tailing their transcript
 * (read-only mirror). To *control* one remotely, the handler "adopts" it by
 * relaunching it under the agent's tmux via `claude --resume <sessionId>`.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { promises as fsp } from 'fs';
import { execFileSync } from 'child_process';
import { EventEmitter } from 'events';
import {
  TranscriptTailer,
  readCwdFromTranscript,
  readTailPreview,
  readHistory,
} from './transcript.js';
import type { Logger } from '../utils/logger.js';
import type { DiscoveredSession, TranscriptEvent } from '../types/index.js';

/** A transcript modified within this window counts toward live correlation. */
const LIVE_WINDOW_MS = 30 * 60 * 1000;
/** Cap how many transcripts we enumerate (most-recent first) to bound cost. */
const MAX_TRANSCRIPTS = 400;

interface RunningClaude {
  pid: number;
  cwd: string;
  slug: string;
  startedAt?: string;
  tty?: string;
}

interface DiscoveryOptions {
  logger: Logger;
  /** Override the Claude home (defaults to $CLAUDE_CONFIG_DIR or ~/.claude). */
  claudeHome?: string;
}

/** Encode a cwd into Claude's project slug (path separators → dashes). */
function cwdToSlug(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

export class ClaudeSessionDiscovery extends EventEmitter {
  private readonly logger: Logger;
  private readonly projectsDir: string;
  private readonly tailers = new Map<string, TranscriptTailer>();
  private autoTimer: NodeJS.Timeout | null = null;
  /** Cache cwd+preview per transcript, keyed by path, invalidated on mtime change.
   *  Avoids re-reading hundreds of unchanged historical transcripts every scan. */
  private readonly metaCache = new Map<string, { mtimeMs: number; cwd: string; preview: string | null }>();

  constructor(options: DiscoveryOptions) {
    super();
    this.logger = options.logger.child({ component: 'ClaudeSessionDiscovery' });
    const home =
      options.claudeHome ||
      process.env.CLAUDE_CONFIG_DIR ||
      path.join(os.homedir(), '.claude');
    this.projectsDir = path.join(home, 'projects');
  }

  /** Build the full list of discovered sessions (live always, history opt-in). */
  async discoverAll(includeHistory = true): Promise<DiscoveredSession[]> {
    const running = this.scanRunningClaude();
    const liveBySlug = new Map<string, RunningClaude[]>();
    for (const proc of running) {
      const arr = liveBySlug.get(proc.slug) ?? [];
      arr.push(proc);
      liveBySlug.set(proc.slug, arr);
    }

    const transcripts = await this.listTranscripts();
    const sessions: DiscoveredSession[] = [];
    const now = Date.now();

    // Group by slug so we can assign live pids to the freshest transcripts.
    const bySlug = new Map<string, typeof transcripts>();
    for (const t of transcripts) {
      const arr = bySlug.get(t.slug) ?? [];
      arr.push(t);
      bySlug.set(t.slug, arr);
    }

    for (const [slug, group] of bySlug) {
      group.sort((a, b) => b.mtimeMs - a.mtimeMs);
      const liveProcs = [...(liveBySlug.get(slug) ?? [])];

      for (const t of group) {
        const fresh = now - t.mtimeMs < LIVE_WINDOW_MS;
        const proc = fresh ? liveProcs.shift() : undefined;
        const isLive = Boolean(proc);

        if (!isLive && !includeHistory) continue;

        // Reuse cached cwd/preview when the transcript is unchanged (mtime).
        // Live sessions append constantly → mtime changes → always refreshed.
        let cwd: string;
        let preview: string | null;
        const cached = this.metaCache.get(t.path);
        if (cached && cached.mtimeMs === t.mtimeMs) {
          cwd = proc?.cwd ?? cached.cwd;
          preview = cached.preview;
        } else {
          cwd =
            proc?.cwd ?? (await readCwdFromTranscript(t.path)) ?? this.slugToCwd(slug);
          preview = await readTailPreview(t.path);
          this.metaCache.set(t.path, { mtimeMs: t.mtimeMs, cwd, preview });
        }

        sessions.push({
          sessionId: t.sessionId,
          projectSlug: slug,
          cwd,
          projectName: path.basename(cwd) || cwd,
          transcriptPath: t.path,
          isLive,
          pid: proc?.pid,
          tty: proc?.tty,
          startedAt: proc?.startedAt,
          lastActivityAt: new Date(t.mtimeMs).toISOString(),
          sizeBytes: t.size,
          lastPreview: preview ?? undefined,
          adopted: false,
        });
      }
    }

    // Evict cache entries for transcripts that no longer exist (bound memory).
    if (this.metaCache.size > transcripts.length * 2) {
      const livePaths = new Set(transcripts.map((t) => t.path));
      for (const key of this.metaCache.keys()) {
        if (!livePaths.has(key)) this.metaCache.delete(key);
      }
    }

    // Live first, then most-recent activity.
    sessions.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return b.lastActivityAt.localeCompare(a.lastActivityAt);
    });

    this.logger.info(
      { total: sessions.length, live: sessions.filter((s) => s.isLive).length },
      'Discovered Claude sessions',
    );
    return sessions;
  }

  /**
   * Begin mirroring a session online: send its redacted history once, then
   * stream every appended event via the 'transcript' event until closed.
   * Returns the initial history batch.
   */
  async openSession(
    sessionId: string,
    transcriptPath: string,
    historyLimit = 500,
  ): Promise<TranscriptEvent[]> {
    const history = await readHistory(transcriptPath, historyLimit);

    if (!this.tailers.has(sessionId)) {
      const tailer = new TranscriptTailer(sessionId, transcriptPath, this.logger);
      tailer.on('batch', (events: TranscriptEvent[]) => {
        this.emit('transcript', { sessionId, events, replace: false });
      });
      tailer.start();
      this.tailers.set(sessionId, tailer);
      this.logger.info({ sessionId }, 'Opened live transcript mirror');
    }

    return history;
  }

  /** Stop mirroring a session. */
  closeSession(sessionId: string): void {
    const tailer = this.tailers.get(sessionId);
    if (tailer) {
      tailer.stop();
      this.tailers.delete(sessionId);
      this.logger.info({ sessionId }, 'Closed live transcript mirror');
    }
  }

  /** Resolve the transcript path for a session id by scanning project dirs. */
  async resolveTranscriptPath(sessionId: string): Promise<string | null> {
    try {
      const slugs = await fsp.readdir(this.projectsDir);
      for (const slug of slugs) {
        const candidate = path.join(this.projectsDir, slug, `${sessionId}.jsonl`);
        if (fs.existsSync(candidate)) return candidate;
      }
    } catch {
      // projects dir missing
    }
    return null;
  }

  /** Periodically re-scan and emit 'discovered' with the fresh list. */
  startAutoDiscovery(intervalMs = 30_000, includeHistory = true): void {
    const run = () => {
      this.discoverAll(includeHistory)
        .then((sessions) => this.emit('discovered', sessions))
        .catch((err) => this.logger.warn({ err }, 'Auto-discovery failed'));
    };
    run();
    this.autoTimer = setInterval(run, intervalMs);
  }

  stop(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
    for (const tailer of this.tailers.values()) tailer.stop();
    this.tailers.clear();
  }

  // ── Private ───────────────────────────────────────

  /** Best-effort decode of a slug back to a path (ambiguous for dashed dirs). */
  private slugToCwd(slug: string): string {
    return slug.replace(/-/g, '/');
  }

  private async listTranscripts(): Promise<
    Array<{ sessionId: string; slug: string; path: string; mtimeMs: number; size: number }>
  > {
    const out: Array<{
      sessionId: string;
      slug: string;
      path: string;
      mtimeMs: number;
      size: number;
    }> = [];

    let slugs: string[];
    try {
      slugs = await fsp.readdir(this.projectsDir);
    } catch {
      return out;
    }

    for (const slug of slugs) {
      const dir = path.join(this.projectsDir, slug);
      let files: string[];
      try {
        files = await fsp.readdir(dir);
      } catch {
        continue;
      }
      for (const file of files) {
        if (!file.endsWith('.jsonl')) continue;
        const full = path.join(dir, file);
        try {
          const stat = await fsp.stat(full);
          if (!stat.isFile()) continue;
          out.push({
            sessionId: file.slice(0, -'.jsonl'.length),
            slug,
            path: full,
            mtimeMs: stat.mtimeMs,
            size: stat.size,
          });
        } catch {
          continue;
        }
      }
    }

    out.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return out.slice(0, MAX_TRANSCRIPTS);
  }

  /** Enumerate running `claude` processes with their cwd (Linux /proc, then lsof). */
  private scanRunningClaude(): RunningClaude[] {
    if (process.platform === 'linux') return this.scanRunningClaudeProc();
    return this.scanRunningClaudeLsof();
  }

  private scanRunningClaudeProc(): RunningClaude[] {
    const result: RunningClaude[] = [];
    const bootMs = this.readBootTimeMs();
    const clkTck = 100; // getconf CLK_TCK; 100 on all mainstream Linux.

    let pids: string[];
    try {
      pids = fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p));
    } catch {
      return result;
    }

    for (const pid of pids) {
      try {
        const comm = fs.readFileSync(`/proc/${pid}/comm`, 'utf-8').trim();
        if (comm !== 'claude' && comm !== 'node') continue;

        // Confirm it's the Claude CLI (argv0 basename === 'claude'),
        // not a child wrapper or unrelated node process.
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf-8').split('\0');
        const argv0 = cmdline[0] ?? '';
        if (path.basename(argv0) !== 'claude') continue;

        const cwd = fs.readlinkSync(`/proc/${pid}/cwd`);

        let startedAt: string | undefined;
        try {
          const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf-8');
          // Field 22 (starttime) lives after the comm field in parens.
          const afterComm = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
          const startTicks = Number(afterComm[19]); // 22nd field, 0-based here
          if (bootMs && Number.isFinite(startTicks)) {
            startedAt = new Date(bootMs + (startTicks / clkTck) * 1000).toISOString();
          }
        } catch {
          // optional
        }

        let tty: string | undefined;
        try {
          tty = fs.readlinkSync(`/proc/${pid}/fd/0`);
          if (!tty.includes('pts') && !tty.includes('tty')) tty = undefined;
        } catch {
          // optional
        }

        result.push({ pid: Number(pid), cwd, slug: cwdToSlug(cwd), startedAt, tty });
      } catch {
        continue; // process vanished or unreadable
      }
    }
    return result;
  }

  private readBootTimeMs(): number | null {
    try {
      const stat = fs.readFileSync('/proc/stat', 'utf-8');
      const match = stat.match(/^btime\s+(\d+)/m);
      return match ? Number(match[1]) * 1000 : null;
    } catch {
      return null;
    }
  }

  /** macOS / non-Linux fallback: use lsof to find claude cwd. Best-effort. */
  private scanRunningClaudeLsof(): RunningClaude[] {
    const result: RunningClaude[] = [];
    try {
      const out = execFileSync('lsof', ['-a', '-c', 'claude', '-d', 'cwd', '-Fn'], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      let pid = 0;
      for (const line of out.split('\n')) {
        if (line.startsWith('p')) pid = Number(line.slice(1));
        else if (line.startsWith('n') && pid) {
          const cwd = line.slice(1);
          result.push({ pid, cwd, slug: cwdToSlug(cwd) });
        }
      }
    } catch {
      // lsof absent or no matches
    }
    return result;
  }
}
