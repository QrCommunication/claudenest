<template>
  <header
    class="public-nav"
    :class="{ 'is-scrolled': isScrolled }"
    :style="{ '--nav-h': '64px' }"
  >
    <div class="nav-inner">
      <div class="nav-left">
        <Logo :to="'/'" variant="full" size="sm" />
      </div>

      <nav class="nav-center" aria-label="Primary">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <div class="nav-right">
        <ThemeToggle variant="ghost" />
        <router-link to="/login" class="nav-link hidden md:inline-flex">
          {{ t('common.login') }}
        </router-link>
        <router-link to="/register" class="nav-cta">
          <span>{{ t('common.register') }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="nav-cta-arrow">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </router-link>
        <button
          type="button"
          class="nav-burger md:hidden"
          :aria-expanded="mobileOpen"
          aria-label="Toggle menu"
          @click="mobileOpen = !mobileOpen"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
            <template v-if="!mobileOpen">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </template>
            <template v-else>
              <path d="M6 6l12 12M6 18L18 6" />
            </template>
          </svg>
        </button>
      </div>
    </div>

    <Transition name="nav-mobile">
      <div v-if="mobileOpen" class="nav-mobile md:hidden">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-mobile-link"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </router-link>
        <div class="nav-mobile-divider" />
        <router-link to="/login" class="nav-mobile-link" @click="mobileOpen = false">
          {{ t('common.login') }}
        </router-link>
        <router-link to="/register" class="nav-mobile-link is-cta" @click="mobileOpen = false">
          {{ t('common.register') }}
        </router-link>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';

const { t } = useI18n();

const mobileOpen = ref(false);
const isScrolled = ref(false);

const navItems = computed(() => [
  { to: '/', label: t('landing.nav.features') },
  { to: '/pricing', label: t('landing.nav.pricing') },
  { to: '/docs', label: t('docs.title', 'Documentation') },
  { to: '/changelog', label: t('landing.footer.changelog') },
]);

let rafId = 0;
const onScroll = () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    isScrolled.value = window.scrollY > 24;
    rafId = 0;
  });
};

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.public-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  height: var(--nav-h);
  padding: 0 clamp(1rem, 4vw, 2.5rem);
  display: flex;
  align-items: center;
  background: transparent;
  transition: background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease;
  border-bottom: 1px solid transparent;
}

.public-nav.is-scrolled {
  background: var(--glass-bg);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom-color: var(--border-color);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.nav-inner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  gap: 1rem;
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-center {
  display: none;
  justify-content: center;
  gap: 0.25rem;
}

@media (min-width: 900px) {
  .nav-center {
    display: flex;
  }
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.9rem;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--text-secondary);
  border-radius: 0.6rem;
  transition: color 0.18s ease, background 0.18s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0.35rem;
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--accent-purple), var(--accent-cyan));
  transition: width 0.25s ease, left 0.25s ease;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link:hover::after {
  width: 55%;
  left: 22.5%;
}

.nav-cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%);
  border-radius: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 6px 18px -6px rgba(168, 85, 247, 0.45);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
}

.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 10px 22px -6px rgba(168, 85, 247, 0.55);
}

.nav-cta:active {
  transform: translateY(0);
}

.nav-cta-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-cta:hover .nav-cta-arrow {
  transform: translateX(2px);
}

.nav-burger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.6rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.nav-burger svg {
  width: 20px;
  height: 20px;
}

.nav-burger:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.nav-mobile {
  position: absolute;
  top: var(--nav-h);
  left: 0;
  right: 0;
  padding: 0.75rem 1rem 1.25rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-mobile-link {
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  border-radius: 0.6rem;
  transition: background 0.18s ease;
}

.nav-mobile-link:hover {
  background: var(--bg-hover);
}

.nav-mobile-link.is-cta {
  margin-top: 0.25rem;
  text-align: center;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
}

.nav-mobile-divider {
  height: 1px;
  margin: 0.5rem 0;
  background: var(--border-color);
}

.nav-mobile-enter-active,
.nav-mobile-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-mobile-enter-from,
.nav-mobile-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
