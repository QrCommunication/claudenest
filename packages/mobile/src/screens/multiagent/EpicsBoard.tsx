/**
 * EpicsBoard
 * List of epics for a given project, with progress indicators and creation FAB.
 * Rendered inside PlanningScreen (Epics | Sprints segmented control) — not a
 * navigation route on its own anymore.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
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
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { Epic } from "@/types";

// ==================== PROPS ====================

interface EpicsBoardProps {
  projectId: string;
}

// ==================== CREATE EPIC MODAL ====================

interface CreateEpicModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

const CreateEpicModal = memo(function CreateEpicModal({
  visible,
  onClose,
  onSubmit,
}: CreateEpicModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setFieldError(null);
    }
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setFieldError("Title is required");
      return;
    }
    setIsSubmitting(true);
    setFieldError(null);
    try {
      await onSubmit(title.trim(), description.trim());
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFieldError(e.message ?? "Failed to create epic");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, onSubmit, onClose]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New Epic"
      footer={
        <View style={modalStyles.actions}>
          <TouchableOpacity
            style={modalStyles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              modalStyles.submitBtn,
              isSubmitting && modalStyles.btnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={modalStyles.submitContent}>
                <Icon
                  name="hourglass-empty"
                  size={16}
                  color={colors.text.primary}
                />
                <Text style={modalStyles.submitText}>Creating…</Text>
              </View>
            ) : (
              <Text style={modalStyles.submitText}>Create Epic</Text>
            )}
          </TouchableOpacity>
        </View>
      }
    >
      <Text style={modalStyles.subtitle}>
        Group related tasks under an epic to track broader goals.
      </Text>

      {fieldError ? (
        <View style={modalStyles.errorRow}>
          <Icon name="error-outline" size={14} color={colors.semantic.error} />
          <Text style={modalStyles.errorText}>{fieldError}</Text>
        </View>
      ) : null}

      <View style={modalStyles.inputGroup}>
        <Text style={modalStyles.inputLabel}>Title *</Text>
        <TextInput
          style={modalStyles.textInput}
          placeholder="e.g. Authentication system"
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="next"
          maxLength={120}
        />
      </View>

      <View style={modalStyles.inputGroup}>
        <Text style={modalStyles.inputLabel}>Description</Text>
        <TextInput
          style={[modalStyles.textInput, modalStyles.textInputMulti]}
          placeholder="What does this epic cover?"
          placeholderTextColor={colors.text.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={500}
        />
      </View>
    </Modal>
  );
});

// ==================== FAB ====================

interface FABProps {
  onPress: () => void;
  onDecompose: () => void;
}

const FAB = memo(function FAB({ onPress, onDecompose }: FABProps) {
  const fadeStyle = useFadeIn();
  return (
    <Animated.View style={[styles.fabWrap, fadeStyle]}>
      <TouchableOpacity
        style={styles.fabSecondary}
        onPress={onDecompose}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Decompose a PRD into an epic"
      >
        <Icon name="auto-awesome" size={20} color={colors.accent.cyan} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="New epic"
      >
        <Icon name="add" size={26} color={colors.text.primary} />
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
        <Text style={styles.listHeaderLabel}>total</Text>
      </View>
      <View style={styles.listHeaderDivider} />
      <View style={styles.listHeaderStat}>
        <Text
          style={[styles.listHeaderValue, { color: colors.primary.purple }]}
        >
          {inProgress}
        </Text>
        <Text style={styles.listHeaderLabel}>in progress</Text>
      </View>
      <View style={styles.listHeaderDivider} />
      <View style={styles.listHeaderStat}>
        <Text
          style={[styles.listHeaderValue, { color: colors.semantic.success }]}
        >
          {done}
        </Text>
        <Text style={styles.listHeaderLabel}>done</Text>
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
    fetchEpics,
    createEpic,
    deleteEpic,
    isLoading,
    error,
    clearError,
  } = useEpicsStore();

  const epics = getEpicsByProject(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      await fetchEpics(projectId);
    } catch {
      // error state managed in store
    }
  }, [projectId, fetchEpics]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchEpics(projectId);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, fetchEpics]);

  const handleEpicPress = useCallback((_epic: Epic) => {
    // Navigate to epic detail when screen is created
  }, []);

  const handleDeleteEpic = useCallback(
    (epic: Epic) => {
      showAlert(
        "Delete Epic",
        `Delete "${epic.title}"? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteEpic(epic.id);
              } catch {
                showAlert("Error", "Failed to delete epic");
              }
            },
          },
        ],
      );
    },
    [deleteEpic],
  );

  const handleCreateEpic = useCallback(
    async (title: string, description: string) => {
      await createEpic(projectId, {
        title,
        description: description || undefined,
        color: "#a855f7",
        priority: "medium",
      });
    },
    [projectId, createEpic],
  );

  const renderItem = useCallback(
    ({ item }: { item: Epic }) => (
      <View style={numColumns > 1 ? styles.gridCell : undefined}>
        <EpicCard
          epic={item}
          onPress={handleEpicPress}
          onLongPress={handleDeleteEpic}
        />
      </View>
    ),
    [handleEpicPress, handleDeleteEpic, numColumns],
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
          <EmptyState
            icon="rocket-launch"
            title="No epics yet"
            description="Create one to organize your tasks into meaningful groups."
            actionLabel="Create Epic"
            onAction={() => setIsModalVisible(true)}
          />
        }
      />

      {/* FAB — always visible so "decompose a PRD" is reachable even with an
          empty board (the create CTA in the EmptyState only covers manual epics). */}
      <FAB
        onPress={() => setIsModalVisible(true)}
        onDecompose={() => navigation.navigate("DecomposeEpic", { projectId })}
      />

      <CreateEpicModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleCreateEpic}
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
    gap: spacing.sm,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.accent.cyan,
    justifyContent: "center",
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

// Modal styles kept separate to avoid name collisions
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background.dark3,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.semantic.error + "18",
    borderRadius: borderRadius.base,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.semantic.error + "40",
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInputMulti: {
    minHeight: 80,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
  },
  cancelText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  submitText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
