import { describe, it, expect } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { DecompositionStatus, Epic } from '@/types/multiagent';
import EpicBoard from '@/components/multiagent/EpicBoard.vue';

/**
 * EpicBoard renders the epic cards. These specs pin the AI-decomposition state
 * badge added to each card: it shows for pending/running/ready/failed (with a
 * spinner while in flight and the backend error as a tooltip on failure) and
 * stays hidden for idle / never-decomposed (null) epics.
 */
const epicboardMessages = {
  epics: 'Epics',
  tasks: 'tasks',
  decompositionPending: 'Queued',
  decompositionRunning: 'Decomposing…',
  decompositionReady: 'Decomposed',
  decompositionFailed: 'Decomposition failed',
  decompositionFailedTitle: 'Decomposition failed — {error}',
  generatePr: 'Generate PR',
  generatePrTitle: 'Open a pull request for this completed epic',
  generatingPr: 'Generating…',
  viewPr: 'View PR',
  viewPrNumbered: 'PR #{number}',
  viewPrTitle: 'Open the pull request',
  prStateOpen: 'open',
  prStateMerged: 'merged',
  prStateClosed: 'closed',
  prShipped: 'Shipped',
  prShippedTitle: "This epic's pull request has been merged and shipped",
};

function makeEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: 'e1',
    project_id: 'p1',
    title: 'Realtime notifications',
    description: null,
    color: '#a855f7',
    icon: 'layers',
    status: 'open',
    priority: 'medium',
    sort_order: 0,
    tasks_count: 0,
    completed_tasks_count: 0,
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
    created_at: '2026-06-16T00:00:00Z',
    updated_at: '2026-06-16T00:00:00Z',
    ...overrides,
  };
}

function mountBoard(epics: Epic[]): VueWrapper {
  const messages = { multiagentEpicboard: epicboardMessages };
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: messages, fr: messages },
  });
  return mount(EpicBoard, {
    props: { epics },
    global: {
      plugins: [i18n],
      // StatusBadge is a leaf relying on its own i18n namespace; stub it so the
      // spec stays focused on EpicBoard's decomposition badge.
      stubs: { StatusBadge: true },
    },
  });
}

describe('EpicBoard decomposition badge', () => {
  it.each<[DecompositionStatus, string]>([
    ['pending', 'Queued'],
    ['running', 'Decomposing…'],
    ['completed', 'Decomposed'],
    ['failed', 'Decomposition failed'],
  ])('renders the %s badge with its label', (status, label) => {
    const wrapper = mountBoard([makeEpic({ decomposition_status: status })]);
    const badge = wrapper.find('.deco-badge');

    expect(badge.exists()).toBe(true);
    expect(badge.classes()).toContain(`deco-${status}`);
    expect(badge.text()).toBe(label);
  });

  it('shows a spinner only while in flight (pending/running)', () => {
    expect(mountBoard([makeEpic({ decomposition_status: 'running' })]).find('.deco-spinner').exists()).toBe(true);
    expect(mountBoard([makeEpic({ decomposition_status: 'pending' })]).find('.deco-spinner').exists()).toBe(true);
    expect(mountBoard([makeEpic({ decomposition_status: 'completed' })]).find('.deco-spinner').exists()).toBe(false);
    expect(mountBoard([makeEpic({ decomposition_status: 'failed' })]).find('.deco-spinner').exists()).toBe(false);
  });

  it('surfaces the backend error as the failed badge tooltip', () => {
    const wrapper = mountBoard([
      makeEpic({ decomposition_status: 'failed', decomposition_error: 'credential expired' }),
    ]);
    expect(wrapper.find('.deco-badge').attributes('title')).toBe('Decomposition failed — credential expired');
  });

  it('hides the badge for idle and never-decomposed epics', () => {
    expect(mountBoard([makeEpic({ decomposition_status: 'idle' })]).find('.deco-badge').exists()).toBe(false);
    expect(mountBoard([makeEpic({ decomposition_status: null })]).find('.deco-badge').exists()).toBe(false);
  });
});

