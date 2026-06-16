/**
 * Lightweight worker sandboxing via bubblewrap (bwrap).
 *
 * Orchestrated workers run with bypassPermissions (no approval dialog), so they
 * can run arbitrary Bash and file writes. bubblewrap confines that blast radius
 * WITHOUT Docker: it is an unprivileged, daemon-less, namespace-based sandbox
 * (the engine behind Flatpak), installable as a few-hundred-KB OS package.
 *
 * Profile = "read-all, write-confined": the whole filesystem is bind-mounted
 * read-only (so node, git, the toolchain all work), then ONLY the project dir,
 * the per-session runtime dir, /tmp and the user's ~/.claude are made writable.
 * A worker therefore cannot modify system files, the home directory, or other
 * projects — but everything it legitimately needs still functions. Network is
 * kept (Claude API + MCP HTTP to the server).
 *
 * Fail-open: if bwrap is unavailable and cannot be installed, the worker runs
 * unsandboxed rather than failing to launch. Sandboxing is best-effort hardening.
 */

import { execFileSync, execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { getCacheDir } from '../utils/index.js';
import type { Logger } from '../utils/logger.js';

let cachedBwrapPath: string | null | undefined;
let installAttempted = false;

/** Resolve the bwrap binary path, or null if not installed. Cached. */
export function findBwrap(): string | null {
  if (cachedBwrapPath !== undefined) return cachedBwrapPath;
  for (const candidate of ['/usr/bin/bwrap', '/usr/local/bin/bwrap', '/bin/bwrap']) {
    if (fs.existsSync(candidate)) {
      cachedBwrapPath = candidate;
      return candidate;
    }
  }
  try {
    const resolved = execSync('command -v bwrap 2>/dev/null', { encoding: 'utf8' }).trim();
    cachedBwrapPath = resolved || null;
  } catch {
    cachedBwrapPath = null;
  }
  return cachedBwrapPath;
}

/**
 * Best-effort install of bubblewrap via the host package manager, using
 * passwordless sudo if available. Returns the bwrap path on success, else null
 * (the caller falls back to running unsandboxed). Never throws.
 */
export function ensureBwrap(logger: Logger): string | null {
  const existing = findBwrap();
  if (existing) return existing;
  if (installAttempted) return null; // try the (slow) install at most once per process
  installAttempted = true;

  const managers: Array<{ probe: string; install: string[] }> = [
    { probe: 'apt-get', install: ['apt-get', 'install', '-y', '--no-install-recommends', 'bubblewrap'] },
    { probe: 'dnf', install: ['dnf', 'install', '-y', 'bubblewrap'] },
    { probe: 'yum', install: ['yum', 'install', '-y', 'bubblewrap'] },
    { probe: 'pacman', install: ['pacman', '-S', '--noconfirm', 'bubblewrap'] },
    { probe: 'apk', install: ['apk', 'add', 'bubblewrap'] },
    { probe: 'zypper', install: ['zypper', '--non-interactive', 'install', 'bubblewrap'] },
  ];

  // Passwordless sudo? (`sudo -n true` exits 0 only if no password is needed.)
  let sudo: string[] = [];
  try {
    execSync('sudo -n true 2>/dev/null');
    sudo = ['sudo', '-n'];
  } catch {
    sudo = [];
  }

  for (const { probe, install } of managers) {
    let hasManager = false;
    try {
      execSync(`command -v ${probe} >/dev/null 2>&1`);
      hasManager = true;
    } catch {
      hasManager = false;
    }
    if (!hasManager) continue;

    const argv = [...sudo, ...install];
    if (sudo.length === 0 && process.getuid?.() !== 0) {
      logger.warn(
        { manager: probe },
        'bubblewrap not installed and no passwordless sudo — workers run UNSANDBOXED. ' +
          `Install it once with: sudo ${install.join(' ')}`,
      );
      return null;
    }
    try {
      logger.info({ argv }, 'Installing bubblewrap for worker sandboxing');
      execFileSync(argv[0]!, argv.slice(1), { stdio: 'ignore', timeout: 120_000 });
      cachedBwrapPath = undefined; // re-resolve
      const installed = findBwrap();
      if (installed) {
        logger.info({ path: installed }, 'bubblewrap installed');
        return installed;
      }
    } catch (err) {
      logger.warn({ err, manager: probe }, 'bubblewrap install attempt failed');
    }
    break; // one matching manager is enough
  }

  return null;
}

let tmuxInstallAttempted = false;

/** True if `tmux` is on PATH. */
function tmuxOnPath(): boolean {
  try {
    execSync('command -v tmux >/dev/null 2>&1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort install of tmux via the host package manager (passwordless sudo
 * if available). tmux is REQUIRED — every Claude session/worker runs inside a
 * tmux session, so a missing tmux means no worker can ever open. Unlike the
 * sandbox (which fails open to unsandboxed), this only TRIES to self-heal;
 * the caller's checkTmuxAvailable() still throws a clear, actionable error if
 * tmux is genuinely unavailable. Never throws.
 */
export function ensureTmux(logger: Logger): void {
  if (tmuxOnPath()) return;
  if (tmuxInstallAttempted) return; // attempt the (slow) install once per process
  tmuxInstallAttempted = true;

  const managers: Array<{ probe: string; install: string[] }> = [
    { probe: 'apt-get', install: ['apt-get', 'install', '-y', '--no-install-recommends', 'tmux'] },
    { probe: 'dnf', install: ['dnf', 'install', '-y', 'tmux'] },
    { probe: 'yum', install: ['yum', 'install', '-y', 'tmux'] },
    { probe: 'pacman', install: ['pacman', '-S', '--noconfirm', 'tmux'] },
    { probe: 'apk', install: ['apk', 'add', 'tmux'] },
    { probe: 'zypper', install: ['zypper', '--non-interactive', 'install', 'tmux'] },
    { probe: 'brew', install: ['brew', 'install', 'tmux'] },
  ];

  let sudo: string[] = [];
  try {
    execSync('sudo -n true 2>/dev/null');
    sudo = ['sudo', '-n'];
  } catch {
    sudo = [];
  }

  for (const { probe, install } of managers) {
    try {
      execSync(`command -v ${probe} >/dev/null 2>&1`);
    } catch {
      continue;
    }

    // brew refuses to run under sudo; everything else needs root unless we are.
    const useSudo = probe !== 'brew' && process.getuid?.() !== 0;
    if (useSudo && sudo.length === 0) {
      logger.warn(
        { manager: probe },
        'tmux is not installed and no passwordless sudo — workers cannot start. ' +
          `Install it once with: sudo ${install.join(' ')}`,
      );
      return;
    }

    const argv = useSudo ? [...sudo, ...install] : install;
    try {
      logger.info({ argv }, 'Installing tmux (required for worker sessions)');
      execFileSync(argv[0]!, argv.slice(1), { stdio: 'ignore', timeout: 120_000 });
      if (tmuxOnPath()) {
        logger.info('tmux installed');
        return;
      }
    } catch (err) {
      logger.warn({ err, manager: probe }, 'tmux install attempt failed');
    }
    break; // one matching manager is enough
  }
}

/**
 * Cache dir where Playwright stores its browser binaries. Shared by the agent
 * (provisioning) and the workers (PLAYWRIGHT_BROWSERS_PATH at runtime). It lives
 * under ~/.cache/claudenest, which the sandbox already binds writable — so a
 * worker can run `npx playwright test` against the pre-provisioned Chromium.
 */
export function playwrightBrowsersPath(): string {
  return path.join(getCacheDir(), 'ms-playwright');
}

let playwrightInstallAttempted = false;

/**
 * True when a Chromium build already exists under the given browsers path
 * (Playwright lays them out as `chromium-<rev>/`). Cheap sentinel so we never
 * re-run the slow install when the binary is already present.
 */
function hasChromiumInstalled(browsersPath: string): boolean {
  try {
    return fs
      .readdirSync(browsersPath)
      .some((entry) => entry.startsWith('chromium-'));
  } catch {
    return false;
  }
}

/**
 * Best-effort provisioning of Playwright's Chromium so orchestrated workers can
 * run browser E2E via plain Bash (`npx playwright test`). Modeled on
 * ensureBwrap: attempts the (slow) install at most once per process and NEVER
 * throws — a failed provision just means E2E may not work, it must not block a
 * worker from launching.
 *
 * Returns true when Chromium is available afterwards, false otherwise.
 *
 * The binaries go to ~/.cache/claudenest/ms-playwright (already a writable
 * sandbox carve-out). System deps (`playwright install-deps`) are only attempted
 * when running as root or with passwordless sudo; otherwise we warn and continue
 * (headless may still fail at runtime, which is acceptable fail-open behaviour).
 */
export function ensurePlaywrightChromium(logger: Logger): boolean {
  const browsersPath = playwrightBrowsersPath();

  // Sentinel: a non-empty chromium-* build → already provisioned.
  if (hasChromiumInstalled(browsersPath)) return true;
  if (playwrightInstallAttempted) return false; // try the slow install once
  playwrightInstallAttempted = true;

  try {
    fs.mkdirSync(browsersPath, { recursive: true });
  } catch (err) {
    logger.warn({ err, browsersPath }, 'Could not create Playwright browsers dir');
    return false;
  }

  const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersPath };

  // 1. Download the Chromium browser build (~180s budget).
  try {
    logger.info({ browsersPath }, 'Provisioning Playwright Chromium for worker E2E');
    execFileSync('npx', ['--yes', 'playwright', 'install', 'chromium'], {
      env,
      stdio: 'ignore',
      timeout: 180_000,
    });
  } catch (err) {
    logger.warn(
      { err },
      'Playwright Chromium install failed — browser E2E may be unavailable',
    );
    return hasChromiumInstalled(browsersPath);
  }

  // 2. System libraries (libnss3, libatk, …). Needs root/sudo; skip otherwise.
  let sudo: string[] = [];
  try {
    execSync('sudo -n true 2>/dev/null');
    sudo = ['sudo', '-n'];
  } catch {
    sudo = [];
  }
  const isRoot = process.getuid?.() === 0;
  if (isRoot || sudo.length > 0) {
    const argv = [...sudo, 'npx', '--yes', 'playwright', 'install-deps', 'chromium'];
    try {
      execFileSync(argv[0]!, argv.slice(1), { stdio: 'ignore', timeout: 180_000 });
    } catch (err) {
      logger.warn(
        { err },
        'Playwright install-deps failed — headless Chromium may be missing system libraries',
      );
    }
  } else {
    logger.warn(
      'Playwright system deps not installed (no root/passwordless sudo) — ' +
        'headless Chromium may fail. Install once with: ' +
        'sudo npx playwright install-deps chromium',
    );
  }

  return hasChromiumInstalled(browsersPath);
}

export interface SandboxOptions {
  /** Project directory — made writable (the worker edits code here). */
  projectPath: string;
  /** Per-session runtime dir (mcp-config, settings, hooks, state) — writable. */
  runtimeDir?: string | null;
}

/**
 * Build the bwrap argv PREFIX that wraps the worker command, i.e. the result is
 * meant to be used as `bwrap <prefix> -- <claude> <args...>`. Returns the args
 * AFTER the bwrap binary (the binary itself comes from findBwrap/ensureBwrap).
 */
export function buildBwrapArgs(opts: SandboxOptions): string[] {
  const home = os.homedir();

  const args: string[] = [
    // The sandbox dies with the agent-launched shell — no escapees.
    '--die-with-parent',
    // Read-all base: the entire host FS is visible read-only so the toolchain
    // (node, git, npm, php, …) keeps working.
    '--ro-bind', '/', '/',
    // Real /dev and /proc (claude + node need them).
    '--dev', '/dev',
    '--proc', '/proc',
    // Fresh private /tmp.
    '--tmpfs', '/tmp',
    // Headless Chromium (Playwright E2E) needs a writable /dev/shm for its
    // shared-memory transport; the read-only base would otherwise crash it.
    '--tmpfs', '/dev/shm',
    // Isolate process + IPC + UTS namespaces (network is intentionally kept).
    '--unshare-pid',
    '--unshare-ipc',
    '--unshare-uts',
  ];

  // ── Writable carve-outs (override the read-only base) ──────────────────────
  const writable = new Set<string>();
  writable.add(path.resolve(opts.projectPath));
  if (opts.runtimeDir) writable.add(path.resolve(opts.runtimeDir));
  // claude's own working state (projects, todos, shell snapshots).
  writable.add(path.join(home, '.claude'));
  writable.add(path.join(home, '.config', 'claude'));
  // Per-session cache (heartbeat sentinel, lock cache) lives here.
  writable.add(path.join(home, '.cache', 'claudenest'));

  for (const dir of writable) {
    if (fs.existsSync(dir)) {
      args.push('--bind', dir, dir);
    } else {
      // Create-on-demand inside the sandbox so claude can write it.
      args.push('--bind-try', dir, dir);
    }
  }

  args.push('--chdir', path.resolve(opts.projectPath));

  return args;
}

export interface SandboxedRunner {
  /** Whether commands actually run inside bwrap (false = fail-open, host run). */
  readonly sandboxed: boolean;
  /** Run a command synchronously, throw-free, returning trimmed stdout. */
  exec(cmd: string, args: string[], timeoutMs?: number): { ok: boolean; out: string };
}

/**
 * Create a reusable runner that executes commands in the project's working tree
 * through the same "read-all, write-confined" bwrap profile as the workers
 * (resolved once). Fail-open: if bwrap is unavailable, commands run unsandboxed.
 *
 * Used by read/act git+gh helpers (status, PR list, PR merge) so those host
 * operations are confined exactly like the workers — the whole FS is readable
 * (git/gh/ssh + their credentials keep working) but only the project tree is
 * writable.
 */
export function createSandboxedRunner(projectPath: string): SandboxedRunner {
  const bwrapBin = findBwrap();
  const prefix = bwrapBin ? buildBwrapArgs({ projectPath }) : null;
  const sandboxed = Boolean(bwrapBin && prefix);

  return {
    sandboxed,
    exec(cmd: string, args: string[], timeoutMs = 30_000): { ok: boolean; out: string } {
      const [bin, argv] = sandboxed
        ? [bwrapBin as string, [...(prefix as string[]), '--', cmd, ...args]]
        : [cmd, args];
      try {
        const out = execFileSync(bin, argv, {
          cwd: projectPath,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: timeoutMs,
        }).trim();
        return { ok: true, out };
      } catch (err) {
        const e = err as { stderr?: Buffer | string; message?: string };
        const out = (e.stderr ? e.stderr.toString() : e.message ?? '').trim();
        return { ok: false, out };
      }
    },
  };
}
