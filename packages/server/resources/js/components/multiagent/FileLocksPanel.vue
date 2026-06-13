<template>
  <div class="locks-panel">
    <header class="locks-header">
      <h3 class="locks-title">{{ t('title') }}</h3>
      <span class="locks-count">{{ t('activeCount', { count: activeLocks.length }) }}</span>
    </header>

    <!-- Enriched conflict banner (from the detailed 409 acquire response). -->
    <div v-if="conflict" class="conflict-banner" role="alert">
      <div class="conflict-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      </div>
      <div class="conflict-body">
        <p class="conflict-headline">
          {{ t('conflict.headline', { holder: shortId(conflict.holder) }) }}
        </p>
        <ul class="conflict-detail">
          <li>
            {{ t('conflict.holds') }}
            <span class="conflict-tag" :class="`tag--${conflict.holder_lock_type}`">
              {{ t(`lockType.${conflict.holder_lock_type}`) }}
            </span>
            <span class="conflict-range">{{ rangeLabel(conflict.holder_line_range) }}</span>
          </li>
          <li>
            {{ t('conflict.requested') }}
            <span class="conflict-tag" :class="`tag--${conflict.requested_lock_type}`">
              {{ t(`lockType.${conflict.requested_lock_type}`) }}
            </span>
            <span class="conflict-range">{{ rangeLabel(conflict.requested_line_range) }}</span>
          </li>
          <li v-if="conflict.remaining_seconds > 0" class="conflict-expiry">
            {{ t('conflict.frees', { duration: formatDuration(conflict.remaining_seconds) }) }}
          </li>
        </ul>
      </div>
      <button type="button" class="conflict-dismiss" :aria-label="t('conflict.dismiss')" @click="emit('dismiss-conflict')">
        ✕
      </button>
    </div>

    <div v-if="error" class="locks-state locks-state--error">{{ error }}</div>
    <div v-else-if="isLoading && locks.length === 0" class="locks-state">{{ t('loading') }}</div>
    <div v-else-if="activeLocks.length === 0" class="locks-state">{{ t('empty') }}</div>

    <ul v-else class="locks-list">
      <li
        v-for="lock in activeLocks"
        :key="lock.id"
        class="lock-card"
        :class="[`lock-card--${lockTypeOf(lock)}`, { 'lock-card--own': isOwn(lock) }]"
      >
        <div class="lock-card-main">
          <div class="lock-path" :title="lock.path">
            <span class="lock-filename">{{ filename(lock.path) }}</span>
            <span v-if="dirname(lock.path)" class="lock-dirname">{{ dirname(lock.path) }}</span>
          </div>

          <div class="lock-tags">
            <span class="lock-tag" :class="`tag--${lockTypeOf(lock)}`">
              {{ t(`lockType.${lockTypeOf(lock)}`) }}
            </span>
            <span class="lock-tag tag--range">{{ rangeLabel(lock.line_range) }}</span>
            <span v-if="(lock.queue_position ?? 0) > 0" class="lock-tag tag--queue">
              {{ t('queued', { position: lock.queue_position }) }}
            </span>
          </div>
        </div>

        <div class="lock-card-meta">
          <span class="lock-holder" :class="{ 'lock-holder--own': isOwn(lock) }">
            <span class="holder-dot" aria-hidden="true" />
            {{ isOwn(lock) ? t('heldByYou') : t('heldBy', { holder: shortId(lock.locked_by) }) }}
          </span>
          <span v-if="lock.reason" class="lock-reason" :title="lock.reason">{{ lock.reason }}</span>
          <span class="lock-expiry">{{ t('expiresIn', { duration: formatDuration(lock.remaining_seconds) }) }}</span>
        </div>

        <div v-if="showActions" class="lock-actions">
          <button
            v-if="isOwn(lock)"
            type="button"
            class="lock-btn"
            :disabled="pendingPath === lock.path"
            @click="onExtend(lock)"
          >
            {{ t('extend') }}
          </button>
          <button
            v-if="isOwn(lock)"
            type="button"
            class="lock-btn lock-btn--release"
            :disabled="pendingPath === lock.path"
            @click="onRelease(lock)"
          >
            {{ t('release') }}
          </button>
          <button
            v-else-if="canForceUnlock"
            type="button"
            class="lock-btn lock-btn--force"
            :disabled="pendingPath === lock.path"
            @click="onForceRelease(lock)"
          >
            {{ t('forceRelease') }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocksStore } from '@/stores/locks';
import { useToast } from '@/composables/useToast';
import type { FileLock, LockConflict, LockLineRange, LockType } from '@/types/multiagent';

