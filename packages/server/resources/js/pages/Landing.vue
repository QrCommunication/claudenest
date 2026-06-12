<template>
  <div class="page-public">
    <GrainOverlay />
    <PublicNav />

    <main class="page-main">
      <!-- ============ 1. HERO ============ -->
      <section class="hero" id="top">
        <div class="hero-grid">
          <div class="hero-lede">
            <span class="hero-badge" v-motion :initial="mInitial(8)" :enter="mEnter(80)">
              <span class="hero-badge-dot" />
              {{ t('landing.hero.badge') }}
            </span>

            <h1 class="hero-title" v-motion :initial="mInitial(16)" :enter="mEnter(140)">
              {{ t('landing.hero.title') }}<br />
              <span class="hl">{{ t('landing.hero.title_highlight') }}</span>
            </h1>

            <p class="hero-sub" v-motion :initial="mInitial()" :enter="mEnter(220)">
              {{ t('landing.hero.subtitle') }}
            </p>

            <div class="hero-install" v-motion :initial="mInitial()" :enter="mEnter(300)">
              <div class="hero-install-prompt">
                <span class="hero-install-label">install-agent.sh</span>
                <button type="button" class="hero-install-copy" @click="copyInstall" :aria-label="t('common.copy')">
                  <Transition name="copy" mode="out-in">
                    <span v-if="!copied" key="copy" class="copy-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      {{ t('common.copy') }}
                    </span>
                    <span v-else key="done" class="copy-ic is-done">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      {{ t('common.copied') }}
                    </span>
                  </Transition>
                </button>
              </div>
              <pre class="hero-install-cmd"><span class="prompt-sign">$</span> <span class="cmd-text">{{ INSTALL_CMD }}</span></pre>
            </div>

            <div class="hero-actions" v-motion :initial="mInitial()" :enter="mEnter(360)">
              <router-link to="/docs/installation" class="btn-primary">
                {{ t('landing.hero.cta_primary') }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </router-link>
              <a href="#demo" class="btn-ghost">
                {{ t('landing.hero.cta_secondary') }}
              </a>
            </div>

            <p class="hero-micro" v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { delay: 420 } }">
              {{ t('landing.hero.micro_copy') }}
            </p>
          </div>

          <div class="hero-visual" v-motion :initial="mInitial(20)" :enter="mEnter(240)">
            <div ref="tiltRef" class="hero-tilt" :style="tiltStyle()">
              <HeroOrchestrationDemo />
            </div>
            <div class="hero-glow" aria-hidden="true" />
          </div>
        </div>
      </section>

      <!-- ============ 2. PROOF BAR ============ -->
      <section class="proof">
        <div class="proof-grid">
          <div
            v-for="(item, idx) in proofItems"
            :key="item.key"
            class="proof-item"
            v-motion
            :initial="mInitial(10)"
            :visible-once="mVisible(idx)"
          >
            <span class="proof-value">{{ item.value }}</span>
            <span class="proof-label">{{ item.label }}</span>
          </div>
        </div>
      </section>

      <!-- ============ 3. PROBLEM ============ -->
      <section class="section section-problem" id="problem">
        <SectionHeader :title="t('landing.problem.title')" />
        <div class="ledger">
          <article
            v-for="(key, idx) in PROBLEM_KEYS"
            :key="key"
            class="ledger-row"
            v-motion
            :initial="mInitial()"
            :visible-once="mVisible(idx)"
          >
            <span class="ledger-num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div class="ledger-body">
              <h3 class="ledger-title">{{ t(`landing.problem.${key}.title`) }}</h3>
              <p class="ledger-desc">{{ t(`landing.problem.${key}.description`) }}</p>
            </div>
          </article>
        </div>
        <p class="problem-transition" v-motion :initial="mInitial()" :visible-once="mVisible(3)">
          {{ t('landing.problem.transition') }}
        </p>
      </section>

      <!-- ============ 4. ORCHESTRATION DEMO ============ -->
      <section class="section section-demo" id="demo">
        <div class="zig-grid">
          <div class="zig-text" v-motion :initial="mInitial()" :visible-once="mVisible(0)">
            <SectionHeader :title="t('landing.demo.title')" :subtitle="t('landing.demo.subtitle')" />
            <ul class="demo-bullets">
              <li v-for="(b, idx) in DEMO_BULLETS" :key="b.key" class="demo-bullet">
                <span class="bullet-icon" v-html="b.icon" />
                <p>
                  <strong>{{ t(`landing.demo.bullets.${idx}.title`) }}</strong>
                  — {{ t(`landing.demo.bullets.${idx}.description`) }}
                </p>
              </li>
            </ul>
            <router-link to="/docs" class="text-link">
              {{ t('landing.demo.link') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </router-link>
          </div>
          <div class="zig-visual" v-motion :initial="mInitial(16)" :visible-once="mVisible(1)">
            <KanbanAutoDemo />
          </div>
        </div>
      </section>

      <!-- ============ 5. HOW IT WORKS ============ -->
      <section class="section section-how" id="how">
        <SectionHeader :badge="t('landing.how_it_works.badge')">
          <template #title>
            {{ t('landing.how_it_works.title') }}<span class="hl">{{ t('landing.how_it_works.title_highlight') }}</span>
          </template>
        </SectionHeader>

        <ol class="steps">
          <li
            v-for="(step, idx) in STEPS"
            :key="step.key"
            class="step"
            v-motion
            :initial="mInitial(18)"
            :visible-once="mVisible(idx)"
          >
            <span class="step-num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <h3 class="step-title">{{ t(`landing.how_it_works.step_${idx + 1}.title`) }}</h3>
            <p class="step-desc">{{ t(`landing.how_it_works.step_${idx + 1}.description`) }}</p>
            <pre v-if="step.cmd" class="step-cmd"><span class="prompt-sign">$</span> {{ step.cmd }}</pre>
            <span v-if="idx < STEPS.length - 1" class="step-connector" aria-hidden="true" />
          </li>
        </ol>
        <p class="how-note">{{ t('landing.how_it_works.note') }}</p>
      </section>

      <!-- ============ 6. FEATURES BENTO ============ -->
      <section class="section section-features" id="features">
        <SectionHeader
          :badge="t('landing.features.badge')"
          :subtitle="t('landing.features.subtitle')"
          align="center"
        >
          <template #title>
            {{ t('landing.features.title') }}<span class="hl">{{ t('landing.features.title_highlight') }}</span>
          </template>
        </SectionHeader>

        <div class="bento">
          <article
            v-for="(card, idx) in BENTO_CARDS"
            :key="card.key"
            class="bento-item"
            :class="`bento-${card.slot}`"
            v-motion
            :initial="mInitial(18)"
            :visible-once="mVisible(idx)"
          >
            <div class="bento-icon" :class="card.iconClass" v-html="card.icon" />
            <h3 class="bento-title">{{ t(`landing.features.${card.key}.title`) }}</h3>
            <p class="bento-desc">{{ t(`landing.features.${card.key}.description`) }}</p>
            <div v-if="card.key === 'locks'" class="bento-demo">
              <LockDenyDemo />
            </div>
          </article>
        </div>
      </section>

      <!-- ============ 7. COMPARISON ============ -->
      <section class="section section-compare" id="compare">
        <SectionHeader :badge="t('landing.comparison.badge')" :subtitle="t('landing.comparison.subtitle')">
          <template #title>
            {{ t('landing.comparison.title') }}<span class="hl">{{ t('landing.comparison.title_highlight') }}</span>
          </template>
        </SectionHeader>

        <div class="compare-table">
          <div class="compare-head">
            <div class="col-head">{{ t('landing.comparison.feature_label') }}</div>
            <div class="col-head is-us">ClaudeNest</div>
            <div class="col-head">{{ t('landing.comparison.columns.swarm') }}</div>
            <div class="col-head">{{ t('landing.comparison.columns.diy') }}</div>
          </div>
          <div v-for="row in COMPARISON_ROWS" :key="row.key" class="compare-row">
            <div class="cell cell-label">{{ t(`landing.comparison.features.${row.key}`) }}</div>
            <div class="cell is-us"><Check /></div>
            <div class="cell">
              <Check v-if="row.swarm === true" />
              <Partial v-else-if="row.swarm === 'partial'" />
              <Cross v-else />
            </div>
            <div class="cell">
              <Check v-if="row.diy === true" />
              <Partial v-else-if="row.diy === 'partial'" />
              <Cross v-else />
            </div>
          </div>
        </div>
      </section>

      <!-- ============ 8. MEMORY ============ -->
      <section class="section section-memory">
        <div class="zig-grid is-reverse">
          <div class="zig-visual" v-motion :initial="mInitial(16)" :visible-once="mVisible(1)">
            <div class="mem-diagram" aria-hidden="true">
              <div class="mem-node">worker session</div>
              <svg class="mem-link" viewBox="0 0 2 36" width="2" height="36"><line x1="1" y1="0" x2="1" y2="36" /></svg>
              <div class="mem-node is-core">
                project memory
                <span class="mem-sub">pgvector</span>
              </div>
              <svg class="mem-link" viewBox="0 0 2 36" width="2" height="36"><line x1="1" y1="0" x2="1" y2="36" /></svg>
              <div class="mem-node">next worker</div>
            </div>
          </div>
          <div class="zig-text" v-motion :initial="mInitial()" :visible-once="mVisible(0)">
            <SectionHeader :title="t('landing.memory.title')" />
            <p class="zig-body">{{ t('landing.memory.body') }}</p>
            <ul class="check-list">
              <li v-for="i in 3" :key="i">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                {{ t(`landing.memory.list.${i - 1}`) }}
              </li>
            </ul>
            <p class="zig-note">{{ t('landing.memory.note') }}</p>
          </div>
        </div>
      </section>

      <!-- ============ 9. PLANNING + COORDINATOR ============ -->
      <section class="section section-planning">
        <div class="zig-grid">
          <div class="zig-text" v-motion :initial="mInitial()" :visible-once="mVisible(0)">
            <SectionHeader :title="t('landing.planning.title')" />
            <p class="zig-body">{{ t('landing.planning.body') }}</p>
            <p class="planning-bullet">{{ t('landing.planning.bullet') }}</p>
          </div>
          <div class="zig-visual">
            <div class="plan-visual" aria-hidden="true">
              <div class="plan-chat">
                <div
                  v-for="(msg, idx) in PLAN_MESSAGES"
                  :key="idx"
                  class="chat-msg"
                  :class="msg.kind"
                  v-motion
                  :initial="mInitial(10)"
                  :visible-once="mVisibleAt(idx * 200)"
                >{{ msg.text }}</div>
              </div>
              <div class="plan-cards">
                <div
                  v-for="(card, idx) in PLAN_CARDS"
                  :key="card.title"
                  class="plan-card"
                  v-motion
                  :initial="mInitial(10)"
                  :visible-once="mVisibleAt(600 + idx * 100)"
                >
                  <span class="plan-card-title">{{ card.title }}</span>
                  <span class="plan-card-pts">{{ card.pts }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ 10. WHAT IS CLAUDENEST ============ -->
      <section class="section section-whatis">
        <div class="whatis-grid">
          <div class="whatis-text" v-motion :initial="mInitial()" :visible-once="mVisible(0)">
            <SectionHeader :title="t('landing.what_is.title')" />
            <p class="whatis-body">{{ t('landing.what_is.body') }}</p>
            <ul class="check-list">
              <li v-for="i in 3" :key="i">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                {{ t(`landing.what_is.bullets.${i - 1}`) }}
              </li>
            </ul>
            <p class="whatis-updated">{{ t('landing.what_is.updated') }}</p>
          </div>
          <div class="whatis-card" v-motion :initial="mInitial(16)" :visible-once="mVisible(1)">
            <ul class="stack-list">
              <li v-for="item in STACK_ITEMS" :key="item">{{ item }}</li>
            </ul>
            <pre class="stack-cmd"><span class="prompt-sign">$</span> {{ INSTALL_CMD }}</pre>
            <a :href="GITHUB_URL" target="_blank" rel="noopener" class="text-link">
              {{ t('landing.what_is.github') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>
      </section>

      <!-- ============ 11. PRICING TEASER ============ -->
      <section class="section section-pricing-teaser" id="pricing">
        <SectionHeader :badge="t('landing.pricing.badge')" :subtitle="t('landing.pricing.subtitle')">
          <template #title>
            {{ t('landing.pricing.title') }}<span class="hl">{{ t('landing.pricing.title_highlight') }}</span>
          </template>
        </SectionHeader>

        <div class="tiers">
          <router-link
            v-for="(tier, idx) in TIERS"
            :key="tier.key"
            to="/pricing"
            class="tier-card"
            :class="{ 'is-pro': tier.key === 'pro' }"
            v-motion
            :initial="mInitial(14)"
            :visible-once="mVisible(idx)"
          >
            <span v-if="tier.key === 'pro'" class="tier-chip">{{ t('landing.pricing.most_popular') }}</span>
            <span class="tier-name">{{ t(`landing.pricing.tiers.${tier.key}.name`) }}</span>
            <span class="tier-price">
              {{ t(`landing.pricing.tiers.${tier.key}.price`) }}
              <small v-if="tier.key === 'pro'">{{ t('landing.pricing.tiers.pro.period') }}</small>
            </span>
            <span class="tier-target">{{ t(`landing.pricing.tiers.${tier.key}.target`) }}</span>
            <ul class="tier-features">
              <li v-for="i in tier.featureCount" :key="i">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                {{ t(`landing.pricing.tiers.${tier.key}.features.${i - 1}`) }}
              </li>
            </ul>
            <span class="tier-cta">
              {{ t(`landing.pricing.tiers.${tier.key}.cta`) }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </span>
          </router-link>
        </div>
        <p class="tiers-note">{{ t('landing.pricing.note') }}</p>
      </section>

      <!-- ============ 12. FAQ ============ -->
      <section class="section section-faq">
        <SectionHeader align="center">
          <template #title>
            {{ t('landing.faq.title') }}<span class="hl">{{ t('landing.faq.title_highlight') }}</span>
          </template>
        </SectionHeader>

        <div class="faq-list">
          <details v-for="i in 8" :key="i" class="faq-row" :open="i === 1">
            <summary class="faq-q">
              <span>{{ t(`landing.faq.items.${i - 1}.question`) }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            <p class="faq-a">{{ t(`landing.faq.items.${i - 1}.answer`) }}</p>
          </details>
        </div>
      </section>

      <!-- ============ 13. FINAL CTA ============ -->
      <section class="section section-cta">
        <div class="cta-panel">
          <div class="cta-text">
            <h2 class="cta-title">
              {{ t('landing.cta.title') }}<span class="hl">{{ t('landing.cta.title_highlight') }}</span>
            </h2>
            <p class="cta-sub">{{ t('landing.cta.subtitle') }}</p>
          </div>
          <div class="cta-actions">
            <router-link to="/docs/installation" class="btn-primary">
              {{ t('landing.cta.cta_primary') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </router-link>
            <a :href="GITHUB_URL" target="_blank" rel="noopener" class="btn-ghost">{{ t('landing.cta.cta_secondary') }}</a>
          </div>
          <div class="cta-mesh" aria-hidden="true" />
        </div>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PublicNav from '@/components/public/PublicNav.vue';
import PublicFooter from '@/components/public/PublicFooter.vue';
import GrainOverlay from '@/components/public/GrainOverlay.vue';
import SectionHeader from '@/components/public/SectionHeader.vue';
import HeroOrchestrationDemo from '@/components/public/demos/HeroOrchestrationDemo.vue';
import KanbanAutoDemo from '@/components/public/demos/KanbanAutoDemo.vue';
import LockDenyDemo from '@/components/public/demos/LockDenyDemo.vue';
import { useTiltCard } from '@/composables/useTiltCard';

const { t } = useI18n();

const INSTALL_CMD = 'curl -fsSL https://claudenest.io/install-agent.sh | bash';
const GITHUB_URL = 'https://github.com/QrCommunication/claudenest';

// ---------------------------------------------------------------------------
// Motion helpers — M-REVEAL (260ms, stagger 60ms) with reduced-motion fallback
// (opacity only, 0.15s). matchMedia is checked at runtime, not only in CSS.
// ---------------------------------------------------------------------------
const prefersReduced = ref(false);
let motionMq: MediaQueryList | null = null;

function onMotionMqChange(): void {
  prefersReduced.value = motionMq?.matches ?? false;
}

onMounted(() => {
  motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReduced.value = motionMq.matches;
  motionMq.addEventListener('change', onMotionMqChange);
});

onUnmounted(() => {
  motionMq?.removeEventListener('change', onMotionMqChange);
  motionMq = null;
});

function mInitial(y = 12): Record<string, number> {
  return prefersReduced.value ? { opacity: 0 } : { opacity: 0, y };
}

function mVisibleAt(delay: number): Record<string, unknown> {
  return prefersReduced.value
    ? { opacity: 1, transition: { duration: 150 } }
    : { opacity: 1, y: 0, transition: { duration: 260, delay } };
}

function mVisible(idx = 0): Record<string, unknown> {
  return mVisibleAt(idx * 60);
}

function mEnter(delay: number): Record<string, unknown> {
  return prefersReduced.value
    ? { opacity: 1, transition: { duration: 150 } }
    : { opacity: 1, y: 0, transition: { duration: 260, delay } };
}

// ---------------------------------------------------------------------------
// Hero tilt — ±3°, desktop pointer only (useTiltCard self-disables on touch
// devices and under prefers-reduced-motion).
// ---------------------------------------------------------------------------
const { cardRef: tiltRef, tiltStyle } = useTiltCard({ maxTilt: 3, scale: 1.01 });

// ---------------------------------------------------------------------------
// Install copy
// ---------------------------------------------------------------------------
const copied = ref(false);
async function copyInstall(): Promise<void> {
  try {
    await navigator.clipboard.writeText(INSTALL_CMD);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // ignore — env may not support clipboard
  }
}

// ---------------------------------------------------------------------------
// Section data (labels resolved through t() in computed/template — never in
// top-level consts)
// ---------------------------------------------------------------------------
const proofItems = computed(() => [
  { key: 'mcp_tools', value: '20', label: t('landing.proof.mcp_tools') },
  { key: 'tests', value: '370+', label: t('landing.proof.tests') },
  { key: 'wake', value: '~3 ms', label: t('landing.proof.wake') },
  { key: 'mobile', value: 'iOS · Android', label: t('landing.proof.mobile') },
]);

const PROBLEM_KEYS = ['conflict', 'vanishing', 'blindfold'] as const;

const ICONS = {
  atomic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>',
  board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>',
  plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>',
  stream: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>',
  siren: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>',
  pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /><polyline points="3.5 12 8 12 10 9 14 15 16 12 20.5 12" /></svg>',
} as const;

const DEMO_BULLETS = [
  { key: 'atomic', icon: ICONS.atomic },
  { key: 'sessions', icon: ICONS.terminal },
  { key: 'board', icon: ICONS.board },
] as const;

const STEPS = [
  { key: 'install', cmd: INSTALL_CMD },
  { key: 'pair', cmd: null },
  { key: 'orchestrate', cmd: null },
] as const;

interface BentoCard {
  key: string;
  slot: 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
  icon: string;
  iconClass: string;
}

const BENTO_CARDS: readonly BentoCard[] = [
  { key: 'locks', slot: 'a', icon: ICONS.lock, iconClass: 'is-purple' },
  { key: 'mcp', slot: 'b', icon: ICONS.plug, iconClass: 'is-cyan' },
  { key: 'board', slot: 'c', icon: ICONS.board, iconClass: 'is-indigo' },
  { key: 'credentials', slot: 'd', icon: ICONS.key, iconClass: 'is-rose' },
  { key: 'coordinator', slot: 'e', icon: ICONS.siren, iconClass: 'is-amber' },
  { key: 'health', slot: 'f', icon: ICONS.pulse, iconClass: 'is-emerald' },
];

type SupportState = boolean | 'partial';

interface ComparisonRow {
  key: string;
  swarm: SupportState;
  diy: SupportState;
}

const COMPARISON_ROWS: readonly ComparisonRow[] = [
  { key: 'multi_agent', swarm: true, diy: false },
  { key: 'web_dashboard', swarm: false, diy: false },
  { key: 'mobile_app', swarm: false, diy: false },
  { key: 'rag_context', swarm: 'partial', diy: false },
  { key: 'file_locking', swarm: false, diy: false },
  { key: 'attachable_terminals', swarm: false, diy: 'partial' },
  { key: 'websocket', swarm: 'partial', diy: 'partial' },
  { key: 'mcp_support', swarm: false, diy: false },
  { key: 'open_source', swarm: true, diy: true },
];

// Simulated product content — hardcoded EN by design, like the demo mockups.
const PLAN_MESSAGES = [
  { kind: 'is-user', text: 'Ship API rate limiting before Friday — protect the public endpoints.' },
  { kind: 'is-agent', text: 'Drafted 1 epic · 4 tasks · Sprint 15 scheduled against velocity 21' },
  { kind: 'is-agent is-ok', text: '✓ All actions applied — board updated' },
] as const;

const PLAN_CARDS = [
  { title: 'Add token-bucket middleware', pts: 3 },
  { title: 'Redis counters with TTL', pts: 2 },
  { title: '429 responses + Retry-After', pts: 2 },
  { title: 'Load-test the limiter', pts: 5 },
] as const;

const STACK_ITEMS = [
  'Laravel · Reverb',
  'PostgreSQL + pgvector',
  'Redis',
  'Node.js agent',
  'Vue 3 dashboard',
  '370+ tests',
] as const;

const TIERS = [
  { key: 'community', featureCount: 4 },
  { key: 'pro', featureCount: 3 },
  { key: 'enterprise', featureCount: 3 },
] as const;

// ---------------------------------------------------------------------------
// Comparison cell icons
// ---------------------------------------------------------------------------
const Check = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'ic ic-ok',
    },
    [h('polyline', { points: '20 6 9 17 4 12' })],
  );

const Cross = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'ic ic-off',
    },
    [h('path', { d: 'M18 6L6 18M6 6l12 12' })],
  );

const Partial = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      class: 'ic ic-partial',
    },
    [h('circle', { cx: 12, cy: 12, r: 9 }), h('path', { d: 'M12 3a9 9 0 0 1 0 18' })],
  );
</script>

<style scoped>
.page-public {
  position: relative;
  min-height: 100dvh;
  color: var(--text-primary);
  background: var(--bg-primary);
  overflow-x: hidden;
}

.page-main {
  position: relative;
  z-index: 1;
}

.section {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(4rem, 7vw, 7.5rem) clamp(1rem, 4vw, 2.5rem);
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.hl {
  color: var(--accent-purple);
}

/* ============ BUTTONS ============ */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: var(--accent-purple);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 24px -10px rgba(168, 85, 247, 0.55);
  transition: transform 0.08s ease, box-shadow 0.25s ease, background 0.2s ease;
}

.btn-primary svg {
  width: 15px;
  height: 15px;
  transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--accent-purple) 88%, #ffffff);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 14px 30px -10px rgba(168, 85, 247, 0.65);
}

.btn-primary:hover svg {
  transform: translateX(3px);
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.2rem;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.7rem;
  transition: transform 0.08s ease, background 0.2s ease, border-color 0.2s ease;
}

.btn-ghost:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.btn-ghost:active {
  transform: scale(0.97);
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-purple);
  cursor: pointer;
}

.text-link svg {
  width: 14px;
  height: 14px;
  transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
}

.text-link:hover svg {
  transform: translateX(3px);
}

.text-link:active {
  transform: scale(0.97);
}

/* ============ 1. HERO ============ */
.hero {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 6rem) clamp(1rem, 4vw, 2.5rem) clamp(4rem, 8vw, 7rem);
  display: flex;
  align-items: center;
}

