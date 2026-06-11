<template>
  <div class="page-public">
    <GrainOverlay />
    <PublicNav />

    <main class="page-main">
      <section class="changelog-hero">
        <SectionHeader
          :badge="t('landing.footer.changelog', 'Changelog')"
          :subtitle="$t('docChangelog.heroSubtitle')"
          align="center"
        >
          <template #title>
            {{ $t('docChangelog.heroTitleLead') }} <GradientText>{{ $t('docChangelog.heroTitleAccent') }}</GradientText>
          </template>
        </SectionHeader>

        <div class="filter-row" role="group" :aria-label="$t('docChangelog.filterReleasesLabel')">
          <button
            v-for="f in filters"
            :key="f.id"
            type="button"
            class="filter-chip"
            :class="{ 'is-active': activeFilter === f.id }"
            @click="activeFilter = f.id"
          >
            <span v-if="f.swatch" class="chip-swatch" :data-type="f.id" />
            {{ f.label }}
            <span class="chip-count">{{ countFor(f.id) }}</span>
          </button>
        </div>
      </section>

      <section class="timeline-wrap">
        <div class="timeline" aria-live="polite">
          <div class="timeline-spine" aria-hidden="true" />

          <article
            v-for="(entry, idx) in filteredEntries"
            :key="entry.version"
            class="entry"
            v-motion
            :initial="{ opacity: 0, y: 24 }"
            :visible-once="{ opacity: 1, y: 0, transition: { delay: idx * 80 } }"
          >
            <div class="entry-marker">
              <span class="marker-pulse" />
              <span class="marker-dot" />
            </div>

            <div class="entry-card">
              <header class="entry-head">
                <time class="entry-date">{{ entry.date }}</time>
                <span class="entry-version">{{ entry.version }}</span>
              </header>

              <h3 class="entry-title">{{ entry.title }}</h3>
              <p class="entry-desc">{{ entry.description }}</p>

              <ul class="entry-changes">
                <li
                  v-for="(change, ci) in filteredChanges(entry)"
                  :key="ci"
                  class="change-line"
                >
                  <span class="change-tag" :data-type="change.type">{{ tagLabel(change.type) }}</span>
                  <span class="change-text">{{ change.text }}</span>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section class="section section-subscribe">
        <div class="subscribe-panel">
          <div>
            <h2 class="subscribe-title">{{ $t('docChangelog.subscribeTitle') }}</h2>
            <p class="subscribe-sub">{{ $t('docChangelog.subscribeSub') }}</p>
          </div>
          <form class="subscribe-form" @submit.prevent="subscribe">
            <input
              v-model="email"
              type="email"
              :placeholder="t('auth.email_placeholder')"
              class="subscribe-input"
              autocomplete="email"
              required
            />
            <button type="submit" class="subscribe-btn">
              {{ $t('docChangelog.subscribeButton') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </button>
          </form>
        </div>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import PublicNav from '@/components/public/PublicNav.vue';
import PublicFooter from '@/components/public/PublicFooter.vue';
import GrainOverlay from '@/components/public/GrainOverlay.vue';
import SectionHeader from '@/components/public/SectionHeader.vue';
import GradientText from '@/components/public/GradientText.vue';

const { t, locale } = useI18n();
const toast = useToast();
const email = ref('');

function tr(en: string, fr: string): string {
  return locale.value?.toString().startsWith('fr') ? fr : en;
}

type ChangeType = 'feat' | 'fix' | 'breaking' | 'perf';
type FilterId = 'all' | ChangeType;

interface Change {
  type: ChangeType;
  text: string;
}

interface Entry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: Change[];
}

const entries = computed<Entry[]>(() => [
  {
    version: 'Mobile v0.6.0',
    date: t('docChangelog.v060mDate'),
    title: t('docChangelog.v060mTitle'),
    description: t('docChangelog.v060mDesc'),
    changes: [
      { type: 'feat', text: t('docChangelog.v060mChange1') },
      { type: 'feat', text: t('docChangelog.v060mChange2') },
      { type: 'feat', text: t('docChangelog.v060mChange3') },
      { type: 'perf', text: t('docChangelog.v060mChange4') },
      { type: 'fix', text: t('docChangelog.v060mChange5') },
      { type: 'fix', text: t('docChangelog.v060mChange6') },
    ],
  },
  {
    version: 'v1.4.0',
    date: t('docChangelog.v140Date'),
    title: t('docChangelog.v140Title'),
    description: t('docChangelog.v140Desc'),
    changes: [
      { type: 'feat', text: t('docChangelog.v140Change1') },
      { type: 'feat', text: t('docChangelog.v140Change2') },
      { type: 'perf', text: t('docChangelog.v140Change3') },
      { type: 'perf', text: t('docChangelog.v140Change4') },
      { type: 'fix', text: t('docChangelog.v140Change5') },
      { type: 'fix', text: t('docChangelog.v140Change6') },
      { type: 'fix', text: t('docChangelog.v140Change7') },
      { type: 'fix', text: t('docChangelog.v140Change8') },
    ],
  },
  {
    version: 'v1.3.0',
    date: t('docChangelog.v130Date'),
    title: t('docChangelog.v130Title'),
    description: t('docChangelog.v130Desc'),
    changes: [
      { type: 'feat', text: t('docChangelog.v130Change1') },
      { type: 'feat', text: t('docChangelog.v130Change2') },
      { type: 'perf', text: t('docChangelog.v130Change3') },
      { type: 'fix', text: t('docChangelog.v130Change4') },
    ],
  },
  {
    version: 'v1.2.0',
    date: t('docChangelog.v120Date'),
    title: t('docChangelog.v120Title'),
    description: t('docChangelog.v120Desc'),
    changes: [
      { type: 'feat', text: t('docChangelog.v120Change1') },
      { type: 'feat', text: t('docChangelog.v120Change2') },
      { type: 'perf', text: t('docChangelog.v120Change3') },
      { type: 'fix', text: t('docChangelog.v120Change4') },
      { type: 'fix', text: t('docChangelog.v120Change5') },
    ],
  },
  {
    version: 'v1.1.0',
    date: t('docChangelog.v110Date'),
    title: t('docChangelog.v110Title'),
    description: t('docChangelog.v110Desc'),
    changes: [
      { type: 'feat', text: t('docChangelog.v110Change1') },
      { type: 'feat', text: t('docChangelog.v110Change2') },
      { type: 'feat', text: t('docChangelog.v110Change3') },
      { type: 'breaking', text: t('docChangelog.v110Change4') },
      { type: 'fix', text: t('docChangelog.v110Change5') },
    ],
  },
  {
    version: 'v1.0.0',
    date: t('docChangelog.v100Date'),
    title: t('docChangelog.v100Title'),
    description: t('docChangelog.v100Desc'),
    changes: [
      { type: 'feat', text: t('docChangelog.v100Change1') },
      { type: 'feat', text: t('docChangelog.v100Change2') },
      { type: 'feat', text: t('docChangelog.v100Change3') },
      { type: 'feat', text: t('docChangelog.v100Change4') },
      { type: 'feat', text: t('docChangelog.v100Change5') },
      { type: 'feat', text: t('docChangelog.v100Change6') },
    ],
  },
]);

const filters = computed<{ id: FilterId; label: string; swatch: boolean }[]>(() => [
  { id: 'all', label: tr('All', 'Tout'), swatch: false },
  { id: 'feat', label: t('docChangelog.filterFeatures'), swatch: true },
  { id: 'perf', label: t('docChangelog.filterPerformance'), swatch: true },
  { id: 'fix', label: t('docChangelog.filterFixes'), swatch: true },
  { id: 'breaking', label: t('docChangelog.filterBreaking'), swatch: true },
]);

const activeFilter = ref<FilterId>('all');

const filteredEntries = computed(() => {
  if (activeFilter.value === 'all') return entries.value;
  return entries.value.filter((e) => e.changes.some((c) => c.type === activeFilter.value));
});

function filteredChanges(entry: Entry): Change[] {
  if (activeFilter.value === 'all') return entry.changes;
  return entry.changes.filter((c) => c.type === activeFilter.value);
}

function countFor(f: FilterId): number {
  if (f === 'all') return entries.value.length;
  return entries.value.filter((e) => e.changes.some((c) => c.type === f)).length;
}

const tagLabels: Record<ChangeType, { en: string; fr: string }> = {
  feat: { en: 'new', fr: 'new' },
  perf: { en: 'perf', fr: 'perf' },
  fix: { en: 'fix', fr: 'fix' },
  breaking: { en: 'breaking', fr: 'cassant' },
};

function tagLabel(type: ChangeType): string {
  if (type === 'perf') return t('docChangelog.tag_perf');
  if (type === 'breaking') return t('docChangelog.tag_breaking');
  const fr = locale.value?.toString().startsWith('fr');
  return fr ? tagLabels[type].fr : tagLabels[type].en;
}

async function subscribe(): Promise<void> {
  if (!email.value) {
    toast.error(t('common.error'), t('auth.email_required'));
    return;
  }
  toast.success(t('common.success'), t('docChangelog.subscribeSuccess'));
  email.value = '';
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

.page-main { position: relative; z-index: 1; }

.section {
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(4rem, 6vw, 6rem) clamp(1rem, 4vw, 2.5rem);
}

.changelog-hero {
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2.5rem) 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.filter-row {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-chip:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.filter-chip.is-active {
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 6px 16px -8px rgba(168, 85, 247, 0.5);
}

.chip-swatch {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.chip-swatch[data-type='feat'] { background: var(--accent-purple); }
.chip-swatch[data-type='perf'] { background: var(--accent-cyan); }
.chip-swatch[data-type='fix'] { background: var(--status-success); }
.chip-swatch[data-type='breaking'] { background: var(--status-warning); }

.chip-count {
  padding: 0.08rem 0.45rem;
  font-size: 0.68rem;
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
}

.filter-chip.is-active .chip-count {
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.24);
}

/* ============ TIMELINE ============ */
.timeline-wrap {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2.5rem) 4rem;
}

.timeline {
  position: relative;
  max-width: 48rem;
  margin: 0 auto;
  padding-left: 2.5rem;
}

.timeline-spine {
  position: absolute;
  top: 0.6rem;
  bottom: 0.6rem;
  left: 0.85rem;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--border-color) 6%,
    var(--border-color) 94%,
    transparent 100%
  );
}

