<template>
  <div class="sessions-page">
    <div class="page-header">
      <h1>Sessions</h1>
      <p class="subtitle">Manage your Claude sessions</p>
    </div>
    <div class="placeholder">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
      <p>Sessions management coming soon</p>
      <router-link to="/machines" class="btn-primary">
        Go to Machines
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.sessions-page {
  @apply p-6;
}

.page-header {
  @apply mb-8;
}

.page-header h1 {
  @apply text-3xl font-bold text-white;
}

.subtitle {
  @apply text-gray-400 mt-1;
}

.placeholder {
  @apply flex flex-col items-center justify-center py-20;
}

.placeholder svg {
  @apply w-16 h-16 text-gray-600 mb-4;
}

.placeholder p {
  @apply text-gray-400 mb-6;
}

.btn-primary {
  @apply px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-indigo text-white rounded-lg font-medium;
  @apply hover:opacity-90 transition-opacity;
}
</style>
