import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProjectsStore } from '@/stores/projects';
import type { SharedProject } from '@/types';

// The projects store performs its archive/unarchive/recover calls through the
// shared axios wrapper and clears the pinned "last project" link on archive.
// Both are mocked so the specs exercise the local state transitions only.
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

vi.mock('@/composables/useLastProject', () => ({
  clearLastProjectIfMatches: vi.fn(),
}));

import { api } from '@/composables/useApi';
import { clearLastProjectIfMatches } from '@/composables/useLastProject';

const mockApi = api as unknown as { post: ReturnType<typeof vi.fn> };
const mockClearLast = clearLastProjectIfMatches as unknown as ReturnType<typeof vi.fn>;

/** Minimal SharedProject fixture — only the fields the store touches matter. */
function makeProject(id: string, name = `Project ${id}`): SharedProject {
  return {
    id,
    name,
    machine_id: 'machine-1',
    project_path: `/tmp/${id}`,
  } as unknown as SharedProject;
}

/** Wrap a project in the standard `{ success, data }` API envelope. */
function envelope(project: SharedProject) {
  return { data: { success: true, data: project } };
}

describe('Projects store — archive / unarchive / recover', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('archiveProject', () => {
    it('moves the project from the active flow to the archived flow', async () => {
      const store = useProjectsStore();
      const p1 = makeProject('p1');
      const p2 = makeProject('p2');
      store.projects = [p1, p2];

      const archived = makeProject('p1', 'Project p1');
      mockApi.post.mockResolvedValueOnce(envelope(archived));

      const result = await store.archiveProject('p1');

      expect(mockApi.post).toHaveBeenCalledWith('/projects/p1/archive');
      expect(result).toEqual(archived);
      // Active list no longer contains p1, archived list now does.
      expect(store.projects.map(p => p.id)).toEqual(['p2']);
      expect(store.archivedProjects.map(p => p.id)).toEqual(['p1']);
    });

    it('clears the selection and the pinned link when the archived project was selected', async () => {
      const store = useProjectsStore();
      const p1 = makeProject('p1');
      store.projects = [p1];
      store.selectedProject = p1;

      mockApi.post.mockResolvedValueOnce(envelope(makeProject('p1')));

      await store.archiveProject('p1');

      expect(store.selectedProject).toBeNull();
      expect(mockClearLast).toHaveBeenCalledWith('p1');
    });

    it('leaves both flows untouched and surfaces the error on failure', async () => {
      const store = useProjectsStore();
      const p1 = makeProject('p1');
      store.projects = [p1];

      mockApi.post.mockRejectedValueOnce(new Error('archive boom'));

      await expect(store.archiveProject('p1')).rejects.toThrow('archive boom');
      expect(store.projects.map(p => p.id)).toEqual(['p1']);
      expect(store.archivedProjects).toHaveLength(0);
      expect(store.error).toBe('archive boom');
    });
  });

  describe('unarchiveProject', () => {
    it('moves the project from the archived flow back to the active flow', async () => {
      const store = useProjectsStore();
      const a1 = makeProject('a1');
      store.archivedProjects = [a1];

      const restored = makeProject('a1');
      mockApi.post.mockResolvedValueOnce(envelope(restored));

      const result = await store.unarchiveProject('a1');

      expect(mockApi.post).toHaveBeenCalledWith('/projects/a1/unarchive');
      expect(result).toEqual(restored);
      expect(store.archivedProjects).toHaveLength(0);
      expect(store.projects.map(p => p.id)).toEqual(['a1']);
    });
  });

  describe('recoverProject', () => {
    it('restores an archived project to the active flow via the /recover endpoint', async () => {
      const store = useProjectsStore();
      const a1 = makeProject('a1');
      store.archivedProjects = [a1];

      const restored = makeProject('a1');
      mockApi.post.mockResolvedValueOnce(envelope(restored));

      const result = await store.recoverProject('a1');

      expect(mockApi.post).toHaveBeenCalledWith('/projects/a1/recover');
      expect(result).toEqual(restored);
      expect(store.archivedProjects).toHaveLength(0);
      expect(store.projects.map(p => p.id)).toEqual(['a1']);
    });
  });

  it('does not duplicate a project when archive then unarchive round-trips', async () => {
    const store = useProjectsStore();
    const p1 = makeProject('p1');
    store.projects = [p1];

    mockApi.post.mockResolvedValueOnce(envelope(makeProject('p1')));
    await store.archiveProject('p1');
    expect(store.projects).toHaveLength(0);
    expect(store.archivedProjects).toHaveLength(1);

    mockApi.post.mockResolvedValueOnce(envelope(makeProject('p1')));
    await store.unarchiveProject('p1');
    expect(store.archivedProjects).toHaveLength(0);
    expect(store.projects.map(p => p.id)).toEqual(['p1']);
  });
});
