/**
 * SprintDetailScreen
 * Sprint header (goal, status, progress, story points) + a burndown chart.
 * Reachable by tapping a sprint in the Planning → Sprints board.
 */

import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { Sprint } from "@/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { WindowFrame } from "@/components/os";
import { BurndownChart } from "@/components/multiagent/BurndownChart";
import { LoadingSpinner } from "@/components/common";
import { useSprintsStore } from "@/stores/sprintsStore";
import { sprintsApi } from "@/services/api";

type Props = NativeStackScreenProps<ProjectsStackParamList, "SprintDetail">;

const STATUS_COLOR: Record<string, string> = {
  planning: colors.text.muted,
  active: colors.status.success,
  completed: colors.accent.cyan,
  cancelled: colors.status.error,
};

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
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

export const SprintDetailScreen: React.FC<Props> = ({ route }) => {
  const { sprintId } = route.params;
  const storeSprint = useSprintsStore((s) => s.getSprintById(sprintId));
  const burndownData = useSprintsStore((s) => s.burndownData);
  const fetchBurndown = useSprintsStore((s) => s.fetchBurndown);

  const [localSprint, setLocalSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);

  const sprint = storeSprint ?? localSprint;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      if (!storeSprint) {
        const res = await sprintsApi.get(sprintId);
        setLocalSprint(res.data ?? null);
      }
      await fetchBurndown(sprintId);
    } catch {
      // errors surface via the store; keep the screen renderable
    } finally {
      setLoading(false);
    }
  }, [sprintId, storeSprint, fetchBurndown]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !sprint) {
    return <LoadingSpinner text="Loading sprint..." fullScreen />;
  }

  if (!sprint) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Sprint not found.</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[sprint.status] ?? colors.text.muted;
  const progress = Math.min(100, Math.max(0, sprint.progress_percentage));

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
        title="sprint"
        subtitle={sprint.name}
        actions={
          <View
            style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {sprint.status}
            </Text>
          </View>
        }
        style={styles.window}
      >
        {sprint.goal ? (
          <Text style={styles.goal}>{sprint.goal}</Text>
        ) : (
          <Text style={styles.muted}>No goal set.</Text>
        )}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {progress}% · {sprint.completed_story_points}/
          {sprint.total_story_points} pts
        </Text>

        <View style={styles.statGrid}>
          <Stat
            icon="task-alt"
            label="tasks"
            value={`${sprint.completed_tasks_count}/${sprint.tasks_count}`}
          />
          <Stat
            icon="speed"
            label="velocity"
            value={`${sprint.velocity ?? "—"}`}
          />
          <Stat
            icon="inventory"
            label="capacity"
            value={`${sprint.capacity ?? "—"}`}
          />
          <Stat
            icon={sprint.is_overdue ? "warning" : "schedule"}
            label={sprint.is_overdue ? "overdue" : "days left"}
            value={`${sprint.remaining_days ?? "—"}`}
          />
        </View>
      </WindowFrame>

      <WindowFrame
        title="burndown"
        subtitle={`${burndownData.length} days`}
        accent="cyan"
        style={styles.window}
      >
        <BurndownChart data={burndownData} />
      </WindowFrame>
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
  goal: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
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
});
