<template>
  <span class="gradient-text" :class="variantClass"><slot /></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'aurora' | 'sunset' | 'ice';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'aurora',
});

const variantClass = computed(() => `variant-${props.variant}`);
</script>

<style scoped>
.gradient-text {
  display: inline;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.variant-primary {
  background-image: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
}

.variant-aurora {
  background-image: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 45%, var(--accent-cyan) 100%);
}

.variant-sunset {
  background-image: linear-gradient(135deg, #f97316 0%, var(--accent-purple) 55%, var(--accent-indigo) 100%);
}

.variant-ice {
  background-image: linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-indigo) 100%);
}
</style>
