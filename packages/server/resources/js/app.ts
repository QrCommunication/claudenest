import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import { MotionPlugin } from '@vueuse/motion';
import { RouterView } from 'vue-router';
import router from './router/index';
import i18n from './i18n';
import './css/app.css';

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

// Create Vue app
const app = createApp({
  render: () => h(RouterView),
});

// Use plugins
app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(MotionPlugin);

// Mount app
app.mount('#app');
