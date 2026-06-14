/**
 * ProjectsListScreen
 * Active multi-agent projects + a collapsible "Archived" section.
 * Archiving is reversible (the server keeps a context snapshot and deletes
 * nothing); long-press a project to archive, expand "Archived" to restore.
 */

import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { useProjectsStore } from "@/stores/projectsStore";
import { useMachinesStore } from "@/stores/machinesStore";
import { showAlert } from "@/services/dialog";
import { websocket } from "@/services/websocket";
import type { SharedProject } from "@/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";

import {
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
  Card,
} from "@/components/common";

type Props = NativeStackScreenProps<ProjectsStackParamList, "ProjectsList">;

const ProjectCard: React.FC<{
  project: SharedProject;
  onPress: () => void;
  onLongPress: () => void;
}> = ({ project, onPress, onLongPress }) => (
  <Card onPress={onPress} onLongPress={onLongPress} style={styles.projectCard}>
    <View style={styles.projectHeader}>
      <View style={styles.iconContainer}>
        <Icon name="folder-shared" size={24} color={colors.primary.purple} />
      </View>
      <View style={styles.projectInfo}>
        <Text style={styles.projectName} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={styles.projectPath} numberOfLines={1}>
          {project.projectPath}
        </Text>
      </View>
    </View>
    {project.summary && (
      <Text style={styles.projectSummary} numberOfLines={2}>
        {project.summary}
      </Text>
    )}
    <View style={styles.projectStats}>
      <View style={styles.stat}>
        <Icon name="memory" size={14} color={colors.text.muted} />
        <Text style={styles.statText}>
          {Math.round(project.totalTokens / 1000)}k tokens
        </Text>
      </View>
    </View>
  </Card>
);