.hero-grid {
  display: grid;
  /* minmax(0,1fr) : sans le min 0, la piste ne peut pas rétrécir sous le
     min-content du <pre> de la commande curl → colonne 515px clippée à 375px */
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(2rem, 4vw, 3rem);
  width: 100%;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero-grid {
    grid-template-columns: minmax(0, 46%) 1fr;
  }
}

.hero-lede {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  max-width: 36rem;
  min-width: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  padding: 0.34rem 0.85rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--accent-cyan);
  background: color-mix(in srgb, var(--accent-cyan) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan) 26%, transparent);
  border-radius: 999px;
}

.hero-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-cyan) 24%, transparent);
  animation: pulseDot 2.2s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero-title {
  font-size: clamp(2.3rem, 4.6vw, 3.75rem);
  line-height: 1.12;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  word-break: normal;
  overflow-wrap: break-word;
  padding-bottom: 0.08em;
}

.hero-sub {
  max-width: 34rem;
  font-size: clamp(1rem, 1.25vw, 1.14rem);
  line-height: 1.6;
  color: var(--text-secondary);
}

.hero-install {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.9rem;
  overflow: hidden;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.hero-install-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.9rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.hero-install-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.hero-install-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.45rem;
  transition: color 0.18s, background 0.18s, border-color 0.18s, transform 0.08s ease;
}

