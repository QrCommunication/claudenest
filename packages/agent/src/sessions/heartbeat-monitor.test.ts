/**
 * Tests for the process-liveness HeartbeatMonitor.
 *
 * The monitor POSTs `{status:'active'}` on a 30s cadence while BOTH gates hold:
 *   - `tmux has-session` exits 0 (execFileSync mocked)
 *   - `process.kill(panePid, 0)` does not throw (mocked)
 * It defers to the hooks via shouldSendHeartbeat (sentinel <30s → skip) and
 * stops itself when the pane dies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Module mocks ─────────────────────────────────────────────────────────────

const postSilentMock = vi.fn(async () => ({ ok: true, status: 200, body: null }));
const shouldSendHeartbeatMock = vi.fn(() => true);
const touchHeartbeatFileMock = vi.fn();

vi.mock('../hooks/lib.js', () => ({
  postSilent: postSilentMock,
  shouldSendHeartbeat: shouldSendHeartbeatMock,
  touchHeartbeatFile: touchHeartbeatFileMock,
}));

const execFileSyncMock = vi.fn();
vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
}));

// Imported AFTER the mocks so it binds to the mocked deps.
const { HeartbeatMonitor } = await import('./heartbeat-monitor.js');
const { createLogger } = await import('../utils/logger.js');

const logger = createLogger('fatal');

function makeMonitor(panePid: number | undefined = 4242) {
  return new HeartbeatMonitor({
    tmuxName: 'cn-test-session',
    getPanePid: () => panePid,
    instanceId: 'inst-1',
    apiUrl: 'http://localhost',
    token: 'tok-abc',
    runtimeDir: '/tmp/cn-runtime',
    logger,
  });
}

describe('HeartbeatMonitor', () => {
  let killSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    postSilentMock.mockClear();
    shouldSendHeartbeatMock.mockClear();
    shouldSendHeartbeatMock.mockReturnValue(true);
    touchHeartbeatFileMock.mockClear();
    // tmux has-session → exit 0 (no throw) by default = session alive.
    execFileSyncMock.mockReset();
    execFileSyncMock.mockReturnValue(Buffer.from(''));
    // process.kill(pid, 0) → alive by default.
    killSpy = vi.spyOn(process, 'kill').mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    killSpy.mockRestore();
  });

  it('POSTs heartbeats while tmux session + pane process are alive', async () => {
    const monitor = makeMonitor();
    monitor.start();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(postSilentMock).toHaveBeenCalledTimes(1);
    // Hits the right endpoint with status:active.
    expect(postSilentMock).toHaveBeenLastCalledWith(
      'http://localhost/api/instances/inst-1/heartbeat',
      'tok-abc',
      { status: 'active' },
      2_000,
    );
    // The shared sentinel is touched so the hooks don't double-count.
    expect(touchHeartbeatFileMock).toHaveBeenCalledWith('/tmp/cn-runtime');

    await vi.advanceTimersByTimeAsync(30_000);
    expect(postSilentMock).toHaveBeenCalledTimes(2);

    monitor.stop();
  });

  it('stops POSTing after stop()', async () => {
    const monitor = makeMonitor();
    monitor.start();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(postSilentMock).toHaveBeenCalledTimes(1);

    monitor.stop();

    await vi.advanceTimersByTimeAsync(120_000);
    // No further beats once stopped.
    expect(postSilentMock).toHaveBeenCalledTimes(1);
  });

  it('skips the POST when the sentinel says a beat is too recent (<30s)', async () => {
    shouldSendHeartbeatMock.mockReturnValue(false);
    const monitor = makeMonitor();
    monitor.start();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(postSilentMock).not.toHaveBeenCalled();
    // But the gates (tmux + pane) were still evaluated.
    expect(execFileSyncMock).toHaveBeenCalled();
    expect(killSpy).toHaveBeenCalledWith(4242, 0);

    monitor.stop();
  });

  it('stops itself when the pane process is dead (kill -0 throws)', async () => {
    killSpy.mockImplementation(() => {
      throw new Error('ESRCH');
    });
    const monitor = makeMonitor();
    monitor.start();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(postSilentMock).not.toHaveBeenCalled();

    // Monitor stopped itself → no further ticks even after more time.
    killSpy.mockReturnValue(true); // pane "comes back" — must NOT resume
    await vi.advanceTimersByTimeAsync(60_000);
    expect(postSilentMock).not.toHaveBeenCalled();

    monitor.stop();
  });

  it('stops itself when the tmux session is gone (has-session throws)', async () => {
    execFileSyncMock.mockImplementation(() => {
      throw new Error('no server running');
    });
    const monitor = makeMonitor();
    monitor.start();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(postSilentMock).not.toHaveBeenCalled();
    // Pane gate never reached because tmux gate failed first.
    expect(killSpy).not.toHaveBeenCalled();

    monitor.stop();
  });
});
