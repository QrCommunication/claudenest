<template>
  <section id="cta" class="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden scanline-overlay">
    <!-- Background -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-brand-indigo/5 to-brand-cyan/10"></div>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-purple/10 rounded-full blur-[120px]"></div>
    </div>

    <div
      v-motion
      :initial="{ opacity: 0, y: 30 }"
      :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 200, duration: 600 } }"
      class="max-w-4xl mx-auto text-center relative"
    >
      <p class="code-comment mb-4">// GET_STARTED</p>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style="color: var(--text-primary)">
        {{ $t('landing.cta.title') }}
        <span class="gradient-text block sm:inline">{{ $t('landing.cta.title_highlight') }}</span>
      </h2>
      <p class="text-lg mb-10 max-w-2xl mx-auto" style="color: var(--text-secondary)">
        {{ $t('landing.cta.subtitle') }}
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <router-link
          to="/register"
          class="w-full sm:w-auto px-10 py-4 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-semibold text-lg transition-all hover:scale-[1.03] shadow-lg shadow-brand-purple/25 hover:shadow-xl hover:shadow-brand-purple/30 cursor-pointer"
        >
          {{ $t('landing.cta.cta_primary') }}
        </router-link>
        <router-link
          to="/docs"
          class="w-full sm:w-auto px-10 py-4 rounded-lg font-semibold text-lg transition-all border cursor-pointer"
          style="background-color: var(--glass-bg); border-color: var(--border); color: var(--text-primary); backdrop-filter: blur(16px)"
        >
          {{ $t('landing.cta.cta_secondary') }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
