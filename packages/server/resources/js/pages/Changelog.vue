<template>
  <div class="changelog-page">
    <!-- Navigation -->
    <nav class="changelog-nav">
      <div class="nav-inner">
        <Logo variant="full" size="md" to="/" />
        <router-link to="/" class="back-link">Back to Home</router-link>
      </div>
    </nav>

    <main class="changelog-main">
      <!-- Header -->
      <header class="changelog-header">
        <span class="changelog-badge">CHANGELOG</span>
        <h1 class="changelog-title">
          Product <span class="gradient-text">Updates</span>
        </h1>
        <p class="changelog-subtitle">
          Latest improvements, features, and bug fixes for ClaudeNest
        </p>
      </header>

      <!-- Timeline -->
      <div class="timeline">
        <div class="timeline-line" />

        <article
          v-for="(entry, idx) in changelogEntries"
          :key="idx"
          class="timeline-entry"
        >
          <div class="timeline-dot" />

          <div class="entry-card">
            <!-- Date + Version -->
            <div class="entry-meta">
              <time class="entry-date">{{ entry.date }}</time>
              <span class="entry-version">{{ entry.version }}</span>
            </div>

            <h3 class="entry-title">{{ entry.title }}</h3>
            <p class="entry-desc">{{ entry.description }}</p>

            <!-- Changes -->
            <div class="entry-changes">
              <div
                v-for="(change, ci) in entry.changes"
                :key="ci"
                class="change-item"
              >
                <span :class="['change-badge', `badge-${change.type}`]">{{ change.type }}</span>
                <span class="change-text">{{ change.text }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Subscribe Section -->
      <section class="subscribe-section">
        <h3 class="subscribe-title">Stay Updated</h3>
        <p class="subscribe-desc">
          Subscribe to our newsletter to get notified about new features and updates.
        </p>
        <div class="subscribe-form">
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="subscribe-input"
          />
          <button class="subscribe-btn" @click="subscribe">Subscribe</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from '@/composables/useToast';
import Logo from '@/components/common/Logo.vue';

const toast = useToast();
const email = ref('');

interface ChangelogChange {
  type: 'feat' | 'fix' | 'breaking';
  text: string;
}

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: ChangelogChange[];
}

const changelogEntries: ChangelogEntry[] = [
  {
    version: 'v1.2.0',
    date: '2026-02-15',
    title: 'Multi-Agent Dashboard & Performance Improvements',
    description: 'Major update introducing real-time multi-agent coordination dashboard and significant performance optimizations for large projects.',
    changes: [
      { type: 'feat', text: 'New multi-agent coordination dashboard with live status updates' },
      { type: 'feat', text: 'Task dependency graph visualization' },
      { type: 'feat', text: 'Context RAG search now 3x faster with optimized pgvector indexes' },
      { type: 'fix', text: 'File lock race condition when multiple agents access same file' },
      { type: 'fix', text: 'WebSocket reconnection memory leak' },
    ],
  },
  {
    version: 'v1.1.0',
    date: '2026-02-01',
    title: 'MCP Integration & Mobile App Beta',
    description: 'Full Model Context Protocol support with automatic MCP server discovery, plus our first mobile app beta release.',
    changes: [
      { type: 'feat', text: 'Model Context Protocol (MCP) integration with automatic discovery' },
      { type: 'feat', text: 'Mobile app beta for iOS and Android' },
      { type: 'feat', text: 'Agent health monitoring and auto-restart on failure' },
      { type: 'breaking', text: 'API endpoints now require v2 header for new features' },
      { type: 'fix', text: 'Session logs pagination performance issue' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-01-15',
    title: 'Production Release',
    description: 'First stable production release with complete feature set including context RAG, file locking, and task coordination.',
    changes: [
      { type: 'feat', text: 'Complete multi-agent orchestration system' },
      { type: 'feat', text: 'Context RAG with pgvector and BGE embeddings' },
      { type: 'feat', text: 'File locking system for conflict prevention' },
      { type: 'feat', text: 'Atomic task claiming and coordination' },
      { type: 'feat', text: 'Real-time WebSocket communication with Laravel Reverb' },
      { type: 'feat', text: 'Web dashboard with xterm.js terminal emulation' },
    ],
  },
  {
    version: 'v0.9.0-beta',
    date: '2026-01-01',
    title: 'Beta Release',
    description: 'Public beta release with core features for early adopters and testing.',
    changes: [
      { type: 'feat', text: 'Basic remote Claude Code session management' },
      { type: 'feat', text: 'Simple context sharing between agents' },
      { type: 'feat', text: 'OAuth authentication (Google, GitHub)' },
      { type: 'fix', text: 'PTY buffer overflow on large outputs' },
      { type: 'fix', text: 'Terminal resize event handling' },
    ],
  },
];

function subscribe(): void {
  if (!email.value) {
    toast.error('Error', 'Please enter your email address');
    return;
  }
  toast.success('Subscribed!', 'You will receive updates about ClaudeNest');
  email.value = '';
}
</script>

<style scoped>
.changelog-page {
  min-height: 100vh;
  background-color: var(--bg-primary, var(--surface-1));
}

/* ── Navigation ────────────────────── */
.changelog-nav {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  background-color: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 80%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-color, var(--border));
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--text-primary);
}

