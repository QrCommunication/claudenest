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

      <!-- Breadcrumb Bar -->
      <div v-if="showBreadcrumb" class="breadcrumb-bar">
        <Breadcrumb :items="breadcrumbItems" />
      </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import TabBar from '@/components/layout/TabBar.vue';
import StatusBar from '@/components/layout/StatusBar.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import { useTabs } from '@/composables/useTabs';
import { useBreadcrumb } from '@/composables/useBreadcrumb';

const route = useRoute();
const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);

const { loadTabs } = useTabs();
const { breadcrumbItems } = useBreadcrumb();

const showBreadcrumb = computed(() =>
  breadcrumbItems.value.length > 0 && route.name !== 'dashboard'
);

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
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.breadcrumb-bar {
  padding: 0 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, #2a2d3e) 50%, transparent);
  background-color: var(--bg-secondary);
  flex-shrink: 0;
}


.app-content {
  flex: 1;
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
