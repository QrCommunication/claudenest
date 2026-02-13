<template>
  <section id="solution" class="py-24 px-4 sm:px-6 lg:px-8 relative">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// THE_SOLUTION</p>
        <h2
          class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
          style="color: var(--text-primary)"
        >
          {{ $t('landing.solution.title') }}
        </h2>
        <p
          class="text-lg max-w-2xl mx-auto"
          style="color: var(--text-secondary)"
        >
          {{ $t('landing.solution.subtitle') }}
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div
          v-for="(pillar, idx) in pillars"
          :key="idx"
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 150, duration: 500 } }"
          class="text-center"
        >
          <div
            class="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center border"
            :class="pillar.containerClass"
          >
            <svg
              class="w-8 h-8"
              :class="pillar.iconClass"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                :d="pillar.iconPath"
              />
            </svg>
          </div>
          <h3
            class="text-xl font-semibold mb-3"
            style="color: var(--text-primary)"
          >
            {{ $t(`landing.solution.pillar_${idx + 1}.title`) }}
          </h3>
          <p
            class="leading-relaxed"
            style="color: var(--text-secondary)"
          >
            {{ $t(`landing.solution.pillar_${idx + 1}.description`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Pillar {
  containerClass: string;
  iconClass: string;
  iconPath: string;
}

const pillars: Pillar[] = [
  {
    containerClass: 'bg-brand-purple/10 border-brand-purple/20',
    iconClass: 'text-brand-purple',
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    containerClass: 'bg-brand-indigo/10 border-brand-indigo/20',
    iconClass: 'text-brand-indigo',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    containerClass: 'bg-brand-cyan/10 border-brand-cyan/20',
    iconClass: 'text-brand-cyan',
    iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
];
</script>
