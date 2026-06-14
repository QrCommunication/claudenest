/**
 * OrchestrationScreen
 * Server-driven worker orchestration (v1.5 contract):
 * - Start opens a config modal (max_workers, permission_mode, coordinator)
 *   posting to /projects/{id}/orchestrator/start.
 * - Worker list reflects the pool live (`.instance.updated` events are
 *   forwarded to the orchestrator store by projectsStore.subscribeToProject,
 *   wired by the underlying ProjectScreen) with a status poll as fallback.
 * - Tapping a worker opens its session terminal.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { showAlert } from "@/services/dialog";
import { Modal } from "@/components/common";
import { useOrchestratorStore } from "@/stores/orchestratorStore";
import { navigateToSession } from "@/navigation/navigationRef";
import type { OrchestratorWorker, PermissionMode } from "@/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<ProjectsStackParamList, "Orchestration">;

const STATUS_POLL_MS = 10_000;
const MIN_WORKERS = 1;
const MAX_WORKERS = 5;
const DEFAULT_WORKERS = 3;

interface PermissionModeOption {
  value: PermissionMode;
  label: string;
  description: string;
}

const PERMISSION_MODES: PermissionModeOption[] = [
  {
    value: "default",
    label: "Default",
    description: "Ask before sensitive actions",
  },
  {
    value: "acceptEdits",
    label: "Accept edits",
    description: "Auto-approve file edits",
  },
  {
    value: "plan",
    label: "Plan",
    description: "Read-only planning mode",
  },
  {
    value: "bypassPermissions",
    label: "Bypass",
    description: "Skip every permission prompt",
  },
];

/** User-facing messages for the server contract error codes. */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  PLAN_001:
    "Too many concurrent sessions (PLAN_001) — stop another running session and retry.",
  MCH_002:
    "The project's machine is offline (MCH_002). Wake it before starting the orchestrator.",
};

const WORKER_STATUS_COLOR: Record<string, string> = {
  active: colors.semantic.success,
  busy: colors.primary.purple,
  idle: colors.status.idle,
  disconnected: colors.semantic.error,
};

const workerStatusColor = (status: string): string =>
  WORKER_STATUS_COLOR[status] ?? colors.status.connecting;

// ---------------------------------------------------------------------------
// StartOrchestratorModal
// ---------------------------------------------------------------------------

interface StartOrchestratorModalProps {
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (opts: {
    max_workers: number;
    permission_mode: PermissionMode;
    coordinator: boolean;
  }) => void;
}

