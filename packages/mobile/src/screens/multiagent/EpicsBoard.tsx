/**
 * EpicsBoard
 * List of epics for a given project, with an Actifs/Archivés toggle, progress
 * indicators, and a single PRD-decomposition entry point. Epics are created
 * exclusively from a PRD (the AI wizard) — there is no manual "+" anymore; the
 * card overflow menu drives archive/restore/delete. Rendered inside
 * PlanningScreen (Epics | Sprints segmented control), not a route on its own.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import { showAlert } from "@/services/dialog";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { useEpicsStore } from "@/stores/epicsStore";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useFadeIn } from "@/utils/animations";
import { EpicCard } from "@/components/multiagent/EpicCard";
import { EpicDecompositionModal } from "@/components/multiagent/EpicDecompositionModal";
import { EmptyState } from "@/components/common/EmptyState";
import { ShowArchivedToggle } from "@/components/os";
import { t } from "@/i18n";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { Epic } from "@/types";

// ==================== PROPS ====================

interface EpicsBoardProps {
  projectId: string;
}

// ==================== FAB ====================

interface FABProps {
  onDecompose: () => void;
}

const FAB = memo(function FAB({ onDecompose }: FABProps) {
  const fadeStyle = useFadeIn();
  return (
    <Animated.View style={[styles.fabWrap, fadeStyle]}>
      <TouchableOpacity
        style={styles.fab}
        onPress={onDecompose}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Decompose a PRD into an epic"
      >
        <Icon name="auto-awesome" size={24} color={colors.text.inverse} />
      </TouchableOpacity>
    </Animated.View>
  );
});

// ==================== SKELETON ====================

const EpicSkeleton = memo(function EpicSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.epicSkeleton, { opacity }]} />;
});

// ==================== LIST HEADER ====================

interface ListHeaderProps {
  total: number;
  done: number;
  inProgress: number;
}

const ListHeaderComponent = memo(function ListHeaderComponent({
  total,
  done,
  inProgress,
}: ListHeaderProps) {
  if (total === 0) return null;
  return (
    <View style={styles.listHeader}>
      <View style={styles.listHeaderStat}>
        <Text style={styles.listHeaderValue}>{total}</Text>
        <Text style={styles.listHeaderLabel}>{t("epicsBoard.statTotal")}</Text>
      </View>
      <View style={styles.listHeaderDivider} />
      <View style={styles.listHeaderStat}>
        <Text
          style={[styles.listHeaderValue, { color: colors.primary.purple }]}
        >
          {inProgress}
        </Text>
        <Text style={styles.listHeaderLabel}>
          {t("epicsBoard.statInProgress")}
        </Text>
      </View>
      <View style={styles.listHeaderDivider} />
      <View style={styles.listHeaderStat}>
        <Text
          style={[styles.listHeaderValue, { color: colors.semantic.success }]}
        >
          {done}
        </Text>
        <Text style={styles.listHeaderLabel}>{t("epicsBoard.statDone")}</Text>
      </View>
    </View>
  );
});

// ==================== MAIN BOARD ====================

export const EpicsBoard = memo(function EpicsBoard({
  projectId,
}: EpicsBoardProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProjectsStackParamList>>();
  const { isExpanded } = useResponsiveLayout();
  const numColumns = isExpanded ? 2 : 1;
  const {
    getEpicsByProject,
    getArchivedEpicsByProject,
    fetchEpics,
    fetchArchivedEpics,
    archiveEpic,
    unarchiveEpic,
    deleteEpic,
    subscribeRealtime,
    showArchived,
    setShowArchived,
    isLoading,
    error,
    clearError,
  } = useEpicsStore();

  const activeEpics = getEpicsByProject(projectId);
  const archivedEpics = getArchivedEpicsByProject(projectId);
  const epics = showArchived ? archivedEpics : activeEpics;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWizardVisible, setIsWizardVisible] = useState(false);

  // Fetch the relevant list whenever the project or the archived view changes.
  const load = useCallback(async () => {
    try {
      if (showArchived) {
        await fetchArchivedEpics(projectId);
      } else {
        await fetchEpics(projectId);
      }
    } catch {
      // error state managed in store
    }
  }, [projectId, showArchived, fetchEpics, fetchArchivedEpics]);

  useEffect(() => {
    load();
  }, [load]);

  // Live archive/decompose/PR updates while the board is mounted.
  useEffect(() => subscribeRealtime(projectId), [projectId, subscribeRealtime]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await load();
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const handleEpicPress = useCallback(
    (epic: Epic) => {
      navigation.navigate("EpicDetail", { epicId: epic.id });
    },
    [navigation],
  );

  const handleArchive = useCallback(
    async (epic: Epic) => {
      try {
        await archiveEpic(epic.id);
      } catch {
        showAlert(t("common.error"), t("epicsBoard.archiveFailed"));
      }
    },
    [archiveEpic],
  );

  const handleUnarchive = useCallback(
    async (epic: Epic) => {
      try {
        await unarchiveEpic(epic.id);
      } catch {
        showAlert(t("common.error"), t("epicsBoard.restoreFailed"));
      }
    },
    [unarchiveEpic],
  );

  const handleDelete = useCallback(
    (epic: Epic) => {
      showAlert(
        t("epicsBoard.deleteTitle"),
        t("epicsBoard.deleteConfirm", { name: epic.title }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteEpic(epic.id);
              } catch {
                showAlert(t("common.error"), t("epicsBoard.deleteFailed"));
              }
            },
          },
        ],
      );
    },
    [deleteEpic],
  );

  // A launched decomposition lands a pending epic in the active list — surface
  // it by leaving the archived view if the user was browsing it.
  const handleDecomposeStarted = useCallback(() => {
    setShowArchived(false);
    void fetchEpics(projectId);
  }, [setShowArchived, fetchEpics, projectId]);

  const renderItem = useCallback(
    ({ item }: { item: Epic }) => (
      <View style={numColumns > 1 ? styles.gridCell : undefined}>
        <EpicCard
          epic={item}
          onPress={handleEpicPress}
          onArchive={item.is_archived ? undefined : handleArchive}
          onUnarchive={item.is_archived ? handleUnarchive : undefined}
          onDelete={handleDelete}
        />
      </View>
    ),
    [handleEpicPress, handleArchive, handleUnarchive, handleDelete, numColumns],
  );

  const keyExtractor = useCallback((item: Epic) => item.id, []);

  const doneCount = epics.filter((e) => e.status === "done").length;
  const inProgressCount = epics.filter(
    (e) => e.status === "in_progress",
  ).length;

  if (isLoading && epics.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((k) => (
            <EpicSkeleton key={k} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      {/* Actifs / Archivés toggle */}
      <View style={styles.toolbar}>
        <ShowArchivedToggle
          value={showArchived}
          onChange={setShowArchived}
          activeLabel={t("common.active")}
          archivedLabel={t("common.archived")}
          activeCount={activeEpics.length}
          archivedCount={archivedEpics.length}
        />
      </View>

      {/* Error banner */}
      {error ? (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={clearError}
          activeOpacity={0.7}
        >
          <Icon name="error-outline" size={16} color={colors.semantic.error} />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
          <Icon name="close" size={16} color={colors.semantic.error} />
        </TouchableOpacity>
      ) : null}

      <FlatList
        key={`cols-${numColumns}`}
        data={epics}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={
          <ListHeaderComponent
            total={epics.length}
            done={doneCount}
            inProgress={inProgressCount}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.purple}
            colors={[colors.primary.purple]}
          />
        }
        ListEmptyComponent={
          showArchived ? (
            <EmptyState
              icon="archive"
              title={t("epicsBoard.noArchivedTitle")}
              description={t("epicsBoard.noArchivedDesc")}
            />
          ) : (
            <EmptyState
              icon="auto-awesome"
              title={t("epicsBoard.noEpicsTitle")}
              description={t("epicsBoard.noEpicsDesc")}
              actionLabel={t("epicsBoard.noEpicsAction")}
              onAction={() => setIsWizardVisible(true)}
            />
          )
        }
      />

      {/* Single entry point: PRD decomposition wizard. Hidden in the archived
          view (you don't create epics there). */}
      {!showArchived ? (
        <FAB onDecompose={() => setIsWizardVisible(true)} />
      ) : null}

      <EpicDecompositionModal
        visible={isWizardVisible}
        projectId={projectId}
        onClose={() => setIsWizardVisible(false)}
        onStarted={handleDecomposeStarted}
      />
    </SafeAreaView>
  );
});

// ==================== STYLES ====================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl + 64, // FAB clearance
    flexGrow: 1,
  },
  // Tablet/landscape 2-column grid.
  columnWrapper: {
    gap: spacing.md,
  },
  gridCell: {
    flex: 1,
  },
  // Summary header
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  listHeaderStat: {
    flex: 1,
    alignItems: "center",
  },
  listHeaderValue: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  listHeaderLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  listHeaderDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
  },
  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.semantic.error + "18",
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.error + "40",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  // Skeleton
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  epicSkeleton: {
    height: 88,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
  },
  // FAB
  fabWrap: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.md,
    alignItems: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.purple,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
});
