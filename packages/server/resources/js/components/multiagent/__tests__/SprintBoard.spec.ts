import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { Sprint } from '@/types';

/**
 * SprintBoard is self-contained: it reads the full sprint list from the sprints
 * store and fetches a sprint's detail on selection. These specs pin the two
 * pieces of UX added by the sprint-board polish:
 *   - the active-sprint action button relabeled "Generate PR" (emits
 *     `complete-sprint`, which triggers PR generation server-side);
 *   - the clickable numbered selector (.sprint-pager) that jumps between sprints.
 * The store composable is mocked so the spec stays focused on the component.
 */
const mocked = vi.hoisted(() => ({
  sprintsStore: {
    sprints: [] as Sprint[],
    fetchSprint: vi.fn((id: string) => Promise.resolve({ id } as unknown as Sprint)),
  },
}));

vi.mock('@/stores/sprints', () => ({ useSprintsStore: () => mocked.sprintsStore }));

import SprintBoard from '@/components/multiagent/SprintBoard.vue';

// Real i18n messages for the keys the specs assert on; unlisted keys fall back
// to their path (fine, we don't assert on them).
const sprintboardMessages = {
  generatePr: 'Generate PR',
  generatePrTitle: 'Complete the sprint and open a pull request',
  goToSprint: 'Go to sprint {number}',
  startNewSprint: 'Start a new sprint',
};

function makeSprint(id: string, overrides: Partial<Sprint> = {}): Sprint {
  return {
    id,
    name: `Sprint ${id}`,
    status: 'planning',
    sort_order: 0,
    ...overrides,
  } as unknown as Sprint;
}

async function mountBoard(): Promise<VueWrapper> {
  const messages = { multiagentSprintboard: sprintboardMessages };
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: messages, fr: messages },
  });
  const wrapper = mount(SprintBoard, {
    global: {
      plugins: [i18n],
      // SprintDetail is a leaf; stub it so the spec asserts SprintBoard's own
      // navigation structure, not the detail rendering.
      stubs: { SprintDetail: { template: '<div class="sprint-detail-stub" />' } },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('SprintBoard — generate PR + numbered selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.sprintsStore.sprints = [];
  });

  it('shows the empty state and emits create-sprint when there is no sprint', async () => {
    const wrapper = await mountBoard();

    expect(wrapper.find('.no-sprint').exists()).toBe(true);
    expect(wrapper.find('.sprint-nav').exists()).toBe(false);
    expect(wrapper.find('.sprint-pager').exists()).toBe(false);

    await wrapper.find('.start-sprint-btn').trigger('click');
    expect(wrapper.emitted('create-sprint')).toHaveLength(1);
  });

  it('hides the numbered selector when there is a single sprint', async () => {
    mocked.sprintsStore.sprints = [makeSprint('s1', { status: 'active' })];

    const wrapper = await mountBoard();

    expect(wrapper.find('.sprint-nav').exists()).toBe(true);
    expect(wrapper.find('.sprint-pager').exists()).toBe(false);
  });

  it('renders one numbered pager dot per sprint, in sort order', async () => {
    mocked.sprintsStore.sprints = [
      makeSprint('b', { sort_order: 1 }),
      makeSprint('a', { sort_order: 0, status: 'active' }),
      makeSprint('c', { sort_order: 2 }),
    ];

    const wrapper = await mountBoard();

    const dots = wrapper.findAll('.pager-dot');
    expect(dots).toHaveLength(3);
    // Numbered 1..n in sort_order order.
    expect(dots.map(d => d.text())).toEqual(['1', '2', '3']);
    // Numbered aria-labels use the {number} param.
    expect(dots[0].attributes('aria-label')).toBe('Go to sprint 1');
    expect(dots[2].attributes('aria-label')).toBe('Go to sprint 3');
  });

  it('marks the active sprint as the current pager dot by default', async () => {
    mocked.sprintsStore.sprints = [
      makeSprint('a', { sort_order: 0 }),
      makeSprint('b', { sort_order: 1, status: 'active' }),
    ];

    const wrapper = await mountBoard();

    const dots = wrapper.findAll('.pager-dot');
    // The active sprint (index 1) is the default selection.
    expect(dots[1].classes()).toContain('is-current');
    expect(dots[1].attributes('aria-selected')).toBe('true');
    expect(dots[0].classes()).not.toContain('is-current');
  });

  it('jumps to a sprint when its numbered dot is clicked', async () => {
    mocked.sprintsStore.sprints = [
      makeSprint('a', { sort_order: 0, status: 'active' }),
      makeSprint('b', { sort_order: 1 }),
      makeSprint('c', { sort_order: 2 }),
    ];

    const wrapper = await mountBoard();
    vi.clearAllMocks(); // ignore the on-mount default fetch

    await wrapper.findAll('.pager-dot')[2].trigger('click');
    await flushPromises();

    const dots = wrapper.findAll('.pager-dot');
    expect(dots[2].classes()).toContain('is-current');
    expect(dots[0].classes()).not.toContain('is-current');
    // Selecting a sprint loads its detail from the store.
    expect(mocked.sprintsStore.fetchSprint).toHaveBeenLastCalledWith('c');
  });

  it('shows the "Generate PR" action only for an active selected sprint and emits complete-sprint', async () => {
    mocked.sprintsStore.sprints = [makeSprint('s1', { status: 'active' })];

    const wrapper = await mountBoard();

    const btn = wrapper.find('.complete-sprint-btn');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe('Generate PR');
    expect(btn.attributes('title')).toBe('Complete the sprint and open a pull request');
    expect(btn.attributes('aria-label')).toBe('Complete the sprint and open a pull request');

    await btn.trigger('click');
    expect(wrapper.emitted('complete-sprint')).toHaveLength(1);
  });

  it('hides the Generate PR action when the selected sprint is not active', async () => {
    mocked.sprintsStore.sprints = [makeSprint('s1', { status: 'completed' })];

    const wrapper = await mountBoard();

    expect(wrapper.find('.complete-sprint-btn').exists()).toBe(false);
  });

  it('disables the prev arrow on the first sprint and navigates with next', async () => {
    mocked.sprintsStore.sprints = [
      makeSprint('a', { sort_order: 0, status: 'active' }),
      makeSprint('b', { sort_order: 1 }),
    ];

    const wrapper = await mountBoard();

    const arrows = wrapper.findAll('.nav-arrow');
    const [prev, next] = arrows;
    // Active sprint 'a' is selected first (index 0) -> prev disabled.
    expect(prev.attributes('disabled')).toBeDefined();
    expect(next.attributes('disabled')).toBeUndefined();

    await next.trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.pager-dot')[1].classes()).toContain('is-current');
  });
});
