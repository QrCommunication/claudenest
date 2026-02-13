<template>
  <section id="features" class="py-24 px-4 sm:px-6 lg:px-8 section-alt relative">
    <!-- Bracket decorator -->
    <div class="absolute top-8 left-4 lg:left-12 font-mono text-6xl font-bold opacity-[0.03]" style="color: var(--text-primary)" aria-hidden="true">{</div>
    <div class="absolute bottom-8 right-4 lg:right-12 font-mono text-6xl font-bold opacity-[0.03]" style="color: var(--text-primary)" aria-hidden="true">}</div>

    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// FEATURES</p>
        <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">{{ $t('landing.features.badge') }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">
          {{ $t('landing.features.title') }}
          <span class="gradient-text">{{ $t('landing.features.title_highlight') }}</span>
        </h2>
        <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary)">
          {{ $t('landing.features.subtitle') }}
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(feature, idx) in features"
          :key="feature.key"
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 100, duration: 500 } }"
          class="group landing-card p-6"
        >
          <div class="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors" :class="feature.bgClass">
            <svg class="w-6 h-6" :class="feature.iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="feature.iconPath" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary)">{{ $t(`landing.features.${feature.key}.title`) }}</h3>
          <p class="leading-relaxed" style="color: var(--text-secondary)">{{ $t(`landing.features.${feature.key}.description`) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Feature {
  key: string;
  bgClass: string;
  iconClass: string;
  iconPath: string;
}

const features: Feature[] = [
  {
    key: 'remote_access',
    bgClass: 'bg-brand-purple/10 group-hover:bg-brand-purple/20',
    iconClass: 'text-brand-purple',
    iconPath: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  },
  {
    key: 'multi_agent',
    bgClass: 'bg-brand-cyan/10 group-hover:bg-brand-cyan/20',
    iconClass: 'text-brand-cyan',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    key: 'context_rag',
    bgClass: 'bg-brand-indigo/10 group-hover:bg-brand-indigo/20',
    iconClass: 'text-brand-indigo',
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    key: 'real_time',
    bgClass: 'bg-green-500/10 group-hover:bg-green-500/20',
    iconClass: 'text-green-500',
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    key: 'file_locking',
    bgClass: 'bg-yellow-500/10 group-hover:bg-yellow-500/20',
    iconClass: 'text-yellow-500',
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    key: 'mcp_support',
    bgClass: 'bg-pink-500/10 group-hover:bg-pink-500/20',
    iconClass: 'text-pink-500',
    iconPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
];
</script>
