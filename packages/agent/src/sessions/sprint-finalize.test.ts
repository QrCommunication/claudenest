import { describe, it, expect, vi, beforeEach } from 'vitest';

// Captured execFileSync invocations.
const calls: Array<{ bin: string; args: string[] }> = [];

vi.mock('node:child_process', () => ({
  // With `encoding: 'utf8'`, the real execFileSync returns a string — the mock
  // must too (finalizeSprint calls `.trim()` on the result).
  execFileSync: (bin: string, args: string[]): string => {
    calls.push({ bin, args });
    // git diff --cached --quiet → non-zero (dirty tree) so a commit happens.
    if (args.includes('diff') && args.includes('--quiet')) {
      const e = new Error('dirty') as Error & { status: number };
      e.status = 1;
      throw e;
    }
    // `command -v gh` resolves; gh pr create returns a URL.
    if (args[args.length - 1] === 'command -v gh') {
      return '/usr/bin/gh';
    }
    if (args.includes('pr') && args.includes('create')) {
      return 'https://github.com/org/repo/pull/99';
    }
    return '';
  },
}));

// Toggle whether bwrap is "installed".
let bwrapAvailable = true;
vi.mock('./sandbox.js', () => ({
  findBwrap: () => (bwrapAvailable ? '/usr/bin/bwrap' : null),
  buildBwrapArgs: ({ projectPath }: { projectPath: string }) => [
    '--die-with-parent',
    '--ro-bind', '/', '/',
    '--chdir', projectPath,
  ],
}));

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
} as unknown as import('../utils/logger.js').Logger;

const { finalizeSprint } = await import('./sprint-finalize.js');

describe('finalizeSprint sandboxing', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('wraps every git/gh command in bwrap when available', () => {
    bwrapAvailable = true;

    const result = finalizeSprint(
      { projectPath: '/home/dev/app', branch: 'claudenest/sprint-x', title: 'Sprint X', body: 'body' },
      logger,
    );

    expect(result.sandboxed).toBe(true);
    expect(result.success).toBe(true);
    expect(result.prUrl).toBe('https://github.com/org/repo/pull/99');

    // No command ran as a bare binary — every call goes through bwrap, and the
    // real command appears after the `--` separator.
    for (const { bin, args } of calls) {
      expect(bin).toBe('/usr/bin/bwrap');
      const sep = args.indexOf('--');
      expect(sep).toBeGreaterThanOrEqual(0);
      expect(['git', 'gh', 'sh']).toContain(args[sep + 1]);
      // The sandbox profile is present in the prefix.
      expect(args.slice(0, sep)).toContain('--ro-bind');
    }

    // The push really happened inside the sandbox.
    const push = calls.find((c) => c.args.includes('push'));
    expect(push?.bin).toBe('/usr/bin/bwrap');
  });

  it('falls open to unsandboxed commands when bwrap is unavailable', () => {
    bwrapAvailable = false;

    const result = finalizeSprint(
      { projectPath: '/home/dev/app', branch: 'claudenest/sprint-y', title: 'Sprint Y', body: 'body' },
      logger,
    );

    expect(result.sandboxed).toBe(false);
    expect(result.success).toBe(true);

    // Commands run as their real binaries, never wrapped.
    for (const { bin } of calls) {
      expect(bin).not.toBe('/usr/bin/bwrap');
      expect(['git', 'gh', 'sh']).toContain(bin);
    }
  });
});
