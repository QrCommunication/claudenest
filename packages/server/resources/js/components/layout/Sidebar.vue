<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-full bg-surface-2 border-r border-skin z-40',
      'transition-all duration-300 ease-in-out flex flex-col',
      collapsed ? 'w-16' : 'w-60',
    ]"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center px-4 border-b border-skin">
      <div class="flex items-center gap-3 overflow-hidden">
        <!-- Logo Icon -->
        <svg class="w-8 h-8 flex-shrink-0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sidebarNestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#a855f7"/>
              <stop offset="100%" style="stop-color:#6366f1"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="512" height="512" rx="96" fill="#1a1b26"/>
          <g transform="translate(256, 256)">
            <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#sidebarNestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#sidebarNestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <circle cx="-35" cy="0" r="18" fill="#22d3ee"/>
            <circle cx="0" cy="0" r="18" fill="url(#sidebarNestGrad)"/>
            <circle cx="35" cy="0" r="18" fill="#22d3ee"/>
          </g>
        </svg>
        
        <span
          :class="[
            'font-bold text-lg whitespace-nowrap transition-all duration-300 gradient-text',
            collapsed ? 'opacity-0 w-0' : 'opacity-100',
          ]"
        >
          ClaudeNest
        </span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
          isActive(item.path)
            ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
            : 'text-skin-secondary hover:bg-surface-3 hover:text-skin-primary',
          collapsed ? 'justify-center' : '',
        ]"
      >
        <component
          :is="item.iconComponent"
          :class="[
            'w-5 h-5 flex-shrink-0 transition-colors',
            isActive(item.path) ? 'text-brand-purple' : 'text-skin-secondary group-hover:text-skin-primary',
          ]"
        />
        <span
          :class="[
            'text-sm font-medium whitespace-nowrap transition-all duration-300',
            collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100',
          ]"
        >
          {{ item.name }}
        </span>
      </router-link>
    </nav>

    <!-- Collapse Button -->
    <div class="p-2 border-t border-skin">
      <button
        :class="[
          'flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all duration-200',
          'text-skin-secondary hover:bg-surface-3 hover:text-skin-primary',
          collapsed ? 'justify-center' : '',
        ]"
        @click="$emit('toggle')"
      >
        <svg
          :class="[
            'w-5 h-5 flex-shrink-0 transition-transform duration-300',
            collapsed ? 'rotate-180' : '',
          ]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span
          :class="[
            'text-sm font-medium whitespace-nowrap transition-all duration-300',
            collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100',
          ]"
        >
          Collapse
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  HomeIcon,
  ServerIcon,
  CommandLineIcon,
  FolderIcon,
  CheckCircleIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon,
  KeyIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline';
import type { NavItem } from '@/types';

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

const iconMap = {
  HomeIcon,
  ServerIcon,
  CommandLineIcon,
  FolderIcon,
  CheckCircleIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon,
  KeyIcon,
  Cog6ToothIcon,
};

const navItemsConfig: Array<NavItem & { iconName: keyof typeof iconMap }> = [
  { name: 'Dashboard', path: '/dashboard', icon: 'home', iconName: 'HomeIcon' },
  { name: 'Machines', path: '/machines', icon: 'server', iconName: 'ServerIcon' },
  { name: 'Sessions', path: '/sessions', icon: 'terminal', iconName: 'CommandLineIcon' },
  { name: 'Projects', path: '/projects', icon: 'folder', iconName: 'FolderIcon' },
  { name: 'Tasks', path: '/tasks', icon: 'checklist', iconName: 'CheckCircleIcon' },
  { name: 'Skills', path: '/skills', icon: 'sparkles', iconName: 'SparklesIcon' },
  { name: 'MCP', path: '/mcp', icon: 'wrench', iconName: 'WrenchScrewdriverIcon' },
  { name: 'Commands', path: '/commands', icon: 'command', iconName: 'Squares2X2Icon' },
  { name: 'Credentials', path: '/credentials', icon: 'key', iconName: 'KeyIcon' },
  { name: 'Settings', path: '/settings', icon: 'gear', iconName: 'Cog6ToothIcon' },
];

const navItems = computed(() => {
  return navItemsConfig.map(item => ({
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
</script>
