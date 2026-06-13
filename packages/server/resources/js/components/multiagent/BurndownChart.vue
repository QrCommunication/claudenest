<template>
  <div class="burndown-chart">
    <div class="chart-header">
      <h4 class="chart-title">Burndown</h4>
      <span v-if="data.length > 0" class="chart-subtitle">
        {{ data.length }} day{{ data.length > 1 ? 's' : '' }}
      </span>
    </div>

    <div class="chart-wrapper" ref="chartContainer">
      <svg
        v-if="data.length > 0"
        :viewBox="`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`"
        class="chart-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="burndown-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#a855f7" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
          </linearGradient>
          <!-- Clip path to avoid overflow -->
          <clipPath id="chart-clip">
            <rect
              :x="PAD"
              :y="PAD"
              :width="SVG_WIDTH - PAD * 2"
              :height="SVG_HEIGHT - PAD * 2"
            />
          </clipPath>
        </defs>

        <!-- Y-axis grid lines + labels -->
        <g class="grid">
          <template v-for="(tick, i) in yTicks" :key="'ytick-' + i">
            <line
              :x1="PAD"
              :x2="SVG_WIDTH - PAD"
              :y1="tick.y"
              :y2="tick.y"
              stroke-width="1"
            />
            <text
              :x="PAD - 4"
              :y="tick.y + 4"
              text-anchor="end"
              class="axis-label"
            >{{ tick.value }}</text>
          </template>
        </g>

        <!-- X-axis date labels (first, middle, last) -->
        <g class="x-axis">
          <template v-for="(point, i) in xLabels" :key="'xlabel-' + i">
            <text
              :x="point.x"
              :y="SVG_HEIGHT - PAD + 13"
              :text-anchor="point.anchor"
              class="axis-label"
            >{{ point.label }}</text>
          </template>
        </g>

        <!-- Ideal line (dashed) -->
        <line
          class="ideal-line"
          :x1="PAD"
          :y1="yScale(maxPoints)"
          :x2="SVG_WIDTH - PAD"
          :y2="yScale(0)"
          stroke-width="1"
          stroke-dasharray="4,4"
          clip-path="url(#chart-clip)"
        />

        <!-- Area fill under the actual line -->
        <polygon
          v-if="areaPoints"
          :points="areaPoints"
          fill="url(#burndown-gradient)"
          clip-path="url(#chart-clip)"
        />

        <!-- Actual remaining line -->
        <polyline
          :points="remainingPoints"
          fill="none"
          stroke="#a855f7"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
          clip-path="url(#chart-clip)"
        />

        <!-- Data points -->
        <circle
          v-for="(point, i) in chartPoints"
          :key="'dot-' + i"
          class="data-dot"
          :cx="point.x"
          :cy="point.y"
          r="3"
          fill="#a855f7"
          stroke-width="1.5"
        />

        <!-- Tooltip invisible hit areas -->
        <g class="hit-areas">
          <rect
            v-for="(point, i) in chartPoints"
            :key="'hit-' + i"
            :x="point.x - 10"
            :y="PAD"
            width="20"
            :height="SVG_HEIGHT - PAD * 2"
            fill="transparent"
            class="hit-area"
            @mouseenter="showTooltip(i, $event)"
            @mouseleave="hideTooltip"
          />
        </g>

        <!-- Tooltip -->
        <g v-if="tooltip.visible" class="tooltip-group">
          <!-- Vertical crosshair -->
          <line
            :x1="tooltip.x"
            :x2="tooltip.x"
            :y1="PAD"
            :y2="SVG_HEIGHT - PAD"
            stroke="rgba(168,85,247,0.3)"
            stroke-width="1"
            stroke-dasharray="2,2"
          />
          <!-- Tooltip box -->
          <g :transform="`translate(${tooltipBoxX}, ${tooltipBoxY})`">
            <rect
              class="tooltip-box"
              x="0"
              y="0"
              width="78"
              height="40"
              rx="4"
              ry="4"
              stroke="rgba(168,85,247,0.35)"
              stroke-width="1"
            />
            <text x="8" y="14" class="tooltip-date">{{ tooltip.date }}</text>
            <text x="8" y="28" class="tooltip-remaining">
              <tspan fill="#a855f7" font-weight="700">{{ tooltip.remaining }}</tspan>
              <tspan class="tooltip-unit"> pts left</tspan>
            </text>
          </g>
        </g>
      </svg>

      <!-- Empty state -->
      <div v-else class="chart-empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p class="empty-text">No burndown data yet</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { BurndownDataPoint } from '@/types';

interface Props {
  data: BurndownDataPoint[];
}

const props = defineProps<Props>();

