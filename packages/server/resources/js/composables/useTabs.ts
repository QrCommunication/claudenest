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

// ── Persistence helpers ───────────────────────────────────────────────────────

function persistTabs(): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ tabs: tabs.value, activeTabId: activeTabId.value }),
  );
}

function restoreTabs(): void {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const data = JSON.parse(stored);
    tabs.value = data.tabs ?? [];
    activeTabId.value = data.activeTabId ?? null;
  } catch {
    tabs.value = [];
    activeTabId.value = null;
  }
}

// ── ID generator ──────────────────────────────────────────────────────────────

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useTabs() {
  const router = useRouter();
  const route = useRoute();

  function setActiveTab(tabId: string): void {
    const tab = tabs.value.find((t) => t.id === tabId);
    if (!tab) return;

    activeTabId.value = tabId;

    if (route.path !== tab.path) {
      router.push(tab.path);
    }

    persistTabs();
  }

  function navigateToFallback(): void {
    if (tabs.value.length > 0) {
      setActiveTab(tabs.value[0].id);
      router.push(tabs.value[0].path);
    } else {
      activeTabId.value = null;
      router.push('/dashboard');
    }
  }

  function openTab(tab: Omit<Tab, 'id'> | Tab): Tab {
    const existingTab = tabs.value.find((t) => t.path === tab.path);
    if (existingTab) {
      setActiveTab(existingTab.id);
      return existingTab;
    }

    const newTab: Tab = {
      id: 'id' in tab ? tab.id : generateTabId(),
      type: tab.type,
      label: tab.label,
      icon: tab.icon,
      path: tab.path,
      closable: tab.closable,
      meta: tab.meta,
    };

    tabs.value.push(newTab);
    setActiveTab(newTab.id);
    persistTabs();

    return newTab;
  }

  function closeTab(tabId: string): void {
    const index = tabs.value.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    const wasActive = activeTabId.value === tabId;
    tabs.value.splice(index, 1);

    if (!wasActive) {
      persistTabs();
      return;
    }

    if (tabs.value.length === 0) {
      activeTabId.value = null;
      router.push('/dashboard');
    } else {
      const newIndex = Math.min(index, tabs.value.length - 1);
      setActiveTab(tabs.value[newIndex].id);
      router.push(tabs.value[newIndex].path);
    }

    persistTabs();
  }

  function closeOtherTabs(tabId: string): void {
    tabs.value = tabs.value.filter((t) => t.id === tabId || !t.closable);
    setActiveTab(tabId);
    persistTabs();
  }

  function closeAllTabs(): void {
    tabs.value = tabs.value.filter((t) => !t.closable);
    navigateToFallback();
    persistTabs();
  }

  function closeTabsToRight(tabId: string): void {
    const index = tabs.value.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    tabs.value = tabs.value.slice(0, index + 1);

    const activeStillExists = tabs.value.some((t) => t.id === activeTabId.value);
    if (!activeStillExists) {
      setActiveTab(tabId);
    }

    persistTabs();
  }

  function getActiveTab(): Tab | null {
    return tabs.value.find((t) => t.id === activeTabId.value) ?? null;
  }

  function hasTab(path: string): boolean {
    return tabs.value.some((t) => t.path === path);
  }

  // Sync active tab when route changes externally
  watch(
    () => route.path,
    (newPath) => {
      const tab = tabs.value.find((t) => t.path === newPath);
      if (!tab || activeTabId.value === tab.id) return;
      activeTabId.value = tab.id;
      persistTabs();
    },
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
    saveTabs: persistTabs,
    loadTabs: restoreTabs,
    getActiveTab,
    hasTab,
  };
}
