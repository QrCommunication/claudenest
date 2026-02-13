<template>
  <section id="problem" class="py-24 px-4 sm:px-6 lg:px-8 section-alt relative">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// THE_PROBLEM</p>
        <h2
          class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
          style="color: var(--text-primary)"
        >
          {{ $t('landing.problem.title') }}
        </h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6 mb-16">
        <div
          v-for="(pain, idx) in painPoints"
          :key="pain.key"
          v-motion
          :initial="{ opacity: 0, x: -30 }"
          :visibleOnce="{ opacity: 1, x: 0, transition: { delay: idx * 150, duration: 500 } }"
          class="landing-card p-6"
        >
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            :class="pain.bgClass"
          >
            <svg
              class="w-6 h-6"
              :class="pain.iconClass"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="pain.iconPath"
              />
            </svg>
          </div>
          <h3
            class="text-lg font-semibold mb-2"
            style="color: var(--text-primary)"
          >
            {{ $t(`landing.problem.${pain.key}.title`) }}
          </h3>
          <p
            class="leading-relaxed text-sm"
            style="color: var(--text-secondary)"
          >
            {{ $t(`landing.problem.${pain.key}.description`) }}
          </p>
        </div>
      </div>

      <div
        v-motion
        :initial="{ opacity: 0, scale: 0.9 }"
        :visibleOnce="{ opacity: 1, scale: 1, transition: { delay: 500 } }"
        class="text-center"
      >
        <p class="text-2xl sm:text-3xl font-bold gradient-text">
          {{ $t('landing.problem.transition') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface PainPoint {
  key: string;
  bgClass: string;
  iconClass: string;
  iconPath: string;
}

const painPoints: PainPoint[] = [
  {
    key: 'conflict',
    bgClass: 'bg-red-500/10',
    iconClass: 'text-red-400',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  {
    key: 'vanishing',
    bgClass: 'bg-orange-500/10',
    iconClass: 'text-orange-400',
    iconPath: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
  {
    key: 'blindfold',
    bgClass: 'bg-yellow-500/10',
    iconClass: 'text-yellow-400',
    iconPath: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
  },
];
</script>
