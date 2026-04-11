<template>
  <div class="docs-shell">
    <GrainOverlay />

    <!-- ============ TOP BAR ============ -->
    <header class="docs-topbar" :class="{ 'is-scrolled': isScrolled }">
      <div class="topbar-inner">
        <div class="topbar-left">
          <button
            type="button"
            class="icon-btn mobile-only"
            :aria-expanded="isSidebarOpen"
            :aria-label="t('common.menu', 'Menu')"
            @click="toggleSidebar"
          >
            <svg v-if="!isSidebarOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>

          <Logo variant="full" size="sm" :to="'/'" />
          <span class="docs-kicker">Docs</span>
        </div>

        <button type="button" class="search-trigger" @click="showSearch = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <span class="search-text">{{ t('docs.search_placeholder', 'Search documentation...') }}</span>
          <span class="search-kbd">
            <kbd>{{ modKey }}</kbd>
            <kbd>K</kbd>
          </span>
        </button>

        <div class="topbar-right">
          <nav class="topbar-nav">
            <router-link to="/pricing" class="topbar-link">{{ t('landing.nav.pricing') }}</router-link>
            <router-link to="/changelog" class="topbar-link">{{ t('landing.footer.changelog') }}</router-link>
            <a href="https://github.com/QrCommunication/claudenest" target="_blank" rel="noreferrer" class="topbar-link topbar-ext">
              GitHub
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M10 7h7v7" /></svg>
            </a>
          </nav>
          <ThemeToggle variant="ghost" />
          <router-link to="/register" class="topbar-cta">
            <span>{{ t('common.register') }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </router-link>
        </div>
      </div>
    </header>

    <!-- ============ SIDEBAR ============ -->
    <aside class="docs-sidebar" :class="{ 'is-open': isSidebarOpen }">
      <DocsSidebar />
    </aside>

    <div
      v-if="isSidebarOpen"
      class="sidebar-scrim mobile-only"
      @click="toggleSidebar"
      aria-hidden="true"
    />

    <!-- ============ MAIN ============ -->
    <main class="docs-main">
      <div class="main-grid">
        <article class="docs-content">
          <RouterView />

          <nav v-if="prevNext.prev || prevNext.next" class="page-nav" aria-label="Page navigation">
            <router-link
              v-if="prevNext.prev && prevNext.prev.path"
              :to="prevNext.prev.path"
              class="page-nav-item is-prev"
            >
              <span class="nav-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </span>
              <span class="nav-meta">
                <span class="nav-label">{{ t('common.previous') }}</span>
                <span class="nav-title">{{ prevNext.prev.title }}</span>
              </span>
            </router-link>
            <span v-else />

            <router-link
              v-if="prevNext.next && prevNext.next.path"
              :to="prevNext.next.path"
              class="page-nav-item is-next"
            >
              <span class="nav-meta">
                <span class="nav-label">{{ t('common.next') }}</span>
                <span class="nav-title">{{ prevNext.next.title }}</span>
              </span>
              <span class="nav-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </span>
            </router-link>
          </nav>
        </article>

        <aside class="docs-toc">
          <TableOfContents />
        </aside>
      </div>
    </main>

    <SearchModal v-model="showSearch" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDocs } from '@/composables/useDocs';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import GrainOverlay from '@/components/public/GrainOverlay.vue';
import DocsSidebar from '@/components/docs/Sidebar.vue';
import TableOfContents from '@/components/docs/Toc.vue';
import SearchModal from '@/components/docs/SearchModal.vue';

const { t } = useI18n();
const { isSidebarOpen, toggleSidebar, prevNext } = useDocs();
const showSearch = ref(false);
const isScrolled = ref(false);

const modKey = computed(() => {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /Mac|iPad|iPhone/.test(navigator.platform) ? '⌘' : 'Ctrl';
});

let rafId = 0;
const onScroll = () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    isScrolled.value = window.scrollY > 12;
    rafId = 0;
  });
};

const onKey = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    showSearch.value = true;
  }
};

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKey);
  onScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('keydown', onKey);
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.docs-shell {
  position: relative;
  min-height: 100dvh;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow-x: hidden;
}

/* ============ TOPBAR ============ */
.docs-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  padding: 0 clamp(1rem, 3vw, 2rem);
  display: flex;
  align-items: center;
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
}

.docs-topbar.is-scrolled {
  background: var(--glass-bg);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom-color: var(--border-color);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.topbar-inner {
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.docs-kicker {
  padding: 0.2rem 0.55rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 26%, transparent);
  border-radius: 0.45rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.55rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.icon-btn svg { width: 18px; height: 18px; }

.icon-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.mobile-only {
  display: none;
}

@media (max-width: 1000px) {
  .mobile-only { display: inline-flex; }
  .docs-kicker { display: none; }
}

/* Search trigger */
.search-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  max-width: 26rem;
  margin: 0 auto;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.65rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.search-trigger svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.search-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-kbd {
  display: inline-flex;
  gap: 0.25rem;
}

.search-kbd kbd {
  padding: 0.12rem 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-bottom-width: 2px;
  border-radius: 0.35rem;
}

.search-trigger:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-secondary);
}