.entry {
  position: relative;
  padding: 1rem 0 2rem;
}

.entry-marker {
  position: absolute;
  left: -2.5rem;
  top: 1.4rem;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--accent-purple);
  border: 2px solid var(--bg-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-purple) 18%, transparent);
  z-index: 2;
  position: relative;
}

.marker-pulse {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent-purple) 22%, transparent);
  animation: markerPulse 2.6s ease-out infinite;
}

@keyframes markerPulse {
  0% { transform: scale(0.7); opacity: 0.7; }
  100% { transform: scale(1.4); opacity: 0; }
}

.entry-card {
  position: relative;
  padding: 1.5rem 1.5rem 1.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  transition: border-color 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.entry-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.entry-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.entry-date {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.entry-version {
  padding: 0.15rem 0.55rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 26%, transparent);
  border-radius: 999px;
}

.entry-title {
  font-size: 1.18rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin-bottom: 0.5rem;
}

.entry-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.entry-changes {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  list-style: none;
}

.change-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.7rem;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.change-tag {
  padding: 0.15rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 0.4rem;
  white-space: nowrap;
  align-self: flex-start;
  margin-top: 2px;
}

.change-tag[data-type='feat'] {
  color: var(--accent-purple);
  background: color-mix(in srgb, var(--accent-purple) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 24%, transparent);
}
.change-tag[data-type='perf'] {
  color: var(--accent-cyan);
  background: color-mix(in srgb, var(--accent-cyan) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan) 24%, transparent);
}
.change-tag[data-type='fix'] {
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-success) 24%, transparent);
}
.change-tag[data-type='breaking'] {
  color: var(--status-warning);
  background: color-mix(in srgb, var(--status-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-warning) 24%, transparent);
}

