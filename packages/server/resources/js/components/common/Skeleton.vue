<template>
  <div
    :class="[
      'animate-pulse bg-surface-3 rounded',
      className,
    ]"
    :style="{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }"
  />
</template>

<script setup lang="ts">
interface Props {
  width?: string | number;
  height?: string | number;
  className?: string;
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  className: '',
});
</script>