interface Props {
  projectId: string;
  /** The viewing instance — used to flag/own-action locks it holds. */
  currentInstanceId?: string;
  /** Whether the viewer may force-release locks held by other instances. */
  canForceUnlock?: boolean;
  /** Toggle the per-lock action buttons (release/extend/force). */
  showActions?: boolean;
  /** Enriched 409 conflict to surface as a banner (parent passes it on a failed
   *  acquire); cleared via the `dismiss-conflict` event. */
  conflict?: LockConflict | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentInstanceId: '',
  canForceUnlock: false,
  showActions: true,
  conflict: null,
});

const emit = defineEmits<{
  'dismiss-conflict': [];
}>();

// Component-local translations (Composition API local scope) — locale inherited
// from the global i18n instance, no shared-locale edits.
const { t } = useI18n({
  useScope: 'local',
  messages: {
    en: {
      title: 'File locks',
      activeCount: '{count} active',
      loading: 'Loading…',
      empty: 'No active lock on this project.',
      heldBy: 'Held by {holder}',
      heldByYou: 'Held by you',
      expiresIn: 'expires in {duration}',
      queued: 'queued #{position}',
      extend: 'Extend',
      release: 'Release',
      forceRelease: 'Force release',
      released: 'Lock released',
      releaseFailed: 'Failed to release the lock',
      forceReleased: 'Lock force-released',
      forceReleaseFailed: 'Failed to force-release the lock',
      extended: 'Lock extended',
      extendFailed: 'Failed to extend the lock',
      forceConfirm: 'Force-release this lock held by another instance?',
      wholeFile: 'whole file',
      lines: 'lines {start}–{end}',
      lockType: {
        exclusive: 'Exclusive',
        shared: 'Shared',
      },
      conflict: {
        headline: 'Conflict with {holder}',
        holds: 'Holder has a',
        requested: 'You requested a',
        frees: 'frees in {duration}',
        dismiss: 'Dismiss',
      },
    },
    fr: {
      title: 'Verrous de fichiers',
      activeCount: '{count} actif·s',
      loading: 'Chargement…',
      empty: 'Aucun verrou actif sur ce projet.',
      heldBy: 'Détenu par {holder}',
      heldByYou: 'Détenu par vous',
      expiresIn: 'expire dans {duration}',
      queued: 'en file n°{position}',
      extend: 'Prolonger',
      release: 'Libérer',
      forceRelease: 'Forcer la libération',
      released: 'Verrou libéré',
      releaseFailed: 'Échec de la libération du verrou',
      forceReleased: 'Verrou libéré de force',
      forceReleaseFailed: 'Échec de la libération forcée',
      extended: 'Verrou prolongé',
      extendFailed: 'Échec de la prolongation du verrou',
      forceConfirm: "Forcer la libération de ce verrou détenu par une autre instance ?",
      wholeFile: 'fichier entier',
      lines: 'lignes {start}–{end}',
      lockType: {
        exclusive: 'Exclusif',
        shared: 'Partagé',
      },
      conflict: {
        headline: 'Conflit avec {holder}',
        holds: 'Le détenteur a un verrou',
        requested: 'Vous avez demandé un verrou',
        frees: 'libéré dans {duration}',
        dismiss: 'Fermer',
      },
    },
  },
});

const locksStore = useLocksStore();
const toast = useToast();

const locks = computed(() => locksStore.locks);
const activeLocks = computed(() => locksStore.activeLocks);
const isLoading = computed(() => locksStore.isLoading);
const error = computed(() => locksStore.error);

// Path currently mutating — disables that card's actions to avoid double-submit.
const pendingPath = ref<string | null>(null);

/** Treat a missing lock_type as exclusive (fail-closed, mirrors the backend). */
function lockTypeOf(lock: FileLock): LockType {
  return lock.lock_type === 'shared' ? 'shared' : 'exclusive';
}