.hero-install-copy:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.hero-install-copy:active {
  transform: scale(0.97);
}

.copy-ic {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.copy-ic svg {
  width: 13px;
  height: 13px;
}

.copy-ic.is-done {
  color: var(--status-success);
}

.copy-enter-active,
.copy-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.copy-enter-from,
.copy-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

.hero-install-cmd {
  margin: 0;
  padding: 1rem 1.05rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-primary);
  overflow-x: auto;
}

.prompt-sign {
  color: var(--accent-cyan);
  margin-right: 0.4rem;
}

.cmd-text {
  color: var(--text-primary);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.hero-micro {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.hero-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.hero-tilt {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 42rem;
}

.hero-glow {
  position: absolute;
  inset: -8% -4%;
  background:
    radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--accent-purple) 12%, transparent), transparent 70%);
  filter: blur(32px);
  z-index: 0;
  pointer-events: none;
}

/* ============ 2. PROOF BAR ============ */
.proof {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2.5rem);
}

.proof-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem 1rem;
  padding: 2rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

@media (min-width: 880px) {
  .proof-grid {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
  }
}

.proof-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.proof-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.3rem, 2.4vw, 1.8rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1.1;
}

.proof-label {
  font-size: 0.76rem;
  color: var(--text-muted);
  max-width: 16rem;
  line-height: 1.45;
}

