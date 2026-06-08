<template>
  <div class="relative inline-block" ref="rootRef">
    <button
      ref="buttonRef"
      type="button"
      @click="toggle"
      :class="[
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
        variant === 'ghost'
          ? 'hover:bg-surface-3 text-skin-secondary hover:text-skin-primary'
          : 'bg-surface-3 border border-skin text-skin-primary hover:border-brand-purple/50'
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

    <!-- Teleported to body so the menu is never clipped by an ancestor with
         overflow:hidden (e.g. the 40px tab bar) and sits above any stacking
         context. Positioned with fixed coords computed from the button rect. -->
    <Teleport to="body">
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
          ref="menuRef"
          class="fixed w-40 bg-surface-2 border border-skin rounded-lg shadow-xl overflow-hidden"
          style="z-index: 9999"
          :style="menuStyle"
        >
          <button
            v-for="locale in availableLocales"
            :key="locale.code"
            type="button"
            @click="selectLocale(locale.code)"
            :class="[
              'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors',
              locale.code === currentLocaleCode
                ? 'bg-brand-purple/10 text-brand-purple'
                : 'text-skin-secondary hover:bg-surface-3 hover:text-skin-primary'
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type CSSProperties } from 'vue';
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
const rootRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuStyle = ref<CSSProperties>({});

const currentLocaleCode = computed(() => locale.value as SupportedLocale);

const currentLocale = computed(() => {
  return availableLocales.find((l) => l.code === currentLocaleCode.value) || availableLocales[0];
});

const positionMenu = (): void => {
  const btn = buttonRef.value;
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  // Right-align the 160px menu under the button, clamped inside the viewport.
  const right = Math.max(8, window.innerWidth - rect.right);
  menuStyle.value = {
    top: `${rect.bottom + 8}px`,
    right: `${right}px`,
  };
};

const open = (): void => {
  positionMenu();
  isOpen.value = true;
};

const close = (): void => {
  isOpen.value = false;
};

const toggle = (): void => {
  if (isOpen.value) {
    close();
  } else {
    open();
  }
};

const selectLocale = (code: SupportedLocale): void => {
  setLocale(code);
  close();
};

// Close when clicking outside both the trigger and the teleported menu.
const handleClickOutside = (event: MouseEvent): void => {
  if (!isOpen.value) return;
  const target = event.target as Node;
  if (rootRef.value?.contains(target)) return;
  if (menuRef.value?.contains(target)) return;
  close();
};

// The menu is fixed-positioned from the button rect, so it would drift on
// scroll/resize — just close it instead of tracking.
const handleViewportChange = (): void => {
  if (isOpen.value) close();
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('scroll', handleViewportChange, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleViewportChange);
  window.removeEventListener('scroll', handleViewportChange, true);
});
</script>
