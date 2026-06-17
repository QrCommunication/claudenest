/**
 * ProjectPanel — the native OS panel for a project (replaces the horizontal-tab
 * ProjectScreen inside a Claude OS window). The project's tools become an icon
 * grid (each tile opens its own window via the registry); below it, a live
 * overview (token usage, summary, focus, active instances). Reuses the same
 * stores as the legacy screen, so it always fetches and displays real data.
 */

import React, { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { useProjectsStore } from "@/stores/projectsStore";
import { useEpicsStore } from "@/stores/epicsStore";
import { useSprintsStore } from "@/stores/sprintsStore";
import {
  Card,
  CardContent,
  CardHeader,
  LoadingSpinner,
} from "@/components/common";
import { InstanceCard } from "@/components/multiagent";
import { useWindowApi } from "../windowApi";
import { resolveRoute } from "../appRegistry";
import { OSNavGrid, type NavGridItem } from "./OSPrimitives";

export function ProjectPanel({ projectId }: { projectId: string }) {
  const {
    getProjectById,
    fetchProject,
    fetchInstances,
    fetchTasks,
    fetchLocks,
    getProjectInstances,
    getProjectTasks,
    getProjectLocks,
    subscribeToProject,
  } = useProjectsStore();
  const { getEpicsByProject, fetchEpics } = useEpicsStore();
  const { getSprintsByProject, fetchSprints } = useSprintsStore();
  const windowApi = useWindowApi();

  const project = getProjectById(projectId);
  const instances = getProjectInstances(projectId);
  const tasks = getProjectTasks(projectId);
  const locks = getProjectLocks(projectId);
  const epics = getEpicsByProject(projectId);
  const sprints = getSprintsByProject(projectId);

  useEffect(() => {
    fetchProject(projectId);
    fetchInstances(projectId);
    fetchTasks(projectId);
    fetchLocks(projectId);
    fetchEpics(projectId);
    fetchSprints(projectId);
    const unsubscribe = subscribeToProject(projectId);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const open = (route: string) => {
    const input = resolveRoute(route, { projectId });
    if (input) windowApi.openApp(input);
  };

  const pendingTasks = tasks.filter((t) => t.status !== "done").length;

  const items: NavGridItem[] = useMemo(
    () => [
      {
        key: "tasks",
        icon: "checklist",
        label: "Tasks",
        badge: pendingTasks,
        accent: "cyan",
        onPress: () => open("Tasks"),
      },
      {
        key: "planning",
        icon: "view-kanban",
        label: "Planning",
        badge: epics.length + sprints.length,
        accent: "purple",
        onPress: () => open("Planning"),
      },
      {
        key: "git",
        icon: "merge-type",
        label: "Git",
        accent: "cyan",
        onPress: () => open("Git"),
      },
      {
        key: "orchestration",
        icon: "hub",
        label: "Workers",
        badge: instances.length,
        accent: "cyan",
        onPress: () => open("Orchestration"),
      },
      {
        key: "locks",
        icon: "lock",
        label: "Locks",
        badge: locks.length,
        accent: "cyan",
        onPress: () => open("Locks"),
      },
      {
        key: "audit",
        icon: "history",
        label: "Audit",
        accent: "cyan",
        onPress: () => open("Audit"),
      },
      {
        key: "health",
        icon: "monitor-heart",
        label: "Health",
        accent: "cyan",
        onPress: () => open("RunnerHealth"),
      },
      {
        key: "context",
        icon: "memory",
        label: "Context",
        accent: "cyan",
        onPress: () => open("Context"),
      },
      {
        key: "assistant",
        icon: "forum",
        label: "Assistant",
        accent: "purple",
        onPress: () => open("PlanningChat"),
      },
      {
        key: "decompose",
        icon: "auto-awesome",
        label: "Decompose",
        accent: "purple",
        onPress: () => open("DecomposeEpic"),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      pendingTasks,
      epics.length,
      sprints.length,
      instances.length,
      locks.length,
    ],
  );

  if (!project) {
    return <LoadingSpinner text="Loading project..." fullScreen />;
  }

  const tokenPct =
    project.maxTokens > 0
      ? Math.round(Math.min(project.totalTokens / project.maxTokens, 1) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Icon name="folder-shared" size={26} color={colors.accent.purple} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={styles.path} numberOfLines={1}>
            {project.projectPath}
          </Text>
        </View>
      </View>

      {project.maxTokens > 0 ? (
        <View style={styles.tokenRow}>
          <View style={styles.tokenTrack}>
            <View style={[styles.tokenFill, { width: `${tokenPct}%` }]} />
          </View>
          <Text style={styles.tokenText}>{tokenPct}% tokens</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Tools</Text>
      <OSNavGrid items={items} />

      {project.summary ? (
        <Card style={styles.card}>
          <CardHeader title="Summary" />
          <CardContent>
            <Text style={styles.body}>{project.summary}</Text>
          </CardContent>
        </Card>
      ) : null}

      {project.currentFocus ? (
        <Card style={styles.card}>
          <CardHeader title="Current Focus" />
          <CardContent>
            <Text style={styles.body}>{project.currentFocus}</Text>
          </CardContent>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <CardHeader
          title="Active Instances"
          rightContent={<Text style={styles.count}>{instances.length}</Text>}
        />
        {instances.length > 0 ? (
          instances.map((inst) => (
            <InstanceCard key={inst.id} instance={inst} />
          ))
        ) : (
          <CardContent>
            <Text style={styles.empty}>No active instances</Text>
          </CardContent>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.hover,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
  },
  path: {
    ...typography.mono,
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tokenTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  tokenFill: {
    height: "100%",
    backgroundColor: colors.accent.cyan,
  },
  tokenText: {
    ...typography.mono,
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  sectionLabel: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {},
  body: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  count: {
    fontSize: typography.size.md,
    fontWeight: "600",
    color: colors.accent.purple,
  },
  empty: {
    fontSize: typography.size.base,
    color: colors.text.muted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
