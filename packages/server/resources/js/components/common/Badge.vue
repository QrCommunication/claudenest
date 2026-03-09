<template>
  <span
    :class="[
      'inline-flex items-center font-medium',
      sizeClasses[size],
      variantClasses[variant],
      className,
    ]"
  >
    <span
      v-if="dot"
      :class="[
        'mr-1.5 h-2 w-2 rounded-full',
        dotClasses[variant],
      ]"
    />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
type BadgeSize = 'sm' | 'md';

interface Props {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  dot: false,
  className: '',
});

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs rounded',
  md: 'px-2.5 py-0.5 text-sm rounded-md',
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-3 text-skin-secondary border border-skin',
  success: 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
  error: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  info: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/20',
  purple: 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-brand-purple/10 dark:text-brand-purple dark:border-brand-purple/20',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-4',
  success: 'bg-green-500 dark:bg-green-400',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  error: 'bg-red-500 dark:bg-red-400',
  info: 'bg-blue-500 dark:bg-brand-cyan',
  purple: 'bg-purple-500 dark:bg-brand-purple',
};
</script>
