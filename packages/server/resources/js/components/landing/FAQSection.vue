<template>
  <section id="faq" class="py-24 px-4 sm:px-6 lg:px-8 relative">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// FAQ</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">
          {{ $t('landing.faq.title') }}
          <span class="gradient-text">{{ $t('landing.faq.title_highlight') }}</span>
        </h2>
      </div>

      <div class="space-y-3">
        <div
          v-for="(_, idx) in 8"
          :key="idx"
          v-motion
          :initial="{ opacity: 0, y: 15 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 80, duration: 400 } }"
          class="landing-card overflow-hidden"
          style="transform: none"
        >
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer group"
            @click="toggle(idx)"
            :aria-expanded="openFaqs.has(idx)"
          >
            <span class="flex items-center gap-3 pr-4">
              <span class="font-mono text-brand-purple text-sm">&gt;</span>
              <span class="font-medium group-hover:text-brand-purple transition-colors" style="color: var(--text-primary)">
                {{ $t(`landing.faq.items.${idx}.question`) }}
              </span>
            </span>
            <svg
              class="w-5 h-5 flex-shrink-0 transition-transform duration-200"
              :class="openFaqs.has(idx) ? 'rotate-45' : ''"
              :style="`color: var(--text-muted)`"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-96"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 max-h-96"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-if="openFaqs.has(idx)" class="overflow-hidden">
              <p class="px-6 pb-4 leading-relaxed" style="color: var(--text-secondary)">
                {{ $t(`landing.faq.items.${idx}.answer`) }}
              </p>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const openFaqs = ref<Set<number>>(new Set());

function toggle(idx: number): void {
  const newSet = new Set(openFaqs.value);
  if (newSet.has(idx)) {
    newSet.delete(idx);
  } else {
    newSet.add(idx);
  }
  openFaqs.value = newSet;
}
</script>
