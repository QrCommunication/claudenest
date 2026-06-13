<template>
  <div class="page-public">
    <GrainOverlay />
    <PublicNav />

    <main class="page-main">
      <section class="pricing-hero">
        <SectionHeader
          :badge="t('landing.unlimited.badge')"
          :subtitle="t('landing.unlimited.subtitle')"
          align="center"
        >
          <template #title>
            {{ t('landing.unlimited.title') }}<GradientText>{{ t('landing.unlimited.title_highlight') }}</GradientText>
          </template>
        </SectionHeader>
      </section>

      <section class="free-wrap">
        <article
          class="free-card"
          v-motion
          :initial="{ opacity: 0, y: 18 }"
          :visible-once="{ opacity: 1, y: 0 }"
        >
          <div class="free-price">
            <span class="free-amount">{{ t('docPricing.freeForever') }}</span>
          </div>

          <ul class="free-features">
            <li v-for="i in 5" :key="i" class="free-feat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span>{{ t(`landing.unlimited.points.${i - 1}`) }}</span>
            </li>
          </ul>

          <router-link to="/register" class="free-cta">
            {{ t('landing.cta.cta_primary') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </router-link>
        </article>

        <p class="pricing-note">{{ t('landing.unlimited.note') }}</p>
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
import { useI18n } from 'vue-i18n';
import PublicNav from '@/components/public/PublicNav.vue';
import PublicFooter from '@/components/public/PublicFooter.vue';
import GrainOverlay from '@/components/public/GrainOverlay.vue';
import SectionHeader from '@/components/public/SectionHeader.vue';
import GradientText from '@/components/public/GradientText.vue';

const { t } = useI18n();
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

/* ============ FREE CARD ============ */
.free-wrap {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2.5rem);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.free-card {
  position: relative;
  width: 100%;
  max-width: 40rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(2rem, 4vw, 2.75rem);
  background: var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 44%, var(--border-color));
  border-radius: 1.2rem;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent-purple) 30%, transparent),
    0 24px 60px -30px rgba(168, 85, 247, 0.5);
}

.free-price {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.free-amount {
  font-size: clamp(2.2rem, 4vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--accent-purple);
}

.free-features {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.free-feat {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: flex-start;
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.free-feat svg {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: var(--accent-purple);
  flex-shrink: 0;
}

.free-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.2rem;
  margin-top: auto;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 24px -10px rgba(168, 85, 247, 0.6);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
}

.free-cta svg {
  width: 15px;
  height: 15px;
  transition: transform 0.25s;
}

.free-cta:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 14px 30px -10px rgba(168, 85, 247, 0.7);
}

.free-cta:hover svg { transform: translateX(3px); }
.free-cta:active { transform: translateY(0); }

.pricing-note {
  max-width: 38rem;
  margin: 1.5rem auto 0;
  padding: 0 1rem;
  font-size: 0.85rem;
  text-align: center;
  color: var(--text-muted);
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
