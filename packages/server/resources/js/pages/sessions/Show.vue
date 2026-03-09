<template>
  <div class="session-detail-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <h1>Session Details</h1>
    </div>
    <div class="placeholder">
      <p>Session detail view coming soon</p>
      <p class="session-id">Session ID: {{ $route.params.id }}</p>
    </div>
  </div>
</template>

<style scoped>
.session-detail-page {
  @apply p-6;
}

.page-header {
  @apply flex items-center gap-4 mb-8;
}

.back-btn {
  @apply p-2 rounded-lg text-skin-secondary hover:text-skin-primary hover:bg-surface-2 transition-colors;
}

.back-btn svg {
  @apply w-6 h-6;
}

.page-header h1 {
  @apply text-2xl font-bold text-skin-primary;
}

.placeholder {
  @apply flex flex-col items-center justify-center py-20;
}

.placeholder p {
  @apply text-skin-secondary;
}

.session-id {
  @apply text-sm text-skin-secondary mt-2;
}
</style>
