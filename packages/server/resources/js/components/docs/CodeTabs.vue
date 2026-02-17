<template>
  <div class="code-tabs">
    <div class="tab-switcher">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-btn"
        :class="{ active: activeTab === index }"
        @click="activeTab = index"
      >
        {{ tab.label }}
      </button>
    </div>
    <CodeBlock
      :code="tabs[activeTab].code"
      :language="tabs[activeTab].language"
      :filename="tabs[activeTab].filename"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from './CodeBlock.vue';

interface Tab {
  label: string;
  language: string;
  code: string;
  filename?: string;
}

interface Props {
  tabs: Tab[];
  defaultTab?: number;
}

const props = withDefaults(defineProps<Props>(), {
  defaultTab: 0,
});

const activeTab = ref(props.defaultTab);
</script>

<style scoped>
.code-tabs {
  margin: 1.5rem 0;
}

.tab-switcher {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-color, var(--border));
  background: var(--bg-code, var(--bg-primary, #0f0f1a));
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}

.tab-btn {
  padding: 0.6rem 1.2rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
}

.tab-btn.active {
  color: var(--accent-purple, #a855f7);
  border-bottom-color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
}

.code-tabs :deep(.code-block) {
  margin-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
