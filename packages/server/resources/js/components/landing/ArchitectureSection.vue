<template>
  <section id="architecture" class="py-24 px-4 sm:px-6 lg:px-8 section-alt relative">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// ARCHITECTURE</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">
          {{ $t('landing.architecture.title') }}
          <span class="gradient-text">{{ $t('landing.architecture.title_highlight') }}</span>
        </h2>
        <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary)">
          {{ $t('landing.architecture.subtitle') }}
        </p>
      </div>

      <!-- Architecture Nodes -->
      <div
        v-motion
        :initial="{ opacity: 0, y: 30 }"
        :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 200, duration: 600 } }"
        class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        <div
          v-for="(node, idx) in archNodes"
          :key="idx"
          class="landing-card p-5 text-center group"
        >
          <div class="font-mono text-xs mb-2 uppercase tracking-wider" style="color: var(--text-muted)">{{ node.label }}</div>
          <div class="text-lg font-bold mb-1" style="color: var(--text-primary)">{{ node.name }}</div>
          <div class="text-sm" style="color: var(--text-secondary)">{{ node.detail }}</div>
        </div>
      </div>

      <!-- Connection line -->
      <div class="flex justify-center my-6" aria-hidden="true">
        <div class="w-px h-8 bg-gradient-to-b from-brand-purple to-brand-cyan opacity-30"></div>
      </div>

      <!-- Features row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div
          v-for="(feat, idx) in archFeatures"
          :key="idx"
          v-motion
          :initial="{ opacity: 0 }"
          :visibleOnce="{ opacity: 1, transition: { delay: 400 + idx * 100 } }"
          class="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-mono text-sm"
          style="background-color: var(--surface-2); border: 1px solid var(--border); color: var(--text-secondary)"
        >
          <span :class="feat.color" v-html="feat.icon"></span>
          {{ feat.label }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface ArchNode {
  label: string;
  name: string;
  detail: string;
}

interface ArchFeature {
  icon: string;
  label: string;
  color: string;
}

const archNodes: ArchNode[] = [
  { label: 'Server', name: 'Laravel 12', detail: 'API + WebSocket' },
  { label: 'Frontend', name: 'Vue.js 3', detail: 'SPA + xterm.js' },
  { label: 'Database', name: 'PostgreSQL', detail: '+ pgvector RAG' },
  { label: 'Agent', name: 'Node.js 20', detail: '+ node-pty' },
];

const archFeatures: ArchFeature[] = [
  { icon: '&#9889;', label: 'Real-time', color: 'text-yellow-400' },
  { icon: '&#128274;', label: 'File Locking', color: 'text-brand-purple' },
  { icon: '&#129302;', label: 'Multi-Agent', color: 'text-brand-cyan' },
  { icon: '&#128200;', label: 'Context RAG', color: 'text-green-400' },
];
</script>
