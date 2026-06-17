/**
 * EpicDetailScreen
 * Epic header (title, status, priority, AI-decomposition state, PR) + progress
 * and a stat grid, followed by the epic's tasks. Reachable by tapping an epic
 * in the Planning → Epics board.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
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
import type {
  DecompositionStatus,
  Epic,
  EpicPrState,
  SharedTask,
} from "@/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { WindowFrame } from "@/components/os";
import { LoadingSpinner, Badge, EmptyState } from "@/components/common";
import { TaskCard } from "@/components/multiagent/TaskCard";
import { t } from "@/i18n";
import { useEpicsStore } from "@/stores/epicsStore";
import { epicsApi, tasksApi } from "@/services/api";

type Props = NativeStackScreenProps<ProjectsStackParamList, "EpicDetail">;

const STATUS_COLOR: Record<string, string> = {
  open: colors.text.muted,
  in_progress: colors.accent.purple,
  done: colors.status.success,
};

const PRIORITY_VARIANT: Record<
  string,
  "error" | "warning" | "primary" | "default"
> = {
  critical: "error",
  high: "warning",
  medium: "primary",
  low: "default",
};

interface PillMeta {
  label: string;
  icon: keyof typeof Icon.glyphMap;
  color: string;
}

function decompPill(status: DecompositionStatus | null): PillMeta | null {
  switch (status) {
    case "pending":
      return { label: t("epic.decompPending"), icon: "schedule", color: colors.accent.cyan };
    case "running":
      return {
        label: t("epic.decompRunning"),
        icon: "autorenew",
        color: colors.accent.purple,
      };
    case "completed":
      return {
        label: t("epic.decompCompleted"),
        icon: "auto-awesome",
        color: colors.status.success,
      };
    case "failed":
      return {
        label: t("epic.decompFailedLong"),
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

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Icon.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={16} color={colors.accent.purple} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export const EpicDetailScreen: React.FC<Props> = ({ route }) => {
  const { epicId } = route.params;
  const storeEpic = useEpicsStore((s) => s.getEpicById(epicId));

  const [localEpic, setLocalEpic] = useState<Epic | null>(null);
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [loading, setLoading] = useState(true);

  const epic = storeEpic ?? localEpic;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const current = useEpicsStore.getState().getEpicById(epicId);
      let resolved: Epic | null = current ?? null;
      if (!resolved) {
        const res = await epicsApi.get(epicId);
        resolved = res.data ?? null;
        setLocalEpic(resolved);
      }
      if (resolved) {
        // Reveal archived-epic tasks too so the detail stays consistent with
        // the epic's archive state.
        const res = await tasksApi.list(resolved.project_id, {
          archived: resolved.is_archived,
        });
        const all = res.data ?? [];
        setTasks(all.filter((t) => t.epic_id === epicId));
      }
    } catch {
      // keep the screen renderable; errors are non-fatal here
    } finally {
      setLoading(false);
    }
  }, [epicId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !epic) {
    return <LoadingSpinner text={t("epic.loading")} fullScreen />;
  }

  if (!epic) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>{t("epic.notFound")}</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[epic.status] ?? colors.text.muted;
  const progress = Math.min(100, Math.max(0, epic.progress_percentage));
  const decomp = decompPill(epic.decomposition_status);
  const showPr = epic.has_pull_request && epic.pr_state != null;
  const openPr = () => {
    if (epic.pr_url) void Linking.openURL(epic.pr_url);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void load()}
          tintColor={colors.accent.purple}
        />
      }
    >
      <WindowFrame
        title="epic"
        subtitle={epic.title}
        actions={
          <View
            style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {epic.status.replace("_", " ")}
            </Text>
          </View>
        }
        style={styles.window}
      >
        {epic.description ? (
          <Text style={styles.description}>{epic.description}</Text>
        ) : (
          <Text style={styles.muted}>{t("epic.detailNoDescription")}</Text>
        )}

        {/* Badges: priority + decomposition + PR */}
        <View style={styles.badgeRow}>
          <Badge
            text={epic.priority}
            variant={PRIORITY_VARIANT[epic.priority] ?? "default"}
          />
          {decomp ? (
            <View
              style={[styles.pill, { backgroundColor: `${decomp.color}1f` }]}
            >
              <Icon name={decomp.icon} size={12} color={decomp.color} />
              <Text style={[styles.pillText, { color: decomp.color }]}>
                {decomp.label}
              </Text>
            </View>
          ) : null}
          {showPr ? (
            <TouchableOpacity
              onPress={epic.pr_url ? openPr : undefined}
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
                {epic.pr_number != null ? `PR #${epic.pr_number}` : "PR"} ·{" "}
                {epic.pr_state}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {epic.decomposition_status === "failed" && epic.decomposition_error ? (
          <Text style={styles.errorNote}>{epic.decomposition_error}</Text>
        ) : null}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: epic.color },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {progress}% · {epic.completed_tasks_count}/{epic.tasks_count} tasks
        </Text>

        <View style={styles.statGrid}>
          <Stat
            icon="task-alt"
            label={t("epic.tasksDone")}
            value={`${epic.completed_tasks_count}/${epic.tasks_count}`}
          />
          <Stat
            icon="pending-actions"
            label={t("epic.tasksRemaining")}
            value={`${epic.remaining_tasks_count}`}
          />
        </View>
      </WindowFrame>

      <WindowFrame
        title={t("epic.detailTasks")}
        subtitle={`${tasks.length}`}
        accent="cyan"
        style={styles.window}
      >
        {tasks.length === 0 ? (
          <EmptyState
            icon="task-alt"
            title={t("epic.detailNoTasks")}
            description={
              epic.decomposition_status === "running"
                ? t("epic.detailNoTasksRunning")
                : t("epic.detailNoTasksIdle")
            }
          />
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onPress={noop} />
            ))}
          </View>
        )}
      </WindowFrame>
    </ScrollView>
  );
};

const noop = (): void => {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  window: {
    minHeight: 100,
  },
  muted: {
    ...typography.mono,
    fontSize: 12,
    color: colors.text.muted,
  },
  description: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
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
  errorNote: {
    ...typography.mono,
    fontSize: 11,
    color: colors.status.error,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  statusPill: {
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusText: {
    ...typography.mono,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  progressTrack: {
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.input,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  progressLabel: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  stat: {
    flexBasis: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statValue: {
    ...typography.mono,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  taskList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
