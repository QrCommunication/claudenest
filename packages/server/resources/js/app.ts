import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import { MotionPlugin } from '@vueuse/motion';
import { RouterView } from 'vue-router';
import router from './router/index';
import i18n from './i18n';
import NewVersionBanner from './components/common/NewVersionBanner.vue';
// NOTE: no CSS import here — the single canonical stylesheet is
// resources/css/app.css, loaded by the Blade @vite entry. A legacy Tailwind
// v3 file (resources/js/css/app.css) used to be imported here, generating a
// SECOND utility bundle that loaded after the canonical one and clobbered
// responsive variants app-wide.

// Initialize theme early (before Vue app mounts)
const initializeTheme = () => {
  const STORAGE_KEY = 'claudenest-theme';
  const stored = localStorage.getItem(STORAGE_KEY);
  const theme = stored && ['dark', 'light', 'system'].includes(stored) ? stored : 'dark';

  let resolvedTheme = theme;
  if (theme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const html = document.documentElement;
  html.setAttribute('data-theme', resolvedTheme);
  if (resolvedTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};

// Initialize theme immediately
initializeTheme();

// Create Vue app.
// NewVersionBanner is mounted ONCE at the root (alongside RouterView) so the
// "new version deployed" detector covers the dashboard AND every public page
// (Landing, docs, legal) with a single composable instance — mounting it in
// AppLayout only would stop the check when navigating to public routes.
const app = createApp({
  render: () => [h(RouterView), h(NewVersionBanner)],
});

// Use plugins
app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(MotionPlugin);

// Mount app
app.mount('#app');
