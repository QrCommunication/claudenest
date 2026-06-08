<template>
  <div class="page-public">
    <GrainOverlay />
    <PublicNav />

    <main class="page-main">
      <section class="pricing-hero">
        <SectionHeader
          :badge="t('landing.pricing.badge')"
          :subtitle="t('landing.pricing.subtitle')"
          align="center"
        >
          <template #title>
            {{ t('landing.pricing.title') }}<GradientText>{{ t('landing.pricing.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>

        <div class="billing-toggle" role="group" :aria-label="$t('docPricing.billingCycle')">
          <button
            type="button"
            class="toggle-option"
            :class="{ 'is-active': billing === 'monthly' }"
            @click="billing = 'monthly'"
          >
            {{ $t('docPricing.monthly') }}
          </button>
          <button
            type="button"
            class="toggle-option"
            :class="{ 'is-active': billing === 'yearly' }"
            @click="billing = 'yearly'"
          >
            {{ $t('docPricing.yearly') }}
            <span class="toggle-save">-20%</span>
          </button>
          <span class="toggle-thumb" :data-pos="billing" aria-hidden="true" />
        </div>
      </section>

      <section class="plans">
        <article
          v-for="(plan, idx) in plans"
          :key="plan.key"
          class="plan"
          :class="{ 'is-featured': plan.featured }"
          v-motion
          :initial="{ opacity: 0, y: 18 }"
          :visible-once="{ opacity: 1, y: 0, transition: { delay: idx * 90 } }"
        >
          <div v-if="plan.featured" class="plan-ribbon">
            <span>{{ t('landing.pricing.most_popular') }}</span>
          </div>

          <header class="plan-head">
            <span class="plan-name">{{ t(`landing.pricing.tiers.${plan.key}.name`) }}</span>
            <p class="plan-target">{{ t(`landing.pricing.tiers.${plan.key}.target`) }}</p>
          </header>

          <div class="plan-price">
            <template v-if="plan.key === 'pro' && billing === 'yearly'">
              <span class="plan-amount">$23</span>
              <span class="plan-unit">{{ t('landing.pricing.tiers.pro.period') }}</span>
            </template>
            <template v-else>
              <span class="plan-amount">{{ t(`landing.pricing.tiers.${plan.key}.price`) }}</span>
              <span v-if="plan.key === 'pro'" class="plan-unit">{{ t('landing.pricing.tiers.pro.period') }}</span>
            </template>
          </div>

          <p v-if="plan.key === 'pro' && billing === 'yearly'" class="plan-savings">
            {{ $t('docPricing.billedAnnually') }}
          </p>

          <ul class="plan-features">
            <li
              v-for="i in featuresCount(plan.key)"
              :key="i"
              class="plan-feat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span>{{ t(`landing.pricing.tiers.${plan.key}.features.${i - 1}`) }}</span>
            </li>
          </ul>

          <router-link
            :to="plan.cta"
            class="plan-cta"
            :class="{ 'is-primary': plan.featured }"
          >
            {{ t(`landing.pricing.tiers.${plan.key}.cta`) }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </router-link>
        </article>
      </section>

      <p class="pricing-note">{{ t('landing.pricing.note') }}</p>

      <!-- Feature comparison matrix -->
      <section class="section section-matrix">
        <SectionHeader
          :title="$t('docPricing.matrixTitle')"
          :subtitle="$t('docPricing.matrixSubtitle')"
        />

        <div class="matrix">
          <div class="matrix-head">
            <div class="matrix-cell cell-label">{{ $t('docPricing.capabilities') }}</div>
            <div class="matrix-cell">Community</div>
            <div class="matrix-cell is-accent">Pro</div>
            <div class="matrix-cell">Enterprise</div>
          </div>
          <div v-for="row in matrix" :key="row.key" class="matrix-row">
            <div class="matrix-cell cell-label">{{ row.label }}</div>
            <div class="matrix-cell">
              <MatrixValue :value="row.community" />
            </div>
            <div class="matrix-cell is-accent">
              <MatrixValue :value="row.pro" />
            </div>
            <div class="matrix-cell">
              <MatrixValue :value="row.enterprise" />
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="section section-faq">
        <SectionHeader align="center">
          <template #title>
            {{ t('landing.faq.title') }}<GradientText>{{ t('landing.faq.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>

        <div class="faq-list">
          <details v-for="i in 4" :key="i" class="faq-row" :open="i === 1">
            <summary class="faq-q">
              <span>{{ t(`landing.faq.items.${i - 1}.question`) }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            <p class="faq-a">{{ t(`landing.faq.items.${i - 1}.answer`) }}</p>
          </details>
        </div>
      </section>

      <section class="section section-cta">
        <div class="cta-panel">
          <div>
            <h2 class="cta-title">{{ $t('docPricing.ctaTitle') }}</h2>
            <p class="cta-sub">{{ $t('docPricing.ctaSub') }}</p>
          </div>
          <div class="cta-actions">
            <router-link to="/register" class="btn-primary">
              {{ t('landing.cta.cta_primary') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </router-link>
            <router-link to="/docs/installation" class="btn-ghost">{{ $t('docPricing.installationGuide') }}</router-link>
          </div>
        </div>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, h, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PublicNav from '@/components/public/PublicNav.vue';
import PublicFooter from '@/components/public/PublicFooter.vue';
import GrainOverlay from '@/components/public/GrainOverlay.vue';
import SectionHeader from '@/components/public/SectionHeader.vue';
import GradientText from '@/components/public/GradientText.vue';

const { t } = useI18n();

type Billing = 'monthly' | 'yearly';
const billing = ref<Billing>('monthly');

const plans = [
  { key: 'community', featured: false, cta: '/register' },
  { key: 'pro', featured: true, cta: '/register' },
  { key: 'enterprise', featured: false, cta: '/register' },
] as const;

const featuresCount = (key: string) => {
  const counts: Record<string, number> = { community: 5, pro: 7, enterprise: 8 };
  return counts[key] ?? 0;
};

type MatrixCell = string | boolean;

const matrix = computed(() => [
  { key: 'agents', label: t('docPricing.rowAgents'), community: '3', pro: '20', enterprise: t('docPricing.unlimited') },
  { key: 'projects', label: t('docPricing.rowProjects'), community: '1', pro: t('docPricing.unlimited'), enterprise: t('docPricing.unlimited') },
  { key: 'rag', label: 'pgvector RAG', community: true, pro: true, enterprise: true },
  { key: 'locks', label: t('docPricing.rowLocks'), community: t('docPricing.basic'), pro: t('docPricing.advanced'), enterprise: t('docPricing.advancedAudit') },
  { key: 'mcp', label: 'MCP Protocol', community: true, pro: true, enterprise: true },
  { key: 'mobile', label: t('docPricing.rowMobile'), community: true, pro: true, enterprise: true },
  { key: 'hosting', label: t('docPricing.rowHosting'), community: false, pro: t('docPricing.optional'), enterprise: t('docPricing.included') },
  { key: 'analytics', label: t('docPricing.rowAnalytics'), community: false, pro: true, enterprise: true },
  { key: 'sso', label: 'SSO / SAML', community: false, pro: false, enterprise: true },
  { key: 'sla', label: t('docPricing.rowSla'), community: false, pro: t('docPricing.emailPriority'), enterprise: t('docPricing.dedicated247') },
]);

const MatrixValue = (props: { value: MatrixCell }) => {
  if (typeof props.value === 'boolean') {
    return props.value
      ? h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'mx-ic is-ok' }, [
          h('polyline', { points: '20 6 9 17 4 12' }),
        ])
      : h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'mx-ic is-off' }, [
          h('path', { d: 'M5 12h14' }),
        ]);
  }
  return h('span', { class: 'mx-txt' }, props.value);
};
</script>

<style scoped>
.page-public {
  position: relative;
  min-height: 100dvh;
  color: var(--text-primary);
  background: var(--bg-primary);
  overflow-x: hidden;
}

.page-main { position: relative; z-index: 1; }

.section {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(4rem, 6.5vw, 6.5rem) clamp(1rem, 4vw, 2.5rem);
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.pricing-hero {
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 5.5rem) clamp(1rem, 4vw, 2.5rem) 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.2rem;
  text-align: center;
}

.billing-toggle {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  padding: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  isolation: isolate;
}

.toggle-option {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.25s ease;
}

.toggle-option.is-active { color: var(--text-primary); }

.toggle-save {
  padding: 0.12rem 0.5rem;
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-success) 24%, transparent);
  border-radius: 999px;
}

.toggle-thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border-radius: 999px;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 6px 16px -8px rgba(168, 85, 247, 0.5);
}

.toggle-thumb[data-pos='monthly'] { transform: translateX(0); }
.toggle-thumb[data-pos='yearly'] { transform: translateX(100%); }

/* ============ PLANS ============ */
.plans {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2.5rem);
}

@media (min-width: 900px) {
  .plans { grid-template-columns: repeat(3, 1fr); align-items: stretch; }
}

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem 1.85rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1.2rem;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s, box-shadow 0.3s;
}

.plan:hover {
  transform: translateY(-2px);
  border-color: var(--border-hover);
}

.plan.is-featured {
  border-color: color-mix(in srgb, var(--accent-purple) 44%, var(--border-color));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent-purple) 32%, transparent),
    0 24px 60px -30px rgba(168, 85, 247, 0.5);
  transform: translateY(-4px);
}