/* ============ 3. PROBLEM ============ */
.section-problem {
  align-items: flex-start;
}

.ledger {
  width: 100%;
  max-width: 56rem;
}

.ledger-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0.5rem;
  padding: 1.6rem 0;
  border-top: 1px solid var(--border-color);
}

.ledger-row:last-child {
  border-bottom: 1px solid var(--border-color);
}

@media (max-width: 560px) {
  .ledger-row {
    grid-template-columns: 48px 1fr;
  }
}

.ledger-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, var(--accent-purple) 40%, transparent);
  padding-top: 0.2rem;
}

.ledger-title {
  margin-bottom: 0.5rem;
  font-size: clamp(1.1rem, 1.6vw, 1.3rem);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.ledger-desc {
  max-width: 40rem;
  font-size: 0.94rem;
  line-height: 1.65;
  color: var(--text-secondary);
}

.problem-transition {
  font-size: clamp(1.05rem, 1.5vw, 1.25rem);
  font-style: italic;
  font-weight: 500;
  color: var(--accent-purple);
}

/* ============ ZIG-ZAG LAYOUTS ============ */
.zig-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2rem, 4vw, 3.5rem);
  align-items: center;
}

@media (min-width: 1024px) {
  .zig-grid {
    grid-template-columns: 40% 1fr;
  }

  .zig-grid.is-reverse {
    grid-template-columns: 1fr 42%;
  }
}