/**
 * Pull request action — the "create PR" button moved from SprintBoard to the
 * epic, surfaced once the epic reaches 100 %. Three states: a generate button
 * (complete, no PR), a busy/disabled button (finalize dispatched, PR pending),
 * and a live PR link (PR opened).
 */
describe('EpicBoard pull request action', () => {
  const complete = { tasks_count: 4, completed_tasks_count: 4, progress_percentage: 100 } as const;

  it('hides the PR action for an incomplete epic with no PR', () => {
    const wrapper = mountBoard([makeEpic({ tasks_count: 4, completed_tasks_count: 2, progress_percentage: 50 })]);
    expect(wrapper.find('.epic-pr').exists()).toBe(false);
  });

  it('hides the PR action for a 100% epic with zero tasks', () => {
    const wrapper = mountBoard([makeEpic({ tasks_count: 0, progress_percentage: 100 })]);
    expect(wrapper.find('.epic-pr').exists()).toBe(false);
  });

  it('shows the generate button for a complete epic without a PR', () => {
    const wrapper = mountBoard([makeEpic({ ...complete })]);
    const btn = wrapper.find('.epic-pr-btn');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe('Generate PR');
    expect(btn.attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.epic-pr-link').exists()).toBe(false);
  });

  it('emits finalize with the epic id when the button is clicked', async () => {
    const wrapper = mountBoard([makeEpic({ id: 'e9', ...complete })]);
    await wrapper.find('.epic-pr-btn').trigger('click');
    expect(wrapper.emitted('finalize')).toEqual([['e9']]);
  });

  it('emits select with the full epic when a card is clicked (drives Tasks-tab navigation)', async () => {
    // Show.vue's handleSelectEpic consumes the emitted epic to jump to the
    // Tasks tab pre-filtered on epic.id, so the board must hand back the row.
    const wrapper = mountBoard([makeEpic({ id: 'e3' })]);
    await wrapper.find('.epic-card').trigger('click');
    const events = wrapper.emitted('select');
    expect(events).toHaveLength(1);
    expect((events![0]![0] as { id: string }).id).toBe('e3');
  });

  it('disables the button with a spinner while the PR is being generated', () => {
    const wrapper = mountBoard([
      makeEpic({ ...complete, finalized_at: '2026-06-16T00:00:00Z', has_pull_request: false }),
    ]);
    const btn = wrapper.find('.epic-pr-btn');
    expect(btn.attributes('disabled')).toBeDefined();
    expect(btn.text()).toBe('Generating…');
    expect(wrapper.find('.epic-pr-spinner').exists()).toBe(true);
  });

  it('renders the PR link with its number and state once the PR is opened', () => {
    const wrapper = mountBoard([
      makeEpic({
        ...complete,
        has_pull_request: true,
        pr_url: 'https://github.com/acme/repo/pull/42',
        pr_number: 42,
        pr_state: 'open',
        finalized_at: '2026-06-16T00:00:00Z',
      }),
    ]);
    const link = wrapper.find('.epic-pr-link');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://github.com/acme/repo/pull/42');
    expect(link.classes()).toContain('pr-open');
    expect(link.text()).toContain('PR #42');
    expect(link.find('.pr-state').text()).toBe('open');
    expect(wrapper.find('.epic-pr-btn').exists()).toBe(false);
  });

  it('hides the Generate-PR button and shows a Shipped marker once pr_done', () => {
    const wrapper = mountBoard([
      makeEpic({ ...complete, has_pull_request: false, pr_done: true }),
    ]);
    expect(wrapper.find('.epic-pr-btn').exists()).toBe(false);
    const shipped = wrapper.find('.epic-pr-shipped');
    expect(shipped.exists()).toBe(true);
    expect(shipped.text()).toBe('Shipped');
  });
});
