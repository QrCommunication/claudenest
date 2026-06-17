import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEpicsStore } from '@/stores/epics';
import type { Epic, DecomposeEpicForm, DecomposeEpicResponse } from '@/types';

// The epics store talks to the backend through the shared axios wrapper and to
// Reverb through the Echo client singleton. Both are mocked so these specs
// exercise the local state transitions and the realtime handler in isolation.
vi.mock('@/composables/useApi', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };
  return { api, useApi: () => api };
});

// ── Fake Echo client ─────────────────────────────────────────────────────────
// `private(channel)` returns the same chainable channel object per name; it
// records `.listen` handlers keyed by event so a spec can fire a broadcast.
type Handler = (payload: unknown) => void;

const channels = new Map<string, Map<string, Set<Handler>>>();

function channelFor(name: string) {
  let events = channels.get(name);
  if (!events) {
    events = new Map();
    channels.set(name, events);
  }
  const chan = {
    listen(event: string, handler: Handler) {
      let set = events!.get(event);
      if (!set) {
        set = new Set();
        events!.set(event, set);
      }
      set.add(handler);
      return chan;
    },
    stopListening(event: string, handler: Handler) {
      events!.get(event)?.delete(handler);
      return chan;
    },
  };
  return chan;
}

const fakeEcho = { private: (name: string) => channelFor(name) };

vi.mock('@/services/echo', () => ({
  getEchoClient: () => fakeEcho,
}));

import { api } from '@/composables/useApi';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

/** Fire every registered handler for an event on a channel. */
function emit(channel: string, event: string, payload: unknown): void {
  channels.get(channel)?.get(event)?.forEach(h => h(payload));
}

/** Minimal Epic fixture — only the fields the store touches matter. */
function makeEpic(id: string, overrides: Partial<Epic> = {}): Epic {
  return {
    id,
    project_id: 'proj-1',
    title: `Epic ${id}`,
    description: null,
    color: '#a855f7',
    icon: null,
    status: 'open',
    priority: 'medium',
    sort_order: 0,
    tasks_count: 0,
    completed_tasks_count: 0,
    remaining_tasks_count: 0,
    progress_percentage: 0,
    decomposition_status: null,
    decomposition_session_id: null,
    decomposition_error: null,
    decomposed_at: null,
    archived_at: null,
    is_archived: false,
    pr_url: null,
    pr_number: null,
    pr_state: null,
    pr_branch: null,
    has_pull_request: false,
    finalized_at: null,
    pr_done: false,
    started_at: null,
    completed_at: null,
    created_at: '2026-06-16T00:00:00+00:00',
    updated_at: '2026-06-16T00:00:00+00:00',
    ...overrides,
  };
}

/** Wrap data in the standard `{ success, data }` API envelope. */
function envelope<T>(data: T) {
  return { data: { success: true, data } };
}

const form: DecomposeEpicForm = {
  title: 'Auth feature',
  prd: 'Build login + 2FA',
  credential_id: 'cred-1',
};

describe('Epics store — decomposeEpic action', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    channels.clear();
  });

  it('POSTs to the decompose endpoint and surfaces the running epic on the board', async () => {
    const store = useEpicsStore();

    const running = makeEpic('e1', { decomposition_status: 'running' });
    const response: DecomposeEpicResponse = {
      epic: running,
      session_id: 'sess-9',
      status: 'decomposing',
      message: 'Decomposition launched',
    };
    mockApi.post.mockResolvedValueOnce(envelope(response));

    const result = await store.decomposeEpic('proj-1', form);

    expect(mockApi.post).toHaveBeenCalledWith('/projects/proj-1/epics/decompose', form);
    expect(result).toEqual(response);
    // The pending/running epic is added immediately (live badge).
    expect(store.epics.map(e => e.id)).toEqual(['e1']);
    expect(store.epics[0].decomposition_status).toBe('running');
  });

  it('does not duplicate the epic when a realtime broadcast already raced it in', async () => {
    const store = useEpicsStore();
    // Simulate the broadcast having already inserted the epic.
    store.epics = [makeEpic('e1', { decomposition_status: 'pending' })];

    const running = makeEpic('e1', { decomposition_status: 'running' });
    mockApi.post.mockResolvedValueOnce(
      envelope({ epic: running, session_id: 's', status: 'decomposing', message: 'm' }),
    );

    await store.decomposeEpic('proj-1', form);

    expect(store.epics).toHaveLength(1);
    expect(store.epics[0].decomposition_status).toBe('running');
  });

  it('surfaces the error and leaves the board untouched on failure', async () => {
    const store = useEpicsStore();
    store.epics = [makeEpic('existing')];

    mockApi.post.mockRejectedValueOnce(new Error('offline machine'));

    await expect(store.decomposeEpic('proj-1', form)).rejects.toThrow('offline machine');
    expect(store.epics.map(e => e.id)).toEqual(['existing']);
    expect(store.error).toBe('offline machine');
  });
});

