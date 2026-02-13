<template>
  <div class="text-center" :class="marginClass">
    <!-- Code comment prefix -->
    <p v-if="comment" class="code-comment mb-3">// {{ comment }}</p>
    <!-- Badge -->
    <p
      v-if="badge"
      class="text-sm font-semibold uppercase tracking-wider mb-3"
      :style="{ color: badgeColor }"
    >
      {{ badge }}
    </p>
    <!-- Title -->
    <h2
      class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
      style="color: var(--text-primary)"
    >
      <slot name="title" />
      <span v-if="$slots.highlight" class="gradient-text">
        <slot name="highlight" />
      </span>
    </h2>
    <!-- Subtitle -->
    <p
      v-if="$slots.subtitle"
      class="text-lg max-w-2xl mx-auto"
      style="color: var(--text-secondary)"
    >
      <slot name="subtitle" />
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  comment?: string;
  badge?: string;
  badgeColor?: string;
  marginClass?: string;
}

withDefaults(defineProps<Props>(), {
  comment: '',
  badge: '',
  badgeColor: '#a855f7',
  marginClass: 'mb-16',
});
</script>
