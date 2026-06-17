/**
 * OS panel primitives — the shared building blocks of native Claude OS panels.
 *
 * OSNavGrid is the "everything is an icon" navigation grid: a wrap of tappable
 * tiles (icon + label + optional badge) that open windows. It encodes the UI/UX
 * rules we care about: 60px touch targets, accent-tinted borders, monospace
 * labels, and an accessible label that folds in the badge count.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "@/theme";

export interface NavGridItem {
  key: string;
  icon: string;
  label: string;
  badge?: number;
  accent?: "purple" | "cyan";
  onPress: () => void;
}

export function OSNavGrid({ items }: { items: NavGridItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((it) => {
        const color =
          it.accent === "cyan" ? colors.accent.cyan : colors.accent.purple;
        const hasBadge = it.badge !== undefined && it.badge > 0;
        return (
          <TouchableOpacity
            key={it.key}
            style={styles.cell}
            onPress={it.onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              hasBadge ? `${it.label}, ${it.badge}` : it.label
            }
          >
            <View style={[styles.tile, { borderColor: color }]}>
              <Icon
                name={it.icon as keyof typeof Icon.glyphMap}
                size={24}
                color={color}
              />
              {hasBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {it.badge! > 99 ? "99+" : it.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  cell: {
    width: 78,
    alignItems: "center",
    gap: spacing.xs,
  },
  tile: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.status.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.bg.secondary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.text.inverse,
  },
  label: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 78,
  },
});
