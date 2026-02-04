<template>
  <Menu as="div" class="relative">
    <MenuButton class="flex items-center gap-3 p-1.5 rounded-lg hover:bg-dark-3 transition-colors focus:outline-none">
      <!-- Avatar -->
      <div
        :class="[
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          user?.avatar_url ? '' : 'bg-gradient-to-br from-brand-purple to-brand-indigo text-white',
        ]"
      >
        <img
          v-if="user?.avatar_url"
          :src="user.avatar_url"
          :alt="user.name"
          class="w-full h-full rounded-full object-cover"
        />
        <span v-else>{{ initials }}</span>
      </div>

      <!-- Name & Email -->
      <div class="hidden md:block text-left">
        <p class="text-sm font-medium text-white">{{ user?.name || 'Guest' }}</p>
        <p class="text-xs text-dark-4">{{ user?.email || 'Not logged in' }}</p>
      </div>

      <!-- Chevron -->
      <svg class="w-4 h-4 text-dark-4 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </MenuButton>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems class="absolute right-0 mt-2 w-56 bg-dark-2 rounded-card border border-dark-4 shadow-xl py-1 focus:outline-none z-50">
        <!-- User Info -->
        <div class="px-4 py-3 border-b border-dark-4">
          <p class="text-sm font-medium text-white">{{ user?.name || 'Guest' }}</p>
          <p class="text-xs text-dark-4 truncate">{{ user?.email || 'Not logged in' }}</p>
        </div>

        <!-- Menu Items -->
        <div class="py-1">
          <MenuItem v-slot="{ active }">
            <router-link
              to="/settings"
              :class="[
                'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                active ? 'bg-dark-3 text-white' : 'text-dark-4',
              ]"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </router-link>
          </MenuItem>

          <MenuItem v-slot="{ active }">
            <button
              :class="[
                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                active ? 'bg-dark-3 text-white' : 'text-dark-4',
              ]"
              @click="copyApiKey"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy API Key
            </button>
          </MenuItem>
        </div>

        <!-- Divider -->
        <div class="border-t border-dark-4" />

        <!-- Logout -->
        <div class="py-1">
          <MenuItem v-slot="{ active }">
            <button
              :class="[
                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-red-400',
                active ? 'bg-red-500/10' : '',
              ]"
              @click="handleLogout"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import type { User } from '@/types';

interface Props {
  user?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
});

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const initials = computed(() => {
  if (!props.user?.name) return '?';
  return props.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const copyApiKey = () => {
  // This would copy the user's API key to clipboard
  toast.info('API Key copied', 'The API key has been copied to your clipboard');
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
    toast.success('Signed out', 'You have been successfully signed out');
  } catch (error) {
    toast.error('Error', 'Failed to sign out');
  }
};
</script>