.plan.is-featured:hover { transform: translateY(-6px); }

.plan-ribbon {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.3rem 0.85rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border-radius: 999px;
  box-shadow: 0 8px 20px -8px rgba(168, 85, 247, 0.6);
}

.plan-head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.plan-name {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-purple);
}

.plan-target {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding-bottom: 1.1rem;
  border-bottom: 1px solid var(--border-color);
}

.plan-amount {
  font-size: 2.8rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--text-primary);
  line-height: 1;
}

.plan-unit {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-muted);
}

.plan-savings {
  margin-top: -0.3rem;
  font-size: 0.76rem;
  color: var(--status-success);
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-feat {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: flex-start;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.plan-feat svg {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: var(--accent-purple);
  flex-shrink: 0;
}

.plan-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem;
  margin-top: auto;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.7rem;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.plan-cta svg {
  width: 15px;
  height: 15px;
  transition: transform 0.25s;
}

.plan-cta:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.plan-cta:hover svg { transform: translateX(3px); }

.plan-cta.is-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 24px -10px rgba(168, 85, 247, 0.6);
}

.plan-cta.is-primary:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 14px 30px -10px rgba(168, 85, 247, 0.7);
}

.plan-cta:active { transform: translateY(0); }

.pricing-note {
  max-width: 38rem;
  margin: 1.5rem auto 0;
  padding: 0 1rem;
  font-size: 0.85rem;
  text-align: center;
  color: var(--text-muted);
}

