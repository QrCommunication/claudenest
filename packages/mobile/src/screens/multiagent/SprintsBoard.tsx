/**
 * SprintsBoard
 * Lists sprints for a project. The active (or next planning) sprint is featured
 * at the top with progress, story points, remaining days and lifecycle actions
 * (start / complete / edit / delete); other sprints follow in a FlatList. A FAB
 * creates a sprint and an Actifs/Archivés toggle reveals sprints under archived
 * epics (the backend `?archived=true` filter — sprints have no native archive
 * flag, so it's a single list). Rendered inside PlanningScreen.
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
import { useSprintsStore } from "@/stores/sprintsStore";
import { useFadeIn } from "@/utils/animations";
import { SprintCard } from "@/components/multiagent/SprintCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common";
import { ShowArchivedToggle } from "@/components/os";
import { t } from "@/i18n";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { Sprint } from "@/types";

// ==================== PROPS ====================

interface SprintsBoardProps {
  projectId: string;
}

// A YYYY-MM-DD date or empty (light validation — keeps TZ out of the picture).
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface SprintFormValues {
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  capacity: string;
}

// ==================== SPRINT FORM MODAL (create + edit) ====================

interface SprintFormModalProps {
  visible: boolean;
  /** When set, the modal edits this sprint; otherwise it creates a new one. */
  sprint: Sprint | null;
  onClose: () => void;
  onSubmit: (values: SprintFormValues) => Promise<void>;
}