@media (max-width: 1023px) {
  .zig-grid.is-reverse .zig-visual {
    order: 2;
  }
  .zig-grid.is-reverse .zig-text {
    order: 1;
  }
}

.zig-text {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.zig-visual {
  min-width: 0;
}

.zig-body {
  max-width: 38rem;
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--text-secondary);
}

.zig-note {
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* ============ 4. DEMO ============ */
.demo-bullets {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.demo-bullet {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}

.demo-bullet p {
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.demo-bullet strong {
  color: var(--text-primary);
  font-weight: 600;
}

.bullet-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 20%, transparent);
  border-radius: 0.55rem;
}

.bullet-icon :deep(svg) {
  width: 15px;
  height: 15px;
}

/* ============ 5. HOW IT WORKS ============ */
.steps {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  list-style: none;
  padding: 0;
}

@media (min-width: 840px) {
  .steps {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

.step {
  position: relative;
  padding: 1.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.step-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--accent-purple);
  font-weight: 700;
}

.step-title {
  font-size: 1.14rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.step-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.step-cmd {
  margin-top: auto;
  padding: 0.7rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.55rem;
  overflow-x: auto;
}

.step-connector {
  display: none;
}

@media (min-width: 840px) {
  .step-connector {
    display: block;
    position: absolute;
    top: 50%;
    right: -0.9rem;
    width: 1.3rem;
    height: 1px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent-purple) 30%, transparent), transparent);
  }
}