/* ============ SUBSCRIBE ============ */
.subscribe-panel {
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

.subscribe-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(40% 60% at 100% 0%, color-mix(in srgb, var(--accent-purple) 14%, transparent), transparent 65%),
    radial-gradient(30% 50% at 0% 100%, color-mix(in srgb, var(--accent-cyan) 12%, transparent), transparent 65%);
  pointer-events: none;
}

.subscribe-panel > * { position: relative; z-index: 1; }

@media (min-width: 840px) {
  .subscribe-panel { grid-template-columns: 1.4fr auto; }
}

.subscribe-title {
  font-size: clamp(1.4rem, 2.6vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 0.4rem;
}

.subscribe-sub {
  max-width: 32rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.subscribe-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  width: 100%;
  max-width: 28rem;
}

.subscribe-input {
  padding: 0.8rem 1rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.6rem;
}

.subscribe-input::placeholder { color: var(--text-muted); }

.subscribe-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent-purple) 55%, var(--border-color));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-purple) 16%, transparent);
}

.subscribe-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.8rem 1.2rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.6rem;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 8px 20px -8px rgba(168, 85, 247, 0.5);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.subscribe-btn svg {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
}

.subscribe-btn:hover { transform: translateY(-1px); }
.subscribe-btn:hover svg { transform: translateX(2px); }

@media (prefers-reduced-motion: reduce) {
  .marker-pulse { animation: none; }
}
</style>
