<template>
  <section ref="heroRef" class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div class="hero-orb hero-orb--purple"></div>
      <div class="hero-orb hero-orb--indigo"></div>
      <div class="hero-orb hero-orb--cyan"></div>
      <!-- Dark: grid pattern / Light: dot pattern -->
      <div class="absolute inset-0 dark:bg-grid-pattern bg-dot-pattern opacity-[0.03] dark:opacity-[0.03]"></div>
    </div>

    <div class="max-w-7xl mx-auto relative">
      <div class="text-center max-w-4xl mx-auto">
        <!-- Badge -->
        <div
          v-motion
          :initial="{ opacity: 0, y: -20 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 100 } }"
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style="background-color: var(--glass-bg); border: 1px solid var(--border); backdrop-filter: blur(16px)"
        >
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span class="text-sm" style="color: var(--text-secondary)">{{ $t('landing.hero.badge') }}</span>
        </div>

        <!-- Title -->
        <h1
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 200, duration: 600 } }"
          class="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 tracking-tight"
          style="color: var(--text-primary)"
        >
          {{ $t('landing.hero.title') }}
          <span class="gradient-text block mt-2">{{ $t('landing.hero.title_highlight') }}</span>
        </h1>

        <p
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 400, duration: 600 } }"
          class="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          style="color: var(--text-secondary)"
        >
          {{ $t('landing.hero.subtitle') }}
        </p>

        <!-- CTAs -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 500, duration: 600 } }"
          class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
        >
          <router-link
            to="/register"
            class="w-full sm:w-auto px-8 py-3.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-semibold transition-all hover:scale-[1.03] shadow-lg shadow-brand-purple/25 hover:shadow-xl hover:shadow-brand-purple/30 cursor-pointer animate-glow-pulse"
          >
            {{ $t('landing.hero.cta_primary') }}
          </router-link>
          <router-link
            to="/docs"
            class="w-full sm:w-auto px-8 py-3.5 rounded-lg font-semibold transition-all cursor-pointer"
            style="background-color: var(--glass-bg); border: 1px solid var(--border); color: var(--text-primary); backdrop-filter: blur(16px)"
          >
            {{ $t('landing.hero.cta_secondary') }}
          </router-link>
        </div>

        <p class="text-xs mb-12" style="color: var(--text-muted); opacity: 0.6">
          {{ $t('landing.hero.micro_copy') }}
        </p>
        <p class="text-sm mb-12" style="color: var(--text-muted); opacity: 0.7">
          {{ $t('landing.hero.social_proof') }}
        </p>

        <!-- Stats -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 600 } }"
          class="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-16"
        >
          <div v-for="stat in heroStats" :key="stat.label" class="flex flex-col items-center">
            <span class="text-2xl sm:text-3xl font-bold gradient-text tabular-nums">{{ stat.value }}</span>
            <span class="text-xs sm:text-sm mt-1" style="color: var(--text-secondary)">{{ stat.label }}</span>
          </div>
          <div class="hidden sm:block w-px h-10" style="background-color: var(--border)" aria-hidden="true"></div>
          <div class="flex flex-col items-center">
            <span class="text-2xl sm:text-3xl font-bold text-green-400">100%</span>
            <span class="text-xs sm:text-sm mt-1" style="color: var(--text-secondary)">{{ $t('landing.hero.stats.open_source') }}</span>
          </div>
        </div>
      </div>

      <!-- Hero Terminal -->
      <div
        v-motion
        :initial="{ opacity: 0, y: 40, scale: 0.95 }"
        :visibleOnce="{ opacity: 1, y: 0, scale: 1, transition: { delay: 700, duration: 800, type: 'spring', stiffness: 100 } }"
        class="relative max-w-4xl mx-auto"
      >
        <div
          class="absolute -inset-4 bg-gradient-to-r from-brand-purple/20 via-brand-indigo/10 to-brand-cyan/20 rounded-2xl blur-2xl opacity-50"
          aria-hidden="true"
        ></div>
        <div class="relative terminal-block shadow-2xl">
          <div class="terminal-header">
            <div class="flex gap-1.5">
              <div class="terminal-dot terminal-dot--red"></div>
              <div class="terminal-dot terminal-dot--yellow"></div>
              <div class="terminal-dot terminal-dot--green"></div>
            </div>
            <span class="text-sm font-mono ml-2" style="color: var(--text-muted)">claude@remote ~ </span>
          </div>
          <div class="terminal-content">
            <div class="text-green-400">$ claudenest connect my-server</div>
            <div class="mt-2" style="color: var(--text-secondary)">Connecting to my-server...</div>
            <div class="text-brand-cyan mt-1">&#10003; Connected! Starting Claude Code session...</div>
            <div class="mt-4">
              <span class="text-brand-purple">[Agent-1]</span>
              <span style="color: var(--text-primary)"> Working on: src/api/auth.ts</span>
            </div>
            <div class="mt-1">
              <span class="text-brand-indigo">[Agent-2]</span>
              <span style="color: var(--text-primary)"> Working on: src/components/Dashboard.vue</span>
            </div>
            <div class="mt-1">
              <span class="text-brand-cyan">[Agent-3]</span>
              <span style="color: var(--text-primary)"> Context query: "authentication flow"</span>
            </div>
            <div class="mt-4" style="color: var(--text-secondary)">Shared Context: 384D embeddings loaded (pgvector)</div>
            <div class="mt-1" style="color: var(--text-secondary)">File Locks: 3 active &middot; Tasks: 2 claimed</div>
            <div class="mt-2" style="color: var(--text-muted)">&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;</div>
            <div class="mt-2 flex items-center">
              <span class="text-green-400">All agents synced. Ready for input.</span>
              <span class="ml-1 terminal-cursor" style="color: var(--text-primary)">_</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const heroRef = ref<HTMLElement | null>(null);

