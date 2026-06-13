import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { buildBwrapArgs } from './sandbox.js';

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
