<template>
  <section id="how-it-works" class="py-24 px-4 sm:px-6 lg:px-8 relative">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// GETTING_STARTED</p>
        <p class="text-sm font-semibold text-brand-cyan uppercase tracking-wider mb-3">{{ $t('landing.how_it_works.badge') }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">
          {{ $t('landing.how_it_works.title') }}
          <span class="gradient-text">{{ $t('landing.how_it_works.title_highlight') }}</span>
        </h2>
        <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary)">
          {{ $t('landing.how_it_works.subtitle') }}
        </p>
      </div>

      <div class="relative">
        <!-- Connecting Line -->
        <div class="hidden lg:block absolute top-24 left-[16.66%] right-[16.66%] h-px" aria-hidden="true">
          <div class="w-full h-full bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-cyan opacity-30"></div>
        </div>

        <div class="grid lg:grid-cols-3 gap-12 lg:gap-8">
          <div
            v-for="(step, idx) in steps"
            :key="idx"
            v-motion
            :initial="{ opacity: 0, y: 40 }"
            :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 200, duration: 600 } }"
            class="relative text-center group"
          >
            <div
              class="relative z-10 w-16 h-16 mx-auto mb-6 rounded-2xl border flex items-center justify-center transition-all duration-300"
              :class="step.containerClass"
              style="background-color: var(--glass-bg); backdrop-filter: blur(16px)"
            >
              <svg class="w-7 h-7" :class="step.iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="step.iconPath" />
              </svg>
              <span
                class="absolute -top-2 -right-2 w-6 h-6 text-xs font-bold rounded-full flex items-center justify-center"
                :class="step.badgeClass"
              >{{ idx + 1 }}</span>
            </div>
            <h3 class="text-xl font-semibold mb-3" style="color: var(--text-primary)">{{ $t(`landing.how_it_works.step_${idx + 1}.title`) }}</h3>
            <p class="mb-4 leading-relaxed" style="color: var(--text-secondary)">
              {{ $t(`landing.how_it_works.step_${idx + 1}.description`) }}
            </p>
            <div
              class="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-sm"
              style="background-color: var(--glass-bg); border: 1px solid var(--border); backdrop-filter: blur(16px)"
            >
              <template v-if="idx === 0">
                <span class="text-brand-cyan">npm i -g @claudenest/agent</span>
              </template>
              <template v-else-if="idx === 1">
                <span class="relative flex h-2 w-2">
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span class="text-green-400">{{ $t('landing.how_it_works.step_2.visual') }}</span>
              </template>
              <template v-else>
                <div class="flex -space-x-2" aria-hidden="true">
                  <div class="w-6 h-6 rounded-full bg-brand-purple/30 border-2 flex items-center justify-center" style="border-color: var(--surface-2)">
                    <span class="text-[10px] text-brand-purple font-bold">A</span>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-brand-indigo/30 border-2 flex items-center justify-center" style="border-color: var(--surface-2)">
                    <span class="text-[10px] text-brand-indigo font-bold">B</span>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-brand-cyan/30 border-2 flex items-center justify-center" style="border-color: var(--surface-2)">
                    <span class="text-[10px] text-brand-cyan font-bold">C</span>
                  </div>
                </div>
                <span style="color: var(--text-secondary)">{{ $t('landing.how_it_works.step_3.visual') }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Step {
  containerClass: string;
  iconClass: string;
  iconPath: string;
  badgeClass: string;
}

const steps: Step[] = [
  {
    containerClass: 'border-transparent group-hover:border-brand-purple/50 group-hover:shadow-lg group-hover:shadow-brand-purple/10',
    iconClass: 'text-brand-purple',
    iconPath: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    badgeClass: 'bg-brand-purple text-white',
  },
  {
    containerClass: 'border-transparent group-hover:border-brand-indigo/50 group-hover:shadow-lg group-hover:shadow-brand-indigo/10',
    iconClass: 'text-brand-indigo',
    iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    badgeClass: 'bg-brand-indigo text-white',
  },
  {
    containerClass: 'border-transparent group-hover:border-brand-cyan/50 group-hover:shadow-lg group-hover:shadow-brand-cyan/10',
    iconClass: 'text-brand-cyan',
    iconPath: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    badgeClass: 'bg-brand-cyan text-dark-1',
  },
];
</script>
