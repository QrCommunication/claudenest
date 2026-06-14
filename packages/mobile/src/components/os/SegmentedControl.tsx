/**
 * SegmentedControl — reusable OS-style segmented switch.
 *
 * Extracted from the homemade control in PlanningScreen so the same look
 * (pill segments, optional icon + count badge, accent active state) can back
 * project tabs, the git/PR switch, lock filters, etc. Generic over the value.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "@/theme";

type IconName = React.ComponentProps<typeof Icon>["name"];

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: "purple" | "cyan";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = "purple",
}: SegmentedControlProps<T>) {
  const accentColor =
    accent === "cyan" ? colors.accent.cyan : colors.accent.purple;

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={opt.label}
          >
            {opt.icon ? (
              <Icon
                name={opt.icon}
                size={16}
                color={isActive ? accentColor : colors.text.muted}
              />
            ) : null}
            <Text
              style={[styles.label, isActive && { color: accentColor }]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
            {typeof opt.count === "number" ? (
              <View
                style={[
                  styles.count,
                  isActive && {
                    backgroundColor: `${accentColor}33`,
                  },
                ]}
              >
                <Text
                  style={[styles.countText, isActive && { color: accentColor }]}
                >
                  {opt.count > 99 ? "99+" : opt.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
  },
  segmentActive: {
    backgroundColor: colors.bg.hover,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.muted,
  },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.input,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.text.muted,
  },
});
