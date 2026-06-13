<template>
  <span
    class="status-badge"
    :class="[`sb-${type}`, `sb-${type}-${value}`, { 'sb-has-dot': dot }]"
  >
    <span v-if="dot" class="sb-dot" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Badge réutilisable — source unique de vérité pour le mapping
 * statut/priorité → couleur (via les classes CSS ci-dessous) + label (i18n).
 * Utilisé par les épics (EpicBoard) et les tâches (TaskCard).
 *
 * Le mapping couleur vit ENTIÈREMENT dans le <style> de ce composant.
 * Toute évolution de palette se fait ici, jamais dans les consommateurs.
 */

type BadgeType = 'status' | 'priority';

interface Props {
  /** 'status' = pastille arrondie (statut), 'priority' = badge (priorité). */
  type: BadgeType;
  /** Valeur de l'enum : statut (open/backlog/pending/in_progress/blocked/review/done) ou priorité (low/medium/high/critical). */
  value: string;
  /** Affiche une pastille de couleur avant le label (style statut de tâche). */
  dot?: boolean;
}

const props = withDefaults(defineProps<Props>(), { dot: false });

const { t } = useI18n();

// status enum → clé i18n (camelCase pour le namespace statusBadge.status.*)
const STATUS_LABEL_KEYS: Record<string, string> = {
  open: 'open',
  backlog: 'backlog',
  pending: 'pending',
  in_progress: 'inProgress',
  blocked: 'blocked',
  review: 'review',
  done: 'done',
};

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

const label = computed(() => {
  if (props.type === 'priority') {
    return t(`statusBadge.priority.${PRIORITY_LABEL_KEYS[props.value] ?? 'medium'}`);
  }
  return t(`statusBadge.status.${STATUS_LABEL_KEYS[props.value] ?? 'pending'}`);
});
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
}

.sb-dot {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 999px;
  background: currentColor;
  flex-shrink: 0;
}

/* ==================== STATUT (pastille arrondie) ==================== */
.sb-status {
  padding: 0.0625rem 0.4375rem;
  border-radius: 999px;
}
.sb-status.sb-has-dot {
  padding-left: 0.375rem;
}

.sb-status-open {
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--text-secondary) 15%, transparent);
}
.sb-status-backlog,
.sb-status-pending {
  color: var(--text-muted);
  background: color-mix(in srgb, var(--text-muted) 16%, transparent);
}
.sb-status-in_progress {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 16%, transparent);
}
.sb-status-blocked {
  color: var(--status-error);
  background: color-mix(in srgb, var(--status-error) 14%, transparent);
}
.sb-status-review {
  color: var(--accent-cyan);
  background: color-mix(in srgb, var(--accent-cyan) 14%, transparent);
}
.sb-status-done {
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 16%, transparent);
}

/* ==================== PRIORITÉ (badge carré) ==================== */
.sb-priority {
  padding: 0.0625rem 0.4375rem;
  border-radius: 0.25rem;
}

.sb-priority-critical {
  color: var(--status-error);
  background: color-mix(in srgb, var(--status-error) 16%, transparent);
}
.sb-priority-high {
  color: #f97316;
  background: color-mix(in srgb, #f97316 16%, transparent);
}
.sb-priority-medium {
  color: var(--status-warning);
  background: color-mix(in srgb, var(--status-warning) 18%, transparent);
}
.sb-priority-low {
  color: var(--text-muted);
  background: color-mix(in srgb, var(--text-muted) 16%, transparent);
}
</style>
