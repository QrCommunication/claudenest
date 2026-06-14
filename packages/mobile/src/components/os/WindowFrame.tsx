/**
 * WindowFrame — terminal-window chrome for the "Claude OS" shell.
 *
 * Wraps any panel/board in a window: a header bar with traffic-light dots, a
 * monospace title (+ optional subtitle), an actions slot, and an accent-tinted
 * top edge with optional neon glow. Purely presentational.
 */

import React, { memo, type ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import {
  borderRadius,
  colors,
  layout,
  shadows,
  spacing,
  typography,
} from "@/theme";

interface WindowFrameProps {
  title: string;
  subtitle?: string;
  accent?: "purple" | "cyan";
  /** Right-aligned header slot (buttons, status, etc.). */
  actions?: ReactNode;
  children: ReactNode;
  /** Drop the inner padding (edge-to-edge content like a terminal or list). */
  flush?: boolean;
  /** Neon glow around the frame (active/focused window). */
  glow?: boolean;
  style?: ViewStyle;
}

const TRAFFIC = [
  colors.status.error,
  colors.status.warning,
  colors.status.success,
];

export const WindowFrame = memo(function WindowFrame({
  title,
  subtitle,
  accent = "purple",
  actions,
  children,
  flush = false,
  glow = false,
  style,
}: WindowFrameProps) {
  const accentColor =
    accent === "cyan" ? colors.accent.cyan : colors.accent.purple;

  return (
    <View
      style={[
        styles.frame,
        { borderTopColor: accentColor },
        glow && (accent === "cyan" ? shadows.glowCyan : shadows.glow),
        style,
      ]}
    >
      <View style={styles.header}>
        <View
          style={styles.lights}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {TRAFFIC.map((c) => (
            <View key={c} style={[styles.light, { backgroundColor: c }]} />
          ))}
        </View>
        <View
          style={styles.titleWrap}
          accessibilityRole="header"
          accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        >
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>{actions}</View>
      </View>
      <View style={[styles.body, !flush && styles.bodyPadded]}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderTopWidth: 2,
    overflow: "hidden",
  },
  header: {
    height: layout.os.windowHeaderHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  lights: {
    flexDirection: "row",
    gap: layout.os.trafficLightGap,
  },
  light: {
    width: layout.os.trafficLightSize,
    height: layout.os.trafficLightSize,
    borderRadius: layout.os.trafficLightSize / 2,
    opacity: 0.85,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  title: {
    ...typography.mono,
    color: colors.text.secondary,
    fontSize: 12,
  },
  subtitle: {
    ...typography.mono,
    color: colors.text.muted,
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  body: {
    flex: 1,
  },
  bodyPadded: {
    padding: spacing.md,
  },
});