.how-note {
  font-size: 0.84rem;
  color: var(--text-muted);
}

/* ============ 6. BENTO ============ */
.bento {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}

@media (min-width: 720px) and (max-width: 1023px) {
  .bento {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-a {
    grid-column: span 2;
  }
  .bento-f {
    grid-column: span 2;
  }
}

@media (min-width: 1024px) {
  .bento {
    grid-template-columns: repeat(12, 1fr);
  }
  .bento-a { grid-column: span 7; grid-row: span 2; }
  .bento-b { grid-column: span 5; }
  .bento-c { grid-column: span 5; }
  .bento-d { grid-column: span 4; }
  .bento-e { grid-column: span 4; }
  .bento-f { grid-column: span 4; }
}

.bento-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1.15rem;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.25s ease;
}

.bento-item:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-purple) 36%, var(--border-color));
}

.bento-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 0.75rem;
  margin-bottom: 0.45rem;
}

.bento-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.bento-icon.is-purple { color: var(--accent-purple); background: color-mix(in srgb, var(--accent-purple) 12%, transparent); }
.bento-icon.is-cyan { color: var(--accent-cyan); background: color-mix(in srgb, var(--accent-cyan) 12%, transparent); }
.bento-icon.is-indigo { color: var(--accent-indigo); background: color-mix(in srgb, var(--accent-indigo) 12%, transparent); }
.bento-icon.is-rose { color: #f472b6; background: rgba(244, 114, 182, 0.12); }
.bento-icon.is-amber { color: #fbbf24; background: rgba(251, 191, 36, 0.12); }
.bento-icon.is-emerald { color: var(--status-success); background: color-mix(in srgb, var(--status-success) 12%, transparent); }

.bento-title {
  font-size: 1.14rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.bento-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.bento-demo {
  margin-top: auto;
  padding-top: 1.1rem;
}

/* ============ 7. COMPARE ============ */
.compare-table {
  overflow-x: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
}

.compare-head,
.compare-row {
  display: grid;
  grid-template-columns: minmax(10rem, 2.4fr) repeat(3, minmax(7rem, 1fr));
  align-items: center;
}

.compare-head {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.col-head {
  padding: 1rem 1.1rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.col-head.is-us {
  color: var(--accent-purple);
}

.compare-row {
  border-top: 1px solid var(--border-color);
  transition: background 0.18s ease;
}

.compare-row:hover {
  background: var(--bg-hover);
}

.cell {
  padding: 1rem 1.1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.cell.cell-label {
  color: var(--text-primary);
  font-weight: 500;
}

.cell.is-us {
  background: color-mix(in srgb, var(--accent-purple) 4%, transparent);
}

.ic {
  width: 18px;
  height: 18px;
}

.ic-ok { color: var(--status-success); }
.ic-off { color: var(--text-muted); opacity: 0.5; }
.ic-partial { color: #fbbf24; }

/* ============ 8. MEMORY ============ */
.check-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.check-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.check-list svg {
  width: 15px;
  height: 15px;
  flex: none;
  margin-top: 0.18rem;
  color: var(--status-success);
}

.mem-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1.15rem;
}

.mem-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.8rem 1.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.7rem;
}

.mem-node.is-core {
  color: var(--accent-purple);
  font-weight: 600;
  border-color: color-mix(in srgb, var(--accent-purple) 36%, transparent);
  background: color-mix(in srgb, var(--accent-purple) 7%, var(--bg-secondary));
}

.mem-sub {
  font-size: 0.62rem;
  font-weight: 400;
  color: var(--text-muted);
}

.mem-link line {
  stroke: color-mix(in srgb, var(--accent-purple) 45%, transparent);
  stroke-width: 2;
  stroke-dasharray: 4 6;
  animation: memDash 4s linear infinite;
}

@keyframes memDash {
  to { stroke-dashoffset: -40; }
}

/* ============ 9. PLANNING ============ */
.planning-bullet {
  max-width: 38rem;
  padding-left: 1rem;
  border-left: 2px solid var(--accent-purple);
  font-size: 0.92rem;
  line-height: 1.65;
  color: var(--text-secondary);
}

.plan-visual {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1.15rem;
}

.plan-chat {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.chat-msg {
  max-width: 85%;
  padding: 0.6rem 0.85rem;
  font-size: 0.8rem;
  line-height: 1.5;
  border-radius: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.chat-msg.is-user {
  align-self: flex-end;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent-purple) 12%, var(--bg-secondary));
  border-color: color-mix(in srgb, var(--accent-purple) 26%, transparent);
}

.chat-msg.is-ok {
  color: var(--status-success);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
}

.plan-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 480px) {
  .plan-cards {
    grid-template-columns: 1fr;
  }
}

.plan-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  font-size: 0.74rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.55rem;
}

.plan-card-pts {
  flex: none;
  padding: 0 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.64rem;
  font-variant-numeric: tabular-nums;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 22%, transparent);
  border-radius: 999px;
}

/* ============ 10. WHAT IS ============ */
.whatis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2rem, 4vw, 3.5rem);
  align-items: start;
}

