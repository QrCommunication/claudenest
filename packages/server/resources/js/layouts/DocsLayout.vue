<template>
  <div class="docs-layout">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="toggleSidebar">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
      <router-link to="/" class="logo">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: var(--bg-secondary, var(--surface-2))"/>
              <stop offset="100%" style="stop-color: var(--bg-card, var(--surface-3))"/>
            </linearGradient>
            <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: var(--accent-purple, #a855f7)"/>
              <stop offset="100%" style="stop-color: var(--accent-indigo, #6366f1)"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="512" height="512" rx="96" fill="url(#bgGrad)"/>
          <g transform="translate(256, 256)">
            <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <circle cx="-35" cy="0" r="18" :style="{ fill: 'var(--accent-cyan, #22d3ee)' }"/>
            <circle cx="0" cy="0" r="18" fill="url(#nestGrad)"/>
            <circle cx="35" cy="0" r="18" :style="{ fill: 'var(--accent-cyan, #22d3ee)' }"/>
          </g>
        </svg>
        <span>ClaudeNest Docs</span>
      </router-link>
      <button class="search-btn" @click="showSearch = true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </button>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'is-open': isSidebarOpen, 'is-closed': !isSidebarOpen }">
      <DocsSidebar />
    </aside>

    <!-- Overlay for mobile -->
    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="content">
          <RouterView />
          
          <!-- Prev/Next Navigation -->
          <nav v-if="prevNext.prev || prevNext.next" class="page-nav">
            <router-link v-if="prevNext.prev && prevNext.prev.path" :to="prevNext.prev.path" class="page-nav-item prev">
              <span class="label">← Previous</span>
              <span class="title">{{ prevNext.prev.title }}</span>
            </router-link>
            <div v-else class="page-nav-item"></div>

            <router-link v-if="prevNext.next && prevNext.next.path" :to="prevNext.next.path" class="page-nav-item next">
              <span class="label">Next →</span>
              <span class="title">{{ prevNext.next.title }}</span>
            </router-link>
          </nav>
        </div>

        <!-- Right Sidebar (TOC) -->
        <aside class="toc-sidebar">
          <TableOfContents />
        </aside>
      </div>
    </main>

    <!-- Search Modal -->
    <SearchModal v-model="showSearch" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDocs } from '@/composables/useDocs';
import DocsSidebar from '@/components/docs/Sidebar.vue';
import TableOfContents from '@/components/docs/Toc.vue';
import SearchModal from '@/components/docs/SearchModal.vue';

const { isSidebarOpen, toggleSidebar, prevNext } = useDocs();
const showSearch = ref(false);

// Keyboard shortcut for search
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    showSearch.value = true;
  }
});
</script>

<style scoped>
.docs-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary, var(--surface-1));
  color: var(--text-primary);
}

/* Mobile Header */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 95%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color, var(--border));
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  z-index: 100;
}

.menu-btn,
.search-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.menu-btn:hover,
.search-btn:hover {
  background: var(--bg-hover, var(--surface-3));
  color: var(--text-primary);
}

.menu-btn svg,
.search-btn svg {
  width: 24px;
  height: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-primary);
}

.logo svg {
  width: 32px;
  height: 32px;
}

.logo span {
  font-weight: 600;
  font-size: 1.1rem;
}

/* Sidebar */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: var(--bg-primary, var(--surface-1));
  border-right: 1px solid var(--border-color, var(--border));
  overflow-y: auto;
  z-index: 50;
  transition: transform 0.3s ease;
}

.sidebar.is-closed {
  transform: translateX(-100%);
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 2rem;
  min-height: 100vh;
}

.content-wrapper {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  gap: 3rem;
}

.content {
  flex: 1;
  min-width: 0;
  max-width: 768px;
}

/* TOC Sidebar */
.toc-sidebar {
  width: 240px;
  position: sticky;
  top: 2rem;
  height: calc(100vh - 4rem);
  overflow-y: auto;
}

/* Page Navigation */
.page-nav {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color, var(--border));
}

.page-nav-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  flex: 1;
}

.page-nav-item:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
}

.page-nav-item.next {
  text-align: right;
  align-items: flex-end;
}

.page-nav-item .label {
  font-size: 0.8rem;
  color: var(--accent-purple, #a855f7);
  margin-bottom: 0.25rem;
}

.page-nav-item .title {
  font-weight: 500;
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .toc-sidebar {
    display: none;
  }
  
  .content-wrapper {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }
  
  .sidebar {
    transform: translateX(-100%);
    top: 60px;
    height: calc(100vh - 60px);
  }
  
  .sidebar.is-open {
    transform: translateX(0);
  }
  
  .sidebar.is-open ~ .sidebar-overlay {
    display: block;
  }
  
  .main-content {
    margin-left: 0;
    margin-top: 60px;
    padding: 1.5rem;
  }
  
  .page-nav {
    flex-direction: column;
  }
  
  .page-nav-item.next {
    text-align: left;
    align-items: flex-start;
  }
}
</style>
