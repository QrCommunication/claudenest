import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { docsNavigation, searchNavigation, getPrevNext, findNavItemByPath } from '@/data/navigation';
import { apiCategories, searchEndpoints, errorCodes } from '@/data/api-endpoints';

// Documentation state
const isSidebarOpen = ref(true);
const searchQuery = ref('');
const searchResults = ref<Array<{ type: 'nav' | 'endpoint'; data: any }>>([]);
const currentVersion = ref('v1.0.0');
const availableVersions = ['v1.0.0', 'v0.9.0', 'v0.8.0'];

export function useDocs() {
  const route = useRoute();
  const router = useRouter();

  // Computed
  const currentPath = computed(() => route.path);
  
  const currentNavItem = computed(() => {
    return findNavItemByPath(route.path);
  });

  const prevNext = computed(() => {
    return getPrevNext(route.path);
  });

  const isApiReference = computed(() => {
    return route.path.startsWith('/docs/api/');
  });

  const currentApiCategory = computed(() => {
    if (!isApiReference.value) return null;
    const categoryId = route.params.category as string;
    return apiCategories.find(cat => cat.id === categoryId);
  });

  // Methods
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
  };

  const performSearch = (query: string) => {
    searchQuery.value = query;
    
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }

    const results: Array<{ type: 'nav' | 'endpoint'; data: any }> = [];

    // Search navigation
    const navResults = searchNavigation(query);
    navResults.forEach(({ section, item }) => {
      results.push({
        type: 'nav',
        data: { section, item }
      });
    });

    // Search API endpoints
    const endpointResults = searchEndpoints(query);
    endpointResults.forEach(({ category, endpoint }) => {
      results.push({
        type: 'endpoint',
        data: { category, endpoint }
      });
    });

    searchResults.value = results.slice(0, 10); // Limit to 10 results
  };

  const clearSearch = () => {
    searchQuery.value = '';
    searchResults.value = [];
  };

  const navigateToResult = (result: { type: 'nav' | 'endpoint'; data: any }) => {
    if (result.type === 'nav') {
      router.push(result.data.item.path);
    } else if (result.type === 'endpoint') {
      router.push(`/docs/api/${result.data.category.id}`);
    }
    clearSearch();
  };

  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      GET: '#22c55e',    // green
      POST: '#a855f7',   // purple
      PUT: '#3b82f6',    // blue
      PATCH: '#f59e0b',  // amber
      DELETE: '#ef4444'  // red
    };
    return colors[method] || '#64748b';
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };

  return {
    // State
    isSidebarOpen,
    searchQuery,
    searchResults,
    currentVersion,
    availableVersions,
    docsNavigation,
    apiCategories,
    errorCodes,

    // Computed
    currentPath,
    currentNavItem,
    prevNext,
    isApiReference,
    currentApiCategory,

    // Methods
    toggleSidebar,
    performSearch,
    clearSearch,
    navigateToResult,
    getMethodColor,
    copyToClipboard
  };
}
