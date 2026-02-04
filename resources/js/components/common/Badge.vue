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
  default: 'bg-dark-3 text-dark-4 border border-dark-4',
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20',
  purple: 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-dark-4',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
  info: 'bg-brand-cyan',
  purple: 'bg-brand-purple',
};
</script>
