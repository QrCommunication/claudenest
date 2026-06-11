<template>
  <div class="legal-layout">
    <PublicNav />

    <!-- Legal pages style themselves (each ships its own scoped .doc-content
         styles); this layout only provides the public chrome and a clean,
         readable column — unlike DocsLayout, no documentation sidebar/TOC. -->
    <main class="legal-main">
      <router-view />
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import PublicNav from '@/components/public/PublicNav.vue';
import PublicFooter from '@/components/public/PublicFooter.vue';
</script>

<style scoped>
.legal-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
}

.legal-main {
  flex: 1;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  /* Top offset clears the fixed public nav. */
  padding: 7rem 1.5rem 5rem;
}

@media (max-width: 760px) {
  .legal-main {
    padding: 6rem 1rem 3rem;
  }
}
</style>
