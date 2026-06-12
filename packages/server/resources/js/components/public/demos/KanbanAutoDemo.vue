<template>
  <div ref="rootRef" class="demo-window" :class="{ 'is-fading': fading, 'is-static': prefersReduced }" aria-hidden="true">
    <div class="dw-chrome">
      <span class="dw-dot" data-c="r" />
      <span class="dw-dot" data-c="y" />
      <span class="dw-dot" data-c="g" />
      <span class="dw-title">acme-api — Sprint 14 · day 3</span>
    </div>

    <div class="dw-board">
      <div v-for="col in COLUMNS" :key="col.id" class="k-col">
        <div class="k-col-head">
          <span class="k-col-name">{{ col.label }}</span>
          <span class="k-count">{{ cardsIn(col.id).length }}</span>
          <span v-if="col.id === 'done'" class="k-spark">
            <svg viewBox="0 0 80 24" width="80" height="24">
              <polyline class="spark-line" :class="{ 'is-on': !sparkDown }" points="0,4 16,7 32,9 48,13 64,15 80,18" />
              <polyline class="spark-line is-down" :class="{ 'is-on': sparkDown }" points="0,4 16,7 32,9 48,13 64,17 80,21" />
            </svg>
          </span>
        </div>
        <TransitionGroup tag="div" name="kcard" class="k-col-list">
          <div v-for="c in cardsIn(col.id)" :key="c.code" class="k-card">
            <span class="k-card-top">
              <Transition name="dotpop">
                <span v-if="c.dot" class="k-dot" :style="{ background: c.dot }" />
              </Transition>
              <span class="k-code">#{{ c.code }}</span>
              <span class="k-pts">{{ c.pts }}</span>
            </span>
            <span class="k-card-title">{{ c.title }}</span>
            <Transition name="badgefade">
              <span v-if="c.blocked" class="k-blocked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10 5v14M14 5v14" /></svg>
                blocked
              </span>
            </Transition>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <div class="dw-status">
      <span class="status-text">{{ statusShown }}</span><span class="t-cursor">▍</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';

type ColId = 'backlog' | 'doing' | 'done';

interface KCard {
  code: string;
  title: string;
  pts: number;
  col: ColId;
  dot: string | null;
  blocked: boolean;
}

interface DemoEvent {
  at: number;
  run: () => void;
}

const LOOP_MS = 16000;
const TYPE_MS = 18;
const STATUS_TEXT = 'coordinator: lock contention resolved · #c4a7 resumed';

const COLUMNS: ReadonlyArray<{ id: ColId; label: string }> = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

const rootRef = ref<HTMLElement | null>(null);
const prefersReduced = ref(false);
const cards = reactive<KCard[]>([]);
const sparkDown = ref(false);
const fading = ref(false);
const statusShown = ref('');
let statusBornAt: number | null = null;

function seedCards(): void {
  cards.splice(
    0,
    cards.length,
    { code: 'c4a7', title: 'Harden ws-ticket validation', pts: 5, col: 'backlog', dot: null, blocked: false },
    { code: '2f8b', title: 'Throttle Reverb broadcasts', pts: 3, col: 'backlog', dot: null, blocked: false },
    { code: '9d3e', title: 'Index activity_log by project', pts: 2, col: 'backlog', dot: null, blocked: false },
    { code: '5b12', title: 'Add lock TTL sweep command', pts: 3, col: 'backlog', dot: null, blocked: false },
    { code: '77e1', title: 'Paginate activity feed', pts: 3, col: 'doing', dot: '#22d3ee', blocked: false },
    { code: 'e802', title: 'Fix burndown date range', pts: 2, col: 'done', dot: null, blocked: false },
    { code: '1af4', title: 'Cache MCP tool manifest', pts: 1, col: 'done', dot: null, blocked: false },
  );
}

function cardsIn(col: ColId): KCard[] {
  return cards.filter((c) => c.col === col);
}

function findCard(code: string): KCard | undefined {
  return cards.find((c) => c.code === code);
}

