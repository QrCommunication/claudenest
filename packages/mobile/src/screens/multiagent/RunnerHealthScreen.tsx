/**
 * RunnerHealthScreen
 * Surfaces the server-side Runner Agent — an automated health monitor that the
 * mobile app previously never exposed (runnerApi was defined but unwired). Shows
 * alerts (blocked tasks, overdue sprint/tasks), task/sprint/epic checks, and
 * recommendations, plus a one-tap status sweep (auto-update).
 *
 * The Runner endpoints return RAW snake_case arrays (no Resource), mirrored in
 * the Runner* types.
 */

import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { RunnerAlert } from "@/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { WindowFrame } from "@/components/os";
import { EmptyState, ErrorMessage, LoadingSpinner } from "@/components/common";
import { showAlert } from "@/services/dialog";
import { useRunnerStore } from "@/stores/runnerStore";

type Props = NativeStackScreenProps<ProjectsStackParamList, "RunnerHealth">;

type IconName = React.ComponentProps<typeof Icon>["name"];

function alertMeta(level: RunnerAlert["level"]): {
  icon: IconName;
  color: string;
} {
  return level === "critical"
    ? { icon: "error", color: colors.status.error }
    : { icon: "warning", color: colors.status.warning };
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <View
      style={styles.tile}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <Text style={[styles.tileValue, tone ? { color: tone } : null]}>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export const RunnerHealthScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;
  const { health, isLoading, isSweeping, error, fetchHealth, runAutoUpdate } =
    useRunnerStore();

  useEffect(() => {
    fetchHealth(projectId);
  }, [projectId, fetchHealth]);

  const handleSweep = useCallback(async () => {
    try {
      const count = await runAutoUpdate(projectId);
      showAlert(
        "Sweep complete",
        count > 0
          ? `${count} item(s) auto-updated based on instance activity.`
          : "Everything is already up to date.",
      );
    } catch {
      showAlert("Error", "The status sweep could not be completed.");
    }
  }, [projectId, runAutoUpdate]);

  if (isLoading && !health) {
    return <LoadingSpinner text="Checking project health..." fullScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => fetchHealth(projectId)}
          tintColor={colors.accent.purple}
        />
      }
    >
      {error ? (
        <ErrorMessage message={error} onRetry={() => fetchHealth(projectId)} />
      ) : null}

      {!health ? (
        <EmptyState
          icon="monitor-heart"
          title="No health data"
          description="Pull to refresh to run the first health check."
        />
      ) : (
        <>
          {/* Alerts — the actionable signal, shown first */}
          <WindowFrame
            title="runner.alerts"
            subtitle={`${health.alerts.length} active`}
            accent="cyan"
            glow={health.alerts.some((a) => a.level === "critical")}
          >
            {health.alerts.length === 0 ? (
              <View style={styles.allClear}>
                <Icon
                  name="check-circle"
                  size={18}
                  color={colors.status.success}
                />
                <Text style={styles.allClearText}>No active alerts</Text>
              </View>
            ) : (
              health.alerts.map((a, i) => {
                const { icon, color } = alertMeta(a.level);
                return (
                  <View
                    key={`${a.type}-${i}`}
                    style={styles.alertRow}
                    accessible
                    accessibilityLabel={`${a.level} alert: ${a.message}`}
                  >
                    <Icon name={icon} size={18} color={color} />
                    <Text style={styles.alertText}>{a.message}</Text>
                  </View>
                );
              })
            )}
          </WindowFrame>

          {/* Task / sprint / epic checks */}
          <WindowFrame title="runner.checks" style={styles.frameGap}>
            <Text style={styles.sectionLabel}>Tasks</Text>
            <View style={styles.tileRow}>
              <StatTile label="total" value={health.tasks.total} />
              <StatTile
                label="done"
                value={health.tasks.completed}
                tone={colors.status.success}
              />
              <StatTile
                label="blocked"
                value={health.tasks.blocked}
                tone={
                  health.tasks.blocked > 0 ? colors.status.error : undefined
                }
              />
            </View>
            <View style={styles.tileRow}>
              <StatTile
                label="overdue"
                value={health.tasks.overdue}
                tone={
                  health.tasks.overdue > 0 ? colors.status.warning : undefined
                }
              />
              <StatTile label="unestimated" value={health.tasks.unestimated} />
              <View style={styles.tile} />
            </View>

            <Text style={[styles.sectionLabel, styles.sectionLabelGap]}>
              Sprints
            </Text>
            {health.sprints.active ? (
              <View style={styles.activeSprint}>
                <Icon name="loop" size={15} color={colors.accent.cyan} />
                <Text style={styles.activeSprintText} numberOfLines={1}>
                  {health.sprints.active.name} ·{" "}
                  {health.sprints.active.progress}%
                  {health.sprints.active.is_overdue
                    ? " · overdue"
                    : health.sprints.active.remaining_days !== null
                      ? ` · ${health.sprints.active.remaining_days}d left`
                      : ""}
                </Text>
              </View>
            ) : (
              <Text style={styles.muted}>No active sprint</Text>
            )}
            <View style={styles.tileRow}>
              <StatTile
                label="planning"
                value={health.sprints.planning_count}
              />
              <StatTile
                label="completed"
                value={health.sprints.completed_count}
              />
              <StatTile label="epics" value={health.epics.length} />
            </View>
          </WindowFrame>

          {/* Recommendations */}
          {health.recommendations.length > 0 ? (
            <WindowFrame
              title="runner.recommendations"
              subtitle={`${health.recommendations.length}`}
              style={styles.frameGap}
            >
              {health.recommendations.map((rec, i) => (
                <View key={i} style={styles.recRow}>
                  <Icon
                    name="lightbulb"
                    size={16}
                    color={colors.accent.purple}
                  />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </WindowFrame>
          ) : null}

          {/* Auto-update sweep */}
          <TouchableOpacity
            style={[styles.sweepBtn, isSweeping && styles.sweepBtnBusy]}
            onPress={handleSweep}
            disabled={isSweeping}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Run status sweep"
            accessibilityState={{ disabled: isSweeping, busy: isSweeping }}
          >
            {isSweeping ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Icon name="sync" size={18} color={colors.text.inverse} />
            )}
            <Text style={styles.sweepBtnText}>
              {isSweeping ? "Sweeping…" : "Run status sweep"}
            </Text>
          </TouchableOpacity>

          {health.checked_at ? (
            <Text style={styles.checkedAt}>
              Last checked {new Date(health.checked_at).toLocaleString()}
            </Text>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  frameGap: {
    marginTop: spacing.md,
  },
  allClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  allClearText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  alertText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.primary,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  sectionLabelGap: {
    marginTop: spacing.md,
  },
  tileRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  tileValue: {
    fontSize: typography.size.xl,
    fontWeight: "800",
    color: colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  tileLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  activeSprint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  activeSprintText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  muted: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  recRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  sweepBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent.purple,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  sweepBtnBusy: {
    opacity: 0.7,
  },
  sweepBtnText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.inverse,
  },
  checkedAt: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
