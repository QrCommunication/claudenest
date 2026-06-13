<template>
  <div class="project-tabs">
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="$emit('change', tab.id)"
      >
        <component :is="tab.icon" v-if="tab.icon" class="tab-icon" />
        <span>{{ tab.label }}</span>
        <span v-if="tab.count !== undefined" class="tab-badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Filtres contextuels selon l'onglet actif -->
    <div v-if="showFilters" class="tabs-filters">
      <slot name="filters" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  showFilters?: boolean;
}

withDefaults(defineProps<Props>(), {
  showFilters: false,
});

defineEmits<{
  change: [tabId: string];
}>();
</script>

<style scoped>
.project-tabs {
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  background: var(--bg-card, #24283b);
}

.tabs-container {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  white-space: nowrap;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  user-select: none;
}

.tab-item:hover {
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  background: var(--bg-hover);
}

.tab-item.active {
  color: var(--accent-purple, #a855f7);
  border-bottom-color: var(--accent-purple, #a855f7);
}

.tab-badge {
  font-size: 0.6875rem;
  background: var(--bg-hover);
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
  font-variant-numeric: tabular-nums;
}

.tab-item.active .tab-badge {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
}

.tab-icon {
  width: 1rem;
  height: 1rem;
}

.tabs-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--border-color);
}
</style>