// Fixed internal dimensions — the SVG scales via viewBox + CSS
const SVG_WIDTH = 400;
const SVG_HEIGHT = 180;
const PAD = 28;

const chartW = SVG_WIDTH - PAD * 2;
const chartH = SVG_HEIGHT - PAD * 2;

// ==================== SCALES ====================

const maxPoints = computed<number>(() => {
  if (props.data.length === 0) return 1;
  return Math.max(
    ...props.data.map(d => d.remaining),
    ...props.data.map(d => d.ideal),
    1,
  );
});

function xScale(index: number): number {
  const count = props.data.length;
  if (count <= 1) return PAD + chartW / 2;
  return PAD + (index / (count - 1)) * chartW;
}

function yScale(value: number): number {
  return PAD + (1 - value / maxPoints.value) * chartH;
}

// ==================== COMPUTED POINTS ====================

const chartPoints = computed(() =>
  props.data.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.remaining),
  })),
);

const remainingPoints = computed(() =>
  chartPoints.value.map(p => `${p.x},${p.y}`).join(' '),
);

const areaPoints = computed(() => {
  const pts = chartPoints.value;
  if (pts.length === 0) return '';
  const top = pts.map(p => `${p.x},${p.y}`).join(' ');
  const lastX = pts[pts.length - 1].x;
  const firstX = pts[0].x;
  const bottom = SVG_HEIGHT - PAD;
  return `${top} ${lastX},${bottom} ${firstX},${bottom}`;
});

// ==================== AXIS TICKS ====================

const Y_TICKS = 4;

const yTicks = computed(() => {
  const max = maxPoints.value;
  return Array.from({ length: Y_TICKS + 1 }, (_, i) => {
    const value = Math.round((max / Y_TICKS) * (Y_TICKS - i));
    return { value, y: yScale(value) };
  });
});

const xLabels = computed(() => {
  const count = props.data.length;
  if (count === 0) return [];
  const indices = Array.from(new Set([0, Math.floor((count - 1) / 2), count - 1]));
  return indices.map((i, pos) => ({
    x: xScale(i),
    label: formatShortDate(props.data[i].date),
    anchor: pos === 0 ? 'start' : pos === indices.length - 1 ? 'end' : 'middle',
  }));
});

// ==================== TOOLTIP ====================

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  remaining: 0,
  index: -1,
});

const tooltipBoxX = computed(() => {
  const bw = 78;
  const margin = 6;
  if (tooltip.x + bw + margin > SVG_WIDTH - PAD) return tooltip.x - bw - margin;
  return tooltip.x + margin;
});

const tooltipBoxY = computed(() => {
  return Math.max(PAD, tooltip.y - 20);
});

function showTooltip(index: number, _event: MouseEvent): void {
  const point = chartPoints.value[index];
  const d = props.data[index];
  if (!point || !d) return;
  tooltip.visible = true;
  tooltip.x = point.x;
  tooltip.y = point.y;
  tooltip.date = formatShortDate(d.date);
  tooltip.remaining = d.remaining;
  tooltip.index = index;
}

function hideTooltip(): void {
  tooltip.visible = false;
}

// ==================== HELPERS ====================

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}
</script>

<style scoped>
.burndown-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  padding: 14px 16px;
}

/* ==================== HEADER ==================== */

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.chart-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.chart-subtitle {
  font-size: 0.68rem;
  color: var(--text-muted);
}

/* ==================== SVG WRAPPER ==================== */

.chart-wrapper {
  width: 100%;
  min-height: 100px;
}

.chart-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

/* ==================== SVG THEME PAINT ==================== */
/* CSS `stroke`/`fill` override SVG presentation attributes and honor the
   theme cascade, unlike hardcoded inline attributes. */

.grid line {
  stroke: var(--border-color);
}

.ideal-line {
  stroke: var(--border-color);
}

/* Dot border matches the card surface to create an inset "cutout" ring. */
.data-dot {
  stroke: var(--bg-secondary);
}

.tooltip-box {
  fill: var(--bg-card);
}

.tooltip-unit {
  fill: var(--text-muted);
}

/* ==================== AXIS LABELS ==================== */

.axis-label {
  font-size: 8px;
  fill: var(--text-disabled);
  font-family: ui-monospace, 'SF Mono', monospace;
}

/* ==================== TOOLTIP ==================== */

.tooltip-date {
  font-size: 8px;
  fill: var(--text-muted);
}

.tooltip-remaining {
  font-size: 9px;
}

.hit-area {
  cursor: crosshair;
}

/* ==================== EMPTY STATE ==================== */

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 0;
}

.empty-icon {
  width: 24px;
  height: 24px;
  color: var(--text-disabled);
}

.empty-text {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin: 0;
}
</style>