const ArchivedRow: React.FC<{
  project: SharedProject;
  restoring: boolean;
  onRestore: () => void;
}> = ({ project, restoring, onRestore }) => (
  <View style={styles.archivedRow}>
    <Icon name="inventory-2" size={18} color={colors.text.muted} />
    <View style={styles.archivedInfo}>
      <Text style={styles.archivedName} numberOfLines={1}>
        {project.name}
      </Text>
      <Text style={styles.archivedPath} numberOfLines={1}>
        {project.projectPath}
      </Text>
    </View>
    <TouchableOpacity
      style={styles.restoreBtn}
      onPress={onRestore}
      disabled={restoring}
      activeOpacity={0.8}
    >
      {restoring ? (
        <ActivityIndicator size="small" color={colors.accent.cyan} />
      ) : (
        <>
          <Icon name="unarchive" size={15} color={colors.accent.cyan} />
          <Text style={styles.restoreText}>Restore</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

export const ProjectsListScreen: React.FC<Props> = ({ navigation }) => {
  const {
    projects,
    archivedProjects,
    isLoading,
    isLoadingArchived,
    error,
    fetchProjects,
    fetchArchivedProjects,
    archiveProject,
    unarchiveProject,
    applyProjectArchived,
    applyProjectUnarchived,
    clearError,
  } = useProjectsStore();
  const { machines, fetchMachines } = useMachinesStore();

  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchMachines().then(() => {
      machines.forEach((m) => fetchProjects(m.id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime archive/restore (another device or a worker) — keep the active
  // and archived lists in sync. Only the internal listeners are torn down;
  // the Echo machine channel is left joined (MachineDetail may share it).
  useEffect(() => {
    machines.forEach((m) => websocket.subscribeToMachine(m.id));

    const offArchived = websocket.on("project:archived", (raw) => {
      const p = raw as { project_id?: string };
      if (p.project_id) applyProjectArchived(p.project_id);
    });
    const offUnarchived = websocket.on("project:unarchived", (raw) => {
      const p = raw as { project_id?: string; machine_id?: string };
      if (p.project_id) applyProjectUnarchived(p.project_id, p.machine_id);
    });

    return () => {
      offArchived();
      offUnarchived();
    };
  }, [machines, applyProjectArchived, applyProjectUnarchived]);

  const handleRefresh = useCallback(() => {
    machines.forEach((m) => fetchProjects(m.id));
    if (archivedExpanded) {
      machines.forEach((m) => void fetchArchivedProjects(m.id));
    }
  }, [machines, fetchProjects, fetchArchivedProjects, archivedExpanded]);

  const handlePressProject = useCallback(
    (project: SharedProject) => {
      navigation.navigate("ProjectDetail", { projectId: project.id });
    },
    [navigation],
  );

  const handleArchive = useCallback(
    (project: SharedProject) => {
      showAlert(
        "Archive project",
        `Archive "${project.name}"? It's reversible — nothing is deleted and you can restore it from the Archived section.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Archive",
            style: "destructive",
            onPress: async () => {
              try {
                await archiveProject(project.id);
              } catch {
                showAlert("Error", "Failed to archive project");
              }
            },
          },
        ],
      );
    },
    [archiveProject],
  );

  const handleToggleArchived = useCallback(() => {
    const next = !archivedExpanded;
    setArchivedExpanded(next);
    if (next && archivedProjects.length === 0) {
      machines.forEach((m) => void fetchArchivedProjects(m.id));
    }
  }, [
    archivedExpanded,
    archivedProjects.length,
    machines,
    fetchArchivedProjects,
  ]);

  const handleRestore = useCallback(
    async (project: SharedProject) => {
      setRestoringId(project.id);
      try {
        await unarchiveProject(project.id);
      } catch {
        showAlert("Error", "Failed to restore project");
      } finally {
        setRestoringId(null);
      }
    },
    [unarchiveProject],
  );

  const activeProjects = useMemo(
    () =>
      projects.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i),
    [projects],
  );

  const uniqueArchived = useMemo(
    () =>
      archivedProjects.filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
      ),
    [archivedProjects],
  );

  const renderItem = useCallback(
    ({ item }: { item: SharedProject }) => (
      <ProjectCard
        project={item}
        onPress={() => handlePressProject(item)}
        onLongPress={() => handleArchive(item)}
      />
    ),
    [handlePressProject, handleArchive],
  );

  const keyExtractor = useCallback((item: SharedProject) => item.id, []);

  const ArchivedSection = (
    <View style={styles.archivedSection}>
      <TouchableOpacity
        style={styles.archivedHeader}
        onPress={handleToggleArchived}
        activeOpacity={0.7}
      >
        <Icon
          name={archivedExpanded ? "expand-more" : "chevron-right"}
          size={20}
          color={colors.text.muted}
        />
        <Icon name="archive" size={16} color={colors.text.muted} />
        <Text style={styles.archivedTitle}>Archived</Text>
        {uniqueArchived.length > 0 ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{uniqueArchived.length}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {archivedExpanded ? (
        isLoadingArchived && uniqueArchived.length === 0 ? (
          <ActivityIndicator
            style={styles.archivedLoader}
            color={colors.accent.purple}
          />
        ) : uniqueArchived.length === 0 ? (
          <Text style={styles.archivedEmpty}>No archived projects</Text>
        ) : (
          uniqueArchived.map((p) => (
            <ArchivedRow
              key={p.id}
              project={p}
              restoring={restoringId === p.id}
              onRestore={() => handleRestore(p)}
            />
          ))
        )
      ) : null}
    </View>
  );

  if (isLoading && projects.length === 0) {
    return <LoadingSpinner text="Loading projects..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
          onDismiss={clearError}
        />
      )}

      <FlatList
        data={activeProjects}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary.purple}
            colors={[colors.primary.purple]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-shared"
            title="No projects"
            description="Create a project to enable multi-agent collaboration"
          />
        }
        ListFooterComponent={ArchivedSection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  projectCard: {
    marginBottom: spacing.md,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.dark2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: typography.size.md,
    fontWeight: "600",
    color: colors.text.primary,
  },
  projectPath: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  projectSummary: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  projectStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  // Archived section
  archivedSection: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
  },
  archivedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  archivedTitle: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  countPill: {
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.full,
    paddingHorizontal: 5,
    backgroundColor: colors.bg.input,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.muted,
  },
  archivedLoader: {
    paddingVertical: spacing.md,
  },
  archivedEmpty: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
  },
  archivedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  archivedInfo: {
    flex: 1,
  },
  archivedName: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  archivedPath: {
    ...typography.mono,
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 1,
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.accent.cyan,
    minWidth: 78,
    justifyContent: "center",
  },
  restoreText: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.accent.cyan,
  },
});