@media (min-width: 1024px) {
  .whatis-grid {
    grid-template-columns: 55% 1fr;
  }
}

.whatis-text {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.whatis-body {
  max-width: 44rem;
  font-size: 0.95rem;
  line-height: 1.75;
  color: var(--text-secondary);
}

.whatis-updated {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.whatis-card {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: clamp(1.5rem, 2.5vw, 2rem);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1.15rem;
}

.stack-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.stack-list li {
  padding: 0.32rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
}

.stack-cmd {
  margin: 0;
  padding: 0.75rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.6rem;
  overflow-x: auto;
}

/* ============ 11. PRICING TEASER ============ */
.tiers {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}

@media (min-width: 840px) {
  .tiers {
    grid-template-columns: repeat(3, 1fr);
    align-items: stretch;
  }
}

.tier-card {
  position: relative;
  padding: 1.75rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.2s;
}

.tier-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-purple) 36%, var(--border-color));
}

.tier-card:active {
  transform: scale(0.97);
}

.tier-card.is-pro {
  border-color: color-mix(in srgb, var(--accent-purple) 55%, var(--border-color));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-purple) 40%, transparent), var(--shadow-md);
}

@media (min-width: 840px) {
  .tier-card.is-pro {
    transform: translateY(-0.5rem);
  }

  .tier-card.is-pro:hover {
    transform: translateY(-0.625rem);
  }

  .tier-card.is-pro:active {
    transform: translateY(-0.5rem) scale(0.97);
  }
}

