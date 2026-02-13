import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import { MotionPlugin } from '@vueuse/motion';
import { RouterView } from 'vue-router';
import router from './router/index';
import i18n from './i18n';
import './css/app.css';

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