const EVENTS: DemoEvent[] = [
  {
    at: 500,
    run: () => {
      const c = findCard('c4a7');
      if (c) c.dot = '#a855f7';
    },
  },
  {
    at: 1000,
    run: () => {
      const c = findCard('c4a7');
      if (c) c.col = 'doing';
    },
  },
  {
    at: 3500,
    run: () => {
      const c = findCard('77e1');
      if (c) c.col = 'done';
      sparkDown.value = true;
    },
  },
  {
    at: 6500,
    run: () => {
      const c = findCard('2f8b');
      if (c) c.dot = '#22d3ee';
    },
  },
  {
    at: 6900,
    run: () => {
      const c = findCard('2f8b');
      if (c) c.col = 'doing';
    },
  },
  {
    at: 9000,
    run: () => {
      const c = findCard('c4a7');
      if (c) c.blocked = true;
    },
  },
  {
    at: 11500,
    run: () => {
      const c = findCard('c4a7');
      if (c) c.blocked = false;
      statusBornAt = 11500;
    },
  },
  {
    at: 14500,
    run: () => {
      fading.value = true;
    },
  },
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
  seedCards();
  sparkDown.value = false;
  fading.value = false;
  statusShown.value = '';
  statusBornAt = null;
  nextIdx = 0;
}

function applyStatic(): void {
  resetState();
  for (const ev of EVENTS) ev.run();
  statusShown.value = STATUS_TEXT;
  fading.value = false;
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

  if (statusBornAt !== null && statusShown.value.length < STATUS_TEXT.length) {
    const n = Math.min(STATUS_TEXT.length, Math.floor((elapsed - statusBornAt) / TYPE_MS));
    if (n > statusShown.value.length) statusShown.value = STATUS_TEXT.slice(0, n);
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
  seedCards();
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
  border-radius: 1rem;
  box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.demo-window > * {
  transition: opacity 0.4s ease;
}

.demo-window.is-fading > * {
  opacity: 0;
}

/* ---------- chrome ---------- */
.dw-chrome {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.65rem 0.9rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.dw-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dw-dot[data-c='r'] { background: #ff5f57; }
.dw-dot[data-c='y'] { background: #febc2e; }
.dw-dot[data-c='g'] { background: #28c840; }

.dw-title {
  margin-left: 0.6rem;
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: var(--text-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---------- board ---------- */
.dw-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  min-height: 264px;
  padding: 0.65rem;
  background: var(--bg-primary);
}

.k-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.4rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.6rem;
}

.k-col-head {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.1rem 0.2rem;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.k-col-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.k-count {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.k-spark {
  margin-left: auto;
  display: inline-flex;
}

.k-spark svg {
  display: block;
  width: 48px;
  height: 16px;
}

.spark-line {
  fill: none;
  stroke: var(--accent-cyan);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.spark-line.is-down {
  stroke: var(--accent-purple);
}

.spark-line.is-on {
  opacity: 0.9;
}

.k-col-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.k-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.42rem 0.48rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.45rem;
}

.k-card-top {
  display: flex;
  align-items: center;
  gap: 0.32rem;
}

.k-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}

.k-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.56rem;
  color: var(--text-muted);
}

.k-pts {
  margin-left: auto;
  padding: 0 0.32rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.54rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
}

.k-card-title {
  font-size: 0.6rem;
  line-height: 1.35;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.k-blocked {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  align-self: flex-start;
  margin-top: 0.1rem;
  padding: 0.1rem 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.54rem;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: 999px;
}

.k-blocked svg {
  width: 8px;
  height: 8px;
}

/* card column moves — translate/opacity only */
.kcard-enter-active {
  transition: opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1), transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.kcard-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.kcard-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.kcard-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.kcard-move {
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.dotpop-enter-active {
  animation: dotPop 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes dotPop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.35); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.badgefade-enter-active,
.badgefade-leave-active {
  transition: opacity 0.25s ease;
}
.badgefade-enter-from,
.badgefade-leave-to {
  opacity: 0;
}

/* ---------- status bar ---------- */
.dw-status {
  display: flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.45rem 0.85rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: var(--text-muted);
}

.status-text {
  white-space: pre;
  overflow: hidden;
}

.t-cursor {
  color: var(--accent-cyan);
  animation: cursorBlink 1s step-end infinite;
}

@keyframes cursorBlink {
  50% { opacity: 0; }
}

/* ---------- reduced motion ---------- */
.demo-window.is-static .t-cursor {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .t-cursor {
    animation: none !important;
  }

  .kcard-enter-active,
  .kcard-leave-active,
  .kcard-move,
  .dotpop-enter-active,
  .badgefade-enter-active,
  .badgefade-leave-active,
  .spark-line {
    transition: none !important;
    animation: none !important;
  }
}
</style>
