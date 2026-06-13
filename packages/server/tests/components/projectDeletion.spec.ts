import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

/**
 * The "phantom project" bug: a shared project deleted from the dashboard kept
 * showing in the menu/sidebar and its tab stayed open. The fix purges state on
 * three layers — the Pinia list/selection, the pinned sidebar entry
 * (useLastProject) and the open tabs (useTabs.closeProjectTabs). These tests
 * pin that purge so the regression can't silently come back.
 */

// ── Mock the HTTP layer so deleteProject() never hits the network ─────────────
vi.mock('@/composables/useApi', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { api, useApi: () => api };
});

// ── Mock vue-router for the useTabs composable ────────────────────────────────
const routerPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
  useRoute: () => ({ path: '/dashboard' }),
}));

import { api } from '@/composables/useApi';
import { useProjectsStore } from '@/stores/projects';
import { setLastProject, useLastProject } from '@/composables/useLastProject';
import { useTabs, type Tab } from '@/composables/useTabs';
import type { SharedProject } from '@/types';

const mockApi = api as unknown as { delete: ReturnType<typeof vi.fn> };

function makeProject(id: string, name = `Project ${id}`): SharedProject {
  // Only the fields the store touches matter; cast the rest.
  return {
    id,
    name,
    machine_id: 'machine-1',
    active_instances_count: 0,
    pending_tasks_count: 0,
  } as unknown as SharedProject;
}

describe('Project deletion — client-side state purge', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('projects store removeProjectLocal', () => {
    it('removes the project from the list while keeping siblings', () => {
      const store = useProjectsStore();
      store.projects = [makeProject('A'), makeProject('B'), makeProject('C')];

      store.removeProjectLocal('B');

      expect(store.projects.map(p => p.id)).toEqual(['A', 'C']);
    });

    it('clears the current selection and its derived data when the deleted project was selected', () => {
      const store = useProjectsStore();
      const selected = makeProject('A');
      store.projects = [selected, makeProject('B')];
      store.selectedProject = selected;
      store.projectStats = { foo: 1 } as never;
      store.instances = [{ id: 'i1' }] as never;
      store.activityLogs = [{ id: 'l1' }] as never;

      store.removeProjectLocal('A');

      expect(store.selectedProject).toBeNull();
      expect(store.projectStats).toBeNull();
      expect(store.instances).toEqual([]);
      expect(store.activityLogs).toEqual([]);
    });

    it('keeps the selection untouched when a different project is removed', () => {
      const store = useProjectsStore();
      const selected = makeProject('A');
      store.projects = [selected, makeProject('B')];
      store.selectedProject = selected;

      store.removeProjectLocal('B');

      expect(store.selectedProject).toEqual(selected);
    });

    it('unpins the sidebar entry when it targets the deleted project', () => {
      const store = useProjectsStore();
      store.projects = [makeProject('A')];
      setLastProject({ id: 'A', name: 'Project A' });
      const { lastProject } = useLastProject();
      expect(lastProject.value?.id).toBe('A');

      store.removeProjectLocal('A');

      expect(lastProject.value).toBeNull();
    });

    it('leaves the sidebar entry alone when it targets another project', () => {
      const store = useProjectsStore();
      store.projects = [makeProject('A'), makeProject('B')];
      setLastProject({ id: 'B', name: 'Project B' });
      const { lastProject } = useLastProject();

      store.removeProjectLocal('A');

      expect(lastProject.value?.id).toBe('B');
    });
  });

  describe('projects store deleteProject', () => {
    it('calls the DELETE endpoint then purges local state', async () => {
      mockApi.delete.mockResolvedValueOnce({ data: { success: true } });
      const store = useProjectsStore();
      store.projects = [makeProject('A'), makeProject('B')];

      await store.deleteProject('A');

      expect(mockApi.delete).toHaveBeenCalledWith('/projects/A');
      expect(store.projects.map(p => p.id)).toEqual(['B']);
      expect(store.isDeleting).toBe(false);
    });

    it('does not purge local state when the API call fails', async () => {
      mockApi.delete.mockRejectedValueOnce(new Error('Network error'));
      const store = useProjectsStore();
      store.projects = [makeProject('A'), makeProject('B')];

      await expect(store.deleteProject('A')).rejects.toThrow('Network error');

      // The project is still listed: a failed delete must not lie to the user.
      expect(store.projects.map(p => p.id)).toEqual(['A', 'B']);
      expect(store.error).toBe('Network error');
      expect(store.isDeleting).toBe(false);
    });
  });

  describe('useTabs closeProjectTabs', () => {
    function tab(id: string, path: string): Tab {
      return { id, type: 'page', label: id, path, closable: true };
    }

    it('closes the project root tab and every sub-route, leaving unrelated tabs', () => {
      const { tabs, closeProjectTabs } = useTabs();
      tabs.value = [
        tab('t1', '/projects/P1'),
        tab('t2', '/projects/P1/workspace'),
        tab('t3', '/projects/P1/tasks'),
        tab('t4', '/projects/P2'),
        tab('t5', '/dashboard'),
      ];

      closeProjectTabs('P1');

      expect(tabs.value.map(t => t.path)).toEqual(['/projects/P2', '/dashboard']);
    });

    it('does not close tabs of a project whose id is a prefix of the deleted one', () => {
      const { tabs, closeProjectTabs } = useTabs();
      tabs.value = [
        tab('t1', '/projects/P1'),
        // /projects/P10 must survive: it is a different project, not a sub-route
        tab('t2', '/projects/P10'),
        tab('t3', '/projects/P10/workspace'),
      ];

      closeProjectTabs('P1');

      expect(tabs.value.map(t => t.path)).toEqual([
        '/projects/P10',
        '/projects/P10/workspace',
      ]);
    });

    it('is a no-op when no tab matches the deleted project', () => {
      const { tabs, closeProjectTabs } = useTabs();
      tabs.value = [tab('t1', '/dashboard'), tab('t2', '/projects/P2')];

      closeProjectTabs('P1');

      expect(tabs.value.map(t => t.path)).toEqual(['/dashboard', '/projects/P2']);
    });
  });
});
