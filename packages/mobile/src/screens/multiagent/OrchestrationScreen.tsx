/**
 * OrchestrationScreen
 * Monitor Claude instances, dispatch tasks, and control the orchestrator.
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, type ListRenderItemInfo } from 'react-native';
import { showAlert } from "@/services/dialog";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { projectsApi, runnerApi, api } from '@/services/api';
import { StatusDot } from '@/components/common';
import { useFadeIn } from '@/utils/animations';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { ClaudeInstance, InstanceStatus } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<ProjectsStackParamList, 'Orchestration'>;

interface DispatchResult {
  dispatched: number;
  message: string;
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

const StatCard = memo(function StatCard({ icon, value, label, color }: StatCardProps) {
  const fadeStyle = useFadeIn();
  const accent = color ?? colors.primary.purple;
  return (
    <Animated.View style={[statStyles.card, fadeStyle]}>
      <View style={[statStyles.iconWrap, { backgroundColor: accent + '20' }]}>
        <Icon name={icon as any} size={20} color={accent} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// InstanceRow
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<InstanceStatus, string> = {
  active:       colors.semantic.success,
  idle:         colors.status.idle,
  busy:         colors.primary.purple,
  disconnected: colors.semantic.error,
};

const STATUS_LABEL: Record<InstanceStatus, string> = {
  active:       'Active',
  idle:         'Idle',
  busy:         'Busy',
  disconnected: 'Offline',
};

const InstanceRow = memo(function InstanceRow({ instance }: { instance: ClaudeInstance }) {
  const fadeStyle = useFadeIn();
  const statusColor = STATUS_COLOR[instance.status];
  const contextPct = Math.min(
    100,
    Math.round((instance.contextTokens / Math.max(instance.maxContextTokens, 1)) * 100)
  );

  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: contextPct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [contextPct, progressWidth]);

  return (
    <Animated.View style={[rowStyles.container, fadeStyle]}>
      {/* Avatar + status dot */}
      <View style={rowStyles.avatarWrap}>
        <View style={rowStyles.avatar}>
          <Icon name="smart-toy" size={18} color={colors.primary.cyan} />
        </View>
        <View style={[rowStyles.dotWrap, { borderColor: colors.background.card }]}>
          <StatusDot
            status={
              instance.status === 'active'
                ? 'online'
                : instance.status === 'disconnected'
                ? 'offline'
                : 'connecting'
            }
            size={8}
            pulse={instance.status === 'busy'}
          />
        </View>
      </View>

      {/* Details */}
      <View style={rowStyles.details}>
        <View style={rowStyles.topRow}>
          <Text style={rowStyles.instanceId} numberOfLines={1}>
            {instance.id.slice(0, 12)}…
          </Text>
          <View style={[rowStyles.badge, { backgroundColor: statusColor + '25', borderColor: statusColor + '60' }]}>
            <Text style={[rowStyles.badgeText, { color: statusColor }]}>
              {STATUS_LABEL[instance.status]}
            </Text>
          </View>
        </View>

        {/* Context progress */}
        <View style={rowStyles.contextRow}>
          <Text style={rowStyles.contextLabel}>Context</Text>
          <View style={rowStyles.track}>
            <Animated.View
              style={[
                rowStyles.fill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: contextPct > 80 ? colors.semantic.warning : colors.primary.purple,
                },
              ]}
            />
          </View>
          <Text style={rowStyles.contextPct}>{contextPct}%</Text>
        </View>

        <View style={rowStyles.metaRow}>
          <View style={rowStyles.meta}>
            <Icon name="task-alt" size={12} color={colors.text.muted} />
            <Text style={rowStyles.metaText}>{instance.tasksCompleted} done</Text>
          </View>
          {instance.currentTaskId && (
            <View style={rowStyles.meta}>
              <Icon name="pending" size={12} color={colors.primary.cyan} />
              <Text style={[rowStyles.metaText, { color: colors.primary.cyan }]}>Working…</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// OrchestrationScreen
// ---------------------------------------------------------------------------

export const OrchestrationScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;

  // Orchestrator store (start/stop/stats)
  const {
    isRunning,
    stats,
    isLoading: storeLoading,
    error: storeError,
    startOrchestrator,
    stopOrchestrator,
    fetchStats,
    dispatchTasks,
    clearError,
  } = useOrchestratorStore();

  // Instance list (local state — refreshed independently)
  const [instances, setInstances] = useState<ClaudeInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadInstances = useCallback(async () => {
    setInstancesLoading(true);
    try {
      const res = await projectsApi.getInstances(projectId);
      setInstances(res.data ?? []);
    } catch {
      // non-critical
    } finally {
      setInstancesLoading(false);
    }
  }, [projectId]);

  const handleRefresh = useCallback(() => {
    fetchStats(projectId);
    loadInstances();
  }, [projectId, fetchStats, loadInstances]);

  useEffect(() => {
    fetchStats(projectId);
    loadInstances();

    pollingRef.current = setInterval(() => {
      loadInstances();
    }, 8000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectId, fetchStats, loadInstances]);

  // Toggle orchestrator
  const handleToggle = useCallback(() => {
    if (isRunning) {
      showAlert(
        'Stop Orchestrator',
        'Stop automated orchestration for this project?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              try {
                await stopOrchestrator(projectId);
              } catch {
                showAlert('Error', 'Failed to stop orchestrator');
              }
            },
          },
        ]
      );
    } else {
      showAlert(
        'Start Orchestrator',
        'Enable automated task orchestration for this project?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              try {
                await startOrchestrator(projectId);
              } catch {
                showAlert('Error', 'Failed to start orchestrator');
              }
            },
          },
        ]
      );
    }
  }, [isRunning, projectId, startOrchestrator, stopOrchestrator]);

  // Dispatch tasks
  const handleDispatch = useCallback(async () => {
    if (isDispatching) return;
    setIsDispatching(true);
    setDispatchMsg(null);
    try {
      // Try store action first; fall back to raw API call
      await dispatchTasks(projectId);
      setDispatchMsg('Tasks dispatched successfully');
      loadInstances();
    } catch {
      try {
        const res = await api.post<DispatchResult>(`/projects/${projectId}/dispatch`);
        const dispatched = res.data?.dispatched ?? 0;
        setDispatchMsg(`${dispatched} task${dispatched !== 1 ? 's' : ''} dispatched`);
        loadInstances();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Dispatch failed';
        setDispatchMsg(`Error: ${msg}`);
      }
    } finally {
      setIsDispatching(false);
    }
  }, [isDispatching, projectId, dispatchTasks, loadInstances]);

  // Derived stats
  const activeCount = instances.filter(
    (i) => i.status === 'active' || i.status === 'busy'
  ).length;
  const totalCompleted = instances.reduce((sum, i) => sum + i.tasksCompleted, 0);

  const renderInstance = useCallback(
    ({ item }: ListRenderItemInfo<ClaudeInstance>) => <InstanceRow instance={item} />,
    []
  );
  const keyExtractor = useCallback((item: ClaudeInstance) => item.id, []);

  const isRefreshing = storeLoading || instancesLoading;

  // Header rendered above the FlatList
  const ListHeader = (
    <View>
      {/* Error banner */}
      {storeError ? (
        <View style={styles.errorBanner}>
          <Icon name="error-outline" size={16} color={colors.semantic.error} />
          <Text style={styles.errorText}>{storeError}</Text>
          <TouchableOpacity onPress={clearError}>
            <Icon name="close" size={16} color={colors.semantic.error} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="groups"
          value={instances.length}
          label="Instances"
          color={colors.primary.indigo}
        />
        <StatCard
          icon="bolt"
          value={activeCount}
          label="Active"
          color={colors.primary.cyan}
        />
        <StatCard
          icon="check-circle"
          value={totalCompleted}
          label="Completed"
          color={colors.semantic.success}
        />
      </View>

      {/* Orchestrator status card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, { backgroundColor: isRunning ? colors.semantic.success : colors.status.offline }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {isRunning ? 'Orchestrator Active' : 'Orchestrator Stopped'}
            </Text>
            <Text style={styles.statusDescription}>
              {isRunning
                ? 'Agents are automatically picking up and executing tasks.'
                : 'Start the orchestrator to enable automated task execution.'}
            </Text>
          </View>
        </View>

        {/* Health details */}
        {stats && Object.keys(stats.details).length > 0 && (
          <View style={styles.healthDetails}>
            {Object.entries(stats.details).slice(0, 4).map(([key, value]) => (
              <View key={key} style={styles.healthRow}>
                <Text style={styles.healthKey}>{key.replace(/_/g, ' ')}</Text>
                <Text style={styles.healthValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.toggleBtn, isRunning ? styles.toggleBtnStop : styles.toggleBtnStart, storeLoading && styles.btnDisabled]}
          onPress={handleToggle}
          disabled={storeLoading}
          activeOpacity={0.8}
        >
          <Icon name={isRunning ? 'stop' : 'play-arrow'} size={18} color="#fff" />
          <Text style={styles.toggleBtnText}>
            {isRunning ? 'Stop Orchestrator' : 'Start Orchestrator'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dispatch */}
      <View style={styles.dispatchSection}>
        <TouchableOpacity
          style={[styles.dispatchBtn, isDispatching && styles.btnDisabled]}
          onPress={handleDispatch}
          disabled={isDispatching}
          activeOpacity={0.8}
        >
          <Icon name={isDispatching ? 'hourglass-empty' : 'send'} size={18} color="#fff" />
          <Text style={styles.dispatchBtnText}>
            {isDispatching ? 'Dispatching…' : 'Dispatch Tasks'}
          </Text>
        </TouchableOpacity>
        {dispatchMsg ? (
          <Text
            style={[
              styles.dispatchMsg,
              dispatchMsg.startsWith('Error') ? styles.dispatchMsgError : styles.dispatchMsgSuccess,
            ]}
          >
            {dispatchMsg}
          </Text>
        ) : null}
      </View>

      {/* Instances section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Claude Instances</Text>
        <Text style={styles.sectionCount}>{instances.length}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={instances}
        renderItem={renderInstance}
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
          !isRefreshing ? (
            <View style={styles.emptyState}>
              <Icon name="smart-toy" size={40} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No instances connected</Text>
              <Text style={styles.emptySubtitle}>
                Start the orchestrator and connect agents to see them here.
              </Text>
            </View>
          ) : null
        }
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
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.error + '20',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontWeight: '700',
    color: colors.text.primary,
  },
  statusDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  healthDetails: {
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthKey: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    textTransform: 'capitalize',
  },
  healthValue: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  toggleBtnStart: {
    backgroundColor: colors.semantic.success,
  },
  toggleBtnStop: {
    backgroundColor: colors.semantic.error,
  },
  toggleBtnText: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  dispatchSection: {
    gap: spacing.xs,
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.purple,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
  },
  dispatchBtnText: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: '#fff',
  },
  dispatchMsg: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  dispatchMsgSuccess: {
    color: colors.semantic.success,
  },
  dispatchMsgError: {
    color: colors.semantic.error,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
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
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.card,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  instanceId: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contextLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    width: 48,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.dark4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  contextPct: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    width: 32,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
});
