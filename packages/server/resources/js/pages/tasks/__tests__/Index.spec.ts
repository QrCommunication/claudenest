import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { SharedTask, Sprint } from '@/types';

/**
 * Tasks page (pages/tasks/Index.vue) — sprint filter.
 *
 * The sprint filter is *server-driven*: selecting a sprint re-fetches the task
 * list with a `sprint_id` param (which bypasses the backend default-visibility
 * scope). These specs pin that contract:
 *   - the filter only renders once a project is selected;
 *   - "All" → no param, "No sprint" → sprint_id=none, a sprint → sprint_id=<uuid>;
 *   - changing the project resets the filter so a stale sprint id never leaks
 *     into the next project's fetch.
 *
 * The four Pinia stores are mocked so the spec stays focused on the filter
 * wiring without axios or real store internals.
 */

const mocked = vi.hoisted(() => ({
  tasksStore: {
    tasks: [] as SharedTask[],
    isLoading: false,
    fetchTasks: vi.fn().mockResolvedValue([]),
  },
  projectsStore: {
    projects: [] as Array<{ id: string; name: string }>,
    instances: [] as unknown[],
    fetchInstances: vi.fn().mockResolvedValue([]),
  },
  sprintsStore: {
    sprints: [] as Sprint[],
    fetchSprints: vi.fn().mockResolvedValue([]),
  },
  toastStore: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/stores/tasks', () => ({ useTasksStore: () => mocked.tasksStore }));
vi.mock('@/stores/projects', () => ({ useProjectsStore: () => mocked.projectsStore }));
vi.mock('@/stores/sprints', () => ({ useSprintsStore: () => mocked.sprintsStore }));
vi.mock('@/stores/toasts', () => ({ useToastStore: () => mocked.toastStore }));

import TasksIndex from '@/pages/tasks/Index.vue';

function makeSprint(id: string, name: string): Sprint {
  return { id, name } as unknown as Sprint;
}

const SPRINT_SELECT = '[aria-label="tasksIndex.filterBySprint"]';

async function mountPage(): Promise<VueWrapper> {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} } });
  const stub = { template: '<div><slot /></div>' };
  const wrapper = mount(TasksIndex, {
    global: {
      plugins: [i18n],
      stubs: {
        Card: stub,
        Button: { template: '<button><slot /></button>' },
        Modal: stub,
        KanbanBoard: true,
        TaskCard: true,
        TaskForm: true,
        InstanceBadge: true,
        FileLockIndicator: true,
      },
    },
  });
  await flushPromises();
  return wrapper;
}

/** Drive the project <select> and let onProjectChange settle. */
async function selectProject(wrapper: VueWrapper, projectId: string): Promise<void> {
  await wrapper.find('.project-select').setValue(projectId);
  await flushPromises();
}

describe('TasksIndex — sprint filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.tasksStore.tasks = [];
    mocked.tasksStore.isLoading = false;
    mocked.projectsStore.projects = [
      { id: 'proj-1', name: 'Project One' },
      { id: 'proj-2', name: 'Project Two' },
    ];
    mocked.projectsStore.instances = [];
    mocked.sprintsStore.sprints = [
      makeSprint('s1', 'Sprint 1'),
      makeSprint('s2', 'Sprint 2'),
    ];
  });

  it('hides the sprint filter until a project is selected', async () => {
    const wrapper = await mountPage();
    expect(wrapper.find(SPRINT_SELECT).exists()).toBe(false);
  });

  it('shows the filter with All / No sprint / per-sprint options once a project is selected', async () => {
    const wrapper = await mountPage();
    await selectProject(wrapper, 'proj-1');

    const select = wrapper.find(SPRINT_SELECT);
    expect(select.exists()).toBe(true);

    const options = select.findAll('option');
    // All + No sprint + 2 sprints
    expect(options).toHaveLength(4);
    expect(options[0].attributes('value')).toBe('');
    expect(options[1].attributes('value')).toBe('__none__');
    expect(options[2].attributes('value')).toBe('s1');
    expect(options[3].attributes('value')).toBe('s2');
  });

  it('selecting a project fetches its tasks with no sprint param (default visibility) and loads its sprints', async () => {
    const wrapper = await mountPage();
    await selectProject(wrapper, 'proj-1');

    expect(mocked.tasksStore.fetchTasks).toHaveBeenCalledWith('proj-1', undefined);
    expect(mocked.sprintsStore.fetchSprints).toHaveBeenCalledWith('proj-1');
    expect(mocked.projectsStore.fetchInstances).toHaveBeenCalledWith('proj-1');
  });

  it('filtering by a specific sprint re-fetches with sprint_id=<uuid>', async () => {
    const wrapper = await mountPage();
    await selectProject(wrapper, 'proj-1');
    mocked.tasksStore.fetchTasks.mockClear();

    await wrapper.find(SPRINT_SELECT).setValue('s1');
    await flushPromises();

    expect(mocked.tasksStore.fetchTasks).toHaveBeenCalledWith('proj-1', { sprint_id: 's1' });
  });

  it('filtering by "No sprint" re-fetches the backlog with sprint_id=none', async () => {
    const wrapper = await mountPage();
    await selectProject(wrapper, 'proj-1');
    mocked.tasksStore.fetchTasks.mockClear();

    await wrapper.find(SPRINT_SELECT).setValue('__none__');
    await flushPromises();

    expect(mocked.tasksStore.fetchTasks).toHaveBeenCalledWith('proj-1', { sprint_id: 'none' });
  });

  it('switching the filter back to "All" re-fetches with no sprint param', async () => {
    const wrapper = await mountPage();
    await selectProject(wrapper, 'proj-1');

    await wrapper.find(SPRINT_SELECT).setValue('s1');
    await flushPromises();
    mocked.tasksStore.fetchTasks.mockClear();

    await wrapper.find(SPRINT_SELECT).setValue('');
    await flushPromises();

    expect(mocked.tasksStore.fetchTasks).toHaveBeenCalledWith('proj-1', undefined);
  });

  it('changing project resets the sprint filter so a stale sprint id never leaks into the next fetch', async () => {
    const wrapper = await mountPage();
    await selectProject(wrapper, 'proj-1');

    // Narrow to a sprint on project 1.
    await wrapper.find(SPRINT_SELECT).setValue('s1');
    await flushPromises();
    expect((wrapper.find(SPRINT_SELECT).element as HTMLSelectElement).value).toBe('s1');
    mocked.tasksStore.fetchTasks.mockClear();

    // Switch to project 2 — the filter must reset, and its fetch must carry no sprint_id.
    await selectProject(wrapper, 'proj-2');

    expect(mocked.tasksStore.fetchTasks).toHaveBeenCalledWith('proj-2', undefined);
    expect(mocked.tasksStore.fetchTasks).not.toHaveBeenCalledWith(
      'proj-2',
      expect.objectContaining({ sprint_id: 's1' })
    );
    // The select itself is back to "All".
    expect((wrapper.find(SPRINT_SELECT).element as HTMLSelectElement).value).toBe('');
  });
});
