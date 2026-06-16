import { describe, it, expect, vi, beforeEach } from 'vitest';

// Programmable fake finalizer: the handler must report back exactly what it
// returns. The PR/git logic itself is covered by sprint-finalize.test.ts.
let finalizeImpl: () => {
  success: boolean;
  branch: string;
  committed: boolean;
  sandboxed: boolean;
  prUrl?: string;
  error?: string;
};

vi.mock('../sessions/sprint-finalize.js', () => ({
  finalizeSprint: () => finalizeImpl(),
}));

const sent: Array<{ type: string; payload: Record<string, unknown> }> = [];
const wsClient = { send: (type: string, payload: Record<string, unknown>) => sent.push({ type, payload }) };
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

const { createEpicHandlers } = await import('./epic-handler.js');
const handlers = createEpicHandlers({ wsClient: wsClient as never, logger: logger as never });

const payload = {
  epicId: 'e1',
  projectId: 'p1',
  projectPath: '/app',
  branch: 'claudenest/epic-design-sprint-a2081dc5',
  title: 'Epic: design sprint',
  body: '## Epic',
};

describe('epic-handler', () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it('reports epic:finalized with the PR url on success', async () => {
    finalizeImpl = () => ({
      success: true,
      branch: payload.branch,
      committed: true,
      sandboxed: true,
      prUrl: 'https://github.com/org/repo/pull/42',
    });

    await handlers['epic:finalize'](payload);

    expect(sent).toHaveLength(1);
    const { type, payload: out } = sent[0]!;
    expect(type).toBe('epic:finalized');
    expect(out.epicId).toBe('e1');
    expect(out.projectId).toBe('p1');
    expect(out.success).toBe(true);
    expect(out.prUrl).toBe('https://github.com/org/repo/pull/42');
    expect(out.branch).toBe(payload.branch);
  });

  it('still reports epic:finalized (with the error) on failure', async () => {
    finalizeImpl = () => ({
      success: false,
      branch: payload.branch,
      committed: false,
      sandboxed: true,
      error: 'git push failed: rejected',
    });

    await handlers['epic:finalize'](payload);

    expect(sent).toHaveLength(1);
    expect(sent[0]!.type).toBe('epic:finalized');
    expect(sent[0]!.payload.success).toBe(false);
    expect(sent[0]!.payload.error).toBe('git push failed: rejected');
    // Never emit a phantom prUrl when none was produced.
    expect(sent[0]!.payload.prUrl).toBeUndefined();
  });

  it('ignores a dispatch missing required fields without replying', async () => {
    finalizeImpl = () => {
      throw new Error('finalizeSprint must not run on an invalid payload');
    };

    await handlers['epic:finalize']({ ...payload, branch: '' });

    expect(sent).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalled();
  });
});
