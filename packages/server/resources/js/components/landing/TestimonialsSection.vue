<template>
  <section id="testimonials" class="py-24 px-4 sm:px-6 lg:px-8 relative">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// TESTIMONIALS</p>
        <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">{{ $t('landing.testimonials.badge') }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">
          {{ $t('landing.testimonials.title') }}
          <span class="gradient-text">{{ $t('landing.testimonials.title_highlight') }}</span>
        </h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="(testimonial, idx) in testimonials"
          :key="idx"
          v-motion
          :initial="{ opacity: 0, x: idx === 0 ? -30 : idx === 2 ? 30 : 0, y: idx === 1 ? 30 : 0 }"
          :visibleOnce="{ opacity: 1, x: 0, y: 0, transition: { delay: idx * 150, duration: 500 } }"
          class="landing-card p-6"
        >
          <!-- Quote mark -->
          <svg class="w-8 h-8 text-brand-purple/30 mb-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z"/>
          </svg>
          <p class="leading-relaxed mb-6" style="color: var(--text-primary)">{{ $t(`landing.testimonials.items.${idx}.quote`) }}</p>
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold avatar-glow"
              :class="testimonial.avatarClass"
            >
              {{ testimonial.initials }}
            </div>
            <div>
              <p class="text-sm font-medium" style="color: var(--text-primary)">{{ $t(`landing.testimonials.items.${idx}.name`) }}</p>
              <p class="text-xs" style="color: var(--text-muted)">{{ $t(`landing.testimonials.items.${idx}.role`) }}</p>
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

interface Testimonial {
  initials: string;
  avatarClass: string;
}

const testimonials: Testimonial[] = [
  { initials: 'SM', avatarClass: 'bg-brand-purple/20 text-brand-purple' },
  { initials: 'JK', avatarClass: 'bg-brand-indigo/20 text-brand-indigo' },
  { initials: 'AR', avatarClass: 'bg-brand-cyan/20 text-brand-cyan' },
];
</script>

<style scoped>
.avatar-glow {
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.15);
  transition: box-shadow 0.3s ease;
}

.landing-card:hover .avatar-glow {
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .avatar-glow {
    transition: none;
  }
}
</style>
