import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectsStore } from '@/stores/projects';
import type { BreadcrumbItem } from '@/types';

/** Route `to` template that identifies the per-project breadcrumb segment. */
const PROJECT_SEGMENT_TO = '/projects/:id';

/**
 * Composable to retrieve breadcrumb items from the current route meta.
 * Resolves dynamic route params (e.g. `:id`) in breadcrumb `to` paths and
 * swaps the static "Project" label of the per-project segment for the actual
 * project name pulled from the Pinia store.
 *
 * Usage:
 *   const { breadcrumbItems } = useBreadcrumb();
 *   <Breadcrumb :items="breadcrumbItems" />
 */
export function useBreadcrumb() {
    const route = useRoute();
    const projectsStore = useProjectsStore();

    /**
     * Resolve the current route's project id to its display name.
     * Prefers the freshly selected project, falls back to the cached list.
     * Returns `null` when the project isn't loaded yet so the caller can keep
     * the static label (avoids flashing an empty crumb on direct navigation).
     */
    const currentProjectName = computed<string | null>(() => {
        const idParam = route.params.id;
        const projectId = Array.isArray(idParam) ? idParam[0] : idParam;
        if (!projectId) return null;

        const selected = projectsStore.selectedProject;
        if (selected?.id === projectId && selected.name) {
            return selected.name;
        }

        const match = projectsStore.projects.find((p) => p.id === projectId);
        return match?.name ?? null;
    });

    const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
        const meta = route.meta;
        const raw = (meta.breadcrumb ?? []) as BreadcrumbItem[];
        const params = route.params;

        return raw.map((item) => {
            // Inject the dynamic project name into the per-project segment,
            // keeping the static label as a fallback while the store loads.
            const label =
                item.to === PROJECT_SEGMENT_TO && currentProjectName.value
                    ? currentProjectName.value
                    : item.label;

            if (!item.to) {
                return label === item.label ? item : { ...item, label };
            }

            // Replace :param placeholders with actual route param values
            let resolvedTo = item.to;
            for (const [key, value] of Object.entries(params)) {
                const paramValue = Array.isArray(value) ? value[0] : value;
                if (paramValue) {
                    resolvedTo = resolvedTo.replace(`:${key}`, paramValue);
                }
            }

            return { ...item, label, to: resolvedTo };
        });
    });

    return {
        breadcrumbItems,
    };
}
