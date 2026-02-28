<template>
  <div
    :class="[
      'bg-surface-2 rounded-card border border-skin transition-all duration-200',
      hoverable ? 'hover:border-brand-purple/50 hover:shadow-lg hover:shadow-brand-purple/10' : '',
      className,
    ]"
  >
    <div v-if="$slots.header || title" class="px-6 py-4 border-b border-skin">
      <slot name="header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-skin-primary">{{ title }}</h3>
          <slot name="header-action" />
        </div>
        <p v-if="subtitle" class="mt-1 text-sm text-skin-secondary">{{ subtitle }}</p>
      </slot>
    </div>
    
    <div :class="['p-6', contentClass]">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-skin">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  subtitle?: string;
  hoverable?: boolean;
  className?: string;
  contentClass?: string;
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  hoverable: false,
  className: '',
  contentClass: '',
});
</script>
