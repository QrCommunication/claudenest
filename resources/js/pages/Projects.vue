<template>
  <div class="projects-redirect">
    <div class="spinner" />
    <p>Loading projects...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // Redirect to the new multi-agent projects page
  router.replace({ name: 'projects' });
});
</script>

<style scoped>
.projects-redirect {
  @apply flex flex-col items-center justify-center min-h-[60vh];
}

.spinner {
  @apply w-10 h-10 border-2 border-brand-purple border-t-transparent rounded-full animate-spin;
}

.projects-redirect p {
  @apply mt-4 text-gray-400;
}
</style>
