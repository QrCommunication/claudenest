<template>
  <div class="tab-bar">
    <div ref="tabsContainer" class="tabs-container">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: tab.id === activeTabId }]"
        @click="handleTabClick(tab.id)"
        @mousedown.middle.prevent="handleMiddleClick(tab.id, tab.closable)"
      >
        <component
          v-if="tab.icon && getIconComponent(tab.icon)"
          :is="getIconComponent(tab.icon)"
          class="tab-icon"
        />
        <span class="tab-label">{{ tab.label }}</span>
        <button
          v-if="tab.closable"
          class="close-btn"
          @click.stop="handleClose(tab.id)"
        >
          <svg class="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- New Session Button -->
    <button class="new-tab-btn" @click="handleNewSession" title="New Session">
      <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- User Menu -->
    <div class="tab-bar-user">
      <UserMenu :user="authStore.user" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTabs } from '@/composables/useTabs';
import { useAuthStore } from '@/stores/auth';
import UserMenu from '@/components/layout/UserMenu.vue';
import {
  HomeIcon,
  CommandLineIcon,
  ServerIcon,
  FolderIcon,
  CheckCircleIcon,
  KeyIcon,
  SparklesIcon,
  CubeIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const { tabs, activeTabId, setActiveTab, closeTab, openTab } = useTabs();

const tabsContainer = ref<HTMLElement | null>(null);

const iconMap: Record<string, unknown> = {
  home: HomeIcon,
  terminal: CommandLineIcon,
  server: ServerIcon,
  folder: FolderIcon,
  checklist: CheckCircleIcon,
  key: KeyIcon,
  sparkles: SparklesIcon,
  cube: CubeIcon,
  command: Squares2X2Icon,
  gear: Cog6ToothIcon,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || null;
};

const handleTabClick = (tabId: string) => {
  setActiveTab(tabId);
};

const handleClose = (tabId: string) => {
  closeTab(tabId);
};

const handleMiddleClick = (tabId: string, closable: boolean) => {
  if (closable) {
    closeTab(tabId);
  }
};

const handleNewSession = () => {
  // Open a new session tab or navigate to create session
  router.push('/sessions/new');

  // Optionally open as tab
  openTab({
    type: 'session',
    label: 'New Session',
    icon: 'terminal',
    path: '/sessions/new',
    closable: true,
  });
};
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  height: 40px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
}

.tabs-container {
  display: flex;
  align-items: center;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 100%;
  background-color: transparent;
  border-right: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;
}

.tab:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.tab.active {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-bottom: 2px solid var(--accent-purple);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--accent-purple);
}

.tab-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.tab-label {
  font-size: 13px;
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.tab:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.close-icon {
  width: 12px;
  height: 12px;
}

.new-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  background: none;
  border: none;
  border-left: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.new-tab-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.icon {
  width: 16px;
  height: 16px;
}

.tab-bar-user {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-left: 1px solid var(--border-color);
  height: 100%;
  flex-shrink: 0;
}
</style>
