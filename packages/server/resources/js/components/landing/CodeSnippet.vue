<template>
  <div
    class="relative group rounded-lg overflow-hidden"
    style="background-color: var(--code-bg); border: 1px solid var(--border)"
  >
    <!-- Line numbers + code -->
    <div class="flex">
      <div
        v-if="showLineNumbers"
        class="select-none py-4 pl-4 pr-3 text-right"
        style="color: var(--text-muted)"
      >
        <div
          v-for="n in lineCount"
          :key="n"
          class="font-mono text-xs leading-relaxed"
        >
          {{ n }}
        </div>
      </div>
      <pre class="py-4 px-4 overflow-x-auto flex-1"><code
        class="font-mono text-sm leading-relaxed"
        style="color: var(--text-primary)"
      ><slot /></code></pre>
    </div>
    <!-- Copy button -->
    <button
      v-if="copyable"
      class="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      style="background-color: var(--surface-3); color: var(--text-secondary)"
      :title="copied ? 'Copied!' : 'Copy'"
      :aria-label="copied ? 'Copied to clipboard' : 'Copy code to clipboard'"
      @click="copyCode"
    >
      <svg
        v-if="!copied"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      <svg
        v-else
        class="w-4 h-4 text-green-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  showLineNumbers?: boolean;
  copyable?: boolean;
  code?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showLineNumbers: false,
  copyable: true,
  code: '',
});

const copied = ref(false);

const lineCount = computed(() => {
  const content = props.code || '';
  return Math.max(content.split('\n').length, 1);
});

async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Clipboard API not available - silent fallback
  }
}
</script>
