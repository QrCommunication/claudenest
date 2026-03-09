<template>
  <div ref="menuRef" class="user-menu">
    <button class="user-menu-btn" @click="isOpen = !isOpen">
      <!-- Avatar -->
      <div class="user-avatar" :class="{ 'user-avatar--gradient': !user?.avatar_url }">
        <img v-if="user?.avatar_url" :src="user.avatar_url" :alt="user?.name" class="w-full h-full rounded-full object-cover" />
        <span v-else>{{ initials }}</span>
      </div>

      <!-- Name & Email -->
      <div class="user-info">
        <p class="user-name">{{ user?.name || 'Guest' }}</p>
        <p class="user-email">{{ user?.email || '' }}</p>
      </div>

      <!-- Chevron -->
      <svg class="user-chevron" :class="{ 'rotate-180': isOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <!-- User Info -->
        <div class="dropdown-header">
          <div class="dropdown-avatar" :class="{ 'dropdown-avatar--gradient': !user?.avatar_url }">
            <img v-if="user?.avatar_url" :src="user.avatar_url" :alt="user?.name" class="w-full h-full rounded-full object-cover" />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="min-w-0">
            <p class="dropdown-user-name">{{ user?.name || 'Guest' }}</p>
            <p class="dropdown-user-email">{{ user?.email || '' }}</p>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="dropdown-section">
          <router-link to="/settings" class="dropdown-item" @click="isOpen = false">
            <svg class="dropdown-item-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </router-link>

          <router-link to="/settings" class="dropdown-item" @click="isOpen = false">
            <svg class="dropdown-item-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </router-link>
        </div>

        <div class="dropdown-divider" />

        <!-- Logout -->
        <div class="dropdown-section">
          <button class="dropdown-item dropdown-item--danger" @click="handleLogout">
            <svg class="dropdown-item-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import type { User } from '@/types';

interface Props {
  user?: User | null;
}

const props = withDefaults(defineProps<Props>(), { user: null });

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const initials = computed(() => {
  if (!props.user?.name) return '?';
  return props.user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside));

const handleLogout = async () => {
  isOpen.value = false;
  try {
    await authStore.logout();
    router.push('/login');
    toast.success('Signed out', 'You have been successfully signed out');
  } catch {
    toast.error('Error', 'Failed to sign out');
  }
};
</script>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.user-menu-btn:hover {
  background-color: var(--bg-hover);
}

.user-menu-btn:focus {
  outline: none;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar--gradient {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  color: white;
}

.user-info {
  display: none;
  text-align: left;
}

@media (min-width: 768px) {
  .user-info { display: block; }
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.user-email {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-chevron {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  display: none;
  transition: transform 0.2s ease;
}

@media (min-width: 768px) {
  .user-chevron { display: block; }
}

/* Dropdown */
.dropdown-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 220px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 4px 0;
  z-index: 200;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
}

.dropdown-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.dropdown-avatar--gradient {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  color: white;
}

.dropdown-user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.dropdown-user-email {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-section {
  padding: 4px 0;
}

.dropdown-divider {
  border-top: 1px solid var(--border-color);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item--danger {
  color: #f87171;
}

.dropdown-item--danger:hover {
  background-color: color-mix(in srgb, #ef4444 10%, transparent);
  color: #f87171;
}

.dropdown-item-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