const SprintFormModal = memo(function SprintFormModal({
  visible,
  sprint,
  onClose,
  onSubmit,
}: SprintFormModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(sprint?.name ?? "");
    setGoal(sprint?.goal ?? "");
    setStartDate(sprint?.start_date ?? "");
    setEndDate(sprint?.end_date ?? "");
    setCapacity(sprint?.capacity != null ? String(sprint.capacity) : "");
    setFieldError(null);
    setIsSubmitting(false);
  }, [visible, sprint]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setFieldError(t("sprint.nameRequired"));
      return;
    }
    if (startDate && !DATE_RE.test(startDate)) {
      setFieldError(t("sprint.startDateInvalid"));
      return;
    }
    if (endDate && !DATE_RE.test(endDate)) {
      setFieldError(t("sprint.endDateInvalid"));
      return;
    }
    if (capacity && Number.isNaN(Number(capacity))) {
      setFieldError(t("sprint.capacityInvalid"));
      return;
    }
    setIsSubmitting(true);
    setFieldError(null);
    try {
      await onSubmit({
        name: name.trim(),
        goal: goal.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        capacity: capacity.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFieldError(e.message ?? t("sprint.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }, [name, goal, startDate, endDate, capacity, onSubmit, onClose]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={sprint ? t("sprint.editTitle") : t("sprint.new")}
      footer={
        <View style={modalStyles.actions}>
          <TouchableOpacity
            style={modalStyles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={modalStyles.cancelText}>{t("common.cancel")}</Text>
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
            <Text style={modalStyles.submitText}>
              {isSubmitting
                ? t("sprint.saving")
                : sprint
                  ? t("sprint.saveChanges")
                  : t("sprint.createSprint")}
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      {fieldError ? (
        <View style={modalStyles.errorRow}>
          <Icon name="error-outline" size={14} color={colors.semantic.error} />
          <Text style={modalStyles.errorText}>{fieldError}</Text>
        </View>
      ) : null}

      <View style={modalStyles.inputGroup}>
        <Text style={modalStyles.inputLabel}>{t("sprint.nameLabel")} *</Text>
        <TextInput
          style={modalStyles.textInput}
          placeholder={t("sprint.namePlaceholder")}
          placeholderTextColor={colors.text.muted}
          value={name}
          onChangeText={setName}
          autoFocus={!sprint}
          maxLength={120}
        />
      </View>

      <View style={modalStyles.inputGroup}>
        <Text style={modalStyles.inputLabel}>{t("sprint.goalLabel")}</Text>
        <TextInput
          style={[modalStyles.textInput, modalStyles.textInputMulti]}
          placeholder={t("sprint.goalPlaceholder")}
          placeholderTextColor={colors.text.muted}
          value={goal}
          onChangeText={setGoal}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
      </View>

      <View style={modalStyles.row}>
        <View style={[modalStyles.inputGroup, modalStyles.rowItem]}>
          <Text style={modalStyles.inputLabel}>{t("sprint.startDateLabel")}</Text>
          <TextInput
            style={modalStyles.textInput}
            placeholder="2026-06-20"
            placeholderTextColor={colors.text.muted}
            value={startDate}
            onChangeText={setStartDate}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={[modalStyles.inputGroup, modalStyles.rowItem]}>
          <Text style={modalStyles.inputLabel}>{t("sprint.endDateLabel")}</Text>
          <TextInput
            style={modalStyles.textInput}
            placeholder="2026-07-04"
            placeholderTextColor={colors.text.muted}
            value={endDate}
            onChangeText={setEndDate}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      <View style={modalStyles.inputGroup}>
        <Text style={modalStyles.inputLabel}>{t("sprint.capacityLabel")}</Text>
        <TextInput
          style={modalStyles.textInput}
          placeholder={t("sprint.capacityPlaceholder")}
          placeholderTextColor={colors.text.muted}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="number-pad"
          maxLength={5}
        />
      </View>
    </Modal>
  );
});

// ==================== SKELETON ====================

const SprintSkeleton = memo(function SprintSkeleton() {
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

  return <Animated.View style={[styles.skeleton, { opacity }]} />;
});

// ==================== ACTIVE SPRINT CARD ====================

interface ActiveSprintCardProps {
  sprint: Sprint;
  onStart: (sprint: Sprint) => void;
  onComplete: (sprint: Sprint) => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
  onPress: (sprint: Sprint) => void;
}

const ActiveSprintCard = memo(function ActiveSprintCard({
  sprint,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  onPress,
}: ActiveSprintCardProps) {
  const fadeStyle = useFadeIn();

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const progressPct = sprint.progress_percentage;
  const isOverdue = sprint.is_overdue;
  const isActive = sprint.status === "active";
  const isPlanning = sprint.status === "planning";

  const progressColor = isOverdue
    ? colors.semantic.error
    : progressPct >= 80
      ? colors.semantic.success
      : colors.primary.purple;

  const openMenu = useCallback(() => {
    showAlert(sprint.name, t("sprint.actions"), [
      { text: t("common.edit"), onPress: () => onEdit(sprint) },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => onDelete(sprint),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }, [sprint, onEdit, onDelete]);

  return (
    <Animated.View style={[styles.activeCard, fadeStyle]}>
      {/* Header row */}
      <View style={styles.activeCardHeader}>
        <View style={styles.activeCardTitleWrap}>
          <View style={[styles.activeBadge, { opacity: isActive ? 1 : 0.5 }]}>
            <View style={styles.activeBadgeDot} />
            <Text style={styles.activeBadgeText}>
              {isActive ? t("sprint.featuredActive") : sprint.status}
            </Text>
          </View>
          <Text style={styles.activeCardName} numberOfLines={1}>
            {sprint.name}
          </Text>
        </View>
        {sprint.remaining_days != null && (
          <View
            style={[
              styles.daysChip,
              isOverdue ? styles.daysChipOverdue : styles.daysChipNormal,
            ]}
          >
            <Icon
              name={isOverdue ? "warning" : "schedule"}
              size={12}
              color={isOverdue ? colors.semantic.error : colors.primary.cyan}
            />
            <Text
              style={[
                styles.daysChipText,
                {
                  color: isOverdue
                    ? colors.semantic.error
                    : colors.primary.cyan,
                },
              ]}
            >
              {isOverdue
                ? t("sprint.daysOver", { n: Math.abs(sprint.remaining_days) })
                : t("sprint.daysLeft", { n: sprint.remaining_days })}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={openMenu}
          hitSlop={8}
          style={styles.menuBtn}
          accessibilityRole="button"
          accessibilityLabel="Sprint actions"
        >
          <Icon name="more-vert" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* Goal */}
      {sprint.goal ? (
        <Text style={styles.activeCardGoal} numberOfLines={2}>
          {sprint.goal}
        </Text>
      ) : null}

      {/* Dates */}
      <View style={styles.datesRow}>
        <Icon name="calendar-today" size={13} color={colors.text.muted} />
        <Text style={styles.datesText}>
          {formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={[styles.progressPct, { color: progressColor }]}>
            {progressPct}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(progressPct, 100)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Metrics grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue} numberOfLines={1}>
            {sprint.completed_tasks_count}/{sprint.tasks_count}
          </Text>
          <Text style={styles.metricLabel}>Tasks</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricValue} numberOfLines={1}>
            {sprint.completed_story_points}/{sprint.total_story_points}
          </Text>
          <Text style={styles.metricLabel}>Story pts</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text
            style={[
              styles.metricValue,
              sprint.velocity != null && { color: colors.primary.cyan },
            ]}
            numberOfLines={1}
          >
            {sprint.velocity ?? "—"}
          </Text>
          <Text style={styles.metricLabel}>Velocity</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.activeCardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDetails]}
          onPress={() => onPress(sprint)}
          activeOpacity={0.8}
        >
          <Icon name="insights" size={18} color={colors.accent.cyan} />
          <Text style={[styles.actionBtnText, { color: colors.accent.cyan }]}>
            {t("sprint.details")}
          </Text>
        </TouchableOpacity>
        {isPlanning && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnStart]}
            onPress={() => onStart(sprint)}
            activeOpacity={0.8}
          >
            <Icon name="play-arrow" size={18} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>{t("sprint.startBtn")}</Text>
          </TouchableOpacity>
        )}
        {isActive && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnComplete]}
            onPress={() => onComplete(sprint)}
            activeOpacity={0.8}
          >
            <Icon name="check-circle" size={18} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>{t("sprint.completeBtn")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

// ==================== FAB ====================

const FAB = memo(function FAB({ onPress }: { onPress: () => void }) {
  const fadeStyle = useFadeIn();
  return (
    <Animated.View style={[styles.fabWrap, fadeStyle]}>
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="New sprint"
      >
        <Icon name="add" size={26} color={colors.text.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
});

// ==================== MAIN BOARD ====================

export const SprintsBoard = memo(function SprintsBoard({
  projectId,
}: SprintsBoardProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProjectsStackParamList>>();
  const {
    getSprintsByProject,
    getActiveSprintForProject,
    fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    subscribeRealtime,
    showArchived,
    setShowArchived,
    isLoading,
    error,
    clearError,
  } = useSprintsStore();

  const allSprints = getSprintsByProject(projectId);
  const activeSprint = getActiveSprintForProject(projectId);
  const otherSprints = allSprints.filter(
    (s) => s.id !== activeSprint?.id && s.status !== "planning",
  );
  const planningSprints = allSprints.filter(
    (s) => s.status === "planning" && s.id !== activeSprint?.id,
  );
  const listSprints = [...planningSprints, ...otherSprints];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  // Fetch on mount and whenever showArchived flips the backend `?archived` filter.
  useEffect(() => {
    void fetchSprints(projectId);
  }, [projectId, showArchived, fetchSprints]);

  useEffect(() => subscribeRealtime(projectId), [projectId, subscribeRealtime]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchSprints(projectId);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, fetchSprints]);

  const openCreate = useCallback(() => {
    setEditingSprint(null);
    setIsModalVisible(true);
  }, []);

  const handleEdit = useCallback((sprint: Sprint) => {
    setEditingSprint(sprint);
    setIsModalVisible(true);
  }, []);

  const handleSubmit = useCallback(
    async (values: SprintFormValues) => {
      const payload = {
        name: values.name,
        goal: values.goal || undefined,
        start_date: values.start_date || undefined,
        end_date: values.end_date || undefined,
        capacity: values.capacity ? Number(values.capacity) : undefined,
      };
      if (editingSprint) {
        await updateSprint(editingSprint.id, payload);
      } else {
        await createSprint(projectId, payload);
      }
    },
    [editingSprint, projectId, createSprint, updateSprint],
  );

  const handleStart = useCallback(
    (sprint: Sprint) => {
      showAlert(
        t("sprint.startTitle"),
        t("sprint.startConfirm", { name: sprint.name }),
        [
          { text: "Cancel", style: "cancel" },
          {
            text: t("sprint.startAction"),
            onPress: async () => {
              try {
                await startSprint(sprint.id);
              } catch {
                showAlert(t("common.error"), t("sprint.startFailed"));
              }
            },
          },
        ],
      );
    },
    [startSprint],
  );

  const handleComplete = useCallback(
    (sprint: Sprint) => {
      showAlert(
        t("sprint.completeTitle"),
        t("sprint.completeConfirm", { name: sprint.name }),
        [
          { text: "Cancel", style: "cancel" },
          {
            text: t("sprint.completeAction"),
            style: "destructive",
            onPress: async () => {
              try {
                await completeSprint(sprint.id);
              } catch {
                showAlert(t("common.error"), t("sprint.completeFailed"));
              }
            },
          },
        ],
      );
    },
    [completeSprint],
  );

  const handleDelete = useCallback(
    (sprint: Sprint) => {
      showAlert(
        t("sprint.deleteTitle"),
        t("sprint.deleteConfirm", { name: sprint.name }),
        [
          { text: "Cancel", style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteSprint(sprint.id);
              } catch {
                showAlert(t("common.error"), t("sprint.deleteFailed"));
              }
            },
          },
        ],
      );
    },
    [deleteSprint],
  );

  const handleSprintPress = useCallback(
    (sprint: Sprint) =>
      navigation.navigate("SprintDetail", { sprintId: sprint.id }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Sprint }) => (
      <SprintCard
        sprint={item}
        onPress={handleSprintPress}
        onStart={handleStart}
        onComplete={handleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [handleSprintPress, handleStart, handleComplete, handleEdit, handleDelete],
  );

  const keyExtractor = useCallback((item: Sprint) => item.id, []);

  const featuredSprint =
    activeSprint ?? allSprints.find((s) => s.status === "planning") ?? null;

  if (isLoading && allSprints.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.skeletonContainer}>
          <Animated.View
            style={[
              styles.skeletonFeatured,
              { opacity: new Animated.Value(0.5) },
            ]}
          />
          {[1, 2].map((k) => (
            <SprintSkeleton key={k} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <>
      {/* Actifs / Archivés toggle */}
      <View style={styles.toolbar}>
        <ShowArchivedToggle
          value={showArchived}
          onChange={setShowArchived}
          activeLabel={t("common.active")}
          archivedLabel={t("common.archived")}
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

      {/* Featured active/planning sprint */}
      {featuredSprint ? (
        <ActiveSprintCard
          sprint={featuredSprint}
          onStart={handleStart}
          onComplete={handleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPress={handleSprintPress}
        />
      ) : null}

      {/* Section title for other sprints */}
      {listSprints.length > 0 ? (
        <Text style={styles.sectionTitle}>{t("sprint.otherSprints")}</Text>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <FlatList
        data={listSprints}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={() => ListHeader}
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
          allSprints.length === 0 ? (
            <EmptyState
              icon="directions-run"
              title={t("sprint.noSprintsTitle")}
              description={t("sprint.noSprintsDesc")}
              actionLabel={t("sprint.new")}
              onAction={openCreate}
            />
          ) : null
        }
      />

      <FAB onPress={openCreate} />

      <SprintFormModal
        visible={isModalVisible}
        sprint={editingSprint}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
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
    marginBottom: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl + 64, // FAB clearance
    flexGrow: 1,
  },
  // Skeleton
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonFeatured: {
    height: 220,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  skeleton: {
    height: 90,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
  },
  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.semantic.error + "18",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.semantic.error + "40",
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  // Section title
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  // Active sprint card
  activeCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary.purple}40`,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  activeCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  activeCardTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  menuBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.base,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },
  activeBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary.purple,
  },
  activeBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.primary.purple,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeCardName: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.text.primary,
  },
  daysChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.base,
  },
  daysChipNormal: {
    backgroundColor: `${colors.primary.cyan}18`,
    borderWidth: 1,
    borderColor: `${colors.primary.cyan}30`,
  },
  daysChipOverdue: {
    backgroundColor: `${colors.semantic.error}18`,
    borderWidth: 1,
    borderColor: `${colors.semantic.error}30`,
  },
  daysChipText: {
    fontSize: typography.size.xs,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  activeCardGoal: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  datesText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  // Progress
  progressSection: {
    marginBottom: spacing.md,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  progressPct: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Metrics
  metricsGrid: {
    flexDirection: "row",
    backgroundColor: colors.background.dark1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCell: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
    alignSelf: "center",
  },
  // Action buttons
  activeCardActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  actionBtnStart: {
    backgroundColor: colors.semantic.success,
  },
  actionBtnComplete: {
    backgroundColor: colors.primary.purple,
  },
  actionBtnDetails: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.accent.cyan,
  },
  actionBtnText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.text.primary,
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

// ==================== MODAL STYLES ====================

const modalStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
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
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInputMulti: {
    minHeight: 70,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
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
  submitText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
