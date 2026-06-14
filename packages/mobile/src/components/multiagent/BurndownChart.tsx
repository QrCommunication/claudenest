/**
 * BurndownChart
 * A dependency-free (View-based) sprint burndown: per-day remaining story
 * points as bars, with the ideal trajectory overlaid as cyan markers. No SVG
 * lib — the OS shell stays light.
 */

import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import type { BurndownDataPoint } from "@/types";

const CHART_HEIGHT = 132;

function shortDate(iso: string): string {
  // "2026-06-14" → "06-14"
  const parts = iso.split("-");
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : iso;
}

export const BurndownChart = memo(function BurndownChart({
  data,
}: {
  data: BurndownDataPoint[];
}) {
  const max = useMemo(() => {
    const vals = data.flatMap((d) => [d.remaining, d.ideal]);
    return Math.max(1, ...vals);
  }, [data]);

  if (data.length === 0) {
    return (
      <Text style={styles.empty}>
        No burndown yet — needs a start date and story points.
      </Text>
    );
  }

  const last = data[data.length - 1];
  const first = data[0]!;

  // Screen-reader summary: the chart itself is opaque to assistive tech, so we
  // describe the trajectory and whether the team is ahead/behind the ideal line.
  const delta = last!.remaining - last!.ideal;
  const trackVerdict =
    Math.abs(delta) <= 0.5
      ? "on track"
      : delta > 0
        ? `${Math.round(delta)} points behind the ideal`
        : `${Math.round(-delta)} points ahead of the ideal`;
  const chartA11yLabel = `Burndown chart: ${Math.round(first.remaining)} points remaining at the start, ${Math.round(last!.remaining)} now over ${data.length} days, ${trackVerdict}.`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={chartA11yLabel}
    >
      <View style={styles.chart}>
        {data.map((d, i) => {
          const barH = (d.remaining / max) * CHART_HEIGHT;
          const idealBottom = (d.ideal / max) * CHART_HEIGHT;
          return (
            <View key={`${d.date}-${i}`} style={styles.col}>
              <View style={styles.plot}>
                <View style={[styles.bar, { height: Math.max(2, barH) }]} />
                <View style={[styles.idealDot, { bottom: idealBottom }]} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{shortDate(data[0]!.date)}</Text>
        <Text style={styles.axisLabel}>{shortDate(last!.date)}</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.swatch, { backgroundColor: colors.accent.purple }]}
          />
          <Text style={styles.legendText}>Remaining ({last!.remaining})</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.swatch, { backgroundColor: colors.accent.cyan }]}
          />
          <Text style={styles.legendText}>Ideal</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: CHART_HEIGHT,
    gap: 2,
  },
  col: {
    flex: 1,
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
  },
  plot: {
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    minWidth: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: colors.accent.purple,
    opacity: 0.85,
  },
  idealDot: {
    position: "absolute",
    alignSelf: "center",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.cyan,
  },
  axis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  axisLabel: {
    ...typography.mono,
    fontSize: 9,
    color: colors.text.muted,
  },
  legend: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  empty: {
    ...typography.mono,
    fontSize: 12,
    color: colors.text.muted,
    paddingVertical: spacing.md,
  },
});
