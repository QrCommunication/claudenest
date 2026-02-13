<template>
  <section id="pricing" class="py-24 px-4 sm:px-6 lg:px-8 section-alt relative">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// PRICING</p>
        <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">{{ $t('landing.pricing.badge') }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">
          {{ $t('landing.pricing.title') }}
          <span class="gradient-text">{{ $t('landing.pricing.title_highlight') }}</span>
        </h2>
        <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary)">
          {{ $t('landing.pricing.subtitle') }}
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6 mb-8">
        <div
          v-for="(tier, idx) in pricingTiers"
          :key="tier.key"
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 150, duration: 500 } }"
          class="relative landing-card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
          :class="tier.popular ? 'border-2 !border-brand-purple/50 shadow-lg shadow-brand-purple/10' : ''"
        >
          <!-- Popular gradient bar -->
          <div
            v-if="tier.popular"
            class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-cyan"
          ></div>

          <div class="p-6">
            <!-- Popular badge -->
            <div v-if="tier.popular" class="inline-flex items-center px-3 py-1 bg-brand-purple/10 border border-brand-purple/30 rounded-full mb-4">
              <span class="text-xs font-semibold text-brand-purple">{{ $t('landing.pricing.most_popular') }}</span>
            </div>

            <!-- Tier name -->
            <h3 class="text-xl font-bold mb-2" style="color: var(--text-primary)">
              {{ $t(`landing.pricing.tiers.${tier.key}.name`) }}
            </h3>

            <!-- Price -->
            <div class="flex items-baseline gap-1 mb-2">
              <span class="text-3xl font-bold" style="color: var(--text-primary)">
                {{ $t(`landing.pricing.tiers.${tier.key}.price`) }}
              </span>
              <span v-if="tier.period" class="text-sm" style="color: var(--text-secondary)">
                {{ $t(`landing.pricing.tiers.${tier.key}.period`) }}
              </span>
            </div>

            <!-- Target audience -->
            <p class="text-sm mb-6" style="color: var(--text-secondary)">
              {{ $t(`landing.pricing.tiers.${tier.key}.target`) }}
            </p>

            <!-- Features list -->
            <ul class="space-y-3 mb-8">
              <li
                v-for="(_, fIdx) in tier.features"
                :key="fIdx"
                class="flex items-start gap-2"
              >
                <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">
                  {{ $t(`landing.pricing.tiers.${tier.key}.features.${fIdx}`) }}
                </span>
              </li>
            </ul>

            <!-- CTA button -->
            <router-link
              :to="tier.cta_link"
              class="block w-full text-center py-3 rounded-lg font-semibold transition-all cursor-pointer"
              :class="tier.popular
                ? 'bg-brand-purple hover:bg-brand-purple/90 text-white shadow-lg shadow-brand-purple/25'
                : ''"
              :style="!tier.popular ? 'background-color: var(--surface-3); color: var(--text-primary); border: 1px solid var(--border)' : ''"
            >
              {{ $t(`landing.pricing.tiers.${tier.key}.cta`) }}
            </router-link>
          </div>
        </div>
      </div>

      <p class="text-center text-sm" style="color: var(--text-muted); opacity: 0.7">
        {{ $t('landing.pricing.note') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface PricingTier {
  key: string;
  features: number[];
  popular: boolean;
  period: boolean;
  cta_link: string;
}

const pricingTiers: PricingTier[] = [
  {
    key: 'community',
    features: [0, 1, 2, 3, 4],
    popular: false,
    period: false,
    cta_link: '/register',
  },
  {
    key: 'pro',
    features: [0, 1, 2, 3, 4, 5, 6],
    popular: true,
    period: true,
    cta_link: '/register',
  },
  {
    key: 'enterprise',
    features: [0, 1, 2, 3, 4, 5, 6, 7],
    popular: false,
    period: false,
    cta_link: '/register',
  },
];
</script>
