<template>
  <div class="min-h-screen bg-surface-1">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-surface-1/80 backdrop-blur-xl border-b border-skin">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <Logo variant="full" size="md" to="/" />
          <div class="flex items-center gap-4">
            <router-link to="/" class="text-sm text-skin-secondary hover:text-skin-primary transition-colors">
              Back to Home
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">CHANGELOG</p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-4" style="color: var(--text-primary)">
            Product <span class="gradient-text">Updates</span>
          </h1>
          <p class="text-lg" style="color: var(--text-secondary)">
            Latest improvements, features, and bug fixes for ClaudeNest
          </p>
        </div>

        <!-- Timeline -->
        <div class="relative">
          <!-- Timeline Line (Desktop) -->
          <div class="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-purple via-brand-indigo to-transparent"></div>

          <!-- Changelog Entries -->
          <div class="space-y-12">
            <div
              v-for="(entry, idx) in changelogEntries"
              :key="idx"
              v-motion
              :initial="{ opacity: 0, y: 30 }"
              :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 100, duration: 500 } }"
              class="relative"
              :class="idx % 2 === 0 ? 'md:pr-[calc(50%+2rem)]' : 'md:pl-[calc(50%+2rem)] md:text-right'"
            >
              <!-- Timeline Dot -->
              <div class="hidden md:block absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-purple ring-4 ring-surface-1"></div>

              <!-- Card -->
              <div class="landing-card p-6">
                <!-- Date & Version -->
                <div class="flex items-center gap-3 mb-3" :class="idx % 2 === 0 ? '' : 'md:justify-end'">
                  <time class="text-sm font-mono text-dark-4">{{ entry.date }}</time>
                  <span class="px-2 py-0.5 bg-brand-purple/10 text-brand-purple text-xs font-semibold rounded">
                    {{ entry.version }}
                  </span>
                </div>

                <!-- Title -->
                <h3 class="text-xl font-bold mb-3" style="color: var(--text-primary)">{{ entry.title }}</h3>

                <!-- Description -->
                <p class="mb-4 leading-relaxed" style="color: var(--text-secondary)">{{ entry.description }}</p>

                <!-- Changes -->
                <div class="space-y-2">
                  <div
                    v-for="(change, changeIdx) in entry.changes"
                    :key="changeIdx"
                    class="flex items-start gap-2"
                    :class="idx % 2 === 0 ? '' : 'md:flex-row-reverse md:text-right'"
                  >
                    <span
                      class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                      :class="changeTypeClasses[change.type]"
                    >
                      {{ change.type }}
                    </span>
                    <span class="text-sm" style="color: var(--text-secondary)">{{ change.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscribe Section -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 400, duration: 600 } }"
          class="mt-16 text-center landing-card p-8"
        >
          <h3 class="text-2xl font-bold mb-3" style="color: var(--text-primary)">Stay Updated</h3>
          <p class="mb-6" style="color: var(--text-secondary)">
            Subscribe to our newsletter to get notified about new features and updates.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="flex-1 px-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-white placeholder-dark-4 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            />
            <Button variant="primary" @click="subscribe">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from '@/composables/useToast';
import Logo from '@/components/common/Logo.vue';
import Button from '@/components/common/Button.vue';

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

const changeTypeClasses: Record<string, string> = {
  feat: 'bg-green-500/10 text-green-500',
  fix: 'bg-blue-500/10 text-blue-500',
  breaking: 'bg-red-500/10 text-red-500',
};

function subscribe(): void {
  if (!email.value) {
    toast.error('Error', 'Please enter your email address');
    return;
  }

  // TODO: Implement newsletter subscription
  toast.success('Subscribed!', 'You will receive updates about ClaudeNest');
  email.value = '';
}
</script>
