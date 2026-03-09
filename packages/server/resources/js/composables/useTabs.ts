import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export type TabType = 'page' | 'terminal' | 'session';

export interface Tab {
  id: string;
  type: TabType;
  label: string;
  icon?: string;
  path: string;
  closable: boolean;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = 'claudenest-tabs';

const tabs = ref<Tab[]>([]);
const activeTabId = ref<string | null>(null);

export function useTabs() {
  const router = useRouter();
  const route = useRoute();

  const openTab = (tab: Omit<Tab, 'id'> | Tab) => {
    // Check if tab already exists
    const existingTab = tabs.value.find((t) => t.path === tab.path);

    if (existingTab) {
      setActiveTab(existingTab.id);
      return existingTab;
    }

    // Create new tab
    const newTab: Tab = {
      id: 'id' in tab ? tab.id : `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: tab.type,
      label: tab.label,
      icon: tab.icon,
      path: tab.path,
      closable: tab.closable,
      meta: tab.meta,
    };

    tabs.value.push(newTab);
    setActiveTab(newTab.id);
    saveTabs();

    return newTab;
  };

  const closeTab = (tabId: string) => {
    const index = tabs.value.findIndex((t) => t.id === tabId);

    if (index === -1) return;

    const wasActive = activeTabId.value === tabId;
    tabs.value.splice(index, 1);

    // If closing active tab, switch to another tab
    if (wasActive && tabs.value.length > 0) {
      // Try to activate the tab to the right, or the one to the left
      const newIndex = Math.min(index, tabs.value.length - 1);
      setActiveTab(tabs.value[newIndex].id);
      router.push(tabs.value[newIndex].path);
    } else if (tabs.value.length === 0) {
      activeTabId.value = null;
      router.push('/dashboard');
    }

    saveTabs();
  };

  const setActiveTab = (tabId: string) => {
    const tab = tabs.value.find((t) => t.id === tabId);

    if (!tab) return;

    activeTabId.value = tabId;

    // Navigate to tab path if not already there
    if (route.path !== tab.path) {
      router.push(tab.path);
    }

    saveTabs();
  };

  const closeOtherTabs = (tabId: string) => {
    tabs.value = tabs.value.filter((t) => t.id === tabId || !t.closable);
    setActiveTab(tabId);
    saveTabs();
  };

  const closeAllTabs = () => {
    tabs.value = tabs.value.filter((t) => !t.closable);

    if (tabs.value.length > 0) {
      setActiveTab(tabs.value[0].id);
      router.push(tabs.value[0].path);
    } else {
      activeTabId.value = null;
      router.push('/dashboard');
    }

    saveTabs();
  };

  const closeTabsToRight = (tabId: string) => {
    const index = tabs.value.findIndex((t) => t.id === tabId);

    if (index === -1) return;

    tabs.value = tabs.value.slice(0, index + 1);

    if (activeTabId.value && !tabs.value.find((t) => t.id === activeTabId.value)) {
      setActiveTab(tabId);
    }

    saveTabs();
  };

  const saveTabs = () => {
    const data = {
      tabs: tabs.value,
      activeTabId: activeTabId.value,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const loadTabs = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);

      if (stored) {
        const data = JSON.parse(stored);
        tabs.value = data.tabs || [];
        activeTabId.value = data.activeTabId || null;
      }
    } catch (error) {
      console.error('Failed to load tabs:', error);
      tabs.value = [];
      activeTabId.value = null;
    }
  };

  const getActiveTab = () => {
    return tabs.value.find((t) => t.id === activeTabId.value) || null;
  };

  const hasTab = (path: string) => {
    return tabs.value.some((t) => t.path === path);
  };

  // Watch route changes to sync active tab
  watch(
    () => route.path,
    (newPath) => {
      const tab = tabs.value.find((t) => t.path === newPath);

      if (tab && activeTabId.value !== tab.id) {
        activeTabId.value = tab.id;
        saveTabs();
      }
    }
  );

  return {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTab,
    closeOtherTabs,
    closeAllTabs,
    closeTabsToRight,
    saveTabs,
    loadTabs,
    getActiveTab,
    hasTab,
  };
}
