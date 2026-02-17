<template>
  <div class="sidebar-content">
    <!-- Logo -->
    <div class="sidebar-header">
      <router-link to="/" class="logo">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#1a1b26"/>
              <stop offset="100%" style="stop-color:#24283b"/>
            </linearGradient>
            <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#a855f7"/>
              <stop offset="100%" style="stop-color:#6366f1"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="512" height="512" rx="96" fill="url(#bgGrad)"/>
          <g transform="translate(256, 256)">
            <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <circle cx="-35" cy="0" r="18" fill="#22d3ee"/>
            <circle cx="0" cy="0" r="18" fill="url(#nestGrad)"/>
            <circle cx="35" cy="0" r="18" fill="#22d3ee"/>
          </g>
        </svg>
        <div class="logo-text">
          <span class="logo-title">ClaudeNest</span>
          <span class="logo-subtitle">Documentation</span>
        </div>
      </router-link>
    </div>

    <!-- Search Trigger -->
    <button class="search-trigger" @click="emit('showSearch')">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <span>Search docs...</span>
      <kbd>Ctrl K</kbd>
    </button>

    <!-- Version Selector -->
    <div class="version-selector">
      <select v-model="currentVersion">
        <option v-for="version in availableVersions" :key="version" :value="version">
          {{ version }}
        </option>
      </select>
    </div>

    <!-- Navigation -->
    <nav class="nav">
      <div v-for="section in docsNavigation" :key="section.id" class="nav-section">
        <button 
          class="nav-section-header"
          @click="toggleSection(section.id)"
        >
          <svg v-if="section.icon" class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path v-if="section.icon === 'rocket'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            <path v-else-if="section.icon === 'code'" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            <path v-else-if="section.icon === 'bell'" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            <path v-else-if="section.icon === 'package'" d="M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.1-1.79l8-4a2 2 0 011.78 0zM12 3.55L5.11 7 12 10.45 18.89 7 12 3.55zM4 8.62v7.16l7 3.5V12.12L4 8.62zm9 10.76l7-3.5V8.62l-7 3.5v7.26z"/>
            <path v-else-if="section.icon === 'book'" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
          <span>{{ section.title }}</span>
          <svg 
            class="chevron"
            :class="{ 'is-open': isSectionOpen(section.id) }"
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
        
        <div v-show="isSectionOpen(section.id)" class="nav-section-items">
          <router-link
            v-for="item in section.items"
            :key="item.id"
            :to="item.path"
            class="nav-link"
            :class="{ 'is-active': isActive(item.path) }"
          >
            <span class="nav-link-title">{{ item.title }}</span>
            <span v-if="item.description" class="nav-link-desc">{{ item.description }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Back to App -->
    <div class="sidebar-footer">
      <router-link to="/" class="back-link">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        Back to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDocs } from '@/composables/useDocs';

const route = useRoute();
const { docsNavigation, currentVersion, availableVersions } = useDocs();
const emit = defineEmits<{
  showSearch: [];
}>();

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
  padding: 1.5rem;
}

/* Header */
.sidebar-header {
  margin-bottom: 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.logo svg {
  width: 40px;
  height: 40px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.logo-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Search Trigger */
.search-trigger {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
  width: 100%;
}

.search-trigger:hover {
  background: color-mix(in srgb, var(--text-primary) 6%, transparent);
  border-color: color-mix(in srgb, var(--text-primary) 15%, transparent);
}

.search-trigger svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.search-trigger span {
  flex: 1;
  text-align: left;
}

.search-trigger kbd {
  font-family: inherit;
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  border-radius: 4px;
  color: var(--text-muted);
}

/* Version Selector */
.version-selector {
  margin-bottom: 1rem;
}

.version-selector select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  outline: none;
}

.version-selector select:focus {
  border-color: var(--accent-purple, #a855f7);
}

/* Navigation */
.nav {
  flex: 1;
}

.nav-section {
  margin-bottom: 0.5rem;
}

.nav-section-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-section-header:hover {
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-primary);
}

.nav-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.nav-section-header span {
  flex: 1;
  text-align: left;
}

.chevron {
  width: 18px;
  height: 18px;
  opacity: 0.5;
  transition: transform 0.2s;
}

.chevron.is-open {
  transform: rotate(180deg);
}

.nav-section-items {
  padding-left: 0.5rem;
}

.nav-link {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.75rem;
  margin: 0.125rem 0;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  transition: all 0.15s;
  border-left: 2px solid transparent;
}

.nav-link:hover {
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-primary);
}

.nav-link.is-active {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--accent-purple, #a855f7);
  border-left-color: var(--accent-purple, #a855f7);
  font-weight: 500;
}

.nav-link-title {
  display: block;
}

.nav-link-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-link:hover .nav-link-desc,
.nav-link.is-active .nav-link-desc {
  color: inherit;
  opacity: 0.7;
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, var(--border));
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.back-link:hover {
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-primary);
}

.back-link svg {
  width: 16px;
  height: 16px;
}
</style>
