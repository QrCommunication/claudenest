<template>
  <footer class="public-footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <Logo :to="'/'" variant="full" size="sm" />
        <p class="footer-tagline">{{ t('landing.footer.description') }}</p>
        <div class="footer-meta">
          <span class="meta-chip">
            <span class="meta-dot" />
            {{ t('landing.open_source.title') }}
          </span>
          <span class="meta-chip">MIT License</span>
        </div>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">{{ t('landing.footer.product') }}</h4>
        <router-link to="/" class="footer-link">{{ t('landing.nav.features') }}</router-link>
        <router-link to="/pricing" class="footer-link">{{ t('landing.nav.pricing') }}</router-link>
        <router-link to="/changelog" class="footer-link">{{ t('landing.footer.changelog') }}</router-link>
        <router-link to="/docs" class="footer-link">{{ t('docs.title', 'Documentation') }}</router-link>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">{{ t('landing.footer.resources') }}</h4>
        <router-link to="/docs/quickstart" class="footer-link">{{ t('landing.how_it_works.step_2.title') }}</router-link>
        <router-link to="/docs/installation" class="footer-link">{{ t('landing.how_it_works.step_1.title') }}</router-link>
        <router-link to="/docs/api/sessions" class="footer-link">{{ t('landing.footer.api_reference') }}</router-link>
        <a :href="githubUrl" rel="noreferrer" target="_blank" class="footer-link footer-link-ext">
          GitHub
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M10 7h7v7" /></svg>
        </a>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">{{ t('landing.footer.legal') }}</h4>
        <router-link to="/docs/terms" class="footer-link">{{ t('auth.terms_of_service') }}</router-link>
        <router-link to="/docs/privacy" class="footer-link">{{ t('auth.privacy_policy') }}</router-link>
        <a href="mailto:hello@claudenest.io" class="footer-link">hello@claudenest.io</a>
      </div>
    </div>

    <div class="footer-bottom">
      <p class="footer-copy">
        {{ t('landing.footer.copyright', { year }) }}
      </p>
      <div class="footer-actions">
        <span class="footer-stack">
          <span>{{ t('landing.footer.built_with') }}</span>
          <span class="stack-item">Laravel 11</span>
          <span class="stack-item">Vue 3</span>
          <span class="stack-item">pgvector</span>
          <span class="stack-item">Reverb</span>
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Logo from '@/components/common/Logo.vue';

const { t } = useI18n();

const year = computed(() => new Date().getFullYear());
const githubUrl = 'https://github.com/QrCommunication/claudenest';
</script>

<style scoped>
.public-footer {
  position: relative;
  padding: clamp(3rem, 6vw, 5.5rem) clamp(1rem, 4vw, 2.5rem) 2.5rem;
  border-top: 1px solid var(--border-color);
  background:
    radial-gradient(80% 120% at 0% 0%, rgba(168, 85, 247, 0.05), transparent 55%),
    radial-gradient(60% 100% at 100% 0%, rgba(34, 211, 238, 0.04), transparent 55%),
    var(--bg-primary);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (min-width: 720px) {
  .footer-grid {
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 3rem;
  }
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 320px;
}

.footer-tagline {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.footer-meta {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 999px;
}

.meta-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-success);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
  animation: pulseDot 2.4s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.footer-heading {
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: color 0.18s ease, transform 0.18s ease;
}

.footer-link:hover {
  color: var(--text-primary);
  transform: translateX(2px);
}

.footer-link-ext svg {
  width: 12px;
  height: 12px;
  opacity: 0.8;
}

.footer-bottom {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 1.75rem;
  border-top: 1px solid var(--border-color);
}

@media (min-width: 720px) {
  .footer-bottom {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.footer-copy {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.footer-actions {
  display: inline-flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-stack {
  display: inline-flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.72rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.stack-item {
  padding: 0.2rem 0.55rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.68rem;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.4rem;
}
</style>
