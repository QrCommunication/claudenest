<template>
    <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

onMounted(() => {
    // Initialize auth state on app load
    if (authStore.token) {
        authStore.fetchUser();
    }
});
</script>

<style>
/* Global styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--bg-primary, var(--surface-1));
    color: var(--text-primary);
}

/* Scrollbar styling */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: color-mix(in srgb, var(--text-primary) 5%, transparent);
}

::-webkit-scrollbar-thumb {
    background: var(--border-color, var(--border));
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--border-color, var(--border));
}

/* Selection styling */
::selection {
    background: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
    color: var(--text-primary);
}
</style>
