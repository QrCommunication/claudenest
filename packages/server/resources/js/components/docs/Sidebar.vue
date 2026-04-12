<template>
  <div class="sidebar-content">
    <!-- Search Trigger -->
    <button class="search-input" @click="emit('showSearch')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <span>Search docs...</span>
      <kbd>{{ modKey }}K</kbd>
    </button>

    <!-- Navigation -->
    <nav class="nav">
      <div v-for="section in docsNavigation" :key="section.id" class="nav-section">
        <button
          class="nav-section-header"
          @click="toggleSection(section.id)"
          :aria-expanded="isSectionOpen(section.id)"
        >
          <span class="nav-section-title">{{ section.title }}</span>
          <svg
            class="chevron"
            :class="{ 'is-open': isSectionOpen(section.id) }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div v-show="isSectionOpen(section.id)" class="nav-section-items">
          <router-link
            v-for="item in section.items"
            :key="item.id"
            :to="item.path ?? '/docs'"
            class="nav-link"
            :class="{ 'is-active': isActive(item.path ?? '') }"
          >
            {{ item.title }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Back to home -->
    <div class="sidebar-footer">
      <router-link to="/" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to home
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDocs } from '@/composables/useDocs';

const route = useRoute();
const { docsNavigation } = useDocs();
const emit = defineEmits<{
  showSearch: [];
}>();

const modKey = computed(() => {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /Mac|iPad|iPhone/.test(navigator.platform) ? '\u2318' : 'Ctrl';
});

// Track open sections
const openSections = ref<Set<string>>(new Set([
  'getting-started',
  'api-reference',
  'webhooks',
  'sdks',
  'resources'
]));

const toggleSection = (id: string) => {
  if (openSections.value.has(id)) {
    openSections.value.delete(id);
  } else {
    openSections.value.add(id);
  }
};

const isSectionOpen = (id: string) => openSections.value.has(id);

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/');
};
</script>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0.75rem 0.5rem;
}

/* Search Input */
.search-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-card, #1e293b);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  margin-bottom: 1.25rem;
  width: 100%;
}

.search-input:hover {
  border-color: var(--border-hover);
  background: var(--bg-hover);
}

.search-input svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.5;
}

.search-input span {
  flex: 1;
  text-align: left;
}

.search-input kbd {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  padding: 0.1rem 0.35rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-bottom-width: 2px;
  border-radius: 3px;
  color: var(--text-muted);
}

/* Navigation */
.nav {
  flex: 1;
}

.nav-section {
  margin-bottom: 0.25rem;
}

.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.4rem 0.65rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s ease;
}

.nav-section-header:hover {
  color: var(--text-secondary);
}

.nav-section-title {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.chevron {
  width: 14px;
  height: 14px;
  opacity: 0.4;
  transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  flex-shrink: 0;
}

.chevron.is-open {
  transform: rotate(90deg);
}

.nav-section-items {
  padding: 0.15rem 0 0.5rem 0;
}

.nav-link {
  display: block;
  padding: 0.35rem 0.65rem;
  margin: 1px 0;
  border-left: 2px solid transparent;
  border-radius: 0 4px 4px 0;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.4;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
}

.nav-link.is-active {
  border-left-color: #3b82f6;
  color: var(--text-primary);
  background: rgba(59, 130, 246, 0.06);
  font-weight: 500;
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.65rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8rem;
  border-radius: 6px;
  transition: color 0.15s ease;
}

.back-link:hover {
  color: var(--text-secondary);
}

.back-link svg {
  width: 14px;
  height: 14px;
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .chevron,
  .nav-link,
  .search-input {
    transition: none;
  }
}
</style>
