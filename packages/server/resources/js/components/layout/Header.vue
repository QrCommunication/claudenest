<template>
  <header class="h-16 bg-dark-2/80 backdrop-blur-xl border-b border-dark-4 flex items-center justify-between px-6 sticky top-0 z-30">
    <!-- Left Section -->
    <div class="flex items-center gap-4">
      <!-- Mobile Menu Button -->
      <button
        class="lg:hidden p-2 -ml-2 text-dark-4 hover:text-white rounded-lg hover:bg-dark-3 transition-colors"
        @click="$emit('toggle-sidebar')"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Page Title -->
      <h1 class="text-xl font-semibold text-white hidden sm:block">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right Section -->
    <div class="flex items-center gap-3">
      <!-- Search Button -->
      <button
        class="p-2 text-dark-4 hover:text-white rounded-lg hover:bg-dark-3 transition-colors"
        @click="$emit('search')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <!-- Notifications -->
      <button
        class="relative p-2 text-dark-4 hover:text-white rounded-lg hover:bg-dark-3 transition-colors"
        @click="$emit('notifications')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span
          v-if="unreadCount > 0"
          class="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-purple rounded-full"
        />
      </button>

      <!-- Theme Toggle -->
      <button
        class="p-2 text-dark-4 hover:text-white rounded-lg hover:bg-dark-3 transition-colors"
        @click="toggleTheme"
      >
        <svg
          v-if="isDark"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg
          v-else
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Divider -->
      <div class="w-px h-6 bg-dark-4 mx-1" />

      <!-- User Menu -->
      <UserMenu :user="user" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from '@/composables/useTheme';
import UserMenu from './UserMenu.vue';
import type { User } from '@/types';

interface Props {
  user?: User | null;
  unreadCount?: number;
}

withDefaults(defineProps<Props>(), {
  user: null,
  unreadCount: 0,
});

const emit = defineEmits<{
  'toggle-sidebar': [];
  search: [];
  notifications: [];
}>();

const route = useRoute();
const { isDark, toggleTheme } = useTheme();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    'dashboard': 'Dashboard',
    'machines': 'Machines',
    'sessions': 'Sessions',
    'projects': 'Projects',
    'tasks': 'Tasks',
    'skills': 'Skills',
    'mcp': 'MCP Connections',
    'settings': 'Settings',
  };
  
  return titles[route.name as string] || 'Dashboard';
});
</script>
