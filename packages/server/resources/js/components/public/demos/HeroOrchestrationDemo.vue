<template>
  <div ref="rootRef" class="demo-window" :class="{ 'is-fading': fading, 'is-static': prefersReduced }" aria-hidden="true">
    <div class="dw-chrome">
      <span class="dw-dot" data-c="r" />
      <span class="dw-dot" data-c="y" />
      <span class="dw-dot" data-c="g" />
      <span class="dw-title">claudenest — acme-api · 3 workers</span>
      <span class="dw-live"><span class="dw-live-dot" />live</span>
    </div>

    <div class="dw-body">
      <div class="dw-term">
        <div
          v-for="(line, i) in lines"
          :key="i"
          class="t-line"
          :class="[`tone-${line.tone}`, { 'is-shake': line.shake }]"
        >{{ line.shown }}</div>
        <span class="t-cursor">▍</span>
      </div>

      <div class="dw-board">
        <div v-for="col in COLUMNS" :key="col.id" class="b-col">
          <div class="b-col-head">
            <span>{{ col.label }}</span>
            <span class="b-count">{{ cardsIn(col.id).length }}</span>
          </div>
          <TransitionGroup tag="div" name="bcard" class="b-col-list">
            <div v-for="c in cardsIn(col.id)" :key="c.code" class="b-card">
              <span class="b-card-top">
                <span v-if="c.dot" class="b-dot" :style="{ background: c.dot }" />
                <span class="b-code">#{{ c.code }}</span>
                <svg v-if="c.col === 'done'" class="b-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                <Transition name="lockfade">
                  <svg v-if="c.locked" class="b-lock" :class="{ 'is-flash': c.lockFlash }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </Transition>
              </span>
              <span class="b-card-title">{{ c.title }}</span>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <div class="dw-foot">
      <span class="w-chip" style="--wc: #a855f7"><span class="w-dot" />atlas</span>
      <span class="w-chip" style="--wc: #22d3ee"><span class="w-dot" />nova</span>
      <Transition name="lockfade">
        <span v-if="emberVisible" class="w-chip" style="--wc: #f472b6"><span class="w-dot" />ember</span>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';

type Tone = 'cmd' | 'ok' | 'err' | 'muted' | 'rose';
type ColId = 'queue' | 'doing' | 'done';

interface TermLine {
  text: string;
  tone: Tone;
  shake: boolean;
  shown: string;
  bornAt: number;
}

interface BoardCard {
  code: string;
  title: string;
  col: ColId;
  dot: string | null;
  locked: boolean;
  lockFlash: boolean;
}

interface DemoEvent {
  at: number;
  run: () => void;
}

const LOOP_MS = 24000;
const TYPE_MS = 18;

