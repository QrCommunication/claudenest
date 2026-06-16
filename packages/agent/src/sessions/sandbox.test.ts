import { describe, it, expect, afterEach, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { buildBwrapArgs, ensurePlaywrightChromium, playwrightBrowsersPath } from './sandbox.js';
import { createLogger } from '../utils/logger.js';

describe('buildBwrapArgs', () => {
  const project = '/home/dev/projects/app';
  const runtime = '/home/dev/.cache/claudenest/sessions/abc/runtime';

  it('uses a read-all, write-confined profile', () => {
    const args = buildBwrapArgs({ projectPath: project, runtimeDir: runtime });

    // Whole FS read-only base so the toolchain still works.
    const i = args.indexOf('--ro-bind');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(args[i + 1]).toBe('/');
    expect(args[i + 2]).toBe('/');

    // Namespaces isolated but network kept (no --unshare-net / --unshare-all).
    expect(args).toContain('--unshare-pid');
    expect(args).toContain('--die-with-parent');
    expect(args).not.toContain('--unshare-net');
    expect(args).not.toContain('--unshare-all');
  });

  it('mounts a writable tmpfs at /dev/shm (Chromium headless needs it) and sets no DISPLAY', () => {
    const args = buildBwrapArgs({ projectPath: project, runtimeDir: runtime });

    // --tmpfs /dev/shm must be present (consecutive flag/value pair).
    const shmPairs = args
      .map((a, idx) => (a === '--tmpfs' && args[idx + 1] === '/dev/shm' ? idx : -1))
      .filter((idx) => idx >= 0);
    expect(shmPairs.length).toBe(1);

    // The sandbox profile must not inject an X DISPLAY (headless only).
    expect(args).not.toContain('DISPLAY');
  });

  it('makes the project and runtime dirs writable and chdirs into the project', () => {
    const args = buildBwrapArgs({ projectPath: project, runtimeDir: runtime });
    const joined = args.join(' ');

    // Project + runtime are bound writable (--bind or --bind-try).
    expect(joined).toMatch(new RegExp(`--bind(-try)? ${project} ${project}`));
    expect(joined).toMatch(new RegExp(`--bind(-try)? ${runtime} ${runtime}`));

    // chdir into the project.
    const c = args.indexOf('--chdir');
    expect(c).toBeGreaterThanOrEqual(0);
    expect(args[c + 1]).toBe(project);
  });

  it("carves out the user's ~/.claude as writable", () => {
    const args = buildBwrapArgs({ projectPath: project });
    expect(args.join(' ')).toContain(path.join(os.homedir(), '.claude'));
  });
});

describe('ensurePlaywrightChromium', () => {
  const logger = createLogger('fatal');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is idempotent: returns true via the sentinel without invoking any install', () => {
    // Sentinel: a chromium-* build already exists under the browsers path. The
    // function must return true on this check ALONE — it returns BEFORE the
    // (slow, networked) `npx playwright install` branch, so a synchronous,
    // network-free return here proves no install ran.
    const readdirSpy = vi
      .spyOn(fs, 'readdirSync')
      .mockReturnValue(['chromium-1124', 'ffmpeg-1011'] as unknown as fs.Dirent[]);

    const result = ensurePlaywrightChromium(logger);

    expect(result).toBe(true);
    // The sentinel was checked against the canonical browsers path.
    expect(readdirSpy).toHaveBeenCalledWith(playwrightBrowsersPath());
  });
});
