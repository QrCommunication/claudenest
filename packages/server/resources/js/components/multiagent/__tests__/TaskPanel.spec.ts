import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { SharedTask, Sprint } from '@/types';

// TaskPanel reads three Pinia stores. Mocking the store composables keeps the
// spec focused on the sprint-filter logic without wiring axios or real stores.
// fetchTasks/fetchSprints are stubbed no-ops (the panel calls them on mount).
const mocked = vi.hoisted(() => ({
  projectsStore: { selectedProject: null as null | { id: string; name: string } },
  tasksStore: { tasks: [] as SharedTask[], fetchTasks: vi.fn() },
  sprintsStore: { sprints: [] as Sprint[], fetchSprints: vi.fn() },
}));

vi.mock('@/stores/projects', () => ({ useProjectsStore: () => mocked.projectsStore }));
vi.mock('@/stores/tasks', () => ({ useTasksStore: () => mocked.tasksStore }));
vi.mock('@/stores/sprints', () => ({ useSprintsStore: () => mocked.sprintsStore }));

import TaskPanel from '@/components/multiagent/TaskPanel.vue';

function makeTask(id: string, sprintId: string | null): SharedTask {
  return { id, title: `Task ${id}`, sprint_id: sprintId } as unknown as SharedTask;
}

function makeSprint(id: string, name: string): Sprint {
  return { id, name } as unknown as Sprint;
}

async function mountPanel(): Promise<VueWrapper> {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} } });
  const wrapper = mount(TaskPanel, {
    global: {
      plugins: [i18n],
      // Stub TaskCard so we can count rendered tasks via a stable selector.
      stubs: { TaskCard: { template: '<div class="task-card-stub" />' } },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('TaskPanel — sprint filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.projectsStore.selectedProject = null;
    mocked.tasksStore.tasks = [];
    mocked.sprintsStore.sprints = [];
  });

  it('hides the sprint filter and prompts when no project is selected', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.find('.sprint-filter').exists()).toBe(false);
    expect(wrapper.find('.task-panel-empty').exists()).toBe(true);
    expect(wrapper.find('select').exists()).toBe(false);
  });

  it('shows the sprint filter with All / No sprint / per-sprint options when a project is selected', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };
    mocked.sprintsStore.sprints = [makeSprint('s1', 'Sprint 1'), makeSprint('s2', 'Sprint 2')];
    mocked.tasksStore.tasks = [makeTask('t1', 's1')];

    const wrapper = await mountPanel();

    expect(wrapper.find('.sprint-filter').exists()).toBe(true);
    const options = wrapper.findAll('option');
    // All + No sprint + 2 sprints.
    expect(options).toHaveLength(4);
    const values = options.map(o => (o.element as HTMLOptionElement).value);
    expect(values).toEqual(['__all__', '__none__', 's1', 's2']);
    expect(options[2].text()).toBe('Sprint 1');
  });

  it('shows every task under the default "All" filter', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };
    mocked.sprintsStore.sprints = [makeSprint('s1', 'Sprint 1')];
    mocked.tasksStore.tasks = [makeTask('t1', 's1'), makeTask('t2', null), makeTask('t3', 's2')];

    const wrapper = await mountPanel();

    expect(wrapper.findAll('.task-card-stub')).toHaveLength(3);
  });

  it('filters tasks down to the selected sprint', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };
    mocked.sprintsStore.sprints = [makeSprint('s1', 'Sprint 1'), makeSprint('s2', 'Sprint 2')];
    mocked.tasksStore.tasks = [
      makeTask('t1', 's1'),
      makeTask('t2', 's1'),
      makeTask('t3', 's2'),
      makeTask('t4', null),
    ];

    const wrapper = await mountPanel();
    await wrapper.find('select').setValue('s1');

    const cards = wrapper.findAll('.task-card-stub');
    expect(cards).toHaveLength(2);
  });

  it('keeps only backlog tasks (sprint_id null) under the "No sprint" filter', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };
    mocked.sprintsStore.sprints = [makeSprint('s1', 'Sprint 1')];
    mocked.tasksStore.tasks = [makeTask('t1', 's1'), makeTask('t2', null), makeTask('t3', null)];

    const wrapper = await mountPanel();
    await wrapper.find('select').setValue('__none__');

    expect(wrapper.findAll('.task-card-stub')).toHaveLength(2);
  });

  it('shows the empty state when the selected sprint has no task', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };
    mocked.sprintsStore.sprints = [makeSprint('s1', 'Sprint 1'), makeSprint('s2', 'Sprint 2')];
    mocked.tasksStore.tasks = [makeTask('t1', 's1')];

    const wrapper = await mountPanel();
    await wrapper.find('select').setValue('s2');

    expect(wrapper.findAll('.task-card-stub')).toHaveLength(0);
    expect(wrapper.find('.task-panel-empty').exists()).toBe(true);
  });

  it('loads the default task view and the sprints for the project on mount', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };

    await mountPanel();

    // Default "All" filter -> no sprint param -> server applies its default
    // visibility (in-progress tasks + tasks completed today).
    expect(mocked.tasksStore.fetchTasks).toHaveBeenCalledWith('proj-1', undefined);
    expect(mocked.sprintsStore.fetchSprints).toHaveBeenCalledWith('proj-1');
  });

  it('re-fetches the sprint task set from the server when a sprint is selected', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };
    mocked.sprintsStore.sprints = [makeSprint('s1', 'Sprint 1')];

    const wrapper = await mountPanel();
    await wrapper.find('select').setValue('s1');

    // Server-driven: selecting a sprint must hit the API with ?sprint_id=<uuid>
    // so its full task set (incl. statuses hidden by the default view) is loaded.
    expect(mocked.tasksStore.fetchTasks).toHaveBeenLastCalledWith('proj-1', { sprint_id: 's1' });
  });

  it('re-fetches the backlog from the server under the "No sprint" filter', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };

    const wrapper = await mountPanel();
    await wrapper.find('select').setValue('__none__');

    expect(mocked.tasksStore.fetchTasks).toHaveBeenLastCalledWith('proj-1', { sprint_id: 'none' });
  });

  it('re-fetches the default view when switching back to "All"', async () => {
    mocked.projectsStore.selectedProject = { id: 'proj-1', name: 'Demo' };
    mocked.sprintsStore.sprints = [makeSprint('s1', 'Sprint 1')];

    const wrapper = await mountPanel();
    await wrapper.find('select').setValue('s1');
    await wrapper.find('select').setValue('__all__');

    expect(mocked.tasksStore.fetchTasks).toHaveBeenLastCalledWith('proj-1', undefined);
  });
});