const StartOrchestratorModal = memo(function StartOrchestratorModal({
  visible,
  isSubmitting,
  onClose,
  onSubmit,
}: StartOrchestratorModalProps) {
  const [maxWorkers, setMaxWorkers] = useState(DEFAULT_WORKERS);
  const [permissionMode, setPermissionMode] =
    useState<PermissionMode>("default");
  const [coordinator, setCoordinator] = useState(false);

  useEffect(() => {
    if (visible) {
      setMaxWorkers(DEFAULT_WORKERS);
      setPermissionMode("default");
      setCoordinator(false);
    }
  }, [visible]);

  const decrement = useCallback(
    () => setMaxWorkers((n) => Math.max(MIN_WORKERS, n - 1)),
    [],
  );
  const increment = useCallback(
    () => setMaxWorkers((n) => Math.min(MAX_WORKERS, n + 1)),
    [],
  );

  const handleSubmit = useCallback(() => {
    onSubmit({
      max_workers: maxWorkers,
      permission_mode: permissionMode,
      coordinator,
    });
  }, [onSubmit, maxWorkers, permissionMode, coordinator]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Start Orchestrator"
      footer={
        <View style={modalStyles.actions}>
          <TouchableOpacity
            style={modalStyles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
            disabled={isSubmitting}
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
            <Icon
              name={isSubmitting ? "hourglass-empty" : "play-arrow"}
              size={16}
              color={colors.text.primary}
            />
            <Text style={modalStyles.submitText}>
              {isSubmitting ? "Starting…" : "Start"}
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <Text style={modalStyles.subtitle}>
        Spawns worker sessions that claim and execute the project's pending
        tasks. The pool size scales to the number of pending tasks.
      </Text>

      {/* Max workers stepper */}
      <View style={modalStyles.fieldGroup}>
        <Text style={modalStyles.fieldLabel}>Max workers</Text>
        <View style={modalStyles.stepper}>
          <TouchableOpacity
            style={[
              modalStyles.stepperBtn,
              maxWorkers <= MIN_WORKERS && modalStyles.btnDisabled,
            ]}
            onPress={decrement}
            disabled={maxWorkers <= MIN_WORKERS}
            activeOpacity={0.7}
            accessibilityLabel="Decrease worker count"
          >
            <Icon name="remove" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={modalStyles.stepperValue}>{maxWorkers}</Text>
          <TouchableOpacity
            style={[
              modalStyles.stepperBtn,
              maxWorkers >= MAX_WORKERS && modalStyles.btnDisabled,
            ]}
            onPress={increment}
            disabled={maxWorkers >= MAX_WORKERS}
            activeOpacity={0.7}
            accessibilityLabel="Increase worker count"
          >
            <Icon name="add" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <Text style={modalStyles.fieldHelper}>
          The server also caps the pool at the number of pending tasks.
        </Text>
      </View>

      {/* Permission mode */}
      <View style={modalStyles.fieldGroup}>
        <Text style={modalStyles.fieldLabel}>Permission mode</Text>
        <View style={modalStyles.permissionList}>
          {PERMISSION_MODES.map((mode) => {
            const isSelected = permissionMode === mode.value;
            return (
              <TouchableOpacity
                key={mode.value}
                style={[
                  modalStyles.permissionRow,
                  isSelected && modalStyles.permissionRowSelected,
                ]}
                onPress={() => setPermissionMode(mode.value)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <Icon
                  name={
                    isSelected
                      ? "radio-button-checked"
                      : "radio-button-unchecked"
                  }
                  size={18}
                  color={isSelected ? colors.primary.purple : colors.text.muted}
                />
                <View style={modalStyles.permissionTextWrap}>
                  <Text
                    style={[
                      modalStyles.permissionLabel,
                      isSelected && modalStyles.permissionLabelSelected,
                    ]}
                  >
                    {mode.label}
                  </Text>
                  <Text style={modalStyles.permissionDescription}>
                    {mode.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Coordinator toggle */}
      <View style={modalStyles.switchRow}>
        <View style={modalStyles.switchTextWrap}>
          <Text style={modalStyles.fieldLabel}>Coordinator</Text>
          <Text style={modalStyles.fieldHelper}>
            React to incidents (task thrashing, lock contention) with an
            ephemeral planning session.
          </Text>
        </View>
        <Switch
          value={coordinator}
          onValueChange={setCoordinator}
          trackColor={{
            false: colors.background.dark4,
            true: `${colors.primary.purple}80`,
          }}
          thumbColor={coordinator ? colors.primary.purple : colors.text.muted}
        />
      </View>
    </Modal>
  );
});

// ---------------------------------------------------------------------------
// WorkerRow
// ---------------------------------------------------------------------------

interface WorkerRowProps {
  worker: OrchestratorWorker;
  onPress: (worker: OrchestratorWorker) => void;
}

const WorkerRow = memo(function WorkerRow({ worker, onPress }: WorkerRowProps) {
  const statusColor = workerStatusColor(worker.status);
  const hasSession = worker.sessionId !== null;

  const handlePress = useCallback(() => {
    onPress(worker);
  }, [onPress, worker]);

  return (
    <TouchableOpacity
      style={rowStyles.container}
      onPress={handlePress}
      disabled={!hasSession}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Worker ${worker.id}`}
    >
      <View style={rowStyles.avatar}>
        <Icon name="smart-toy" size={18} color={colors.primary.cyan} />
      </View>

      <View style={rowStyles.details}>
        <View style={rowStyles.topRow}>
          <Text style={rowStyles.workerId} numberOfLines={1}>
            {worker.id.slice(0, 14)}…
          </Text>
          <View
            style={[
              rowStyles.badge,
              {
                backgroundColor: `${statusColor}25`,
                borderColor: `${statusColor}60`,
              },
            ]}
          >
            <Text style={[rowStyles.badgeText, { color: statusColor }]}>
              {worker.status}
            </Text>
          </View>
        </View>

        <View style={rowStyles.taskRow}>
          <Icon
            name={worker.currentTaskId ? "pending-actions" : "hourglass-empty"}
            size={13}
            color={
              worker.currentTaskId ? colors.primary.cyan : colors.text.muted
            }
          />
          <Text
            style={[
              rowStyles.taskText,
              worker.currentTaskId !== null && rowStyles.taskTextActive,
            ]}
            numberOfLines={1}
          >
            {worker.currentTaskTitle ??
              worker.currentTaskId ??
              "No task claimed"}
          </Text>
        </View>

        <View style={rowStyles.metaRow}>
          <Icon name="task-alt" size={12} color={colors.text.muted} />
          <Text style={rowStyles.metaText}>
            {worker.tasksCompleted} completed
          </Text>
          {hasSession ? (
            <Text style={rowStyles.openHint}>Open terminal</Text>
          ) : null}
        </View>
      </View>

      {hasSession ? (
        <Icon name="chevron-right" size={20} color={colors.text.muted} />
      ) : null}
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------
// TaskCountPill
// ---------------------------------------------------------------------------

interface TaskCountPillProps {
  label: string;
  value: number;
  color: string;
}

const TaskCountPill = memo(function TaskCountPill({
  label,
  value,
  color,
}: TaskCountPillProps) {
  return (
    <View style={pillStyles.pill}>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// OrchestrationScreen
// ---------------------------------------------------------------------------

export const OrchestrationScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;

  const status = useOrchestratorStore((s) => s.status);
  const error = useOrchestratorStore((s) => s.error);
  const errorCode = useOrchestratorStore((s) => s.errorCode);
  const start = useOrchestratorStore((s) => s.start);
  const stop = useOrchestratorStore((s) => s.stop);
  const fetchStatus = useOrchestratorStore((s) => s.fetchStatus);
  const clearError = useOrchestratorStore((s) => s.clearError);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load + poll fallback (live `.instance.updated` events already
  // patch the store via projectsStore.subscribeToProject — the poll refreshes
  // task counts and worker task titles, which the push payload lacks).
  useEffect(() => {
    fetchStatus(projectId).catch(() => {
      /* error state handled by the store */
    });
    pollingRef.current = setInterval(() => {
      fetchStatus(projectId).catch(() => {
        /* transient — next tick retries */
      });
    }, STATUS_POLL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectId, fetchStatus]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchStatus(projectId);
    } catch {
      // error state handled by the store
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, fetchStatus]);

  const handleStart = useCallback(
    async (opts: {
      max_workers: number;
      permission_mode: PermissionMode;
      coordinator: boolean;
    }) => {
      setIsActing(true);
      try {
        await start(projectId, opts);
        setIsModalVisible(false);
      } catch {
        // Keep the modal closed and surface the mapped error banner
        // (PLAN_001 / MCH_002 / generic) — the store carries the code.
        setIsModalVisible(false);
      } finally {
        setIsActing(false);
      }
    },
    [projectId, start],
  );

  const handleStop = useCallback(() => {
    showAlert(
      "Stop Orchestrator",
      "Terminate all worker sessions for this project?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stop",
          style: "destructive",
          onPress: async () => {
            setIsActing(true);
            try {
              await stop(projectId);
            } catch {
              // error state handled by the store
            } finally {
              setIsActing(false);
            }
          },
        },
      ],
    );
  }, [projectId, stop]);

  const handleWorkerPress = useCallback((worker: OrchestratorWorker) => {
    if (worker.sessionId) {
      navigateToSession(worker.sessionId);
    }
  }, []);

  const renderWorker = useCallback(
    ({ item }: ListRenderItemInfo<OrchestratorWorker>) => (
      <WorkerRow worker={item} onPress={handleWorkerPress} />
    ),
    [handleWorkerPress],
  );
  const keyExtractor = useCallback((item: OrchestratorWorker) => item.id, []);

  const isActive = status?.active ?? false;
  const workers = status?.workers ?? [];
  const errorMessage =
    (errorCode !== null ? ERROR_CODE_MESSAGES[errorCode] : undefined) ?? error;

  const ListHeader = (
    <View style={styles.headerWrap}>
      {/* Error banner (PLAN_001 / MCH_002 mapped to clear messages) */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Icon name="error-outline" size={16} color={colors.semantic.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={clearError} hitSlop={8}>
            <Icon name="close" size={16} color={colors.semantic.error} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Status card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isActive
                  ? colors.semantic.success
                  : colors.status.offline,
              },
            ]}
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {isActive ? "Orchestrator running" : "Orchestrator stopped"}
            </Text>
            <Text style={styles.statusDescription}>
              {isActive
                ? "Worker sessions claim and execute pending tasks automatically."
                : "Start the orchestrator to spawn worker sessions on this project."}
            </Text>
          </View>
        </View>

        {/* Task counts */}
        {status ? (
          <View style={styles.pillsRow}>
            <TaskCountPill
              label="Pending"
              value={status.tasks.pending}
              color={colors.semantic.warning}
            />
            <TaskCountPill
              label="In progress"
              value={status.tasks.in_progress}
              color={colors.primary.cyan}
            />
            <TaskCountPill
              label="Done"
              value={status.tasks.done}
              color={colors.semantic.success}
            />
          </View>
        ) : null}

        {isActive ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnStop,
              isActing && styles.btnDisabled,
            ]}
            onPress={handleStop}
            disabled={isActing}
            activeOpacity={0.8}
          >
            <Icon name="stop" size={18} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>Stop Orchestrator</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnStart,
              isActing && styles.btnDisabled,
            ]}
            onPress={() => setIsModalVisible(true)}
            disabled={isActing}
            activeOpacity={0.8}
          >
            <Icon name="play-arrow" size={18} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>Start Orchestrator</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Workers section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Workers</Text>
        <Text style={styles.sectionCount}>{workers.length}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={workers}
        renderItem={renderWorker}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
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
          <View style={styles.emptyState}>
            <Icon name="smart-toy" size={40} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>
              {isActive ? "No workers yet" : "No workers running"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isActive
                ? "The pool is spinning up — workers appear here as they connect."
                : "Start the orchestrator to spawn workers that pick up pending tasks."}
            </Text>
          </View>
        }
      />

      <StartOrchestratorModal
        visible={isModalVisible}
        isSubmitting={isActing}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleStart}
      />
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  headerWrap: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.semantic.error}20`,
    borderWidth: 1,
    borderColor: `${colors.semantic.error}40`,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.md,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
    flexShrink: 0,
  },
  statusInfo: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.primary,
  },
  statusDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  pillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  actionBtnStart: {
    backgroundColor: colors.semantic.success,
  },
  actionBtnStop: {
    backgroundColor: colors.semantic.error,
  },
  actionBtnText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  value: {
    fontSize: typography.size.lg,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  workerId: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  badge: {
    borderRadius: borderRadius.base,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  taskText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  taskTextActive: {
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  openHint: {
    fontSize: typography.size.xs,
    color: colors.primary.cyan,
    marginLeft: "auto",
  },
});

const modalStyles = StyleSheet.create({
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  fieldGroup: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  fieldHelper: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    lineHeight: 16,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.xs,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.dark4,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperValue: {
    minWidth: 40,
    textAlign: "center",
    fontSize: typography.size["2xl"],
    fontWeight: "800",
    color: colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  permissionList: {
    gap: spacing.xs,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  permissionRowSelected: {
    borderColor: colors.primary.purple,
    backgroundColor: "rgba(168,85,247,0.10)",
  },
  permissionTextWrap: {
    flex: 1,
    gap: 1,
  },
  permissionLabel: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  permissionLabelSelected: {
    color: colors.primary.purple,
  },
  permissionDescription: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  switchTextWrap: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
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
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.semantic.success,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  submitText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
