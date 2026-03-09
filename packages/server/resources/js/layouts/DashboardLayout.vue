<template>
  <div class="min-h-screen bg-surface-1">
    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <!-- Main Content -->
    <div
      :class="[
        'transition-all duration-300 min-h-screen flex flex-col',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60',
      ]"
    >
      <!-- Header -->
      <Header
        :user="authStore.user"
        :unread-count="0"
        @toggle-sidebar="toggleMobileSidebar"
        @search="showSearch = true"
        @notifications="showNotifications = true"
      />

      <!-- Page Content -->
      <main class="flex-1 p-6">
        <Breadcrumb
          v-if="breadcrumbItems.length > 0"
          :items="breadcrumbItems"
        />
        <router-view v-slot="{ Component }">
          <Transition
            name="fade"
            mode="out-in"
          >
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        @click="mobileSidebarOpen = false"
      />
    </Transition>

    <!-- Mobile Sidebar -->
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div
        v-if="mobileSidebarOpen"
        class="fixed left-0 top-0 h-full w-60 bg-surface-2 border-r border-skin z-50 lg:hidden"
      >
        <Sidebar @toggle="mobileSidebarOpen = false" />
      </div>
    </Transition>

    <!-- Search Modal -->
    <Modal
      v-model="showSearch"
      title="Search"
      size="lg"
    >
      <div class="space-y-4">
        <Input
          v-model="searchQuery"
          placeholder="Search machines, sessions, tasks..."
          class="w-full"
        >
          <template #left-icon>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </Input>
        
        <div class="text-sm text-skin-secondary text-center py-4">
          Start typing to search across your dashboard
        </div>
      </div>
    </Modal>

    <!-- Notifications Modal -->
    <Modal
      v-model="showNotifications"
      title="Notifications"
      size="md"
    >
      <div class="space-y-4">
        <div class="text-center py-8 text-skin-secondary">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p>No new notifications</p>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useBreadcrumb } from '@/composables/useBreadcrumb';
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import Modal from '@/components/common/Modal.vue';
import Input from '@/components/common/Input.vue';

const authStore = useAuthStore();
const { breadcrumbItems } = useBreadcrumb();

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);
const showSearch = ref(false);
const showNotifications = ref(false);
const searchQuery = ref('');

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed.value));
};

const toggleMobileSidebar = () => {
  mobileSidebarOpen.value = !mobileSidebarOpen.value;
};

onMounted(() => {
  // Restore sidebar state
  const savedState = localStorage.getItem('sidebar-collapsed');
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true';
  }

  // Initialize auth
  authStore.init();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
