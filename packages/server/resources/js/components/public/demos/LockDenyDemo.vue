<template>
  <div
    ref="rootRef"
    class="demo-window"
    :class="{ 'is-fading': fading, 'is-static': prefersReduced, 'no-anim': prefersReduced }"
    aria-hidden="true"
  >
    <div class="dw-chrome">
      <span class="dw-dot" data-c="r" />
      <span class="dw-dot" data-c="y" />
      <span class="dw-dot" data-c="g" />
      <span class="dw-title">acme-api — file locks</span>
    </div>

    <div class="ld-body">
      <div class="ld-dock">workers</div>

      <div class="ld-rows">
        <div
          v-for="(file, i) in FILES"
          :key="file"
          class="ld-row"
          :class="{
            'is-atlas': atlasRow === i,
            'is-nova': novaRow === i && atlasRow !== i,
            'is-deny': denyFlash && i === 0,
          }"
        >
          <svg class="ld-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          <span class="ld-path">{{ file }}</span>
          <Transition name="lockfade">
            <svg v-if="atlasDone && i === 0" class="ld-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </Transition>
        </div>
      </div>

      <span class="ld-chip" :style="[{ '--wc': '#a855f7' }, atlasStyle]">
        <span class="w-dot" />atlas
        <Transition name="lockfade">
          <span v-if="atlasLocked" class="ld-lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            {{ atlasClock }}
          </span>
        </Transition>
      </span>

      <span class="ld-chip" :style="[{ '--wc': '#22d3ee' }, novaStyle]" :class="{ 'is-shake': novaShake }">
        <span class="w-dot" />nova
        <Transition name="lockfade">
          <span v-if="novaLocked" class="ld-lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </span>
        </Transition>
      </span>

      <Transition name="lockfade">
        <span v-if="tooltip" class="ld-tooltip">✗ Edit denied — held by atlas (47s)</span>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

interface DemoEvent {
  at: number;
  run: () => void;
}

const LOOP_MS = 12000;
const ROW_H = 36;
const DOCK_BASE = 37;
const LOCK_START_MS = 900;

const FILES: readonly string[] = [
  'src/api/auth.ts',
  'src/api/webhooks.ts',
  'src/session/store.ts',
  'tests/auth.spec.ts',
  'config/reverb.php',
];

const rootRef = ref<HTMLElement | null>(null);
const prefersReduced = ref(false);
const atlasRow = ref<number | null>(null);
const novaRow = ref<number | null>(null);
const atlasLocked = ref(false);
const novaLocked = ref(false);
const atlasDone = ref(false);
const atlasClock = ref('0:04');
const denyFlash = ref(false);
const novaShake = ref(false);
const tooltip = ref(false);
const fading = ref(false);

const atlasStyle = computed<Record<string, string>>(() => ({
  transform: atlasRow.value === null ? 'translate(0px, 0px)' : `translate(0px, ${DOCK_BASE + atlasRow.value * ROW_H}px)`,
}));

const novaStyle = computed<Record<string, string>>(() => {
  if (novaRow.value === null) return { transform: 'translate(0px, 0px)' };
  const shiftX = novaRow.value === atlasRow.value ? 0 : 74;
  return { transform: `translate(${shiftX}px, ${DOCK_BASE + novaRow.value * ROW_H}px)` };
});

const EVENTS: DemoEvent[] = [
  { at: 500, run: () => { atlasRow.value = 0; } },
  { at: LOCK_START_MS, run: () => { atlasLocked.value = true; atlasClock.value = '0:04'; } },
  { at: 3000, run: () => { novaRow.value = 0; } },
  {
    at: 4000,
    run: () => {
      denyFlash.value = true;
      novaShake.value = true;
      tooltip.value = true;
    },
  },
  {
    at: 4250,
    run: () => {
      denyFlash.value = false;
      novaShake.value = false;
    },
  },
  {
    at: 6000,
    run: () => {
      tooltip.value = false;
      novaRow.value = 1;
      novaLocked.value = true;
    },
  },
  {
    at: 9000,
    run: () => {
      atlasDone.value = true;
      atlasLocked.value = false;
    },
  },
  { at: 11000, run: () => { fading.value = true; } },
];

// ---------------------------------------------------------------------------
// Single rAF timeline driver — paused when tab hidden or component offscreen.
// ---------------------------------------------------------------------------
let rafId: number | null = null;
let startTs: number | null = null;
let pausedElapsed = 0;
let nextIdx = 0;
let inView = false;
let observer: IntersectionObserver | null = null;
let mq: MediaQueryList | null = null;

function resetState(): void {
  atlasRow.value = null;
  novaRow.value = null;
  atlasLocked.value = false;
  novaLocked.value = false;
  atlasDone.value = false;
  atlasClock.value = '0:04';
  denyFlash.value = false;
  novaShake.value = false;
  tooltip.value = false;
  fading.value = false;
  nextIdx = 0;
}

function applyStatic(): void {
  resetState();
  atlasRow.value = 0;
  atlasLocked.value = true;
  atlasClock.value = '0:47';
  novaRow.value = 0;
  tooltip.value = true;
  nextIdx = EVENTS.length;
}

