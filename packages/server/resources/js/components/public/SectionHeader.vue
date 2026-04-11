<template>
  <header class="section-header" :class="{ 'is-center': align === 'center' }">
    <span v-if="badge" class="section-badge">
      <span class="section-badge-dot" />
      {{ badge }}
    </span>
    <h2 class="section-title">
      <slot name="title">
        <span>{{ title }}</span>
        <span v-if="highlight" class="section-highlight">{{ highlight }}</span>
      </slot>
    </h2>
    <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
  </header>
</template>

<script setup lang="ts">
interface Props {
  badge?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

withDefaults(defineProps<Props>(), {
  badge: '',
  title: '',
  highlight: '',
  subtitle: '',
  align: 'left',
});
</script>

<style scoped>
.section-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 42rem;
}

.section-header.is-center {
  align-items: center;
  text-align: center;
  margin: 0 auto;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  padding: 0.32rem 0.8rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 24%, transparent);
  border-radius: 999px;
}

.section-header.is-center .section-badge {
  align-self: center;
}

.section-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-purple);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-purple) 18%, transparent);
}

.section-title {
  font-size: clamp(1.9rem, 3.8vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  word-break: normal;
  overflow-wrap: break-word;
  padding-bottom: 0.08em;
}

.section-highlight {
  display: inline;
  background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 45%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-subtitle {
  max-width: 38rem;
  font-size: clamp(1rem, 1.2vw, 1.1rem);
  line-height: 1.65;
  color: var(--text-secondary);
}
</style>