function isOwn(lock: FileLock): boolean {
  return !!props.currentInstanceId && lock.locked_by === props.currentInstanceId;
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 10)}…` : id;
}

function filename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

function dirname(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.slice(0, idx) : '';
}

function rangeLabel(range: LockLineRange | null | undefined): string {
  if (!range || typeof range.start !== 'number' || typeof range.end !== 'number') {
    return t('wholeFile');
  }
  return t('lines', { start: range.start, end: range.end });
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

async function onRelease(lock: FileLock): Promise<void> {
  pendingPath.value = lock.path;
  try {
    await locksStore.unlockFile(props.projectId, lock.path, lock.locked_by);
    toast.success(t('released'));
  } catch {
    toast.error(t('releaseFailed'));
  } finally {
    pendingPath.value = null;
  }
}

async function onForceRelease(lock: FileLock): Promise<void> {
  if (!window.confirm(t('forceConfirm'))) return;
  pendingPath.value = lock.path;
  try {
    await locksStore.forceUnlock(props.projectId, lock.path);
    toast.success(t('forceReleased'));
  } catch {
    toast.error(t('forceReleaseFailed'));
  } finally {
    pendingPath.value = null;
  }
}

async function onExtend(lock: FileLock): Promise<void> {
  pendingPath.value = lock.path;
  try {
    await locksStore.extendLock(props.projectId, lock.path, lock.locked_by, 30);
    toast.success(t('extended'));
  } catch {
    toast.error(t('extendFailed'));
  } finally {
    pendingPath.value = null;
  }
}

function load(): void {
  if (!props.projectId) return;
  void locksStore.fetchLocks(props.projectId);
}

// Refresh whenever the bound project changes.
watch(() => props.projectId, () => load(), { immediate: true });

onBeforeUnmount(() => {
  locksStore.clearError();
});
</script>

<style scoped>
.locks-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.locks-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.locks-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary, #e5e7eb);
}

.locks-count {
  font-size: 0.78rem;
  color: var(--text-muted, #9ca3af);
}

/* ---- Conflict banner ---- */
.conflict-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-error, #ef4444) 35%, transparent);
  background: color-mix(in srgb, var(--color-error, #ef4444) 10%, transparent);
}

.conflict-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--color-error, #ef4444);
}

.conflict-icon svg {
  width: 18px;
  height: 18px;
}

.conflict-body {
  flex: 1;
  min-width: 0;
}

.conflict-headline {
  margin: 0 0 0.3rem;
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--text-primary, #e5e7eb);
}

.conflict-detail {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: var(--text-secondary, #cbd5e1);
}

.conflict-detail li {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.conflict-range {
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--text-muted, #9ca3af);
  font-size: 0.74rem;
}

.conflict-expiry {
  color: var(--text-muted, #9ca3af);
  font-style: italic;
}

.conflict-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
}

.conflict-dismiss {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0.1rem;
}

.conflict-dismiss:hover {
  color: var(--text-primary, #e5e7eb);
}

/* ---- States ---- */
.locks-state {
  padding: 1.25rem 0.75rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary, #9ca3af);
}

.locks-state--error {
  color: var(--color-error, #ef4444);
}

/* ---- Lock cards ---- */
.locks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
  min-height: 0;
  overflow-y: auto;
}

.lock-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  background: var(--bg-card, var(--surface-2, #24283b));
  border-left-width: 3px;
}

/* Exclusive = writer (amber), shared = reader (cyan), own = brand accent. */
.lock-card--exclusive {
  border-left-color: var(--color-warning, #fbbf24);
}

.lock-card--shared {
  border-left-color: var(--brand-cyan, #22d3ee);
}

.lock-card--own {
  border-left-color: var(--accent-purple, #a855f7);
}

.lock-card-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.lock-path {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.lock-filename {
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--text-primary, #e5e7eb);
  font-family: var(--font-mono, ui-monospace, monospace);
  word-break: break-all;
}

.lock-dirname {
  font-size: 0.7rem;
  color: var(--text-muted, #6b7280);
  font-family: var(--font-mono, ui-monospace, monospace);
  word-break: break-all;
}

.lock-tags {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.lock-tag,
.conflict-tag {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.08rem 0.45rem;
  border-radius: 999px;
  white-space: nowrap;
}

.tag--exclusive {
  background: color-mix(in srgb, var(--color-warning, #fbbf24) 18%, transparent);
  color: var(--color-warning, #fbbf24);
}

.tag--shared {
  background: color-mix(in srgb, var(--brand-cyan, #22d3ee) 18%, transparent);
  color: var(--brand-cyan, #22d3ee);
}

.tag--range {
  background: color-mix(in srgb, var(--text-muted, #6b7280) 18%, transparent);
  color: var(--text-secondary, #cbd5e1);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 500;
}

.tag--queue {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 18%, transparent);
  color: var(--accent-purple, #a855f7);
}

.lock-card-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.76rem;
  color: var(--text-secondary, #9ca3af);
}

.lock-holder {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono, ui-monospace, monospace);
}

.lock-holder--own {
  color: var(--accent-purple, #a855f7);
}

.holder-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.lock-reason {
  font-style: italic;
  color: var(--text-muted, #9ca3af);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 18rem;
}

.lock-expiry {
  color: var(--text-muted, #6b7280);
  margin-left: auto;
  white-space: nowrap;
}

.lock-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.lock-btn {
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  background: transparent;
  color: var(--text-secondary, #cbd5e1);
  font-size: 0.74rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.lock-btn:not(:disabled):hover {
  border-color: var(--accent-purple, #a855f7);
  color: var(--accent-purple, #a855f7);
}

.lock-btn--release:not(:disabled):hover {
  border-color: var(--color-success, #22c55e);
  color: var(--color-success, #22c55e);
}

.lock-btn--force:not(:disabled):hover {
  border-color: var(--color-error, #ef4444);
  color: var(--color-error, #ef4444);
}

.lock-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
