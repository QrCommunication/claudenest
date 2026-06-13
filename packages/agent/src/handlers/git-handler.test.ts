import { describe, it, expect, vi, beforeEach } from 'vitest';

// Programmable fake runner: maps a command's args to a canned result.
let execImpl: (cmd: string, args: string[]) => { ok: boolean; out: string };

vi.mock('../sessions/sandbox.js', () => ({
  createSandboxedRunner: () => ({
    sandboxed: true,
    exec: (cmd: string, args: string[]) => execImpl(cmd, args),
  }),
}));

const sent: Array<{ type: string; payload: Record<string, unknown> }> = [];
const wsClient = { send: (type: string, payload: Record<string, unknown>) => sent.push({ type, payload }) };
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

const { createGitHandlers } = await import('./git-handler.js');
const handlers = createGitHandlers({
  wsClient: wsClient as never,
  logger: logger as never,
});

describe('git-handler', () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it('parses git status porcelain (branch, ahead/behind, dirty files)', async () => {
    execImpl = (cmd, args) => {
      if (args.includes('--is-inside-work-tree')) return { ok: true, out: 'true' };
      if (args[0] === 'status') {
        return {
          ok: true,
          // NUL-separated: branch header + two file records.
          out: '## main...origin/main [ahead 1, behind 2]\0 M src/a.ts\0?? new.txt\0',
        };
      }
      if (args[0] === 'remote') return { ok: true, out: 'git@github.com:org/repo.git' };
      if (args[0] === 'log') return { ok: true, out: 'abc123 last commit' };
      return { ok: true, out: '' };
    };

    await handlers['git:status']({ requestId: 'r1', projectPath: '/app' });

    expect(sent).toHaveLength(1);
    const { type, payload } = sent[0]!;
    expect(type).toBe('git:status:result');
    expect(payload.requestId).toBe('r1');
    expect(payload.branch).toBe('main');
    expect(payload.ahead).toBe(1);
    expect(payload.behind).toBe(2);
    expect(payload.clean).toBe(false);
    expect(payload.files).toEqual([
      { code: ' M', path: 'src/a.ts' },
      { code: '??', path: 'new.txt' },
    ]);
    expect(payload.remoteUrl).toBe('git@github.com:org/repo.git');
  });

  it('reports a non-git directory cleanly', async () => {
    execImpl = () => ({ ok: false, out: 'fatal: not a git repository' });

    await handlers['git:status']({ requestId: 'r2', projectPath: '/tmp' });

    expect(sent[0]!.payload).toMatchObject({ requestId: 'r2', error: 'not a git repository' });
  });

  it('lists pull requests as parsed JSON', async () => {
    execImpl = (cmd, args) => {
      if (args.includes('command -v gh')) return { ok: true, out: '/usr/bin/gh' };
      if (args[0] === 'pr' && args[1] === 'list') {
        return { ok: true, out: JSON.stringify([{ number: 7, title: 'Feature', headRefName: 'feat' }]) };
      }
      return { ok: true, out: '' };
    };

    await handlers['pr:list']({ requestId: 'r3', projectPath: '/app' });

    const { type, payload } = sent[0]!;
    expect(type).toBe('pr:list:result');
    expect(payload.prs).toEqual([{ number: 7, title: 'Feature', headRefName: 'feat' }]);
  });

  it('merges a PR with the requested method', async () => {
    const seen: string[][] = [];
    execImpl = (cmd, args) => {
      seen.push(args);
      if (args.includes('command -v gh')) return { ok: true, out: '/usr/bin/gh' };
      return { ok: true, out: 'merged' };
    };

    await handlers['pr:merge']({ requestId: 'r4', projectPath: '/app', number: 7, method: 'squash' });

    expect(sent[0]!.payload).toMatchObject({ requestId: 'r4', merged: true, number: 7 });
    const mergeCall = seen.find((a) => a[0] === 'pr' && a[1] === 'merge');
    expect(mergeCall).toContain('--squash');
    expect(mergeCall).toContain('--delete-branch');
    expect(mergeCall).toContain('7');
  });

  it('surfaces a merge failure as merged:false', async () => {
    execImpl = (cmd, args) => {
      if (args.includes('command -v gh')) return { ok: true, out: '/usr/bin/gh' };
      return { ok: false, out: 'Pull request is not mergeable' };
    };

    await handlers['pr:merge']({ requestId: 'r5', projectPath: '/app', number: 9 });

    expect(sent[0]!.payload).toMatchObject({ requestId: 'r5', merged: false });
    expect(String(sent[0]!.payload.error)).toContain('not mergeable');
  });
});
