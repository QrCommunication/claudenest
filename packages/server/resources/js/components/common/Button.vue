<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="relative inline-flex items-center justify-center font-medium rounded-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[variantClass, sizeClass, block ? 'w-full' : '']"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <svg
        class="animate-spin h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </span>
    <span :class="['inline-flex items-center gap-2', { 'opacity-0': loading }]">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning' | 'error' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
});

defineEmits<{
  click: [event: MouseEvent];
}>();

const variantClass = computed(() => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    success: 'btn-success',
    warning: 'btn-warning',
    error: 'btn-danger',
    info: 'btn-info',
  };
  return variants[props.variant];
});

const sizeClass = computed(() => {
  const sizes: Record<ButtonSize, string> = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };
  return sizes[props.size];
});
</script>

<style scoped>
@reference "../../../css/tailwind.css";

/* Variants */
.btn-primary {
  @apply bg-gradient-to-r from-brand-purple to-brand-indigo text-white;
}
.btn-primary:hover { opacity: 0.9; }

.btn-secondary {
  @apply bg-surface-3 text-skin-primary border border-skin;
}
.btn-secondary:hover { @apply bg-surface-4; }

.btn-danger {
  background-color: var(--status-error, #dc2626);
  color: white;
}
.btn-danger:hover { background-color: color-mix(in srgb, var(--status-error, #dc2626) 85%, #000); }

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  @apply bg-surface-3;
  color: var(--text-primary);
}

.btn-success {
  background-color: var(--status-success, #16a34a);
  color: white;
}
.btn-success:hover { background-color: color-mix(in srgb, var(--status-success, #16a34a) 85%, #000); }

.btn-warning {
  background-color: var(--status-warning, #ca8a04);
  color: white;
}
.btn-warning:hover { background-color: color-mix(in srgb, var(--status-warning, #ca8a04) 85%, #000); }

.btn-info {
  background-color: var(--accent-cyan, #0891b2);
  color: white;
}
.btn-info:hover { background-color: color-mix(in srgb, var(--accent-cyan, #0891b2) 85%, #000); }

/* Sizes */
.btn-sm {
  padding: 6px 12px;
  font-size: 0.8125rem;
}

.btn-md {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
}

/* Active feedback */
button:active:not(:disabled) {
  transform: scale(0.97);
}
</style>
