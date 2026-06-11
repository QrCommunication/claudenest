/**
 * SprintsScreen
 * Lists sprints for a project. Active sprint is featured prominently at the top
 * with progress, story points and remaining days. Other sprints follow in a FlatList.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { showAlert } from "@/services/dialog";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useSprintsStore } from '@/stores/sprintsStore';
import { useFadeIn } from '@/utils/animations';
import { SprintCard } from '@/components/multiagent/SprintCard';
import { EmptyState } from '@/components/common/EmptyState';
import type { Sprint } from '@/types';

// ==================== NAVIGATION TYPE ====================

type Props = NativeStackScreenProps<ProjectsStackParamList, 'Sprints'>;

// ==================== SKELETON ====================

const SprintSkeleton = memo(function SprintSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
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
}

const ActiveSprintCard = memo(function ActiveSprintCard({
  sprint,
  onStart,
  onComplete,
}: ActiveSprintCardProps) {
  const fadeStyle = useFadeIn();

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const progressPct = sprint.progress_percentage;
  const isOverdue = sprint.is_overdue;
  const isActive = sprint.status === 'active';
  const isPlanning = sprint.status === 'planning';

  const progressColor =
    isOverdue
      ? colors.semantic.error
      : progressPct >= 80
      ? colors.semantic.success
      : colors.primary.purple;

  return (
    <Animated.View style={[styles.activeCard, fadeStyle]}>
      {/* Header row */}
      <View style={styles.activeCardHeader}>
        <View style={styles.activeCardTitleWrap}>
          <View style={[styles.activeBadge, { opacity: isActive ? 1 : 0.5 }]}>
            <View style={styles.activeBadgeDot} />
            <Text style={styles.activeBadgeText}>
              {isActive ? 'Active' : sprint.status}
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
              isOverdue
                ? styles.daysChipOverdue
                : styles.daysChipNormal,
            ]}
          >
            <Icon
              name={isOverdue ? 'warning' : 'schedule'}
              size={12}
              color={isOverdue ? colors.semantic.error : colors.primary.cyan}
            />
            <Text
              style={[
                styles.daysChipText,
                { color: isOverdue ? colors.semantic.error : colors.primary.cyan },
              ]}
            >
              {isOverdue
                ? `${Math.abs(sprint.remaining_days)}d over`
                : `${sprint.remaining_days}d left`}
            </Text>
          </View>
        )}
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
            {sprint.velocity ?? '—'}
          </Text>
          <Text style={styles.metricLabel}>Velocity</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.activeCardActions}>
        {isPlanning && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnStart]}
            onPress={() => onStart(sprint)}
            activeOpacity={0.8}
          >
            <Icon name="play-arrow" size={18} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>Start Sprint</Text>
          </TouchableOpacity>
        )}
        {isActive && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnComplete]}
            onPress={() => onComplete(sprint)}
            activeOpacity={0.8}
          >
            <Icon name="check-circle" size={18} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>Complete Sprint</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

// ==================== MAIN SCREEN ====================

export const SprintsScreen = memo(function SprintsScreen({
  route,
}: Props) {
  const { projectId } = route.params;
  const {
    getSprintsByProject,
    getActiveSprintForProject,
    fetchSprints,
    startSprint,
    completeSprint,
    isLoading,
    error,
    clearError,
  } = useSprintsStore();

  const allSprints = getSprintsByProject(projectId);
  const activeSprint = getActiveSprintForProject(projectId);
  const otherSprints = allSprints.filter(
    (s) => s.id !== activeSprint?.id && s.status !== 'planning'
  );
  // Planning sprints (not active) — shown below others
  const planningSprints = allSprints.filter(
    (s) => s.status === 'planning' && s.id !== activeSprint?.id
  );
  const listSprints = [...planningSprints, ...otherSprints];

  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await fetchSprints(projectId);
    } catch {
      // error managed in store
    }
  }, [projectId, fetchSprints]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchSprints(projectId);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, fetchSprints]);

  const handleStart = useCallback(
    (sprint: Sprint) => {
      showAlert(
        'Start Sprint',
        `Start "${sprint.name}"? This will mark it as active.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              try {
                await startSprint(sprint.id);
              } catch {
                showAlert('Error', 'Failed to start sprint. Please try again.');
              }
            },
          },
        ]
      );
    },
    [startSprint]
  );

  const handleComplete = useCallback(
    (sprint: Sprint) => {
      showAlert(
        'Complete Sprint',
        `Complete "${sprint.name}"? Unfinished tasks will remain in backlog.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            style: 'destructive',
            onPress: async () => {
              try {
                await completeSprint(sprint.id);
              } catch {
                showAlert('Error', 'Failed to complete sprint. Please try again.');
              }
            },
          },
        ]
      );
    },
    [completeSprint]
  );

  const handleSprintPress = useCallback((_sprint: Sprint) => {
    // Navigate to sprint detail when screen is created
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Sprint }) => (
      <SprintCard sprint={item} onPress={handleSprintPress} />
    ),
    [handleSprintPress]
  );

  const keyExtractor = useCallback((item: Sprint) => item.id, []);

  // Active or planning sprint to feature at top
  const featuredSprint =
    activeSprint ??
    allSprints.find((s) => s.status === 'planning') ??
    null;

  if (isLoading && allSprints.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.skeletonContainer}>
          <Animated.View
            style={[styles.skeletonFeatured, { opacity: new Animated.Value(0.5) }]}
          />
          {[1, 2].map((k) => (
            <SprintSkeleton key={k} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ListHeader rendered inside FlatList for unified scrolling
  const ListHeader = (
    <>
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
        />
      ) : null}

      {/* Section title for other sprints */}
      {listSprints.length > 0 ? (
        <Text style={styles.sectionTitle}>Other Sprints</Text>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
              title="No sprints yet"
              description="Create a sprint to start tracking your team's work in time-boxed iterations."
            />
          ) : null
        }
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
    paddingBottom: spacing.xl,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.semantic.error + '18',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.semantic.error + '40',
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  // Section title
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  activeCardTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  activeBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary.purple,
  },
  activeBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.primary.purple,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeCardName: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  daysChip: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  activeCardGoal: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressPct: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.dark1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
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
    alignSelf: 'center',
  },
  // Action buttons
  activeCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  actionBtnText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
