<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      :class="[
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
        variant === 'ghost' 
          ? 'hover:bg-dark-3 text-dark-4 hover:text-white' 
          : 'bg-dark-3 border border-dark-4 text-white hover:border-brand-purple/50'
      ]"
    >
      <span class="text-lg">{{ currentLocale.flag === 'US' ? '🇺🇸' : '🇫🇷' }}</span>
      <span v-if="showLabel" class="text-sm font-medium">{{ currentLocale.name }}</span>
      <svg 
        :class="['w-4 h-4 transition-transform', isOpen ? 'rotate-180' : '']" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-40 bg-dark-2 border border-dark-4 rounded-lg shadow-xl z-50 overflow-hidden"
      >
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          @click="selectLocale(locale.code)"
          :class="[
            'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors',
            locale.code === currentLocaleCode
              ? 'bg-brand-purple/10 text-brand-purple'
              : 'text-dark-4 hover:bg-dark-3 hover:text-white'
          ]"
        >
          <span class="text-lg">{{ locale.flag === 'US' ? '🇺🇸' : '🇫🇷' }}</span>
          <span class="text-sm font-medium">{{ locale.name }}</span>
          <svg
            v-if="locale.code === currentLocaleCode"
            class="w-4 h-4 ml-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLocale, availableLocales, type SupportedLocale } from '@/i18n';

interface Props {
  variant?: 'default' | 'ghost';
  showLabel?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  showLabel: true,
});

const { locale } = useI18n();
const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const currentLocaleCode = computed(() => locale.value as SupportedLocale);

const currentLocale = computed(() => {
  return availableLocales.find(l => l.code === currentLocaleCode.value) || availableLocales[0];
});

const selectLocale = (code: SupportedLocale) => {
  setLocale(code);
  isOpen.value = false;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
