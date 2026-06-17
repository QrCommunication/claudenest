/**
 * EpicCard
 * Rich epic summary used by the epics board: title + status, AI-decomposition
 * state badge, epic-level PR badge, priority badge, progress, and an optional
 * overflow menu (edit / archive·restore / delete). Action props are optional so
 * the existing board (press + long-press delete) keeps working unchanged; the
 * kebab only appears once a menu callback is wired.
 */

import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { Badge } from "@/components/common";
import { showAlert, type DialogButton } from "@/services/dialog";
import { t } from "@/i18n";
import type {
  DecompositionStatus,
  Epic,
  EpicPrState,
  TaskPriority,
} from "@/types";

interface EpicCardProps {
  epic: Epic;
  onPress: (epic: Epic) => void;
  /** Long-press action (e.g. delete confirmation). Kept for back-compat. */
  onLongPress?: (epic: Epic) => void;
  /** Overflow-menu actions — when provided, a kebab button appears. */
  onEdit?: (epic: Epic) => void;
  onArchive?: (epic: Epic) => void;
  onUnarchive?: (epic: Epic) => void;
  onDelete?: (epic: Epic) => void;
}

const EPIC_STATUS_COLORS: Record<string, string> = {
  open: colors.text.muted,
  in_progress: colors.accent.purple,
  done: colors.status.success,
};

const PRIORITY_VARIANT: Record<
  TaskPriority,
  "error" | "warning" | "primary" | "default"
> = {
  critical: "error",
  high: "warning",
  medium: "primary",
  low: "default",
};

interface DecompMeta {
  label: string;
  icon: keyof typeof Icon.glyphMap;
  color: string;
  spinning?: boolean;
}

/** AI-decomposition pill descriptor. `idle`/null render nothing. */
function decompMeta(status: DecompositionStatus | null): DecompMeta | null {
  switch (status) {
    case "pending":
      return { label: t("epic.decompPending"), icon: "schedule", color: colors.accent.cyan };
    case "running":
      return {
        label: t("epic.decompRunning"),
        icon: "autorenew",
        color: colors.accent.purple,
        spinning: true,
      };
    case "completed":
      return {
        label: t("epic.decompCompleted"),
        icon: "auto-awesome",
        color: colors.status.success,
      };
    case "failed":
      return {
        label: t("epic.decompFailed"),
        icon: "error-outline",
        color: colors.status.error,
      };
    default:
      return null;
  }
}

const PR_STATE_COLOR: Record<EpicPrState, string> = {
  open: colors.accent.cyan,
  merged: colors.accent.purple,
  closed: colors.text.muted,
};

export const EpicCard = memo(function EpicCard({
  epic,
  onPress,
  onLongPress,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: EpicCardProps) {
  const handlePress = useCallback(() => onPress(epic), [epic, onPress]);
  const handleLongPress = useCallback(
    () => onLongPress?.(epic),
    [epic, onLongPress],
  );

  const handlePrPress = useCallback(() => {
    if (epic.pr_url) void Linking.openURL(epic.pr_url);
  }, [epic.pr_url]);

  const hasMenu = !!(onEdit || onArchive || onUnarchive || onDelete);

  const handleMenu = useCallback(() => {
    const buttons: DialogButton[] = [];
    if (onEdit) buttons.push({ text: t("common.edit"), onPress: () => onEdit(epic) });
    if (epic.is_archived) {
      if (onUnarchive)
        buttons.push({ text: t("common.restore"), onPress: () => onUnarchive(epic) });
    } else if (onArchive) {
      buttons.push({ text: t("common.archive"), onPress: () => onArchive(epic) });
    }
    if (onDelete)
      buttons.push({
        text: t("common.delete"),
        style: "destructive",
        onPress: () => onDelete(epic),
      });
    buttons.push({ text: t("common.cancel"), style: "cancel" });
    showAlert(epic.title, t("epic.actions"), buttons);
  }, [epic, onEdit, onArchive, onUnarchive, onDelete]);

  const decomp = decompMeta(epic.decomposition_status);
  const statusColor = EPIC_STATUS_COLORS[epic.status] ?? colors.text.muted;
  const showPr = epic.has_pull_request && epic.pr_state != null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Epic ${epic.title}, ${epic.status.replace(
        "_",
        " ",
      )}, priority ${epic.priority}, ${epic.completed_tasks_count} of ${
        epic.tasks_count
      } tasks done`}
      accessibilityHint={
        hasMenu ? "Use the menu button for more actions" : undefined
      }
    >
      {/* Header: color dot, title, status pill, optional kebab */}
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: epic.color }]} />
        <Text style={styles.title} numberOfLines={1}>
          {epic.title}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}25` }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {epic.status.replace("_", " ")}
          </Text>
        </View>
        {hasMenu ? (
          <TouchableOpacity
            onPress={handleMenu}
            hitSlop={8}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Epic actions"
          >
            <Icon name="more-vert" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {epic.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {epic.description}
        </Text>
      ) : null}

      {/* Meta row: priority + decomposition + PR badges */}
      <View style={styles.metaRow}>
        <Badge text={epic.priority} variant={PRIORITY_VARIANT[epic.priority]} />

        {decomp ? (
          <View style={[styles.pill, { backgroundColor: `${decomp.color}1f` }]}>
            {decomp.spinning ? (
              <ActivityIndicator size="small" color={decomp.color} />
            ) : (
              <Icon name={decomp.icon} size={12} color={decomp.color} />
            )}
            <Text style={[styles.pillText, { color: decomp.color }]}>
              {decomp.label}
            </Text>
          </View>
        ) : null}

        {showPr ? (
          <TouchableOpacity
            onPress={epic.pr_url ? handlePrPress : undefined}
            disabled={!epic.pr_url}
            style={[
              styles.pill,
              { backgroundColor: `${PR_STATE_COLOR[epic.pr_state!]}1f` },
            ]}
            accessibilityRole="link"
            accessibilityLabel={`Pull request ${
              epic.pr_number != null ? `number ${epic.pr_number}` : ""
            }, ${epic.pr_state}`}
          >
            <Icon
              name="merge-type"
              size={12}
              color={PR_STATE_COLOR[epic.pr_state!]}
            />
            <Text
              style={[
                styles.pillText,
                { color: PR_STATE_COLOR[epic.pr_state!] },
              ]}
            >
              {epic.pr_number != null
                ? t("epic.prNumbered", { number: epic.pr_number })
                : t("epic.pr")}
              {epic.pr_state === "merged" ? ` · ${t("epic.prMerged")}` : ""}
              {epic.pr_state === "closed" ? ` · ${t("epic.prClosed")}` : ""}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${epic.progress_percentage}%`,
                backgroundColor: epic.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {epic.completed_tasks_count}/{epic.tasks_count}
        </Text>
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
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  colorDot: { width: 10, height: 10, borderRadius: 2 },
  title: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
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
  description: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.base,
  },
  pillText: {
    fontSize: typography.size.xs,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border.subtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontVariant: ["tabular-nums"],
  },
});
