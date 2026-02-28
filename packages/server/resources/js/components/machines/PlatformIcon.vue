<template>
  <div class="platform-icon" :class="`platform-${platform}`" :title="platformLabel">
    <!-- macOS Icon -->
    <svg v-if="platform === 'darwin'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
    
    <!-- Windows Icon -->
    <svg v-else-if="platform === 'win32'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 12V6.75l6-1.32v6.48L3 12m17-9v8.75l-10 .15V5.21L20 3M3 13l6 .09v6.81l-6-1.15V13m17 .25V22l-10-1.91V13.1l10 .15z"/>
    </svg>
    
    <!-- Linux Icon -->
    <svg v-else-if="platform === 'linux'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489.117.779.428 1.506.928 2.122.5.616 1.17 1.107 1.94 1.43.77.323 1.656.478 2.584.478.928 0 1.814-.155 2.584-.478.77-.323 1.44-.814 1.94-1.43.5-.616.811-1.343.928-2.122.123-.805-.009-1.657-.287-2.489-.589-1.771-1.831-3.47-2.716-4.521-.75-1.067-.974-1.928-1.05-3.02-.065-1.491 1.056-5.965-3.17-6.298-.165-.013-.325-.021-.48-.021zm-.504 3c.425 0 .816.108 1.146.313.33.205.591.497.76.846.169.35.254.745.254 1.154 0 .41-.085.804-.254 1.153-.169.35-.43.641-.76.846-.33.205-.721.313-1.146.313-.425 0-.816-.108-1.146-.313-.33-.205-.591-.496-.76-.846-.169-.349-.254-.743-.254-1.153 0-.409.085-.804.254-1.154.169-.349.43-.641.76-.846.33-.205.721-.313 1.146-.313zM12 10c.552 0 1 .448 1 1v3c0 .552-.448 1-1 1s-1-.448-1-1v-3c0-.552.448-1 1-1zm-4 3c.552 0 1 .448 1 1v2c0 .552-.448 1-1 1s-1-.448-1-1v-2c0-.552.448-1 1-1zm8 0c.552 0 1 .448 1 1v2c0 .552-.448 1-1 1s-1-.448-1-1v-2c0-.552.448-1 1-1z"/>
      <circle cx="12" cy="7.5" r="1.5"/>
    </svg>
    
    <!-- Unknown Icon -->
    <svg v-else viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MachinePlatform } from '@/types';

interface Props {
  platform: MachinePlatform;
}

const props = defineProps<Props>();

const platformLabel = computed(() => {
  const labels: Record<MachinePlatform, string> = {
    darwin: 'macOS',
    win32: 'Windows',
    linux: 'Linux',
  };
  return labels[props.platform] || 'Unknown';
});
</script>

<style scoped>
.platform-icon {
  @apply w-6 h-6 flex items-center justify-center rounded-lg;
}

.platform-icon svg {
  @apply w-5 h-5;
}

.platform-darwin {
  @apply bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300;
}

.platform-win32 {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400;
}

.platform-linux {
  @apply bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500;
}
</style>
