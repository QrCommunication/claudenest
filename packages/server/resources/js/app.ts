import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './css/app.css';

// Create Vue app
const app = createApp({
  template: '<RouterView />',
});

// Use plugins
app.use(createPinia());
app.use(router);

// Mount app
app.mount('#app');
