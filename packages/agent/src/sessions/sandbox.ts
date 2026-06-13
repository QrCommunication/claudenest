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