interface HeroStat {
  value: string;
  label: string;
  target: number;
  suffix: string;
  prefix: string;
}

const heroStats = ref<HeroStat[]>([
  { value: '5+', label: t('landing.hero.stats.agents'), target: 5, suffix: '+', prefix: '' },
  { value: '384D', label: t('landing.hero.stats.embeddings'), target: 384, suffix: 'D', prefix: '' },
  { value: '<50ms', label: t('landing.hero.stats.latency'), target: 50, suffix: 'ms', prefix: '<' },
]);

let statsAnimated = false;
let animationFrameId: number | null = null;
let statsObserver: IntersectionObserver | null = null;

function animateStats(): void {
  if (statsAnimated) return;
  statsAnimated = true;
  const duration = 1500;
  const start = performance.now();

  function step(timestamp: number): void {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    heroStats.value = heroStats.value.map((stat) => ({
      ...stat,
      value: `${stat.prefix}${Math.round(stat.target * eased)}${stat.suffix}`,
    }));
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step);
    }
  }

  animationFrameId = requestAnimationFrame(step);
}

onMounted(() => {
  statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) animateStats();
      });
    },
    { threshold: 0.3 }
  );
  if (heroRef.value) statsObserver.observe(heroRef.value);
});

onUnmounted(() => {
  statsObserver?.disconnect();
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

.hero-orb--purple {
  width: 500px;
  height: 500px;
  top: 10%;
  left: 15%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%);
  animation: float-purple 8s ease-in-out infinite;
}

.hero-orb--indigo {
  width: 400px;
  height: 400px;
  bottom: 20%;
  right: 10%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
  animation: float-indigo 10s ease-in-out infinite;
}

.hero-orb--cyan {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%);
  animation: float-cyan 12s ease-in-out infinite;
}

@keyframes float-purple {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

@keyframes float-indigo {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-25px, 20px) scale(1.08); }
  66% { transform: translate(15px, -25px) scale(0.92); }
}

@keyframes float-cyan {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) translate(20px, -15px) scale(1.1); }
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .hero-orb {
    animation: none !important;
  }
}
</style>
