<template>
  <div class="sprint-board">
    <!-- ==================== AUCUN SPRINT ==================== -->
    <div v-if="sortedSprints.length === 0" class="no-sprint">
      <svg class="no-sprint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <p class="no-sprint-text">{{ t('multiagentSprintboard.noActiveSprint') }}</p>
      <button class="start-sprint-btn" @click="$emit('create-sprint')">
        {{ t('multiagentSprintboard.startNewSprint') }}
      </button>
    </div>

    <template v-else>
      <!-- ==================== BARRE DE NAVIGATION ==================== -->
      <nav class="sprint-nav" :aria-label="t('multiagentSprintboard.navLabel')">
        <button
          class="nav-arrow"
          :disabled="currentIndex <= 0"
          :title="t('multiagentSprintboard.previousSprint')"
          :aria-label="t('multiagentSprintboard.previousSprint')"
          @click="goPrev"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <div class="nav-selector">
          <select
            v-model="selectedSprintId"
            class="nav-select"
            :aria-label="t('multiagentSprintboard.selectSprint')"
          >
            <option v-for="s in sortedSprints" :key="s.id" :value="s.id">
              {{ s.name }}{{ s.status === 'active' ? ' • ' + t('multiagentSprintboard.activeTag') : '' }}
            </option>
          </select>
          <span class="nav-position">{{ currentIndex + 1 }} / {{ sortedSprints.length }}</span>
        </div>

        <button
          class="nav-arrow"
          :disabled="currentIndex >= sortedSprints.length - 1"
          :title="t('multiagentSprintboard.nextSprint')"
          :aria-label="t('multiagentSprintboard.nextSprint')"
          @click="goNext"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>

        <div class="nav-actions">
          <button
            v-if="selectedSprintSummary?.status === 'active'"
            class="complete-sprint-btn"
            :title="t('multiagentSprintboard.generatePrTitle')"
            :aria-label="t('multiagentSprintboard.generatePrTitle')"
            @click="$emit('complete-sprint')"
          >
            {{ t('multiagentSprintboard.generatePr') }}
          </button>
          <button
            class="create-sprint-btn"
            :title="t('multiagentSprintboard.startNewSprint')"
            :aria-label="t('multiagentSprintboard.startNewSprint')"
            @click="$emit('create-sprint')"
          >
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          </button>
        </div>
      </nav>

      <!-- ==================== SÉLECTEUR NUMÉROTÉ ==================== -->
      <div
        v-if="sortedSprints.length > 1"
        class="sprint-pager"
        role="tablist"
        :aria-label="t('multiagentSprintboard.navLabel')"
      >
        <button
          v-for="(s, i) in sortedSprints"
          :key="s.id"
          type="button"
          class="pager-dot"
          :class="{ 'is-current': s.id === selectedSprintId }"
          role="tab"
          :aria-selected="s.id === selectedSprintId"
          :aria-current="s.id === selectedSprintId ? 'true' : undefined"
          :title="`${t('multiagentSprintboard.goToSprint', { number: i + 1 })} — ${s.name}`"
          :aria-label="t('multiagentSprintboard.goToSprint', { number: i + 1 })"
          @click="selectedSprintId = s.id"
        >
          <span
            class="pager-status"
            :style="{ background: statusColor(s.status) }"
            aria-hidden="true"
          />
          {{ i + 1 }}
        </button>
      </div>

      <!-- ==================== DÉTAIL DU SPRINT SÉLECTIONNÉ ==================== -->
      <div class="sprint-detail-wrap">
        <div v-if="isLoadingDetail && !detail" class="detail-loading">
          <span class="detail-spinner" aria-hidden="true" />
          <span class="detail-loading-text">{{ t('multiagentSprintboard.loadingDetail') }}</span>
        </div>
        <SprintDetail v-else :sprint="detail ?? selectedSprintSummary" />
      </div>

      <!-- ==================== CONTENU ADDITIONNEL (slot) ==================== -->
      <div v-if="$slots.default" class="sprint-body">
        <slot />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSprintsStore } from '@/stores/sprints';
import SprintDetail from '@/components/multiagent/SprintDetail.vue';
import type { Sprint } from '@/types';

const { t } = useI18n();
const store = useSprintsStore();

interface Props {
  /**
   * @deprecated SprintBoard is now self-contained and reads the full sprint
   * list from the sprints store. Kept optional for backward compatibility with
   * existing call sites; ignored.
   */
  sprint?: Sprint | null;
}

defineProps<Props>();

defineEmits<{
  'create-sprint': [];
  'complete-sprint': [];
}>();

/** Full sprint list, workflow order (active sprint surfaced first via sort_order). */
const sortedSprints = computed<Sprint[]>(() =>
  [...store.sprints].sort((a, b) => a.sort_order - b.sort_order)
);

const selectedSprintId = ref<string>('');
const detail = ref<Sprint | null>(null);
const isLoadingDetail = ref(false);