describe('Epics store — realtime .epic.decomposition', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    channels.clear();
  });

  it('updates the epic in place and maps decomposition_completed_at to decomposed_at', () => {
    const store = useEpicsStore();
    store.epics = [makeEpic('e1', { decomposition_status: 'running' })];
    store.subscribeRealtime('proj-1');

    emit('projects.proj-1', '.epic.decomposition', {
      epic_id: 'e1',
      project_id: 'proj-1',
      action: 'failed',
      decomposition_status: 'failed',
      decomposition_error: 'boom',
      decomposition_completed_at: null,
      timestamp: '2026-06-16T00:00:00+00:00',
    });

    expect(store.epics[0].decomposition_status).toBe('failed');
    expect(store.epics[0].decomposition_error).toBe('boom');
    // No refetch on a failed transition.
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('refetches the epics on a completed transition (sprints/tasks not in payload)', async () => {
    const store = useEpicsStore();
    store.epics = [makeEpic('e1', { decomposition_status: 'running' })];
    store.subscribeRealtime('proj-1');

    mockApi.get.mockResolvedValueOnce(
      envelope([makeEpic('e1', {
        decomposition_status: 'completed',
        decomposed_at: '2026-06-16T01:00:00+00:00',
        tasks_count: 5,
      })]),
    );

    emit('projects.proj-1', '.epic.decomposition', {
      epic_id: 'e1',
      project_id: 'proj-1',
      action: 'completed',
      decomposition_status: 'completed',
      decomposition_error: null,
      decomposition_completed_at: '2026-06-16T01:00:00+00:00',
      timestamp: '2026-06-16T01:00:00+00:00',
    });

    // Translated alias applied synchronously before the refetch resolves.
    expect(store.epics[0].decomposition_status).toBe('completed');
    expect(store.epics[0].decomposed_at).toBe('2026-06-16T01:00:00+00:00');
    expect(mockApi.get).toHaveBeenCalledWith('/projects/proj-1/epics');

    await vi.waitFor(() => expect(store.epics[0].tasks_count).toBe(5));
  });

  it('detaches its handlers on unsubscribe (no stale updates)', () => {
    const store = useEpicsStore();
    store.epics = [makeEpic('e1', { decomposition_status: 'running' })];
    store.subscribeRealtime('proj-1');
    store.unsubscribeRealtime();

    emit('projects.proj-1', '.epic.decomposition', {
      epic_id: 'e1',
      project_id: 'proj-1',
      action: 'completed',
      decomposition_status: 'completed',
      decomposition_error: null,
      decomposition_completed_at: '2026-06-16T01:00:00+00:00',
      timestamp: '2026-06-16T01:00:00+00:00',
    });

    expect(store.epics[0].decomposition_status).toBe('running');
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});

describe('Epics store — realtime .epic.updated PR lifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    channels.clear();
  });

  it('patches pr_done and pr_state in place from the broadcast', () => {
    const store = useEpicsStore();
    store.epics = [makeEpic('e1', { status: 'in_progress', pr_done: false, pr_state: null })];
    store.subscribeRealtime('proj-1');
    // finalized triggers a backstop refetch — mock it so its promise resolves.
    mockApi.get.mockResolvedValueOnce(envelope([makeEpic('e1', { pr_done: true, pr_state: 'merged' })]));

    emit('projects.proj-1', '.epic.updated', {
      epic_id: 'e1',
      action: 'finalized',
      title: 'Epic e1',
      status: 'done',
      progress_percentage: 100,
      pr_state: 'merged',
      pr_done: true,
      timestamp: '2026-06-16T02:00:00+00:00',
    });

    // The merged/shipped markers are reflected instantly (button hide).
    expect(store.epics[0].pr_done).toBe(true);
    expect(store.epics[0].pr_state).toBe('merged');
    expect(store.epics[0].status).toBe('done');
  });

  it('refetches on the finalized action to pick up pr_url/pr_number', () => {
    const store = useEpicsStore();
    store.epics = [makeEpic('e1', { status: 'in_progress' })];
    store.subscribeRealtime('proj-1');
    mockApi.get.mockResolvedValueOnce(envelope([makeEpic('e1')]));

    emit('projects.proj-1', '.epic.updated', {
      epic_id: 'e1',
      action: 'finalized',
      title: 'Epic e1',
      status: 'done',
      progress_percentage: 100,
      pr_state: 'open',
      pr_done: false,
      timestamp: '2026-06-16T02:00:00+00:00',
    });

    expect(mockApi.get).toHaveBeenCalledWith('/projects/proj-1/epics');
  });

  it('does not refetch on a plain update but still patches pr markers', () => {
    const store = useEpicsStore();
    store.epics = [makeEpic('e1', { pr_done: false })];
    store.subscribeRealtime('proj-1');

    emit('projects.proj-1', '.epic.updated', {
      epic_id: 'e1',
      action: 'updated',
      title: 'Epic e1',
      status: 'in_progress',
      progress_percentage: 50,
      pr_state: 'open',
      pr_done: false,
      timestamp: '2026-06-16T02:00:00+00:00',
    });

    expect(store.epics[0].pr_state).toBe('open');
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});
