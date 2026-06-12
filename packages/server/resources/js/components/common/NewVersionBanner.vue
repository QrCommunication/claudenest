<template>
  <Teleport to="body">
    <Transition name="nvb">
      <div
        v-if="visible"
        class="nvb"
        role="status"
        aria-live="polite"
      >
        <span class="nvb-dot" aria-hidden="true" />

        <p class="nvb-message">{{ t('common.newVersion.message') }}</p>

        <button
          type="button"
          class="nvb-reload"
          @click="reload"
        >
          {{ t('common.newVersion.reload') }}
        </button>

        <button
          type="button"
          class="nvb-close"
          :aria-label="t('common.close')"
          @click="dismiss"
        >
          <svg class="nvb-close-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVersionCheck } from '@/composables/useVersionCheck';

const { t } = useI18n();
const { newVersionAvailable, dismissed, dismiss } = useVersionCheck();

const visible = computed(() => newVersionAvailable.value && !dismissed.value);

const reload = (): void => {
  window.location.reload();
};
</script>

<style scoped>
.nvb {
  position: fixed;
  bottom: 2.75rem; /* clears the 28px IDE status bar */
  right: 1rem;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 26rem;
  padding: 0.75rem 0.875rem;
  background-color: var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 35%, var(--border-color));
  border-left: 3px solid var(--accent-purple);
  border-radius: 0.625rem;
  box-shadow: var(--shadow-lg), var(--shadow-purple);
}

.nvb-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: var(--accent-purple);
  animation: nvb-pulse 2s ease-in-out infinite;
}

.nvb-message {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--text-primary);
}

.nvb-reload {
  flex-shrink: 0;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--accent-purple);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.nvb-reload:hover {
  background-color: color-mix(in srgb, var(--accent-purple) 85%, #000000);
}

.nvb-reload:active {
  transform: scale(0.97);
}

.nvb-reload:focus-visible,
.nvb-close:focus-visible {
  outline: 2px solid var(--accent-purple);
  outline-offset: 2px;
}

.nvb-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.nvb-close:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.nvb-close-icon {
  width: 1rem;
  height: 1rem;
}

@keyframes nvb-pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-purple) 40%, transparent);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 4px transparent;
  }
}

/* Entrance / exit */
.nvb-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.nvb-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.nvb-enter-from,
.nvb-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}

@media (prefers-reduced-motion: reduce) {
  .nvb-dot {
    animation: none;
  }

  .nvb-enter-active,
  .nvb-leave-active,
  .nvb-reload {
    transition: none;
  }
}

@media (max-width: 640px) {
  .nvb {
    right: 0.75rem;
    left: 0.75rem;
    max-width: none;
  }
}
</style>