/* ── Main ──────────────────────────── */
.changelog-main {
  padding: 8rem 1.5rem 5rem;
  max-width: 720px;
  margin: 0 auto;
}

/* ── Header ────────────────────────── */
.changelog-header {
  text-align: center;
  margin-bottom: 4rem;
}

.changelog-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--accent-purple, #a855f7);
  margin-bottom: 0.75rem;
}

.changelog-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 1rem;
  line-height: 1.15;
}

.changelog-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ── Timeline ──────────────────────── */
.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline-line {
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--accent-purple, #a855f7),
    var(--accent-indigo, #6366f1),
    transparent
  );
}

/* ── Timeline Entry ────────────────── */
.timeline-entry {
  position: relative;
  margin-bottom: 2.5rem;
}

.timeline-dot {
  position: absolute;
  left: -2rem;
  top: 1.5rem;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-purple, #a855f7);
  box-shadow: 0 0 0 4px var(--bg-primary, var(--surface-1));
  transform: translateX(calc(-50% + 8px));
}

.entry-card {
  padding: 1.5rem;
  border-radius: 12px;
  background-color: var(--bg-card, var(--surface-2));
  border: 1px solid var(--border-color, var(--border));
  transition: border-color 0.2s;
}

.entry-card:hover {
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, var(--border-color, var(--border)));
}

/* ── Entry Meta ────────────────────── */
.entry-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.entry-date {
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
}

.entry-version {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-purple, #a855f7);
  background-color: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-radius: 4px;
}

.entry-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.entry-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem;
}

/* ── Changes ───────────────────────── */
.entry-changes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.change-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.change-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
  text-transform: uppercase;
  margin-top: 2px;
}

.badge-feat {
  background-color: color-mix(in srgb, #22c55e 12%, transparent);
  color: #22c55e;
}

.badge-fix {
  background-color: color-mix(in srgb, #3b82f6 12%, transparent);
  color: #3b82f6;
}

.badge-breaking {
  background-color: color-mix(in srgb, #ef4444 12%, transparent);
  color: #ef4444;
}

.change-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ── Subscribe ─────────────────────── */
.subscribe-section {
  margin-top: 4rem;
  padding: 2rem;
  border-radius: 16px;
  background-color: var(--bg-card, var(--surface-2));
  border: 1px solid var(--border-color, var(--border));
  text-align: center;
}

.subscribe-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.subscribe-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
}

.subscribe-form {
  display: flex;
  gap: 0.75rem;
  max-width: 400px;
  margin: 0 auto;
}

.subscribe-input {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  background-color: var(--bg-primary, var(--surface-1));
  border: 1px solid var(--border-color, var(--border));
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.subscribe-input::placeholder {
  color: var(--text-muted);
}

.subscribe-input:focus {
  border-color: var(--accent-purple, #a855f7);
}

.subscribe-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.subscribe-btn:hover {
  opacity: 0.9;
}

/* ── Responsive ────────────────────── */
@media (max-width: 768px) {
  .changelog-main {
    padding: 7rem 1rem 3rem;
  }

  .subscribe-form {
    flex-direction: column;
  }
}
</style>