const COLUMNS: ReadonlyArray<{ id: ColId; label: string }> = [
  { id: 'queue', label: 'Queue' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
];

const rootRef = ref<HTMLElement | null>(null);
const prefersReduced = ref(false);
const lines = reactive<TermLine[]>([]);
const cards = reactive<BoardCard[]>([]);
const emberVisible = ref(false);
const fading = ref(false);

function seedCards(): void {
  cards.splice(
    0,
    cards.length,
    { code: '9f2c', title: 'Migrate session storage to Redis', col: 'queue', dot: null, locked: false, lockFlash: false },
    { code: 'b41e', title: 'Add retry to webhook dispatcher', col: 'queue', dot: null, locked: false, lockFlash: false },
    { code: 'd27a', title: 'Fix N+1 on /api/projects', col: 'queue', dot: null, locked: false, lockFlash: false },
    { code: '41c8', title: 'Document MCP planning tools', col: 'done', dot: null, locked: false, lockFlash: false },
  );
}

function cardsIn(col: ColId): BoardCard[] {
  return cards.filter((c) => c.col === col);
}

function findCard(code: string): BoardCard | undefined {
  return cards.find((c) => c.code === code);
}

function pushLine(at: number, text: string, tone: Tone, shake = false): void {
  lines.push({ text, tone, shake, shown: '', bornAt: at });
}

const EVENTS: DemoEvent[] = [
  { at: 0, run: () => pushLine(0, '▸ worker/atlas   mcp: task_claim()', 'cmd') },
  {
    at: 1200,
    run: () => {
      pushLine(1200, '  ✓ claimed "Migrate session storage to Redis" #9f2c', 'ok');
      const c = findCard('9f2c');
      if (c) {
        c.col = 'doing';
        c.dot = '#a855f7';
      }
    },
  },
  {
    at: 3000,
    run: () => {
      pushLine(3000, '▸ worker/atlas   lock: src/session/store.ts', 'cmd');
      const c = findCard('9f2c');
      if (c) c.locked = true;
    },
  },
  { at: 4600, run: () => pushLine(4600, '▸ worker/nova    edit: src/session/store.ts', 'cmd') },
  {
    at: 5400,
    run: () => {
      pushLine(5400, '  ✗ denied — locked by atlas (PreToolUse hook)', 'err', true);
      const c = findCard('9f2c');
      if (c) c.lockFlash = true;
    },
  },
  {
    at: 5650,
    run: () => {
      const c = findCard('9f2c');
      if (c) c.lockFlash = false;
    },
  },
  { at: 7000, run: () => pushLine(7000, '▸ worker/nova    mcp: task_claim()', 'cmd') },
  {
    at: 8200,
    run: () => {
      pushLine(8200, '  ✓ claimed "Add retry to webhook dispatcher" #b41e', 'ok');
      const c = findCard('b41e');
      if (c) {
        c.col = 'doing';
        c.dot = '#22d3ee';
      }
    },
  },
  { at: 10500, run: () => pushLine(10500, '▸ worker/atlas   tests: 38 passed in 6.1s', 'muted') },
  { at: 13000, run: () => pushLine(13000, '▸ worker/atlas   mcp: task_complete()', 'cmd') },
  {
    at: 14200,
    run: () => {
      pushLine(14200, '  ✓ summary ingested → project memory (pgvector)', 'ok');
      const c = findCard('9f2c');
      if (c) {
        c.col = 'done';
        c.locked = false;
      }
    },
  },
  {
    at: 16000,
    run: () => {
      pushLine(16000, '▸ worker/ember   spawned · context: 12 chunks injected', 'rose');
      emberVisible.value = true;
    },
  },
  {
    at: 23200,
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
  lines.splice(0, lines.length);
  seedCards();
  emberVisible.value = false;
  fading.value = false;
  nextIdx = 0;
}

function applyStatic(): void {
  resetState();
  for (const ev of EVENTS) ev.run();
  for (const line of lines) line.shown = line.text;
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

  const last = lines[lines.length - 1];
  if (last && last.shown.length < last.text.length) {
    const n = Math.min(last.text.length, Math.floor((elapsed - last.bornAt) / TYPE_MS));
    if (n > last.shown.length) last.shown = last.text.slice(0, n);
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

.dw-live {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.18rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: var(--accent-cyan);
  background: color-mix(in srgb, var(--accent-cyan) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan) 24%, transparent);
  border-radius: 999px;
}

.dw-live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-cyan);
  animation: livePulse 2s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* ---------- body ---------- */
.dw-body {
  display: grid;
  grid-template-columns: 1fr;
  background: var(--bg-primary);
}

@media (min-width: 768px) {
  .dw-body {
    grid-template-columns: 58% 42%;
  }
}

.dw-term {
  position: relative;
  height: 252px;
  padding: 0.8rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.58rem, 0.85vw, 0.66rem);
  line-height: 1.75;
  overflow: hidden;
}

.t-line {
  white-space: pre;
  overflow: hidden;
  color: var(--text-secondary);
}

.t-line.tone-ok { color: var(--status-success); }
.t-line.tone-err { color: #ef4444; }
.t-line.tone-muted { color: var(--text-muted); }
.t-line.tone-rose { color: #f472b6; }

.t-line.is-shake {
  animation: denyShake 0.12s linear 1;
}

@keyframes denyShake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}

.t-cursor {
  color: var(--accent-cyan);
  animation: cursorBlink 1s step-end infinite;
}

@keyframes cursorBlink {
  50% { opacity: 0; }
}

/* ---------- board ---------- */
.dw-board {
  display: none;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  padding: 0.55rem;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
}

@media (min-width: 768px) {
  .dw-board {
    display: grid;
  }
}

.b-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.b-col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.15rem 0.25rem;
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.b-count {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.b-col-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 2rem;
}

.b-card {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  padding: 0.4rem 0.45rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.45rem;
}

.b-card-top {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.b-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}

.b-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.56rem;
  color: var(--text-muted);
}

.b-check {
  width: 10px;
  height: 10px;
  margin-left: auto;
  color: var(--status-success);
  flex: none;
}

.b-lock {
  width: 10px;
  height: 10px;
  margin-left: auto;
  color: var(--accent-purple);
  flex: none;
  transition: color 0.2s ease;
}

.b-lock.is-flash {
  color: #ef4444;
}

.b-card-title {
  font-size: 0.6rem;
  line-height: 1.35;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* card column moves — translate/opacity only */
.bcard-enter-active {
  transition: opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1), transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.bcard-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bcard-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.bcard-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.bcard-move {
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.lockfade-enter-active,
.lockfade-leave-active {
  transition: opacity 0.3s ease;
}
.lockfade-enter-from,
.lockfade-leave-to {
  opacity: 0;
}

/* ---------- footer ---------- */
.dw-foot {
  display: flex;
  gap: 0.45rem;
  padding: 0.55rem 0.85rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.w-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.55rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--wc);
  background: color-mix(in srgb, var(--wc) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--wc) 26%, transparent);
  border-radius: 999px;
}

.w-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--wc);
}

/* ---------- reduced motion ---------- */
.demo-window.is-static .t-cursor,
.demo-window.is-static .dw-live-dot {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .dw-live-dot,
  .t-cursor,
  .t-line.is-shake {
    animation: none !important;
  }

  .bcard-enter-active,
  .bcard-leave-active,
  .bcard-move,
  .lockfade-enter-active,
  .lockfade-leave-active {
    transition: none !important;
  }
}
</style>
