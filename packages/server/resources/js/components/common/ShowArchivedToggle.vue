<template>
  <!--
    ShowArchivedToggle — reusable "Actifs / Archivés" tablist switch.

    Backs the archive parity work across the SPA boards (epics, sprints, tasks,
    projects). Stores expose a `showArchived: boolean`, so the component keeps a
    clean v-model boolean API for callers while owning the accessible pill look
    (tablist/tab roles, the readable accent-tinted active state, optional count
    badges). Labels default to French (the project language) but stay
    overridable so the i18n pass can feed translated strings from the consumer.
  -->
  <div class="archive-toggle" role="tablist" :aria-label="ariaLabel ?? archivedLabel">
    <button
      type="button"
      class="archive-toggle-btn"
      :class="{ active: !modelValue }"
      role="tab"
      :aria-selected="!modelValue"
      @click="select(false)"
    >
      {{ activeLabel }}
      <span v-if="activeCount != null" class="archive-toggle-count">{{ activeCount }}</span>
    </button>
    <button
      type="button"
      class="archive-toggle-btn"
      :class="{ active: modelValue }"
      role="tab"
      :aria-selected="modelValue"
      @click="select(true)"
    >
      {{ archivedLabel }}
      <span v-if="archivedCount != null" class="archive-toggle-count">{{ archivedCount }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Current state: `true` shows the archived view, `false` the active one. */
  modelValue: boolean;
  /** Label for the active segment. */
  activeLabel?: string;
  /** Label for the archived segment. */
  archivedLabel?: string;
  /** Accessible label for the tablist (defaults to the archived label). */
  ariaLabel?: string;
  /** Optional count badge on the active segment. */
  activeCount?: number;
  /** Optional count badge on the archived segment. */
  archivedCount?: number;
}

withDefaults(defineProps<Props>(), {
  activeLabel: 'Actifs',
  archivedLabel: 'Archivés',
  ariaLabel: undefined,
  activeCount: undefined,
  archivedCount: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [showArchived: boolean];
}>();

function select(showArchived: boolean): void {
  emit('update:modelValue', showArchived);
}
</script>

<style scoped>
.archive-toggle {
  display: inline-flex;
  border: 1px solid color-mix(in srgb, var(--accent-purple) 25%, transparent);
  border-radius: 0.375rem;
  overflow: hidden;
}

.archive-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.18rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  transition: color 0.15s, background-color 0.15s;
}
.archive-toggle-btn:hover {
  color: var(--text-secondary);
}
.archive-toggle-btn.active {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 14%, transparent);
}
.archive-toggle-btn:focus-visible {
  outline: 2px solid var(--accent-purple);
  outline-offset: -2px;
}

.archive-toggle-count {
  font-variant-numeric: tabular-nums;
  font-size: 0.62rem;
  line-height: 1;
  padding: 0.08rem 0.28rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-muted) 22%, transparent);
  color: inherit;
}
.archive-toggle-btn.active .archive-toggle-count {
  background: color-mix(in srgb, var(--accent-purple) 22%, transparent);
}
</style>
