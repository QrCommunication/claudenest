<template>
  <div class="auth-shell">
    <GrainOverlay />

    <aside class="auth-aside">
      <router-link to="/" class="aside-logo">
        <Logo variant="full" size="sm" />
      </router-link>

      <div class="aside-content">
        <span class="aside-badge">
          <span class="aside-dot" />
          {{ t('landing.hero.badge') }}
        </span>
        <h2 class="aside-title">
          {{ t('landing.solution.title') }}
        </h2>
        <p class="aside-sub">{{ t('landing.solution.subtitle') }}</p>

        <ul class="aside-pillars">
          <li
            v-for="(p, idx) in pillars"
            :key="p"
            class="pillar"
            :style="{ '--i': idx }"
          >
            <span class="pillar-num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ t(`landing.solution.pillar_${idx + 1}.title`) }}</strong>
              <p>{{ t(`landing.solution.pillar_${idx + 1}.description`) }}</p>
            </div>
          </li>
        </ul>

        <footer class="aside-foot">
          <div class="aside-stats">
            <div v-for="s in stats" :key="s.key" class="aside-stat">
              <span class="stat-value">{{ s.value }}</span>
              <span class="stat-label">{{ t(`landing.hero.stats.${s.key}`) }}</span>
            </div>
          </div>
          <p class="aside-mit">MIT License · Self-hosted · No telemetry</p>
        </footer>
      </div>

      <div class="aside-glow" aria-hidden="true" />
    </aside>

    <main class="auth-main">
      <div class="auth-main-inner">
        <header class="auth-header">
          <router-link to="/" class="back-home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            {{ t('auth.back_to_login', 'Back to home') }}
          </router-link>
          <ThemeToggle variant="ghost" />
        </header>

        <div class="auth-mobile-logo">
          <Logo variant="full" size="sm" :to="'/'" />
        </div>

        <div class="auth-body">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import GrainOverlay from '@/components/public/GrainOverlay.vue';

const { t } = useI18n();

const pillars = ['pillar_1', 'pillar_2', 'pillar_3'];

const stats = [
  { key: 'agents', value: '5+' },
  { key: 'embeddings', value: '384d' },
  { key: 'latency', value: '<50ms' },
];
</script>

<style scoped>
.auth-shell {
  position: relative;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr;
  background: var(--bg-primary);
  color: var(--text-primary);
}

@media (min-width: 1000px) {
  .auth-shell {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }
}

/* ============ ASIDE ============ */
.auth-aside {
  position: relative;
  display: none;
  flex-direction: column;
  padding: clamp(2rem, 4vw, 3rem);
  background:
    radial-gradient(70% 80% at 20% 10%, rgba(168, 85, 247, 0.18), transparent 55%),
    radial-gradient(55% 60% at 90% 80%, rgba(34, 211, 238, 0.14), transparent 60%),
    var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
}

:root[data-theme='light'] .auth-aside {
  background:
    radial-gradient(70% 80% at 20% 10%, rgba(147, 51, 234, 0.12), transparent 55%),
    radial-gradient(55% 60% at 90% 80%, rgba(8, 145, 178, 0.08), transparent 60%),
    var(--bg-secondary);
}

@media (min-width: 1000px) {
  .auth-aside { display: flex; }
}

.aside-logo {
  position: relative;
  z-index: 2;
  align-self: flex-start;
}

.aside-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  margin-top: auto;
  margin-bottom: auto;
  max-width: 30rem;
}

.aside-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  padding: 0.35rem 0.85rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-cyan);
  background: color-mix(in srgb, var(--accent-cyan) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan) 26%, transparent);
  border-radius: 999px;
}

.aside-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-cyan) 22%, transparent);
  animation: pulseDot 2.2s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.aside-title {
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  line-height: 1.22;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary) 0%, color-mix(in srgb, var(--text-primary) 70%, var(--accent-purple)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  padding-bottom: 0.1em;
}

.aside-sub {
  max-width: 28rem;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text-secondary);
}

.aside-pillars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
  list-style: none;
  padding: 0;
}

.pillar {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  background: color-mix(in srgb, var(--bg-card) 82%, transparent);
  border: 1px solid var(--border-color);
  border-radius: 0.85rem;
  animation: pillarIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: calc(var(--i) * 0.1s + 0.2s);
}

@keyframes pillarIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.pillar-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-purple);
  letter-spacing: 0.08em;
  padding-top: 2px;
}

.pillar strong {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
}

.pillar p {
  font-size: 0.82rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.aside-foot {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.aside-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.aside-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo), var(--accent-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.aside-mit {
  font-size: 0.76rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.aside-glow {
  position: absolute;
  inset: auto -20% -30% -20%;
  height: 55%;
  background: radial-gradient(60% 100% at 50% 100%, rgba(168, 85, 247, 0.18), transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

/* ============ MAIN ============ */
.auth-main {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: clamp(1.25rem, 3vw, 2rem);
  z-index: 1;
}

.auth-main-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  max-width: 26rem;
  margin: 0 auto;
  gap: 1.5rem;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

.back-home {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.55rem;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}

.back-home svg {
  width: 14px;
  height: 14px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.back-home:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-color: var(--border-color);
}

.back-home:hover svg {
  transform: translateX(-2px);
}

.auth-mobile-logo {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

@media (min-width: 1000px) {
  .auth-mobile-logo { display: none; }
}

.auth-body {
  display: flex;
  flex-direction: column;
  margin: auto 0;
}
</style>
