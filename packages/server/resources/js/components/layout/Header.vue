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
    <div class="flex items-center gap-2">
      <!-- Search Button -->
      <button
        class="p-2 text-dark-4 hover:text-white rounded-lg hover:bg-dark-3 transition-colors"
        @click="$emit('search')"
        :title="$t('header.search')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <!-- Notifications -->
      <button
        class="relative p-2 text-dark-4 hover:text-white rounded-lg hover:bg-dark-3 transition-colors"
        @click="$emit('notifications')"
        :title="$t('header.notifications')"
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
      <ThemeToggle variant="ghost" />

      <!-- Language Switcher -->
      <LanguageSwitcher variant="ghost" :show-label="false" />

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
import { useI18n } from 'vue-i18n';
import UserMenu from './UserMenu.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';
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
const { t } = useI18n();

const pageTitle = computed(() => {
  const routeName = route.name as string;
  const titleKeys: Record<string, string> = {
    'dashboard': 'sidebar.dashboard',
    'machines': 'sidebar.machines',
    'machines.show': 'sidebar.machines',
    'sessions': 'sidebar.sessions',
    'session.terminal': 'sidebar.sessions',
    'sessions.new': 'sidebar.sessions',
    'projects': 'sidebar.projects',
    'projects.show': 'sidebar.projects',
    'projects.tasks': 'tasks.title',
    'projects.context': 'projects.context.title',
    'projects.locks': 'projects.locks.title',
    'tasks': 'sidebar.tasks',
    'skills': 'sidebar.skills',
    'skill.detail': 'sidebar.skills',
    'mcp': 'sidebar.mcp',
    'mcp.tools': 'mcp.all_tools',
    'commands': 'sidebar.commands',
    'settings': 'sidebar.settings',
  };
  
  const key = titleKeys[routeName];
  return key ? t(key) : t('sidebar.dashboard');
});
</script>
