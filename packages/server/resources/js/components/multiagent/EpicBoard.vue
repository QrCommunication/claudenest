<template>
  <div class="epic-board">
    <!-- Header : titre + bascule Actifs/Archivés + bouton d'ajout -->
    <div class="epic-board-header">
      <h3 class="epic-board-title">{{ t('multiagentEpicboard.epics') }}</h3>
      <div class="epic-header-actions">
        <!-- Bascule Actifs / Archivés (l'archivage est réversible côté backend) -->
        <div class="archive-toggle" role="tablist" :aria-label="t('multiagentEpicboard.archived')">
          <button
            type="button"
            class="archive-toggle-btn"
            :class="{ active: !showArchived }"
            role="tab"
            :aria-selected="!showArchived"
            @click="$emit('toggle-archived', false)"
          >
            {{ t('multiagentEpicboard.active') }}
          </button>
          <button
            type="button"
            class="archive-toggle-btn"
            :class="{ active: showArchived }"
            role="tab"
            :aria-selected="showArchived"
            @click="$emit('toggle-archived', true)"
          >
            {{ t('multiagentEpicboard.archived') }}
          </button>
        </div>
        <!-- Création réservée à la vue active (on ne crée pas un épic archivé) -->
        <button
          v-if="!showArchived"
          class="add-epic-btn"
          :title="t('multiagentEpicboard.createFirstEpic')"
          @click="$emit('create')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Liste des épics -->
    <div class="epic-list">
      <div
        v-for="epic in sortedEpics"
        :key="epic.id"
        class="epic-card"
        :class="{ selected: selectedEpicId === epic.id, 'is-done': epic.status === 'done' }"
        :style="{ '--epic-color': epic.color || 'var(--accent-purple)' }"
        @click="$emit('select', epic)"
      >
        <!-- Bandeau de couleur (côté gauche) -->
        <span class="epic-band" aria-hidden="true" />

        <div class="epic-body">
          <!-- Ligne titre : icône + titre + statut -->
          <div class="epic-header">
            <span class="epic-icon">
              <template v-if="isGlyph(epic.icon)">{{ epic.icon }}</template>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h12v2H3v-2z" /></svg>
            </span>
            <span class="epic-title">{{ epic.title }}</span>
            <!-- Badge d'état de décomposition IA (caché pour idle/null) -->
            <span
              v-if="showDecomposition(epic.decomposition_status)"
              class="deco-badge"
              :class="`deco-${epic.decomposition_status}`"
              :title="decompositionTitle(epic)"
              role="status"
            >
              <span
                v-if="epic.decomposition_status === 'pending' || epic.decomposition_status === 'running'"
                class="deco-spinner"
                aria-hidden="true"
              />
              {{ t(`multiagentEpicboard.${DECO_LABEL_KEYS[epic.decomposition_status!]}`) }}
            </span>
            <StatusBadge type="status" :value="epic.status" />
            <!-- Archiver (vue active) / Restaurer (vue archivée) — réversible -->
            <button
              v-if="!showArchived"
              class="epic-archive"
              :title="t('multiagentEpicboard.archiveEpic')"
              :aria-label="t('multiagentEpicboard.archiveEpic')"
              @click.stop="$emit('archive', epic.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
            </button>
            <button
              v-else
              class="epic-archive"
              :title="t('multiagentEpicboard.unarchiveEpic')"
              :aria-label="t('multiagentEpicboard.unarchiveEpic')"
              @click.stop="$emit('unarchive', epic.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><path d="M12 18v-6m0 0-2.5 2.5M12 12l2.5 2.5" /></svg>
            </button>
            <button
              v-if="!showArchived"
              class="epic-delete"
              :title="t('multiagentEpicboard.deleteEpic')"
              :aria-label="t('multiagentEpicboard.deleteEpic')"
              @click.stop="$emit('delete', epic.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            </button>
          </div>

          <!-- Barre de progression -->
          <div class="epic-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: clampPercent(epic.progress_percentage) + '%' }"
              />
            </div>
            <span class="progress-percent">{{ Math.round(clampPercent(epic.progress_percentage)) }}%</span>
          </div>

          <!-- Méta : compteur de tâches + priorité -->
          <div class="epic-meta">
            <span class="task-count">
              <svg viewBox="0 0 24 24" fill="currentColor" class="task-count-icon"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              {{ epic.completed_tasks_count }}/{{ epic.tasks_count }} {{ t('multiagentEpicboard.tasks') }}
            </span>
            <StatusBadge type="priority" :value="epic.priority" />
          </div>

          <!-- Action pull request — surface à 100 % (moved from SprintBoard) -->
          <div v-if="epic.has_pull_request || isComplete(epic)" class="epic-pr">
            <!-- PR ouverte : lien direct + état -->
            <a
              v-if="epic.has_pull_request && epic.pr_url"
              :href="epic.pr_url"
              target="_blank"
              rel="noopener noreferrer"
              class="epic-pr-link"
              :class="`pr-${epic.pr_state ?? 'open'}`"
              :title="t('multiagentEpicboard.viewPrTitle')"
              @click.stop
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" /></svg>
              {{ epic.pr_number ? t('multiagentEpicboard.viewPrNumbered', { number: epic.pr_number }) : t('multiagentEpicboard.viewPr') }}
              <span class="pr-state">{{ t(`multiagentEpicboard.${PR_STATE_LABEL_KEYS[epic.pr_state ?? 'open']}`) }}</span>
            </a>

            <!-- Sinon : bouton de génération (désactivé pendant le dispatch).
                 Masqué une fois l'epic shippé (pr_done) — sa PR est mergée,
                 plus rien à (re)générer. -->
            <button
              v-else-if="!epic.pr_done"
              type="button"
              class="epic-pr-btn"
              :disabled="isFinalizing(epic)"
              :title="t('multiagentEpicboard.generatePrTitle')"
              @click.stop="$emit('finalize', epic.id)"
            >
              <span v-if="isFinalizing(epic)" class="epic-pr-spinner" aria-hidden="true" />
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" /></svg>
              {{ isFinalizing(epic) ? t('multiagentEpicboard.generatingPr') : t('multiagentEpicboard.generatePr') }}
            </button>

            <!-- Shipped: pr_done but no live PR link to render — show the
                 merged/shipped marker so the state is never blank. -->
            <span
              v-else
              class="epic-pr-shipped"
              :title="t('multiagentEpicboard.prShippedTitle')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M20 6 9 17l-5-5" /></svg>
              {{ t('multiagentEpicboard.prShipped') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="epics.length === 0" class="epic-empty">
        <p class="epic-empty-text">
          {{ showArchived ? t('multiagentEpicboard.noArchivedEpics') : t('multiagentEpicboard.noEpicsYet') }}
        </p>
        <button v-if="!showArchived" class="epic-empty-btn" @click="$emit('create')">
          {{ t('multiagentEpicboard.createFirstEpic') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StatusBadge from '@/components/common/StatusBadge.vue';
import type { DecompositionStatus, Epic, EpicPrState } from '@/types/multiagent';

const { t } = useI18n();

interface Props {
  epics: Epic[];
  selectedEpicId?: string;
  /** Archived view: swaps the create/delete affordances for an unarchive one. */
  showArchived?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedEpicId: '',
  showArchived: false,
});

defineEmits<{
  select: [epic: Epic];
  create: [];
  update: [epicId: string, data: Partial<Epic>];
  delete: [epicId: string];
  finalize: [epicId: string];
  archive: [epicId: string];
  unarchive: [epicId: string];
  'toggle-archived': [archived: boolean];
}>();

const sortedEpics = computed(() =>
  [...props.epics].sort((a, b) => a.sort_order - b.sort_order)
);

const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, value ?? 0));

// The epic `icon` field stores a name (e.g. "layers") for generated epics —
// rendering it as text shows "layers". Only render it as a glyph when it is an
// actual symbol/emoji (non-identifier); otherwise fall back to the SVG.
const isGlyph = (icon?: string | null): boolean =>
  !!icon && !/^[a-z0-9_-]+$/i.test(icon);

// Decomposition states that warrant a visible badge. `idle`/null (manual epic,
// never decomposed) stays badge-less to keep the card clean.
const DECO_VISIBLE: DecompositionStatus[] = ['pending', 'running', 'completed', 'failed'];

const DECO_LABEL_KEYS: Record<DecompositionStatus, string> = {
  idle: 'decompositionReady', // unused (idle is never shown) — keeps the map total
  pending: 'decompositionPending',
  running: 'decompositionRunning',
  completed: 'decompositionReady',
  failed: 'decompositionFailed',
};

const showDecomposition = (status: DecompositionStatus | null): boolean =>
  !!status && DECO_VISIBLE.includes(status);

// ── Pull request (finalize flow) ────────────────────────────────────────────
// Label key per PR state — mirrors the backend Epic::PR_STATES.
const PR_STATE_LABEL_KEYS: Record<EpicPrState, string> = {
  open: 'prStateOpen',
  merged: 'prStateMerged',
  closed: 'prStateClosed',
};

// A 100%-complete epic (every task done) can open its PR — mirrors the backend
// finalize guard (tasks_count > 0 && progress_percentage >= 100).
const isComplete = (epic: Epic): boolean =>
  epic.tasks_count > 0 && clampPercent(epic.progress_percentage) >= 100;

// Finalize was requested (finalized_at stamped) but the agent hasn't reported
// the opened PR yet (no pr_url) — keep the button busy/disabled in the meantime.
const isFinalizing = (epic: Epic): boolean =>
  !!epic.finalized_at && !epic.has_pull_request;

// `failed` surfaces the backend reason as a tooltip; the other states reuse the
// badge label as its own title.
const decompositionTitle = (epic: Epic): string => {
  if (epic.decomposition_status === 'failed' && epic.decomposition_error) {
    return t('multiagentEpicboard.decompositionFailedTitle', { error: epic.decomposition_error });
  }
  const status = epic.decomposition_status;
  return status ? t(`multiagentEpicboard.${DECO_LABEL_KEYS[status]}`) : '';
};
</script>

<style scoped>
.epic-board {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.epic-board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.epic-board-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.epic-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Bascule Actifs / Archivés */
.archive-toggle {
  display: inline-flex;
  border: 1px solid color-mix(in srgb, var(--accent-purple) 25%, transparent);
  border-radius: 0.375rem;
  overflow: hidden;
}

.archive-toggle-btn {
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

.add-epic-btn {
  color: var(--text-muted);
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: color 0.15s, background-color 0.15s;
}
.add-epic-btn:hover {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 12%, transparent);
}

.epic-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

/* ====================== CARTE EPIC ====================== */

.epic-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.epic-card:hover {
  border-color: color-mix(in srgb, var(--epic-color) 45%, var(--border-color));
  background: color-mix(in srgb, var(--epic-color) 5%, var(--bg-card));
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.epic-card.selected {
  border-color: var(--epic-color);
  background: color-mix(in srgb, var(--epic-color) 10%, var(--bg-card));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--epic-color) 40%, transparent);
}
.epic-card.is-done {
  opacity: 0.78;
}

/* Bandeau de couleur sur le bord gauche */
.epic-band {
  width: 4px;
  flex-shrink: 0;
  background: var(--epic-color);
}

.epic-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
}

/* ----- Ligne titre ----- */
.epic-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.epic-archive {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted, #8b8ca0);
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}
.epic-card:hover .epic-archive {
  opacity: 1;
}
.epic-archive:hover {
  color: var(--accent-cyan, #22d3ee);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 12%, transparent);
}

.epic-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted, #8b8ca0);
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}
.epic-card:hover .epic-delete {
  opacity: 1;
}
.epic-delete:hover {
  color: var(--color-error, #ef4444);
  background: color-mix(in srgb, var(--color-error, #ef4444) 12%, transparent);
}

.epic-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1;
  color: var(--epic-color);
  background: color-mix(in srgb, var(--epic-color) 16%, transparent);
}
.epic-icon svg {
  width: 0.875rem;
  height: 0.875rem;
}

.epic-title {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ----- Badge de décomposition IA ----- */
.deco-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  padding: 0.0625rem 0.4rem;
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}
.deco-pending {
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--text-muted) 18%, transparent);
}
.deco-running {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 14%, transparent);
}
.deco-completed {
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 14%, transparent);
}
.deco-failed {
  color: var(--color-error, #ef4444);
  background: color-mix(in srgb, var(--color-error, #ef4444) 14%, transparent);
}

.deco-spinner {
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  animation: deco-spin 0.7s linear infinite;
}
@keyframes deco-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .deco-spinner {
    animation: none;
  }
}

/* ----- Barre de progression ----- */
.epic-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 0.375rem;
  background: color-mix(in srgb, var(--text-muted) 22%, transparent);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--epic-color);
  transition: width 0.4s ease;
}

