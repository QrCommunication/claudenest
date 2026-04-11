<template>
  <div class="page-public">
    <GrainOverlay />
    <PublicNav />

    <main class="page-main">
      <!-- ============ HERO ============ -->
      <section class="hero" id="top">
        <div class="hero-grid">
          <div class="hero-lede">
            <span class="hero-badge" v-motion :initial="{ opacity: 0, y: 8 }" :enter="{ opacity: 1, y: 0, transition: { delay: 80 } }">
              <span class="hero-badge-dot" />
              {{ t('landing.hero.badge') }}
            </span>

            <h1 class="hero-title" v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { delay: 140 } }">
              {{ t('landing.hero.title') }}<br />
              <GradientText variant="aurora">{{ t('landing.hero.title_highlight') }}</GradientText>
            </h1>

            <p class="hero-sub" v-motion :initial="{ opacity: 0, y: 12 }" :enter="{ opacity: 1, y: 0, transition: { delay: 220 } }">
              {{ t('landing.hero.subtitle') }}
            </p>

            <div class="hero-install" v-motion :initial="{ opacity: 0, y: 12 }" :enter="{ opacity: 1, y: 0, transition: { delay: 300 } }">
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

            <div class="hero-actions" v-motion :initial="{ opacity: 0, y: 12 }" :enter="{ opacity: 1, y: 0, transition: { delay: 360 } }">
              <router-link to="/register" class="btn-primary">
                {{ t('landing.hero.cta_primary') }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </router-link>
              <router-link to="/docs" class="btn-ghost">
                {{ t('landing.hero.cta_secondary') }}
              </router-link>
            </div>

            <p class="hero-micro" v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { delay: 420 } }">
              {{ t('landing.hero.micro_copy') }}
            </p>
          </div>

          <div class="hero-visual" v-motion :initial="{ opacity: 0, x: 24 }" :enter="{ opacity: 1, x: 0, transition: { delay: 240 } }">
            <div class="terminal">
              <div class="terminal-chrome">
                <span class="chrome-dot" data-c="r" />
                <span class="chrome-dot" data-c="y" />
                <span class="chrome-dot" data-c="g" />
                <span class="terminal-title">claudenest ~ multi-agent session</span>
                <span class="terminal-chip">
                  <span class="chip-dot" />
                  live
                </span>
              </div>
              <div class="terminal-body">
                <div
                  v-for="(line, idx) in terminalLines"
                  :key="idx"
                  class="term-line"
                  :style="{ animationDelay: `${line.delay}s` }"
                >
                  <span v-if="line.prompt" class="term-prompt">{{ line.prompt }}</span>
                  <span :class="['term-text', line.class]">{{ line.text }}</span>
                </div>
                <div class="term-cursor">
                  <span class="term-prompt">claudenest@pod</span>
                  <span class="term-bar">|</span>
                </div>
              </div>
              <div class="terminal-foot">
                <div
                  v-for="agent in agents"
                  :key="agent.name"
                  class="agent-chip"
                  :style="{ '--agent-color': agent.color }"
                >
                  <span class="agent-dot" />
                  <span class="agent-name">{{ agent.name }}</span>
                  <span class="agent-file">{{ agent.file }}</span>
                </div>
              </div>
            </div>

            <div class="terminal-glow" aria-hidden="true" />
          </div>
        </div>
      </section>

      <!-- ============ STATS STRIP ============ -->
      <section class="stats">
        <div class="stats-grid">
          <div
            v-for="(stat, idx) in stats"
            :key="stat.key"
            class="stat"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :visible-once="{ opacity: 1, y: 0, transition: { delay: idx * 60 } }"
          >
            <div class="stat-value"><GradientText>{{ stat.value }}</GradientText></div>
            <div class="stat-label">{{ t(`landing.hero.stats.${stat.key}`) }}</div>
          </div>
        </div>
      </section>

      <!-- ============ PROBLEM ============ -->
      <section class="section section-problem" id="problem">
        <SectionHeader
          :badge="t('landing.features.badge')"
          :title="t('landing.problem.title')"
          :subtitle="t('landing.problem.transition')"
        />
        <div class="problem-grid">
          <article v-for="(key, idx) in ['conflict','vanishing','blindfold']" :key="key" class="problem-card" v-motion :initial="{ opacity: 0, y: 12 }" :visible-once="{ opacity: 1, y: 0, transition: { delay: idx * 90 } }">
            <span class="problem-num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <h3 class="problem-title">{{ t(`landing.problem.${key}.title`) }}</h3>
            <p class="problem-desc">{{ t(`landing.problem.${key}.description`) }}</p>
          </article>
        </div>
      </section>

      <!-- ============ FEATURES BENTO ============ -->
      <section class="section section-features" id="features">
        <SectionHeader
          :badge="t('landing.features.badge')"
          align="center"
        >
          <template #title>
            {{ t('landing.features.title') }}<GradientText>{{ t('landing.features.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>
        <p class="features-sub">{{ t('landing.features.subtitle') }}</p>

        <div class="bento">
          <article class="bento-item" v-motion :initial="{ opacity: 0, y: 18 }" :visible-once="{ opacity: 1, y: 0 }">
            <div class="bento-icon is-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
            </div>
            <h3 class="bento-title">{{ t('landing.features.remote_access.title') }}</h3>
            <p class="bento-desc">{{ t('landing.features.remote_access.description') }}</p>
            <div class="bento-viz viz-globe">
              <div v-for="n in 6" :key="n" class="ring" :style="{ '--i': n }" />
            </div>
          </article>

          <article class="bento-item" v-motion :initial="{ opacity: 0, y: 18 }" :visible-once="{ opacity: 1, y: 0, transition: { delay: 80 } }">
            <div class="bento-icon is-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h3 class="bento-title">{{ t('landing.features.multi_agent.title') }}</h3>
            <p class="bento-desc">{{ t('landing.features.multi_agent.description') }}</p>
            <ul class="agent-queue">
              <li v-for="(a, i) in agents" :key="a.name" class="queue-row" :style="{ '--agent-color': a.color, '--i': i }">
                <span class="q-dot" />
                <span class="q-name">{{ a.name }}</span>
                <span class="q-file">{{ a.file }}</span>
                <span class="q-status">{{ a.status }}</span>
              </li>
            </ul>
          </article>

          <article class="bento-item" v-motion :initial="{ opacity: 0, y: 18 }" :visible-once="{ opacity: 1, y: 0, transition: { delay: 120 } }">
            <div class="bento-icon is-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
            <h3 class="bento-title">{{ t('landing.features.context_rag.title') }}</h3>
            <p class="bento-desc">{{ t('landing.features.context_rag.description') }}</p>
          </article>

          <article class="bento-item" v-motion :initial="{ opacity: 0, y: 18 }" :visible-once="{ opacity: 1, y: 0, transition: { delay: 160 } }">
            <div class="bento-icon is-rose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h3 class="bento-title">{{ t('landing.features.file_locking.title') }}</h3>
            <p class="bento-desc">{{ t('landing.features.file_locking.description') }}</p>
          </article>

          <article class="bento-item" v-motion :initial="{ opacity: 0, y: 18 }" :visible-once="{ opacity: 1, y: 0, transition: { delay: 140 } }">
            <div class="bento-icon is-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <h3 class="bento-title">{{ t('landing.features.real_time.title') }}</h3>
            <p class="bento-desc">{{ t('landing.features.real_time.description') }}</p>
            <div class="bento-viz viz-stream">
              <span v-for="n in 14" :key="n" class="stream-bar" :style="{ '--i': n }" />
            </div>
          </article>

          <article class="bento-item" v-motion :initial="{ opacity: 0, y: 18 }" :visible-once="{ opacity: 1, y: 0, transition: { delay: 200 } }">
            <div class="bento-icon is-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </div>
            <h3 class="bento-title">{{ t('landing.features.mcp_support.title') }}</h3>
            <p class="bento-desc">{{ t('landing.features.mcp_support.description') }}</p>
          </article>
        </div>
      </section>

      <!-- ============ HOW IT WORKS ============ -->
      <section class="section section-how" id="how">
        <SectionHeader
          :badge="t('landing.how_it_works.badge')"
        >
          <template #title>
            {{ t('landing.how_it_works.title') }}<GradientText>{{ t('landing.how_it_works.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>
        <p class="how-sub">{{ t('landing.how_it_works.subtitle') }}</p>

        <ol class="steps">
          <li
            v-for="(step, idx) in steps"
            :key="step.key"
            class="step"
            v-motion
            :initial="{ opacity: 0, y: 18 }"
            :visible-once="{ opacity: 1, y: 0, transition: { delay: idx * 110 } }"
          >
            <span class="step-num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <h3 class="step-title">{{ t(`landing.how_it_works.step_${idx + 1}.title`) }}</h3>
            <p class="step-desc">{{ t(`landing.how_it_works.step_${idx + 1}.description`) }}</p>
            <pre v-if="step.cmd" class="step-cmd"><span class="prompt-sign">$</span> {{ step.cmd }}</pre>
            <span v-if="idx < steps.length - 1" class="step-connector" aria-hidden="true" />
          </li>
        </ol>
      </section>

      <!-- ============ COMPARISON ============ -->
      <section class="section section-compare" id="compare">
        <SectionHeader
          :badge="t('landing.comparison.badge')"
          :subtitle="t('landing.comparison.subtitle')"
        >
          <template #title>
            {{ t('landing.comparison.title') }}<GradientText>{{ t('landing.comparison.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>

        <div class="compare-table">
          <div class="compare-head">
            <div class="col-head">{{ t('landing.comparison.feature_label') }}</div>
            <div class="col-head is-us">ClaudeNest</div>
            <div class="col-head">Swarm Tools</div>
            <div class="col-head">DIY Scripts</div>
          </div>
          <div v-for="row in comparisonRows" :key="row.key" class="compare-row">
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

      <!-- ============ TESTIMONIALS ============ -->
      <section class="section section-testi">
        <SectionHeader
          :badge="t('landing.testimonials.badge')"
          align="center"
        >
          <template #title>
            {{ t('landing.testimonials.title') }}<GradientText>{{ t('landing.testimonials.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>

        <div class="testi-grid">
          <figure
            v-for="i in [0, 1, 2]"
            :key="i"
            class="testi-card"
            v-motion
            :initial="{ opacity: 0, y: 16 }"
            :visible-once="{ opacity: 1, y: 0, transition: { delay: i * 90 } }"
          >
            <svg class="testi-quote" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.17 15H5a2 2 0 0 1-2-2V9a6 6 0 0 1 6-6v2a4 4 0 0 0-4 4h3a2 2 0 0 1 2 2v2a2 2 0 0 1-.83 2zm10 0H15a2 2 0 0 1-2-2V9a6 6 0 0 1 6-6v2a4 4 0 0 0-4 4h3a2 2 0 0 1 2 2v2a2 2 0 0 1-.83 2z" /></svg>
            <blockquote class="testi-text">{{ t(`landing.testimonials.items.${i}.quote`) }}</blockquote>
            <figcaption class="testi-foot">
              <span class="testi-avatar" :style="{ background: avatarBg(i) }">{{ initial(t(`landing.testimonials.items.${i}.name`)) }}</span>
              <span>
                <span class="testi-name">{{ t(`landing.testimonials.items.${i}.name`) }}</span>
                <span class="testi-role">{{ t(`landing.testimonials.items.${i}.role`) }}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- ============ PRICING TEASER ============ -->
      <section class="section section-pricing-teaser" id="pricing">
        <SectionHeader
          :badge="t('landing.pricing.badge')"
          :subtitle="t('landing.pricing.subtitle')"
        >
          <template #title>
            {{ t('landing.pricing.title') }}<GradientText>{{ t('landing.pricing.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>

        <div class="tease-row">
          <router-link
            v-for="tier in (['community','pro','enterprise'] as const)"
            :key="tier"
            to="/pricing"
            class="tease-card"
          >
            <span class="tease-name">{{ t(`landing.pricing.tiers.${tier}.name`) }}</span>
            <span class="tease-price">
              {{ t(`landing.pricing.tiers.${tier}.price`) }}
              <small v-if="tier === 'pro'">{{ t('landing.pricing.tiers.pro.period') }}</small>
            </span>
            <span class="tease-target">{{ t(`landing.pricing.tiers.${tier}.target`) }}</span>
            <span class="tease-cta">
              {{ t(`landing.pricing.tiers.${tier}.cta`) }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </span>
          </router-link>
        </div>
        <p class="tease-note">{{ t('landing.pricing.note') }}</p>
      </section>

      <!-- ============ FAQ ============ -->
      <section class="section section-faq">
        <SectionHeader align="center">
          <template #title>
            {{ t('landing.faq.title') }}<GradientText>{{ t('landing.faq.title_highlight') }}</GradientText>
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

      <!-- ============ FINAL CTA ============ -->
      <section class="section section-cta">
        <div class="cta-panel">
          <div class="cta-text">
            <h2 class="cta-title">
              {{ t('landing.cta.title') }}<GradientText>{{ t('landing.cta.title_highlight') }}</GradientText>
            </h2>
            <p class="cta-sub">{{ t('landing.cta.subtitle') }}</p>
          </div>
          <div class="cta-actions">
            <router-link to="/register" class="btn-primary">
              {{ t('landing.cta.cta_primary') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </router-link>
            <router-link to="/docs" class="btn-ghost">{{ t('landing.cta.cta_secondary') }}</router-link>
          </div>
          <div class="cta-mesh" aria-hidden="true" />
        </div>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { useI18n } from 'vue-i18n';
import PublicNav from '@/components/public/PublicNav.vue';
import PublicFooter from '@/components/public/PublicFooter.vue';
import GrainOverlay from '@/components/public/GrainOverlay.vue';
import SectionHeader from '@/components/public/SectionHeader.vue';
import GradientText from '@/components/public/GradientText.vue';

const { t } = useI18n();

const INSTALL_CMD = 'curl -fsSL https://claudenest.io/install-agent.sh | bash';

const copied = ref(false);
async function copyInstall() {
  try {
    await navigator.clipboard.writeText(INSTALL_CMD);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // ignore — env may not support clipboard
  }
}

const terminalLines = [
  { prompt: 'claudenest@pod', text: ' claudenest sessions list --live', class: 'term-cmd', delay: 0.2 },
  { prompt: '', text: 'Connected to 3 machines · 5 sessions · 2 shared projects', class: 'term-muted', delay: 0.6 },
  { prompt: '', text: '[pod-01] atlas    src/api/auth.ts       holds lock · 34s', class: 'term-ok', delay: 1.1 },
  { prompt: '', text: '[pod-01] nova     tests/auth.spec.ts    running suite', class: 'term-info', delay: 1.6 },
  { prompt: '', text: '[pod-02] ember    rag.query("session token refresh")', class: 'term-magenta', delay: 2.1 },
  { prompt: '', text: '>> task TSK-482 claimed by ember · files: 2 · ETA 00:42', class: 'term-warn', delay: 2.8 },
  { prompt: '', text: '>> context updated · +47 chunks embedded via bge-small', class: 'term-ok', delay: 3.4 },
];

const stats = [
  { key: 'agents', value: '5+' },
  { key: 'embeddings', value: '384d' },
  { key: 'latency', value: '<50ms' },
  { key: 'open_source', value: '100%' },
];

const agents = [
  { name: 'atlas', file: 'src/api/auth.ts', status: 'editing', color: '#a855f7' },
  { name: 'nova', file: 'tests/auth.spec.ts', status: 'testing', color: '#22d3ee' },
  { name: 'ember', file: 'migrations/2026_04_users.sql', status: 'waiting', color: '#f472b6' },
];

const steps = [
  { key: 'install', cmd: INSTALL_CMD },
  { key: 'pair', cmd: 'claudenest machines pair --token $CN_TOKEN' },
  { key: 'orchestrate', cmd: 'claudenest projects open --share src/' },
];

type SupportState = boolean | 'partial';

interface ComparisonRow {
  key: string;
  swarm: SupportState;
  diy: SupportState;
}

const comparisonRows: ComparisonRow[] = [
  { key: 'multi_agent', swarm: true, diy: false },
  { key: 'web_dashboard', swarm: false, diy: false },
  { key: 'mobile_app', swarm: false, diy: false },
  { key: 'rag_context', swarm: 'partial', diy: false },
  { key: 'file_locking', swarm: false, diy: false },
  { key: 'claude_specific', swarm: false, diy: false },
  { key: 'websocket', swarm: 'partial', diy: 'partial' },
  { key: 'mcp_support', swarm: false, diy: false },
  { key: 'open_source', swarm: true, diy: true },
];

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

function initial(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function avatarBg(i: number): string {
  const palettes = [
    'linear-gradient(135deg, #a855f7, #6366f1)',
    'linear-gradient(135deg, #22d3ee, #6366f1)',
    'linear-gradient(135deg, #f472b6, #a855f7)',
  ];
  return palettes[i % palettes.length];
}
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

/* ============ HERO ============ */
.hero {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 6rem) clamp(1rem, 4vw, 2.5rem) clamp(4rem, 8vw, 7rem);
  min-height: calc(100dvh - 64px);
  display: flex;
  align-items: center;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2rem, 4vw, 4rem);
  width: 100%;
  align-items: center;
}

@media (min-width: 960px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.95fr);
  }
}

.hero-lede {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  max-width: 36rem;
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
  font-size: clamp(2.4rem, 5.6vw, 4.4rem);
  line-height: 1.18;
  font-weight: 700;
  letter-spacing: -0.024em;
  color: var(--text-primary);
  word-break: normal;
  overflow-wrap: break-word;
  padding-bottom: 0.08em;
}

.hero-sub {
  max-width: 34rem;
  font-size: clamp(1rem, 1.25vw, 1.18rem);
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
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.45rem;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}

.hero-install-copy:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.hero-install-copy:active {
  transform: translateY(1px);
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

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 24px -10px rgba(168, 85, 247, 0.6);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
}

.btn-primary svg {
  width: 15px;
  height: 15px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 14px 30px -10px rgba(168, 85, 247, 0.7);
}

.btn-primary:hover svg {
  transform: translateX(3px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.2rem;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.7rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-ghost:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.hero-micro {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* ============ HERO TERMINAL ============ */
.hero-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.terminal-glow {
  position: absolute;
  inset: -10% -5% -10% -5%;
  background:
    radial-gradient(50% 50% at 50% 50%, rgba(168, 85, 247, 0.18), transparent 70%),
    radial-gradient(40% 40% at 80% 20%, rgba(34, 211, 238, 0.14), transparent 70%);
  filter: blur(30px);
  z-index: 0;
  pointer-events: none;
}

.terminal {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 34rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.7rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.chrome-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.chrome-dot[data-c='r'] { background: #ff5f57; }
.chrome-dot[data-c='y'] { background: #febc2e; }
.chrome-dot[data-c='g'] { background: #28c840; }

.terminal-title {
  margin-left: 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-muted);
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.terminal-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.55rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-success) 24%, transparent);
  border-radius: 999px;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-success);
  animation: pulseDot 1.8s ease-in-out infinite;
}

.terminal-body {
  position: relative;
  padding: 1rem 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  line-height: 1.65;
  min-height: 240px;
  background: var(--bg-primary);
}

.term-line {
  opacity: 0;
  transform: translateY(4px);
  animation: lineIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes lineIn {
  to { opacity: 1; transform: translateY(0); }
}

.term-prompt {
  color: var(--accent-cyan);
  margin-right: 0.35rem;
}

.term-text.term-cmd { color: var(--text-primary); }
.term-text.term-muted { color: var(--text-muted); }
.term-text.term-ok { color: var(--status-success); }
.term-text.term-info { color: var(--accent-cyan); }
.term-text.term-warn { color: #fbbf24; }
.term-text.term-magenta { color: #f472b6; }

.term-cursor {
  display: inline-flex;
  gap: 0.3rem;
  margin-top: 0.3rem;
}

.term-bar {
  color: var(--accent-cyan);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.terminal-foot {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.agent-chip {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.65rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.55rem;
  font-size: 0.68rem;
  font-family: 'JetBrains Mono', monospace;
}

.agent-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--agent-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--agent-color) 22%, transparent);
}

.agent-name {
  color: var(--agent-color);
  font-weight: 600;
}

.agent-file {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============ STATS ============ */
.stats {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2.5rem);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  padding: 2rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

@media (min-width: 720px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.8rem 1.2rem;
  border-right: 1px solid var(--border-color);
}

.stat:last-child { border-right: none; }

@media (max-width: 719px) {
  .stat:nth-child(2n) { border-right: none; }
  .stat:nth-child(-n+2) { border-bottom: 1px solid var(--border-color); padding-bottom: 1.2rem; }
  .stat:nth-child(n+3) { padding-top: 1.2rem; }
}

.stat-value {
  font-size: clamp(1.8rem, 3.4vw, 2.6rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ============ PROBLEM ============ */
.problem-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 840px) {
  .problem-grid { grid-template-columns: repeat(3, 1fr); }
}

.problem-card {
  position: relative;
  padding: 1.75rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
}

.problem-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-hover);
}

.problem-num {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--accent-purple);
  letter-spacing: 0.08em;
  margin-bottom: 0.9rem;
}

.problem-title {
  margin-bottom: 0.6rem;
  font-size: 1.12rem;
  font-weight: 600;
  line-height: 1.3;
}

.problem-desc {
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* ============ FEATURES BENTO ============ */
.features-sub {
  max-width: 42rem;
  margin: 0 auto;
  text-align: center;
  font-size: clamp(0.98rem, 1.1vw, 1.1rem);
  color: var(--text-secondary);
}

.bento {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}

@media (min-width: 720px) {
  .bento {
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: minmax(14rem, auto);
  }
  .bento-item { grid-column: span 3; }
  .bento-item:nth-child(1) { grid-column: span 4; }
  .bento-item:nth-child(2) { grid-column: span 2; grid-row: span 2; }
  .bento-item:nth-child(3) { grid-column: span 2; }
  .bento-item:nth-child(4) { grid-column: span 2; }
  .bento-item:nth-child(5) { grid-column: span 4; }
  .bento-item:nth-child(6) { grid-column: span 6; }
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
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
}

.bento-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 80% at 85% 0%, color-mix(in srgb, var(--accent-purple) 10%, transparent), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.bento-item:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-purple) 36%, var(--border-color));
}

.bento-item:hover::before { opacity: 1; }

.bento-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 0.75rem;
  margin-bottom: 0.45rem;
}

.bento-icon svg {
  width: 20px;
  height: 20px;
}

.bento-icon.is-purple { color: var(--accent-purple); background: color-mix(in srgb, var(--accent-purple) 12%, transparent); }
.bento-icon.is-cyan { color: var(--accent-cyan); background: color-mix(in srgb, var(--accent-cyan) 12%, transparent); }
.bento-icon.is-indigo { color: var(--accent-indigo); background: color-mix(in srgb, var(--accent-indigo) 12%, transparent); }
.bento-icon.is-rose { color: #f472b6; background: rgba(244, 114, 182, 0.12); }
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

.bento-viz {
  position: relative;
  margin-top: auto;
  padding-top: 1.25rem;
}

.viz-globe {
  height: 110px;
  overflow: hidden;
}

.viz-globe .ring {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: calc(50px * var(--i));
  height: calc(50px * var(--i));
  border: 1px solid color-mix(in srgb, var(--accent-purple) 24%, transparent);
  border-radius: 50%;
  transform: translate(-50%, 50%);
  animation: ringPulse 4.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.25s);
}

@keyframes ringPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

.agent-queue {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.6rem;
  list-style: none;
  padding: 0;
}

.queue-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.55rem 0.7rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.55rem;
  font-size: 0.74rem;
  font-family: 'JetBrains Mono', monospace;
  animation: queueIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: calc(var(--i) * 0.1s + 0.2s);
}

@keyframes queueIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.q-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--agent-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--agent-color) 22%, transparent);
}

.q-name { color: var(--agent-color); font-weight: 600; grid-column: 2; }
.q-file { grid-column: 2; color: var(--text-muted); font-size: 0.68rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.q-status { color: var(--text-secondary); font-size: 0.66rem; }

.viz-stream {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 3px;
  align-items: end;
  height: 60px;
}

.stream-bar {
  height: 100%;
  background: linear-gradient(180deg, var(--accent-cyan), var(--accent-indigo));
  border-radius: 2px;
  opacity: 0.4;
  transform-origin: bottom;
  animation: barPulse 2.4s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes barPulse {
  0%, 100% { transform: scaleY(0.35); opacity: 0.35; }
  50% { transform: scaleY(1); opacity: 0.9; }
}

/* ============ HOW IT WORKS ============ */
.how-sub {
  max-width: 38rem;
  font-size: 1rem;
  color: var(--text-secondary);
}

.steps {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  list-style: none;
  padding: 0;
}

@media (min-width: 840px) {
  .steps { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
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
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo), var(--accent-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
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

/* ============ COMPARE ============ */
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

.compare-row:hover { background: var(--bg-hover); }

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
.ic-partial { color: var(--status-warning); }

/* ============ TESTIMONIALS ============ */
.testi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;
}

@media (min-width: 840px) {
  .testi-grid { grid-template-columns: repeat(3, 1fr); }
}

.testi-card {
  position: relative;
  padding: 1.75rem 1.6rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s;
}

.testi-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-hover);
}

.testi-quote {
  width: 22px;
  height: 22px;
  color: var(--accent-purple);
  opacity: 0.6;
}

.testi-text {
  margin: 0;
  font-size: 0.96rem;
  line-height: 1.65;
  color: var(--text-primary);
}

.testi-foot {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 0.9rem;
  border-top: 1px solid var(--border-color);
}

.testi-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-purple) 12%, transparent);
  letter-spacing: 0.02em;
}

.testi-name {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.testi-role {
  display: block;
  font-size: 0.76rem;
  color: var(--text-muted);
}

/* ============ PRICING TEASER ============ */
.tease-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}

@media (min-width: 840px) {
  .tease-row { grid-template-columns: repeat(3, 1fr); }
}

.tease-card {
  position: relative;
  padding: 1.75rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s;
}

.tease-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-purple) 36%, var(--border-color));
}

.tease-name {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.tease-price {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.tease-price small {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
}

.tease-target {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
  min-height: 2.8em;
}

.tease-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-purple);
  transition: transform 0.25s;
}

.tease-cta svg {
  width: 14px;
  height: 14px;
  transition: transform 0.25s;
}

.tease-card:hover .tease-cta svg {
  transform: translateX(3px);
}

.tease-note {
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: center;
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

/* ============ CTA FINAL ============ */
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
  .cta-panel { grid-template-columns: 1.4fr auto; }
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
    radial-gradient(35% 60% at 85% 30%, color-mix(in srgb, var(--accent-purple) 18%, transparent), transparent 65%),
    radial-gradient(30% 50% at 15% 85%, color-mix(in srgb, var(--accent-cyan) 14%, transparent), transparent 65%);
  pointer-events: none;
  z-index: 0;
  animation: meshDrift 18s ease-in-out infinite alternate;
}

@keyframes meshDrift {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-1.5%, 1.5%, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .cta-mesh,
  .stream-bar,
  .ring,
  .hero-badge-dot,
  .chip-dot {
    animation: none !important;
  }
}
</style>
