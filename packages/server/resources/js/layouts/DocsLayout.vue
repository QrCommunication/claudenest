<template>
  <div class="docs-shell">
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

    <!-- ============ FOOTER ============ -->
    <div class="docs-footer-wrapper">
      <PublicFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDocs } from '@/composables/useDocs';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import PublicFooter from '@/components/public/PublicFooter.vue';
import DocsSidebar from '@/components/docs/Sidebar.vue';
import TableOfContents from '@/components/docs/Toc.vue';
import SearchModal from '@/components/docs/SearchModal.vue';

const { t } = useI18n();
const { isSidebarOpen, toggleSidebar, prevNext } = useDocs();
const showSearch = ref(false);
const isScrolled = ref(false);

const modKey = computed(() => {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /Mac|iPad|iPhone/.test(navigator.platform) ? '\u2318' : 'Ctrl';
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
/* ============ SHELL ============ */
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
  height: 56px;
  padding: 0 clamp(1rem, 3vw, 2rem);
  display: flex;
  align-items: center;
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease;
}

.docs-topbar.is-scrolled {
  background: var(--glass-bg);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom-color: var(--border-color);
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
  padding: 0.15rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
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
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
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
  gap: 0.6rem;
  width: 100%;
  max-width: 24rem;
  margin: 0 auto;
  padding: 0.45rem 0.8rem;
  font-size: 0.82rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
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
  gap: 0.2rem;
}

.search-kbd kbd {
  padding: 0.1rem 0.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-bottom-width: 2px;
  border-radius: 3px;
}

.search-trigger:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-secondary);
}

@media (max-width: 760px) {
  .search-text { display: none; }
  .search-trigger { width: 40px; padding: 0.45rem; max-width: none; }
  .search-kbd { display: none; }
}

/* Right cluster */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.topbar-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

@media (max-width: 1000px) {
  .topbar-nav { display: none; }
}

.topbar-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.65rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}

.topbar-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.topbar-ext svg {
  width: 11px;
  height: 11px;
  opacity: 0.6;
}

.topbar-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  text-decoration: none;
  transition: transform 160ms ease-out, background 0.15s ease;
}

.topbar-cta svg {
  width: 13px;
  height: 13px;
  transition: transform 160ms ease-out;
}

.topbar-cta:hover {
  background: #2563eb;
}

.topbar-cta:active {
  transform: scale(0.97);
}

.topbar-cta:hover svg {
  transform: translateX(2px);
}

@media (max-width: 560px) {
  .topbar-cta span { display: none; }
  .topbar-cta {
    padding: 0.4rem;
    width: 36px;
    height: 36px;
    justify-content: center;
  }
}

/* ============ SIDEBAR ============ */
.docs-sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 250px;
  padding: 1rem 0.5rem 2rem 0.75rem;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 40;
}

.docs-sidebar::-webkit-scrollbar {
  width: 4px;
}

.docs-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 999px;
}

.sidebar-scrim {
  position: fixed;
  inset: 56px 0 0;
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
  margin-left: 250px;
  padding: clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 3rem) 4rem;
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
  max-width: 960px;
  margin: 0 auto;
}

@media (min-width: 1280px) {
  .main-grid {
    grid-template-columns: minmax(0, 720px) 200px;
  }
}

.docs-content {
  min-width: 0;
  max-width: 720px;
  width: 100%;
}

/* Prose typography for doc pages */
.docs-content :deep(h1) {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: var(--text-primary);
}

.docs-content :deep(h2) {
  margin-top: 3rem;
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  scroll-margin-top: 5rem;
}

.docs-content :deep(h3) {
  margin-top: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  scroll-margin-top: 5rem;
}

.docs-content :deep(p) {
  line-height: 1.75;
  color: var(--text-secondary);
  max-width: 65ch;
}

.docs-content :deep(code):not(:deep(pre code)) {
  padding: 0.12rem 0.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 4px;
}

.docs-content :deep(pre) {
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.docs-content :deep(a) {
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  transition: color 0.15s ease, border-color 0.15s ease;
}

.docs-content :deep(a:hover) {
  color: #60a5fa;
  border-bottom-color: #60a5fa;
}

/* TOC */
.docs-toc {
  display: none;
  position: sticky;
  top: 76px;
  align-self: start;
  height: calc(100dvh - 92px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.docs-toc::-webkit-scrollbar {
  width: 3px;
}

.docs-toc::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 999px;
}

@media (min-width: 1280px) {
  .docs-toc { display: block; }
}

/* ============ PAGE NAV ============ */
.page-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 640px) {
  .page-nav { grid-template-columns: 1fr; }
}

.page-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.15rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: transform 160ms ease-out, border-color 0.15s ease, background 0.15s ease;
}

.page-nav-item.is-next {
  justify-content: flex-end;
  text-align: right;
}

.page-nav-item:hover {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.04);
}

.page-nav-item:active {
  transform: scale(0.98);
}

.nav-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #3b82f6;
  flex-shrink: 0;
  transition: transform 160ms ease-out;
}

.nav-arrow svg { width: 14px; height: 14px; }

.page-nav-item.is-prev:hover .nav-arrow { transform: translateX(-2px); }
.page-nav-item.is-next:hover .nav-arrow { transform: translateX(2px); }

.nav-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.nav-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.nav-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============ DOCS FOOTER ============ */
.docs-footer-wrapper {
  margin-left: 250px;
  position: relative;
  z-index: 1;
}

@media (max-width: 1000px) {
  .docs-footer-wrapper { margin-left: 0; }
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .docs-topbar,
  .docs-sidebar,
  .page-nav-item,
  .topbar-cta,
  .nav-arrow {
    transition: none;
  }
}
</style>
