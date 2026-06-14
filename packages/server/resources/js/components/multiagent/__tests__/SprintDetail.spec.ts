import { describe, it, expect } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { Sprint, SprintTask } from '@/types/multiagent';
import SprintDetail from '@/components/multiagent/SprintDetail.vue';

/**
 * SprintDetail surfaces a sprint's embedded task list (the `tasks` payload
 * from GET /sprints/{id}) grouped by status. These specs pin that rendering:
 * workflow-ordered groups, per-task metadata, empty state, and the
 * remaining-count server/fallback contract.
 */

function makeTask(id: string, overrides: Partial<SprintTask> = {}): SprintTask {
  return {
    id,
    title: `Task ${id}`,
    status: 'pending',
    priority: 'medium',
    story_points: null,
    assigned_to: null,
    ...overrides,
  };
}

function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 's1',
    project_id: 'p1',
    name: 'Sprint 1',
    goal: null,
    status: 'active',
    start_date: null,
    end_date: null,
    velocity: null,
    capacity: 10,
    sort_order: 0,
    tasks_count: 0,
    completed_tasks_count: 0,
    total_story_points: 0,
    completed_story_points: 0,
    progress_percentage: 0,
    remaining_days: null,
    is_overdue: false,
    tasks: [],
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

function mountDetail(sprint: Sprint | null): VueWrapper {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} } });
  return mount(SprintDetail, {
    props: { sprint },
    global: {
      plugins: [i18n],
      // StatusBadge is a leaf presentational component; stub it so the spec
      // asserts on SprintDetail's own structure, not the badge internals.
      stubs: { StatusBadge: { template: '<span class="status-badge-stub" />' } },
    },
  });
}

describe('SprintDetail — sprint task list', () => {
  it('renders the empty placeholder when no sprint is selected', () => {
    const wrapper = mountDetail(null);

    expect(wrapper.find('.sd-empty').exists()).toBe(true);
    expect(wrapper.find('.sd-tasks').exists()).toBe(false);
  });

  it('shows the no-tasks message when the sprint has an empty task list', () => {
    const wrapper = mountDetail(makeSprint({ tasks: [] }));

    expect(wrapper.find('.sd-tasks-empty').exists()).toBe(true);
    expect(wrapper.findAll('.sd-task')).toHaveLength(0);
  });

  it('renders every embedded task', () => {
    const wrapper = mountDetail(
      makeSprint({
        tasks: [
          makeTask('a', { status: 'in_progress' }),
          makeTask('b', { status: 'done' }),
          makeTask('c', { status: 'pending' }),
        ],
      })
    );

    expect(wrapper.findAll('.sd-task')).toHaveLength(3);
    expect(wrapper.text()).toContain('Task a');
    expect(wrapper.text()).toContain('Task b');
    expect(wrapper.text()).toContain('Task c');
  });

  it('groups tasks by status in workflow order (active work first, done last)', () => {
    const wrapper = mountDetail(
      makeSprint({
        tasks: [
          makeTask('d1', { status: 'done' }),
          makeTask('p1', { status: 'pending' }),
          makeTask('w1', { status: 'in_progress' }),
        ],
      })
    );

    const groups = wrapper.findAll('.sd-group');
    expect(groups).toHaveLength(3);

    // STATUS_ORDER → in_progress before pending before done.
    const firstTaskTitle = (i: number) => groups[i].find('.sd-task-title').text();
    expect(firstTaskTitle(0)).toBe('Task w1');
    expect(firstTaskTitle(1)).toBe('Task p1');
    expect(firstTaskTitle(2)).toBe('Task d1');
  });

  it('omits status groups that have no tasks', () => {
    const wrapper = mountDetail(
      makeSprint({ tasks: [makeTask('only', { status: 'in_progress' })] })
    );

    // Only the in_progress group renders — no empty review/blocked/etc. columns.
    expect(wrapper.findAll('.sd-group')).toHaveLength(1);
  });

  it('renders per-task story points and assignee metadata', () => {
    const wrapper = mountDetail(
      makeSprint({
        tasks: [makeTask('x', { story_points: 5, assigned_to: 'instance-abcdef123456' })],
      })
    );

    const points = wrapper.find('.sd-task-points');
    expect(points.exists()).toBe(true);
    expect(points.text()).toContain('5');

    const assignee = wrapper.find('.sd-task-assignee');
    expect(assignee.exists()).toBe(true);
    // Long instance ids are truncated by shortAssignee().
    expect(assignee.text()).toContain('…');
  });

  it('uses the server-provided remaining count when present', () => {
    const wrapper = mountDetail(
      makeSprint({ tasks_count: 8, completed_tasks_count: 3, remaining_tasks_count: 2 })
    );

    expect(wrapper.find('.sd-count-remaining').text()).toContain('2');
  });

  it('falls back to (total − done) when the remaining count is absent', () => {
    const wrapper = mountDetail(
      makeSprint({ tasks_count: 8, completed_tasks_count: 3, remaining_tasks_count: undefined })
    );

    // 8 − 3 = 5.
    expect(wrapper.find('.sd-count-remaining').text()).toContain('5');
  });
});
