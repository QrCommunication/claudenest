/**
 * SprintCard
 * Compact sprint summary for the board list (non-featured sprints): name +
 * status, goal, story points, dates, progress, and an optional overflow menu
 * (start / complete / edit / delete). Action props are optional so a read-only
 * usage (press only) keeps working; the kebab appears once a callback is wired.
 */

import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { showAlert, type DialogButton } from "@/services/dialog";
import { t } from "@/i18n";
import type { Sprint } from "@/types";

interface SprintCardProps {
  sprint: Sprint;
  onPress: (sprint: Sprint) => void;
  onStart?: (sprint: Sprint) => void;
  onComplete?: (sprint: Sprint) => void;
  onEdit?: (sprint: Sprint) => void;
  onDelete?: (sprint: Sprint) => void;
}

const SPRINT_STATUS_COLORS: Record<string, string> = {
  planning: colors.text.muted,
  active: colors.accent.purple,
  completed: colors.status.success,
  cancelled: colors.status.error,
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export const SprintCard = memo(function SprintCard({
  sprint,
  onPress,
  onStart,
  onComplete,
  onEdit,
  onDelete,
}: SprintCardProps) {
  const handlePress = useCallback(() => onPress(sprint), [sprint, onPress]);

  const hasMenu = !!(onStart || onComplete || onEdit || onDelete);

  const handleMenu = useCallback(() => {
    const buttons: DialogButton[] = [];
    if (onStart && sprint.status === "planning") {
      buttons.push({ text: t("sprint.start"), onPress: () => onStart(sprint) });
    }
    if (onComplete && sprint.status === "active") {
      buttons.push({
        text: t("sprint.complete"),
        onPress: () => onComplete(sprint),
      });
    }
    if (onEdit) buttons.push({ text: t("common.edit"), onPress: () => onEdit(sprint) });
    if (onDelete)
      buttons.push({
        text: t("common.delete"),
        style: "destructive",
        onPress: () => onDelete(sprint),
      });
    buttons.push({ text: t("common.cancel"), style: "cancel" });
    showAlert(sprint.name, t("sprint.actions"), buttons);
  }, [sprint, onStart, onComplete, onEdit, onDelete]);

  const statusColor = SPRINT_STATUS_COLORS[sprint.status] ?? colors.text.muted;

  const a11yLabel = [
    `Sprint ${sprint.name}`,
    sprint.status,
    `${sprint.completed_story_points} of ${sprint.total_story_points} points`,
    sprint.remaining_days !== null
      ? sprint.is_overdue
        ? `${Math.abs(sprint.remaining_days)} days overdue`
        : `${sprint.remaining_days} days left`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {sprint.name}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}25` }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {sprint.status}
          </Text>
        </View>
        {hasMenu ? (
          <TouchableOpacity
            onPress={handleMenu}
            hitSlop={8}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Sprint actions"
          >
            <Icon name="more-vert" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {sprint.goal ? (
        <Text style={styles.goal} numberOfLines={1}>
          {sprint.goal}
        </Text>
      ) : null}

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>
          {sprint.completed_story_points}/{sprint.total_story_points} pts
        </Text>
        <Text style={styles.dates}>
          {formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}
        </Text>
        {sprint.remaining_days !== null && (
          <Text style={[styles.days, sprint.is_overdue && styles.overdue]}>
            {sprint.is_overdue
              ? t("sprint.daysOver", { n: Math.abs(sprint.remaining_days) })
              : t("sprint.daysLeft", { n: sprint.remaining_days })}
          </Text>
        )}
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${sprint.progress_percentage}%` },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.base,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  menuBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.base,
  },
  goal: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metric: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"],
  },
  dates: { fontSize: typography.size.xs, color: colors.text.muted },
  days: {
    fontSize: typography.size.xs,
    color: colors.accent.cyan,
    fontWeight: "500",
  },
  overdue: { color: colors.status.error },
  progressBar: {
    height: 3,
    backgroundColor: colors.border.subtle,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent.purple,
    borderRadius: 2,
  },
});
