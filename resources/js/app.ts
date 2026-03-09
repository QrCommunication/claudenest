import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import i18n from './i18n';
import './css/app.css';

// Create Vue app
const app = createApp({
  template: '<RouterView />',
});

// Use plugins
app.use(createPinia());
app.use(router);
app.use(i18n);

// Mount app
app.mount('#app');
