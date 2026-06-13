<template>
  <div class="audit-trail">
    <header class="audit-header">
      <h3 class="audit-title">{{ t('title') }}</h3>

      <div class="audit-filters">
        <input
          v-model="typeFilter"
          type="search"
          class="audit-input"
          :placeholder="t('filterTypePlaceholder')"
          :aria-label="t('filterType')"
        />
        <select v-model="periodFilter" class="audit-select" :aria-label="t('period')">
          <option value="all">{{ t('periodAll') }}</option>
          <option value="24h">{{ t('period24h') }}</option>
          <option value="7d">{{ t('period7d') }}</option>
          <option value="30d">{{ t('period30d') }}</option>
        </select>
      </div>
    </header>

    <div v-if="error" class="audit-state audit-state--error">{{ error }}</div>
    <div v-else-if="isLoading && entries.length === 0" class="audit-state">{{ t('loading') }}</div>
    <div v-else-if="entries.length === 0" class="audit-state">{{ t('empty') }}</div>

    <div v-else class="audit-table-wrap">
      <table class="audit-table">
        <thead>
          <tr>
            <th class="col-type">{{ t('colType') }}</th>
            <th class="col-actor">{{ t('colActor') }}</th>
            <th class="col-details">{{ t('colDetails') }}</th>
            <th class="col-date">{{ t('colDate') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td class="col-type">
              <span class="type-badge">
                <span class="type-dot" :style="dotStyle(entry.color)" />
                {{ entry.type }}
              </span>
            </td>
            <td class="col-actor">
              <span :class="['actor', { 'actor--system': !entry.instance_id }]">
                {{ entry.instance_id || t('actorSystem') }}
              </span>
            </td>
            <td class="col-details">
              <span class="details" :title="entry.message || formatDetails(entry.details)">
                {{ entry.message || formatDetails(entry.details) || '—' }}
              </span>
            </td>
            <td class="col-date">
              <time :datetime="entry.created_at || undefined" :title="entry.created_at || ''">
                {{ entry.created_at_human || '—' }}
              </time>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer v-if="pagination.total > 0" class="audit-pagination">
      <span class="audit-count">
        {{ t('total', { count: pagination.total }) }}
      </span>
      <div class="audit-pager">
        <button
          type="button"
          class="pager-btn"
          :disabled="pagination.current_page <= 1 || isLoading"
          @click="goToPage(pagination.current_page - 1)"
        >
          {{ t('prev') }}
        </button>
        <span class="pager-page">
          {{ t('pageOf', { current: pagination.current_page, last: pagination.last_page }) }}
        </span>
        <button
          type="button"
          class="pager-btn"
          :disabled="pagination.current_page >= pagination.last_page || isLoading"
          @click="goToPage(pagination.current_page + 1)"
        >
          {{ t('next') }}
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuditStore } from '@/stores/audit';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

// Component-local translations (Composition API local scope), locale inherited
// from the global i18n instance — no shared-locale edits.
const { t } = useI18n({
  useScope: 'local',
  messages: {
    en: {
      title: 'Audit trail',
      filterType: 'Filter by type',
      filterTypePlaceholder: 'Filter by type…',
      period: 'Period',
      periodAll: 'All time',
      period24h: 'Last 24h',
      period7d: 'Last 7 days',
      period30d: 'Last 30 days',
      colType: 'Type',
      colActor: 'Actor',
      colDetails: 'Details',
      colDate: 'When',
      actorSystem: 'System',
      empty: 'No audit entry matches these filters.',
      loading: 'Loading…',
      total: '{count} entries',
      prev: 'Previous',
      next: 'Next',
      pageOf: 'Page {current} of {last}',
    },
    fr: {
      title: "Piste d'audit",
      filterType: 'Filtrer par type',
      filterTypePlaceholder: 'Filtrer par type…',
      period: 'Période',
      periodAll: 'Tout',
      period24h: 'Dernières 24h',
      period7d: '7 derniers jours',
      period30d: '30 derniers jours',
      colType: 'Type',
      colActor: 'Acteur',
      colDetails: 'Détails',
      colDate: 'Quand',
      actorSystem: 'Système',
      empty: "Aucune entrée d'audit ne correspond à ces filtres.",
      loading: 'Chargement…',
      total: '{count} entrées',
      prev: 'Précédent',
      next: 'Suivant',
      pageOf: 'Page {current} sur {last}',
    },
  },
});

const auditStore = useAuditStore();
const entries = computed(() => auditStore.entries);
const pagination = computed(() => auditStore.pagination);
const isLoading = computed(() => auditStore.isLoading);
const error = computed(() => auditStore.error);

const typeFilter = ref('');
const periodFilter = ref<'all' | '24h' | '7d' | '30d'>('all');

const PERIOD_MS: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/** Resolve the `from` ISO timestamp for the selected period (full timestamp,
 * not a date-only string — safe to use toISOString here). */
const fromTimestamp = computed<string | undefined>(() => {
  const span = PERIOD_MS[periodFilter.value];
  if (!span) return undefined;
  return new Date(Date.now() - span).toISOString();
});

function load(page = 1): void {
  void auditStore.fetchAudit(props.projectId, {
    page,
    type: typeFilter.value.trim() || undefined,
    from: fromTimestamp.value,
  });
}

function goToPage(page: number): void {
  if (page < 1 || page > pagination.value.last_page) return;
  load(page);
}

function dotStyle(color: string | null): Record<string, string> {
  // entry.color may be a CSS color or token; fall back to the brand accent.
  return { backgroundColor: color || 'var(--accent-purple, #a855f7)' };
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details || typeof details !== 'object') return '';
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${stringifyValue(value)}`)
    .join(' · ');
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Debounced reload on filter change (type input is keystroke-heavy).
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch([typeFilter, periodFilter], () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => load(1), 300);
});

// Reload from scratch when the bound project changes.
watch(
  () => props.projectId,
  () => {
    auditStore.reset();
    load(1);
  },
);

onMounted(() => load(1));

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<style scoped>
.audit-trail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.audit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.audit-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary, #e5e7eb);
}

.audit-filters {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.audit-input,
.audit-select {
  padding: 0.35rem 0.55rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  background: var(--bg-card, var(--surface-2, #24283b));
  color: var(--text-primary, #e5e7eb);
  font-size: 0.8rem;
}

.audit-input:focus-visible,
.audit-select:focus-visible {
  outline: 2px solid var(--accent-purple, #a855f7);
  outline-offset: 1px;
}

.audit-state {
  padding: 1.25rem 0.75rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary, #9ca3af);
}

.audit-state--error {
  color: var(--color-error, #ef4444);
}

.audit-table-wrap {
  overflow-x: auto;
  min-height: 0;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.audit-table th {
  text-align: left;
  padding: 0.5rem 0.6rem;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted, #6b7280);
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  white-space: nowrap;
}

.audit-table td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, #ffffff) 6%, transparent);
  color: var(--text-secondary, #cbd5e1);
  vertical-align: top;
}

.audit-table tbody tr:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.03));
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.78rem;
  color: var(--text-primary, #e5e7eb);
  white-space: nowrap;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.actor {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.76rem;
}

.actor--system {
  color: var(--text-muted, #6b7280);
  font-style: italic;
}

.col-details .details {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 36rem;
}

.col-date time {
  white-space: nowrap;
  color: var(--text-muted, #9ca3af);
}

.audit-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

.audit-count {
  font-size: 0.78rem;
  color: var(--text-muted, #9ca3af);
}

.audit-pager {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.pager-btn {
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  background: var(--bg-card, var(--surface-2, #24283b));
  color: var(--text-primary, #e5e7eb);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pager-btn:not(:disabled):hover {
  border-color: var(--accent-purple, #a855f7);
  color: var(--accent-purple, #a855f7);
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pager-page {
  font-size: 0.78rem;
  color: var(--text-secondary, #9ca3af);
}
</style>