/** Lightweight summary (from the index list) for the currently selected sprint. */
const selectedSprintSummary = computed<Sprint | null>(
  () => sortedSprints.value.find(s => s.id === selectedSprintId.value) ?? null
);

const currentIndex = computed(() =>
  sortedSprints.value.findIndex(s => s.id === selectedSprintId.value)
);

/**
 * Status accent for a numbered pager dot — parity with the mobile
 * sprintStatusDotColor helper (active / completed / cancelled / planning).
 */
function statusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'var(--accent-purple)';
    case 'completed':
      return 'var(--status-success)';
    case 'cancelled':
      return 'var(--status-error)';
    default: // planning
      return 'var(--text-disabled)';
  }
}

function goPrev(): void {
  if (currentIndex.value > 0) {
    selectedSprintId.value = sortedSprints.value[currentIndex.value - 1].id;
  }
}

function goNext(): void {
  if (currentIndex.value < sortedSprints.value.length - 1) {
    selectedSprintId.value = sortedSprints.value[currentIndex.value + 1].id;
  }
}

/**
 * Keep a valid selection as the sprint list changes: default to the active
 * sprint, else the first one. Reset only when the current selection vanishes.
 */
watch(
  sortedSprints,
  list => {
    if (list.length === 0) {
      selectedSprintId.value = '';
      return;
    }
    const stillPresent = list.some(s => s.id === selectedSprintId.value);
    if (!stillPresent) {
      const active = list.find(s => s.status === 'active');
      selectedSprintId.value = active?.id ?? list[0].id;
    }
  },
  { immediate: true }
);

/**
 * Load the full sprint detail (embedded tasks) whenever the selection changes.
 * Falls back to the list summary if the detail fetch fails.
 */
watch(
  selectedSprintId,
  async id => {
    if (!id) {
      detail.value = null;
      return;
    }
    // Show the summary immediately if we don't have a matching detail yet.
    if (detail.value?.id !== id) {
      detail.value = null;
    }
    isLoadingDetail.value = true;
    try {
      detail.value = await store.fetchSprint(id);
    } catch {
      // Keep the summary rendering via the computed fallback in the template.
      detail.value = null;
    } finally {
      isLoadingDetail.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.sprint-board {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ==================== NAVIGATION ==================== */
.sprint-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.nav-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.nav-arrow svg {
  width: 1rem;
  height: 1rem;
}
.nav-arrow:hover:not(:disabled) {
  color: var(--accent-purple);
  border-color: color-mix(in srgb, var(--accent-purple) 40%, var(--border-color));
  background: color-mix(in srgb, var(--accent-purple) 8%, var(--bg-secondary));
}
.nav-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.nav-select {
  flex: 1;
  min-width: 0;
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  appearance: none;
  text-overflow: ellipsis;
}
.nav-select:focus {
  outline: none;
  border-color: var(--accent-purple);
}

.nav-position {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.complete-sprint-btn {
  padding: 0.3rem 0.625rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.complete-sprint-btn:hover {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 8%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple) 30%, var(--border-color));
}

.create-sprint-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.create-sprint-btn svg {
  width: 1rem;
  height: 1rem;
}
.create-sprint-btn:hover {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 8%, var(--bg-secondary));
  border-color: color-mix(in srgb, var(--accent-purple) 30%, var(--border-color));
}

/* ==================== SÉLECTEUR NUMÉROTÉ ==================== */
.sprint-pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.125rem;
}

.pager-dot {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.pager-dot:hover {
  color: var(--accent-purple);
  border-color: color-mix(in srgb, var(--accent-purple) 40%, var(--border-color));
  background: color-mix(in srgb, var(--accent-purple) 8%, var(--bg-secondary));
}
.pager-dot:focus-visible {
  outline: none;
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-purple) 30%, transparent);
}
.pager-dot.is-current {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 12%, var(--bg-secondary));
  border-color: color-mix(in srgb, var(--accent-purple) 50%, var(--border-color));
}

.pager-status {
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: 999px;
}

/* ==================== DETAIL ==================== */
.sprint-detail-wrap {
  min-height: 0;
}

.detail-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
}
.detail-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid color-mix(in srgb, var(--accent-purple) 25%, transparent);
  border-top-color: var(--accent-purple);
  border-radius: 999px;
  animation: sprint-spin 0.7s linear infinite;
}
.detail-loading-text {
  font-size: 0.78rem;
  color: var(--text-muted);
}
@keyframes sprint-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== NO SPRINT ==================== */
.no-sprint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1.25rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}
.no-sprint-icon {
  width: 32px;
  height: 32px;
  color: var(--text-disabled);
}
.no-sprint-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}
.start-sprint-btn {
  font-size: 0.78rem;
  color: var(--accent-purple);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  transition: background 0.15s;
}
.start-sprint-btn:hover {
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
}

/* ==================== SLOT ==================== */
.sprint-body {
  flex: 1;
  min-height: 0;
}
</style>
