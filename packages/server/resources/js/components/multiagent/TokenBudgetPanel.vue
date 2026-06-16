<template>
  <div class="token-budget">
    <header class="tb-header">
      <h4 class="tb-title">{{ t('projectsTokenbudget.title') }}</h4>
      <button
        class="tb-refresh"
        :class="{ spinning: store.isLoadingTokenBudget }"
        :disabled="store.isLoadingTokenBudget"
        :title="t('projectsTokenbudget.title')"
        @click="load"
      >
        ↻
      </button>
    </header>

    <!-- Loading (first fetch only — keeps prior data on refresh) -->
    <p v-if="store.isLoadingTokenBudget && !budget" class="tb-empty">…</p>

    <!-- Error -->
    <p v-else-if="loadError" class="tb-error">{{ t('projectsTokenbudget.loadError') }}</p>

    <!-- Empty: no token usage recorded yet -->
    <p v-else-if="budget && budget.tokens.used === 0 && budget.tokens.session_total === 0" class="tb-empty">
      {{ t('projectsTokenbudget.noUsage') }}
    </p>

    <template v-else-if="budget">
      <!-- Cost -->
      <div class="tb-cost">
        <span class="tb-cost-label">{{ t('projectsTokenbudget.cost') }}</span>
        <span
          class="tb-cost-value"
          :title="t('projectsTokenbudget.costTooltip', { model: budget.cost.pricing_model })"
        >
          {{ formatCost(budget.cost.estimated_usd, budget.cost.currency) }}
        </span>
      </div>

      <!-- Usage bar against the project budget -->
      <div class="tb-usage">
        <div class="tb-usage-head">
          <span>{{ t('projectsTokenbudget.used') }}</span>
          <span class="tb-usage-figures">
            {{ formatTokens(budget.tokens.used) }}
            <template v-if="budget.tokens.max">/ {{ formatTokens(budget.tokens.max) }}</template>
            <template v-else>· {{ t('projectsTokenbudget.unlimited') }}</template>
          </span>
        </div>
        <div v-if="budget.tokens.max" class="tb-bar" :class="{ 'is-reached': budget.tokens.limit_reached }">
          <div class="tb-bar-fill" :style="{ width: `${Math.min(100, budget.tokens.percent)}%` }" />
        </div>
        <div class="tb-usage-foot">
          <span v-if="budget.tokens.max">{{ t('projectsTokenbudget.percentUsed', { percent: budget.tokens.percent }) }}</span>
          <span v-if="budget.tokens.limit_reached" class="tb-limit-reached">
            {{ t('projectsTokenbudget.limitReached') }}
          </span>
        </div>
      </div>

      <!-- Input / output split + sessions -->
      <dl class="tb-grid">
        <div class="tb-stat">
          <dt>{{ t('projectsTokenbudget.input') }}</dt>
          <dd>{{ formatTokens(budget.tokens.input) }}</dd>
        </div>
        <div class="tb-stat">
          <dt>{{ t('projectsTokenbudget.output') }}</dt>
          <dd>{{ formatTokens(budget.tokens.output) }}</dd>
        </div>
        <div class="tb-stat">
          <dt>{{ t('projectsTokenbudget.sessionTotal') }}</dt>
          <dd>{{ formatTokens(budget.tokens.session_total) }}</dd>
        </div>
        <div class="tb-stat">
          <dt>{{ t('projectsTokenbudget.sessions') }}</dt>
          <dd>{{ budget.sessions_count }}</dd>
        </div>
      </dl>

      <p class="tb-pricing">
        {{ t('projectsTokenbudget.pricingModel') }}: <code>{{ budget.cost.pricing_model }}</code>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectsStore } from '@/stores/projects';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const { t } = useI18n();
const store = useProjectsStore();

const loadError = ref(false);
const budget = computed(() => store.tokenBudget);

async function load(): Promise<void> {
  loadError.value = false;
  try {
    await store.fetchTokenBudget(props.projectId);
  } catch {
    loadError.value = true;
  }
}

// Fetch on mount and whenever the project changes.
watch(() => props.projectId, load, { immediate: true });

function formatTokens(value: number): string {
  return `${value.toLocaleString()} ${t('projectsTokenbudget.tokens')}`;
}

function formatCost(value: number, currency: string): string {
  const prefix = currency === 'USD' ? '$' : '';
  return `${prefix}${value.toFixed(4)}${prefix ? '' : ` ${currency}`}`;
}
</script>

<style scoped>
.token-budget {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tb-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.tb-refresh {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s ease;
}

.tb-refresh:hover {
  color: var(--text-primary);
}

.tb-refresh.spinning {
  animation: tb-spin 0.8s linear infinite;
}

@keyframes tb-spin {
  to {
    transform: rotate(360deg);
  }
}

.tb-empty {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 12px 0;
}

.tb-error {
  font-size: 12px;
  color: var(--color-error, #ef4444);
  padding: 8px 0;
}

/* Cost */
.tb-cost {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 10px;
  background-color: var(--bg-tertiary, var(--bg-secondary));
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.tb-cost-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.tb-cost-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary, #a855f7);
  font-variant-numeric: tabular-nums;
}

/* Usage bar */
.tb-usage {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tb-usage-head,
.tb-usage-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.tb-usage-figures {
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.tb-bar {
  height: 6px;
  background-color: var(--bg-tertiary, var(--bg-secondary));
  border-radius: 3px;
  overflow: hidden;
}

.tb-bar-fill {
  height: 100%;
  background-color: var(--color-primary, #a855f7);
  transition: width 0.3s ease;
}

.tb-bar.is-reached .tb-bar-fill {
  background-color: var(--color-error, #ef4444);
}

.tb-limit-reached {
  color: var(--color-error, #ef4444);
  font-weight: 600;
}

/* Stats grid */
.tb-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0;
}

.tb-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background-color: var(--bg-tertiary, var(--bg-secondary));
  border-radius: 6px;
}

.tb-stat dt {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.tb-stat dd {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.tb-pricing {
  margin: 0;
  font-size: 11px;
  color: var(--text-muted);
}

.tb-pricing code {
  color: var(--text-secondary);
}
</style>