@media (max-width: 760px) {
  .search-text { display: none; }
  .search-trigger { width: 40px; padding: 0.55rem; max-width: none; }
  .search-kbd { display: none; }
}

/* Right cluster */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  justify-content: flex-end;
}

.topbar-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

@media (max-width: 1000px) {
  .topbar-nav { display: none; }
}

.topbar-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 0.55rem;
  transition: color 0.2s, background 0.2s;
}

.topbar-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.topbar-ext svg {
  width: 12px;
  height: 12px;
  opacity: 0.75;
}

.topbar-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.6rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 16px -8px rgba(168, 85, 247, 0.5);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.topbar-cta svg {
  width: 13px;
  height: 13px;
  transition: transform 0.2s;
}

.topbar-cta:hover {
  transform: translateY(-1px);
}

.topbar-cta:hover svg {
  transform: translateX(2px);
}

@media (max-width: 560px) {
  .topbar-cta span { display: none; }
  .topbar-cta {
    padding: 0.5rem;
    width: 36px;
    height: 36px;
    justify-content: center;
  }
}

/* ============ SIDEBAR ============ */
.docs-sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 272px;
  padding: 1.5rem 0.5rem 2rem 1rem;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 40;
}

.docs-sidebar::-webkit-scrollbar {
  width: 6px;
}

.docs-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 999px;
}

.sidebar-scrim {
  position: fixed;
  inset: 64px 0 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  z-index: 35;
}

@media (max-width: 1000px) {
  .docs-sidebar { transform: translateX(-100%); }
  .docs-sidebar.is-open { transform: translateX(0); }
}

/* ============ MAIN ============ */
.docs-main {
  margin-left: 272px;
  padding: clamp(1.5rem, 3vw, 3rem) clamp(1rem, 3vw, 2.5rem) 4rem;
  position: relative;
  z-index: 1;
}

@media (max-width: 1000px) {
  .docs-main { margin-left: 0; }
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3rem;
  max-width: 1180px;
  margin: 0 auto;
}

@media (min-width: 1200px) {
  .main-grid {
    grid-template-columns: minmax(0, 1fr) 240px;
  }
}

.docs-content {
  min-width: 0;
  max-width: 820px;
  width: 100%;
}

/* Apply typography improvements to descendants from pages docs */
.docs-content :deep(h1) {
  font-size: clamp(2rem, 3.5vw, 2.6rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
  color: var(--text-primary);
}

.docs-content :deep(h2) {
  margin-top: 2.75rem;
  font-size: clamp(1.35rem, 2.2vw, 1.6rem);
  font-weight: 650;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  scroll-margin-top: 5rem;
}

.docs-content :deep(h3) {
  margin-top: 1.75rem;
  font-size: 1.14rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  scroll-margin-top: 5rem;
}

.docs-content :deep(p) {
  line-height: 1.7;
  color: var(--text-secondary);
}

.docs-content :deep(code):not(:deep(pre code)) {
  padding: 0.12rem 0.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86em;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 20%, transparent);
  border-radius: 0.35rem;
}

.docs-content :deep(pre) {
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.docs-content :deep(a) {
  color: var(--accent-purple);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent-purple) 30%, transparent);
  transition: color 0.2s, border-color 0.2s;
}

.docs-content :deep(a:hover) {
  color: var(--accent-indigo);
  border-bottom-color: var(--accent-indigo);
}

/* TOC */
.docs-toc {
  display: none;
  position: sticky;
  top: 84px;
  align-self: start;
  height: calc(100dvh - 100px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.docs-toc::-webkit-scrollbar {
  width: 4px;
}

.docs-toc::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 999px;
}

@media (min-width: 1200px) {
  .docs-toc { display: block; }
}

/* ============ PAGE NAV ============ */
.page-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 640px) {
  .page-nav { grid-template-columns: 1fr; }
}

.page-nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.9rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s, background 0.22s;
}

.page-nav-item.is-next {
  justify-content: flex-end;
  text-align: right;
}

.page-nav-item:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-purple) 36%, var(--border-color));
  background: color-mix(in srgb, var(--accent-purple) 4%, var(--bg-card));
}

.nav-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 24%, transparent);
  border-radius: 0.55rem;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-arrow svg { width: 14px; height: 14px; }

.page-nav-item.is-prev:hover .nav-arrow { transform: translateX(-2px); }
.page-nav-item.is-next:hover .nav-arrow { transform: translateX(2px); }

.nav-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.nav-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.nav-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
