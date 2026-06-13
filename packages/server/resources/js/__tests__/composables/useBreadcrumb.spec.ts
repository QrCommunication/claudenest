import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reactive } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import type { BreadcrumbItem, SharedProject } from '@/types';

// Controllable route object returned by the mocked `useRoute()`.
// `reactive` so the composable's computed re-evaluates when we mutate it.
const mockRoute = reactive<{
    params: Record<string, string | string[]>;
    meta: { breadcrumb?: BreadcrumbItem[] };
}>({
    params: {},
    meta: {},
});

vi.mock('vue-router', () => ({
    useRoute: () => mockRoute,
}));

// The projects store pulls in the shared axios wrapper at import time; mock it
// so instantiating the store has no network side effects. The breadcrumb logic
// under test only reads `selectedProject` / `projects` from the store.
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

import { useBreadcrumb } from '@/composables/useBreadcrumb';
import { useProjectsStore } from '@/stores/projects';

/** Minimal SharedProject fixture — only id/name matter for breadcrumbs. */
function makeProject(id: string, name = `Project ${id}`): SharedProject {
    return {
        id,
        name,
        machine_id: 'machine-1',
        project_path: `/tmp/${id}`,
    } as unknown as SharedProject;
}

/** Breadcrumb meta for a per-project sub-route (e.g. workspace). */
function projectSubRouteBreadcrumb(): BreadcrumbItem[] {
    return [
        { label: 'Projects', to: '/projects' },
        { label: 'Project', to: '/projects/:id' },
        { label: 'Workspace' },
    ];
}

describe('useBreadcrumb', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        mockRoute.params = {};
        mockRoute.meta = {};
    });

    it('returns an empty list when the route has no breadcrumb meta', () => {
        const { breadcrumbItems } = useBreadcrumb();
        expect(breadcrumbItems.value).toEqual([]);
    });

    it('swaps the static "Project" label for the selected project name', () => {
        const store = useProjectsStore();
        store.selectProject(makeProject('abc-123', 'My Awesome Project'));

        mockRoute.params = { id: 'abc-123' };
        mockRoute.meta = { breadcrumb: projectSubRouteBreadcrumb() };

        const { breadcrumbItems } = useBreadcrumb();
        const labels = breadcrumbItems.value.map((c) => c.label);

        // Projects > My Awesome Project > Workspace
        expect(labels).toEqual(['Projects', 'My Awesome Project', 'Workspace']);
    });

    it('resolves the :id placeholder in the per-project segment `to`', () => {
        const store = useProjectsStore();
        store.selectProject(makeProject('abc-123', 'My Awesome Project'));

        mockRoute.params = { id: 'abc-123' };
        mockRoute.meta = { breadcrumb: projectSubRouteBreadcrumb() };

        const { breadcrumbItems } = useBreadcrumb();
        const projectCrumb = breadcrumbItems.value[1];

        expect(projectCrumb.to).toBe('/projects/abc-123');
    });

    it('falls back to the cached projects list when no project is selected', () => {
        const store = useProjectsStore();
        store.projects = [makeProject('p1', 'Cached One'), makeProject('p2', 'Cached Two')];
        // No selectedProject set.

        mockRoute.params = { id: 'p2' };
        mockRoute.meta = { breadcrumb: projectSubRouteBreadcrumb() };

        const { breadcrumbItems } = useBreadcrumb();
        expect(breadcrumbItems.value[1].label).toBe('Cached Two');
    });

    it('keeps the static "Project" label when the project is not loaded yet', () => {
        // Neither selectedProject nor projects contain the current id.
        mockRoute.params = { id: 'not-loaded' };
        mockRoute.meta = { breadcrumb: projectSubRouteBreadcrumb() };

        const { breadcrumbItems } = useBreadcrumb();
        expect(breadcrumbItems.value[1].label).toBe('Project');
        // The `to` placeholder is still resolved so the link stays valid.
        expect(breadcrumbItems.value[1].to).toBe('/projects/not-loaded');
    });

    it('does not touch non-project segments', () => {
        const store = useProjectsStore();
        store.selectProject(makeProject('abc-123', 'My Awesome Project'));

        mockRoute.params = { id: 'abc-123' };
        mockRoute.meta = { breadcrumb: projectSubRouteBreadcrumb() };

        const { breadcrumbItems } = useBreadcrumb();

        // "Projects" link keeps its static label and absolute `to`.
        expect(breadcrumbItems.value[0]).toMatchObject({ label: 'Projects', to: '/projects' });
        // Trailing leaf has no `to`.
        expect(breadcrumbItems.value[2]).toMatchObject({ label: 'Workspace' });
        expect(breadcrumbItems.value[2].to).toBeUndefined();
    });

    it('reacts to a route change without rebuilding the composable', () => {
        const store = useProjectsStore();
        store.projects = [makeProject('p1', 'First'), makeProject('p2', 'Second')];

        mockRoute.params = { id: 'p1' };
        mockRoute.meta = { breadcrumb: projectSubRouteBreadcrumb() };

        const { breadcrumbItems } = useBreadcrumb();
        expect(breadcrumbItems.value[1].label).toBe('First');

        // Navigate to another project: the computed must recompute.
        mockRoute.params = { id: 'p2' };
        expect(breadcrumbItems.value[1].label).toBe('Second');
        expect(breadcrumbItems.value[1].to).toBe('/projects/p2');
    });
});
