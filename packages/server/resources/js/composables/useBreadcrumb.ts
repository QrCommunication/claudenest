import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb.vue';

/**
 * Composable to retrieve breadcrumb items from the current route meta.
 * Resolves dynamic route params (e.g. `:id`) in breadcrumb `to` paths.
 *
 * Usage:
 *   const { breadcrumbItems } = useBreadcrumb();
 *   <Breadcrumb :items="breadcrumbItems" />
 */
export function useBreadcrumb() {
    const route = useRoute();

    const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
        const meta = route.meta;
        const raw = (meta.breadcrumb ?? []) as BreadcrumbItem[];

        // Resolve dynamic route params in `to` paths
        return raw.map((item) => {
            if (!item.to) return item;

            let resolvedTo = item.to;
            const params = route.params;

            // Replace :param placeholders with actual route param values
            for (const [key, value] of Object.entries(params)) {
                const paramValue = Array.isArray(value) ? value[0] : value;
                if (paramValue) {
                    resolvedTo = resolvedTo.replace(`:${key}`, paramValue);
                }
            }

            return { ...item, to: resolvedTo };
        });
    });

    return {
        breadcrumbItems,
    };
}