function frame(now: number): void {
  if (startTs === null) startTs = now - pausedElapsed;
  let elapsed = now - startTs;

  if (elapsed >= LOOP_MS) {
    resetState();
    startTs = now;
    elapsed = 0;
  }

  while (nextIdx < EVENTS.length && EVENTS[nextIdx].at <= elapsed) {
    EVENTS[nextIdx].run();
    nextIdx += 1;
  }

  if (atlasLocked.value) {
    const secs = 4 + Math.max(0, Math.floor((elapsed - LOCK_START_MS) / 1000));
    const fmt = `0:${String(secs).padStart(2, '0')}`;
    if (fmt !== atlasClock.value) atlasClock.value = fmt;
  }

  rafId = requestAnimationFrame(frame);
}

function pause(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (startTs !== null) {
    pausedElapsed = performance.now() - startTs;
    startTs = null;
  }
}

function maybeRun(): void {
  if (prefersReduced.value) {
    pause();
    return;
  }
  const shouldRun = inView && !document.hidden;
  if (shouldRun && rafId === null) {
    rafId = requestAnimationFrame(frame);
  } else if (!shouldRun) {
    pause();
  }
}

function onMqChange(): void {
  prefersReduced.value = mq?.matches ?? false;
  if (prefersReduced.value) {
    pause();
    applyStatic();
  } else {
    resetState();
    pausedElapsed = 0;
    maybeRun();
  }
}

onMounted(() => {
  mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReduced.value = mq.matches;
  mq.addEventListener('change', onMqChange);
  document.addEventListener('visibilitychange', maybeRun);

  if (prefersReduced.value) {
    applyStatic();
  }

  observer = new IntersectionObserver(
    (entries) => {
      inView = entries[0]?.isIntersecting ?? false;
      maybeRun();
    },
    { threshold: 0.15 },
  );
  if (rootRef.value) observer.observe(rootRef.value);
});

onUnmounted(() => {
  pause();
  observer?.disconnect();
  observer = null;
  document.removeEventListener('visibilitychange', maybeRun);
  mq?.removeEventListener('change', onMqChange);
  mq = null;
});
</script>

<style scoped>
.demo-window {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.85rem;
  overflow: hidden;
}

.demo-window > * {
  transition: opacity 0.3s ease;
}

.demo-window.is-fading > * {
  opacity: 0;
}

/* ---------- chrome ---------- */
.dw-chrome {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.55rem 0.8rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.dw-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dw-dot[data-c='r'] { background: #ff5f57; }
.dw-dot[data-c='y'] { background: #febc2e; }
.dw-dot[data-c='g'] { background: #28c840; }

.dw-title {
  margin-left: 0.55rem;
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: var(--text-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---------- body ---------- */
.ld-body {
  position: relative;
  padding: 0.6rem 0.7rem 0.7rem;
  background: var(--bg-primary);
}

.ld-dock {
  height: 26px;
  display: flex;
  align-items: center;
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.ld-rows {
  display: flex;
  flex-direction: column;
}

.ld-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  height: 36px;
  padding: 0 0.55rem;
  padding-right: 9.5rem;
  border-radius: 0.45rem;
  border: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.2s ease;
}

.ld-row.is-atlas {
  background: color-mix(in srgb, #a855f7 7%, transparent);
  border-color: color-mix(in srgb, #a855f7 22%, transparent);
}

.ld-row.is-nova {
  background: color-mix(in srgb, #22d3ee 7%, transparent);
  border-color: color-mix(in srgb, #22d3ee 22%, transparent);
}

.ld-row.is-deny {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.ld-file {
  width: 12px;
  height: 12px;
  color: var(--text-muted);
  flex: none;
}

.ld-path {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: var(--text-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ld-check {
  width: 12px;
  height: 12px;
  margin-left: 0.3rem;
  color: var(--status-success);
  flex: none;
}

/* ---------- chips ---------- */
.ld-chip {
  position: absolute;
  top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.2rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--wc);
  background: color-mix(in srgb, var(--wc) 12%, var(--bg-card));
  border: 1px solid color-mix(in srgb, var(--wc) 32%, transparent);
  border-radius: 999px;
  transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  will-change: transform;
  z-index: 2;
}

.ld-chip:nth-of-type(1) { right: 10px; }
.ld-chip:nth-of-type(2) { right: 84px; }

.ld-chip.is-shake {
  animation: denyShake 0.12s linear 1;
}

@keyframes denyShake {
  0% { translate: 0 0; }
  25% { translate: -4px 0; }
  50% { translate: 4px 0; }
  75% { translate: -2px 0; }
  100% { translate: 0 0; }
}

.w-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--wc);
  flex: none;
}

.ld-lock {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  font-variant-numeric: tabular-nums;
}

.ld-lock svg {
  width: 9px;
  height: 9px;
}

/* ---------- tooltip ---------- */
.ld-tooltip {
  position: absolute;
  left: 1rem;
  top: 102px;
  padding: 0.32rem 0.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: #ef4444;
  background: var(--bg-card);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 0.45rem;
  box-shadow: var(--shadow-md);
  z-index: 3;
  white-space: nowrap;
}

.lockfade-enter-active,
.lockfade-leave-active {
  transition: opacity 0.3s ease;
}
.lockfade-enter-from,
.lockfade-leave-to {
  opacity: 0;
}

/* ---------- reduced motion ---------- */
.demo-window.no-anim .ld-chip,
.demo-window.no-anim .ld-row {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .ld-chip,
  .ld-row {
    transition: none !important;
  }

  .ld-chip.is-shake {
    animation: none !important;
  }

  .lockfade-enter-active,
  .lockfade-leave-active {
    transition: none !important;
  }
}
</style>
