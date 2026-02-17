<template>
  <aside :class="['app-sidebar', collapsed ? 'collapsed' : 'expanded']">
    <!-- Logo Section -->
    <div class="sidebar-header">
      <button class="logo-section" @click="navigateToDashboard">
        <svg class="logo-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: var(--accent-purple)" />
              <stop offset="100%" style="stop-color: var(--accent-indigo)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="512" height="512" rx="96" :fill="isDark ? '#1a1b26' : '#f8fafc'" />
          <g transform="translate(256, 256)">
            <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round" />
            <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round" />
            <circle cx="-35" cy="0" r="18" :fill="isDark ? '#22d3ee' : '#0891b2'" />
            <circle cx="0" cy="0" r="18" fill="url(#nestGrad)" />
            <circle cx="35" cy="0" r="18" :fill="isDark ? '#22d3ee' : '#0891b2'" />
          </g>
        </svg>
        <span v-if="!collapsed" class="logo-text gradient-text">ClaudeNest</span>
      </button>

      <!-- Collapse Button (Desktop) -->
      <button v-if="!collapsed" class="collapse-btn" @click="$emit('toggle')">
        <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['nav-item', { active: isActive(item.path) }]"
        :title="collapsed ? item.name : ''"
      >
        <component :is="item.iconComponent" class="nav-icon" />
        <span v-if="!collapsed" class="nav-label">{{ item.name }}</span>
        <div v-if="isActive(item.path)" class="active-indicator" />
      </router-link>
    </nav>

    <!-- Expand Button (Collapsed State) -->
    <div v-if="collapsed" class="sidebar-footer">
      <button class="expand-btn" @click="$emit('toggle')" title="Expand Sidebar">
        <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from '@/composables/useTheme';
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

interface Props {
  collapsed?: boolean;
}

withDefaults(defineProps<Props>(), {
  collapsed: false,
});

defineEmits<{
  toggle: [];
}>();

const route = useRoute();
const router = useRouter();
const { isDark } = useTheme();

const iconMap = {
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
};

const navItemsConfig = [
  { name: 'Dashboard', path: '/dashboard', iconName: 'HomeIcon' as const },
  { name: 'Sessions', path: '/sessions', iconName: 'CommandLineIcon' as const },
  { name: 'Machines', path: '/machines', iconName: 'ServerIcon' as const },
  { name: 'Projects', path: '/projects', iconName: 'FolderIcon' as const },
  { name: 'Tasks', path: '/tasks', iconName: 'CheckCircleIcon' as const },
  { name: 'Credentials', path: '/credentials', iconName: 'KeyIcon' as const },
  { name: 'Skills', path: '/skills', iconName: 'SparklesIcon' as const },
  { name: 'MCP', path: '/mcp', iconName: 'CubeIcon' as const },
  { name: 'Commands', path: '/commands', iconName: 'Squares2X2Icon' as const },
  { name: 'Settings', path: '/settings', iconName: 'Cog6ToothIcon' as const },
];

const navItems = computed(() => {
  return navItemsConfig.map((item) => ({
    ...item,
    iconComponent: iconMap[item.iconName],
  }));
});

const isActive = (path: string) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard';
  }
  return route.path.startsWith(path);
};

const navigateToDashboard = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s ease;
  position: relative;
  z-index: 50;
}

.app-sidebar.expanded {
  width: 240px;
}

.app-sidebar.collapsed {
  width: 48px;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  overflow: hidden;
  flex: 1;
}

.logo-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.collapse-btn,
.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-btn:hover,
.expand-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.icon {
  width: 18px;
  height: 18px;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 2px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 10px 0;
}

.nav-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--accent-purple, #a855f7);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.collapsed .nav-label {
  display: none;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: var(--accent-purple);
  border-radius: 0 2px 2px 0;
}

/* Footer */
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--border-color);
}

.expand-btn {
  width: 100%;
}

/* Scrollbar */
.sidebar-nav {
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background-color: var(--border-hover);
}

/* Mobile */
@media (max-width: 1024px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
  }
}
</style>
