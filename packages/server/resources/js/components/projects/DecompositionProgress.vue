<template>
  <div class="decomposition-progress">
    <div class="progress-header">
      <div class="flex items-center gap-2">
        <div class="pulse-dot"></div>
        <span class="text-sm font-medium text-brand-purple">
          {{ $t('projects.decompose.in_progress') }}
        </span>
      </div>
    </div>

    <!-- Terminal-like output viewer -->
    <div ref="outputContainer" class="output-viewer">
      <pre class="output-text">{{ output || $t('projects.decompose.waiting_output') }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

interface Props {
  output: string;
}

const props = defineProps<Props>();

const outputContainer = ref<HTMLElement | null>(null);

// Auto-scroll to bottom when output changes
watch(() => props.output, async () => {
  await nextTick();
  if (outputContainer.value) {
    outputContainer.value.scrollTop = outputContainer.value.scrollHeight;
  }
});
</script>

<style scoped>
.decomposition-progress {
  @apply space-y-3;
}

.progress-header {
  @apply flex items-center justify-between;
}

.pulse-dot {
  @apply w-2 h-2 rounded-full bg-brand-purple;
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.output-viewer {
  @apply bg-dark-1 border border-dark-4 rounded-lg p-4 max-h-[300px] overflow-y-auto;
}

.output-text {
  @apply text-xs text-gray-400 font-mono whitespace-pre-wrap break-words;
}
</style>
