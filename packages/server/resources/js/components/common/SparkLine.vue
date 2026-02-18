<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="sparkline"
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <!-- Fill area under the curve -->
    <path
      :d="areaPath"
      :fill="`url(#${gradientId})`"
    />
    <!-- Line -->
    <polyline
      :points="polylinePoints"
      fill="none"
      :stroke="color"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  color: '#a855f7',
  width: 80,
  height: 32,
});

const gradientId = computed(() => `spark-grad-${Math.random().toString(36).slice(2, 8)}`);

const points = computed(() => {
  const d = props.data;
  if (d.length < 2) return [];

  const max = Math.max(...d, 1);
  const min = Math.min(...d, 0);
  const range = max - min || 1;
  const padding = 2;
  const w = props.width - padding * 2;
  const h = props.height - padding * 2;

  return d.map((val, i) => ({
    x: padding + (i / (d.length - 1)) * w,
    y: padding + h - ((val - min) / range) * h,
  }));
});

const polylinePoints = computed(() =>
  points.value.map((p) => `${p.x},${p.y}`).join(' ')
);

const areaPath = computed(() => {
  const pts = points.value;
  if (pts.length < 2) return '';

  const first = pts[0];
  const last = pts[pts.length - 1];
  const linePart = pts.map((p) => `L${p.x},${p.y}`).join(' ');

  return `M${first.x},${props.height} ${linePart} L${last.x},${props.height} Z`;
});
</script>

<style scoped>
.sparkline {
  display: block;
  flex-shrink: 0;
}
</style>
