<template>
  <div class="relative" ref="dropdownRef">
    <button
      v-if="mode === 'toggle'"
      @click="toggleTheme"
      :class="[
        'flex items-center justify-center p-2 rounded-lg transition-colors',
        variant === 'ghost'
          ? 'hover:bg-dark-3 text-dark-4 hover:text-white'
          : 'bg-dark-3 border border-dark-4 text-white hover:border-brand-purple/50'
      ]"
      :title="isDark ? $t('settings.preferences.theme_light') : $t('settings.preferences.theme_dark')"
    >
      <!-- Sun icon (light mode) -->
      <svg v-if="isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <!-- Moon icon (dark mode) -->
      <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>

    <button
      v-else
      @click="isOpen = !isOpen"
      :class="[
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
        variant === 'ghost'
          ? 'hover:bg-dark-3 text-dark-4 hover:text-white'
          : 'bg-dark-3 border border-dark-4 text-white hover:border-brand-purple/50'
      ]"
    >
      <component :is="currentThemeIcon" class="w-5 h-5" />
      <span v-if="showLabel" class="text-sm font-medium">{{ currentThemeLabel }}</span>
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
        v-if="isOpen && mode === 'dropdown'"
        class="absolute right-0 mt-2 w-40 bg-dark-2 border border-dark-4 rounded-lg shadow-xl z-50 overflow-hidden"
      >
        <button
          v-for="option in themeOptions"
          :key="option.value"
          @click="selectTheme(option.value)"
          :class="[
            'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors',
            theme === option.value
              ? 'bg-brand-purple/10 text-brand-purple'
              : 'text-dark-4 hover:bg-dark-3 hover:text-white'
          ]"
        >
          <component :is="option.icon" class="w-5 h-5" />
          <span class="text-sm font-medium">{{ option.label }}</span>
          <svg
            v-if="theme === option.value"
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
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/composables/useTheme';

interface Props {
  mode?: 'toggle' | 'dropdown';
  variant?: 'default' | 'ghost';
  showLabel?: boolean;
}

withDefaults(defineProps<Props>(), {
  mode: 'toggle',
  variant: 'ghost',
  showLabel: true,
});

const { t } = useI18n();
const { theme, isDark, setTheme, toggleTheme } = useTheme();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// Icon components
const SunIcon = {
  render() {
    return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
      })
    ]);
  }
};

const MoonIcon = {
  render() {
    return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
      })
    ]);
  }
};

const ComputerIcon = {
  render() {
    return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
      })
    ]);
  }
};

const themeOptions = computed(() => [
  { value: 'light' as const, label: t('settings.preferences.theme_light'), icon: SunIcon },
  { value: 'dark' as const, label: t('settings.preferences.theme_dark'), icon: MoonIcon },
  { value: 'system' as const, label: t('settings.preferences.theme_system'), icon: ComputerIcon },
]);

const currentThemeIcon = computed(() => {
  if (theme.value === 'system') return ComputerIcon;
  return isDark.value ? MoonIcon : SunIcon;
});

const currentThemeLabel = computed(() => {
  const option = themeOptions.value.find(o => o.value === theme.value);
  return option?.label || '';
});

const selectTheme = (value: 'light' | 'dark' | 'system') => {
  setTheme(value);
  isOpen.value = false;
};

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
