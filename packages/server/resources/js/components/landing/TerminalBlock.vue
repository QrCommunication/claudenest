<template>
  <div class="terminal-block" :class="{ 'animate-terminal-glow': glow }">
    <!-- Terminal Header -->
    <div class="terminal-header">
      <div class="flex gap-1.5">
        <div class="terminal-dot terminal-dot--red"></div>
        <div class="terminal-dot terminal-dot--yellow"></div>
        <div class="terminal-dot terminal-dot--green"></div>
      </div>
      <span
        v-if="filename"
        class="text-sm font-mono ml-2"
        style="color: var(--text-muted)"
      >
        {{ filename }}
      </span>
    </div>
    <!-- Terminal Content -->
    <div class="terminal-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  filename?: string;
  glow?: boolean;
}

withDefaults(defineProps<Props>(), {
  filename: '',
  glow: false,
});
</script>