.progress-percent {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 2.25rem;
  text-align: right;
}

/* ----- Méta ----- */
.epic-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.task-count {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.task-count-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--status-success);
}

/* ----- Action pull request ----- */
.epic-pr {
  display: flex;
  align-items: center;
}

.epic-pr-btn,
.epic-pr-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--epic-color) 40%, var(--border-color));
  background: color-mix(in srgb, var(--epic-color) 10%, transparent);
  color: var(--epic-color);
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}
.epic-pr-btn:hover:not(:disabled),
.epic-pr-link:hover {
  background: color-mix(in srgb, var(--epic-color) 18%, transparent);
  border-color: var(--epic-color);
}
.epic-pr-btn:disabled {
  cursor: progress;
  opacity: 0.7;
}
.epic-pr-link {
  text-decoration: none;
}

.pr-state {
  padding: 0 0.35rem;
  border-radius: 999px;
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.epic-pr-link.pr-open .pr-state {
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 16%, transparent);
}
.epic-pr-link.pr-merged .pr-state {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 16%, transparent);
}
.epic-pr-link.pr-closed .pr-state {
  color: var(--color-error, #ef4444);
  background: color-mix(in srgb, var(--color-error, #ef4444) 16%, transparent);
}

.epic-pr-spinner {
  width: 0.6875rem;
  height: 0.6875rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  animation: deco-spin 0.7s linear infinite;
}

.epic-pr-shipped {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 12%, transparent);
  padding: 0.2rem 0.5rem;
  border-radius: 0.375rem;
}

/* ----- Empty state ----- */
.epic-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
}
.epic-empty-text {
  font-size: 0.8125rem;
  color: var(--text-muted);
}
.epic-empty-btn {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--accent-purple);
  transition: color 0.15s;
}
.epic-empty-btn:hover {
  color: color-mix(in srgb, var(--accent-purple) 80%, white);
}
</style>