.tier-chip {
  position: absolute;
  top: -0.7rem;
  left: 1.25rem;
  padding: 0.22rem 0.7rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: var(--accent-purple);
  border-radius: 999px;
}

.tier-name {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.tier-price {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.tier-price small {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
}

.tier-target {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.tier-features {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0.5rem 0 0;
  padding: 0.8rem 0 0;
  border-top: 1px solid var(--border-color);
  list-style: none;
}

.tier-features li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.tier-features svg {
  width: 13px;
  height: 13px;
  flex: none;
  margin-top: 0.2rem;
  color: var(--status-success);
}

.tier-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-purple);
}

.tier-cta svg {
  width: 14px;
  height: 14px;
  transition: transform 0.25s;
}

.tier-card:hover .tier-cta svg {
  transform: translateX(3px);
}

.tiers-note {
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: center;
}

/* ============ 12. FAQ ============ */
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

.faq-q::-webkit-details-marker {
  display: none;
}

.faq-q svg {
  width: 16px;
  height: 16px;
  flex: none;
  color: var(--text-muted);
  transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
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

/* ============ 13. CTA FINAL ============ */
.cta-panel {
  position: relative;
  padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem);
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
  .cta-panel {
    grid-template-columns: 1.4fr auto;
  }
}

.cta-title {
  font-size: clamp(1.7rem, 3.4vw, 2.6rem);
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: -0.02em;
  margin-bottom: 0.8rem;
}

.cta-sub {
  max-width: 34rem;
  font-size: 0.98rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.cta-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.cta-mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(35% 60% at 85% 30%, color-mix(in srgb, var(--accent-purple) 16%, transparent), transparent 65%),
    radial-gradient(30% 50% at 15% 85%, color-mix(in srgb, var(--accent-cyan) 12%, transparent), transparent 65%);
  pointer-events: none;
  z-index: 0;
  animation: meshDrift 18s ease-in-out infinite alternate;
}

@keyframes meshDrift {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-1.5%, 1.5%, 0); }
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .cta-mesh,
  .hero-badge-dot,
  .mem-link line {
    animation: none !important;
  }
}
</style>