/* ============ MATRIX ============ */
.matrix {
  overflow-x: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
}

.matrix-head,
.matrix-row {
  display: grid;
  grid-template-columns: minmax(12rem, 2fr) repeat(3, minmax(8rem, 1fr));
  align-items: center;
}

.matrix-head {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.matrix-cell {
  padding: 1rem 1.2rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.matrix-cell.cell-label {
  color: var(--text-primary);
  font-weight: 500;
}

.matrix-cell.is-accent {
  background: color-mix(in srgb, var(--accent-purple) 5%, transparent);
  color: var(--accent-purple);
}

.matrix-head .matrix-cell {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.matrix-head .matrix-cell.is-accent { color: var(--accent-purple); }

.matrix-row {
  border-top: 1px solid var(--border-color);
  transition: background 0.18s ease;
}

.matrix-row:hover { background: var(--bg-hover); }

.mx-ic {
  width: 18px;
  height: 18px;
}

.mx-ic.is-ok { color: var(--status-success); }
.mx-ic.is-off { color: var(--text-muted); opacity: 0.45; }

.mx-txt {
  font-variant-numeric: tabular-nums;
  color: inherit;
}

/* ============ FAQ ============ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 50rem;
  margin: 0 auto;
  width: 100%;
}

.faq-row {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.85rem;
  transition: border-color 0.2s ease;
}

.faq-row[open] {
  border-color: color-mix(in srgb, var(--accent-purple) 32%, var(--border-color));
}

.faq-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.05rem 1.2rem;
  cursor: pointer;
  list-style: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

.faq-q::-webkit-details-marker { display: none; }

.faq-q svg {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.faq-row[open] .faq-q svg {
  transform: rotate(180deg);
  color: var(--accent-purple);
}

.faq-a {
  padding: 0 1.2rem 1.2rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--text-secondary);
}

/* ============ CTA ============ */
.cta-panel {
  position: relative;
  padding: clamp(2rem, 5vw, 3.5rem);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1.5rem;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  align-items: center;
}

@media (min-width: 840px) {
  .cta-panel { grid-template-columns: 1.4fr auto; }
}

.cta-title {
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 0.6rem;
}

.cta-sub {
  max-width: 32rem;
  font-size: 0.96rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.cta-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.2rem;
  font-size: 0.92rem;
  font-weight: 600;
  border-radius: 0.7rem;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, border-color 0.2s;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 10px 24px -10px rgba(168, 85, 247, 0.6);
}

.btn-primary svg {
  width: 15px;
  height: 15px;
  transition: transform 0.22s;
}

.btn-primary:hover { transform: translateY(-1px); }
.btn-primary:hover svg { transform: translateX(3px); }

.btn-ghost {
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.btn-ghost:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}
</style>
