<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <AppSidebar
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <!-- Main Content Area -->
    <div
      :class="[
        'app-main',
        sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
      ]"
    >
      <!-- Tab Bar -->
      <TabBar />

      <!-- Page Content -->
      <main class="app-content">
        <router-view v-slot="{ Component }">
          <Transition
            name="fade"
            mode="out-in"
          >
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>

      <!-- Status Bar -->
      <StatusBar />
    </div>

    <!-- Mobile Sidebar Overlay -->
    <Transition name="overlay">
      <div
        v-if="mobileSidebarOpen"
        class="mobile-overlay"
        @click="mobileSidebarOpen = false"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import TabBar from '@/components/layout/TabBar.vue';
import StatusBar from '@/components/layout/StatusBar.vue';
import { useTabs } from '@/composables/useTabs';

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);

const { loadTabs } = useTabs();

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed.value));
};

const handleResize = () => {
  // Auto-collapse sidebar on small screens
  if (window.innerWidth < 1024) {
    mobileSidebarOpen.value = false;
  }
};

onMounted(() => {
  // Restore sidebar state
  const savedState = localStorage.getItem('sidebar-collapsed');
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true';
  }

  // Load tabs from session storage
  loadTabs();

  // Listen for window resize
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.app-main {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.app-content {
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--bg-primary);
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background-color: var(--overlay-bg);
  backdrop-filter: blur(4px);
  z-index: 40;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Mobile Responsiveness */
@media (max-width: 1024px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
}
</style>
