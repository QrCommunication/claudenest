/**
 * TasksScreen
 * Displays and manages project tasks with List/Kanban toggle,
 * epic/sprint filter chips, story points summary, and pull-to-refresh.
 */

import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
  memo,
} from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Animated, Platform } from 'react-native';
import { showAlert, showPrompt } from "@/services/dialog";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useProjectsStore } from '@/stores/projectsStore';
import { useEpicsStore } from '@/stores/epicsStore';
import { useSprintsStore } from '@/stores/sprintsStore';
import { useFadeIn } from '@/utils/animations';
import type { SharedTask, TaskStatus, TaskPriority } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

import { LoadingSpinner, EmptyState, ErrorMessage } from '@/components/common';
import { TaskCard, KanbanBoard } from '@/components/multiagent';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'Tasks'>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'kanban';
type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | TaskPriority;

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string; color: string }> = [
  { key: 'all',         label: 'All',         color: colors.primary.purple },
  { key: 'backlog',     label: 'Backlog',      color: colors.text.muted },
  { key: 'pending',     label: 'Pending',      color: colors.primary.indigo },
  { key: 'in_progress', label: 'In Progress',  color: colors.primary.cyan },
  { key: 'blocked',     label: 'Blocked',      color: colors.semantic.error },
  { key: 'review',      label: 'Review',       color: colors.semantic.warning },
  { key: 'done',        label: 'Done',         color: colors.semantic.success },
];

// ---------------------------------------------------------------------------
// Chip components
// ---------------------------------------------------------------------------

interface ChipProps {
  label: string;
  isActive: boolean;
  accentColor?: string;
  count?: number;
  onPress: () => void;
}

const Chip = memo(function Chip({
  label,
  isActive,
  accentColor = colors.primary.purple,
  count,
  onPress,
}: ChipProps) {
  return (
    <TouchableOpacity
      style={[
        chipStyles.chip,
        isActive && { borderColor: accentColor, backgroundColor: accentColor + '18' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[chipStyles.label, isActive && { color: accentColor, fontWeight: '600' }]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[chipStyles.badge, isActive && { backgroundColor: accentColor + '30' }]}>
          <Text style={[chipStyles.badgeText, isActive && { color: accentColor }]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.dark3,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.dark4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
  },
});

// ---------------------------------------------------------------------------
// ViewModeToggle
// ---------------------------------------------------------------------------

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewModeToggle = memo(function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <View style={toggleStyles.container}>
      <TouchableOpacity
        style={[toggleStyles.button, mode === 'list' && toggleStyles.buttonActive]}
        onPress={() => onChange('list')}
        activeOpacity={0.7}
      >
        <Icon
          name="view-list"
          size={18}
          color={mode === 'list' ? colors.primary.purple : colors.text.muted}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[toggleStyles.button, mode === 'kanban' && toggleStyles.buttonActive]}
        onPress={() => onChange('kanban')}
        activeOpacity={0.7}
      >
        <Icon
          name="view-kanban"
          size={18}
          color={mode === 'kanban' ? colors.primary.purple : colors.text.muted}
        />
      </TouchableOpacity>
    </View>
  );
});

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonActive: {
    backgroundColor: 'rgba(168,85,247,0.18)',
  },
});

// ---------------------------------------------------------------------------
// StoryPointsHeader
// ---------------------------------------------------------------------------

interface StoryPointsHeaderProps {
  total: number;
  completed: number;
}

const StoryPointsHeader = memo(function StoryPointsHeader({
  total,
  completed,
}: StoryPointsHeaderProps) {
  if (total === 0) return null;
  const pct = Math.round((completed / total) * 100);

  return (
    <View style={spStyles.container}>
      <View style={spStyles.row}>
        <Icon name="star" size={14} color={colors.primary.purple} />
        <Text style={spStyles.text}>
          <Text style={spStyles.emphasis}>{completed}</Text>
          <Text style={spStyles.muted}> / {total} story points</Text>
          <Text style={spStyles.pct}>  {pct}%</Text>
        </Text>
      </View>
      <View style={spStyles.track}>
        <View style={[spStyles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
});

const spStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.dark3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.size.xs,
  },
  emphasis: {
    fontWeight: '700',
    color: colors.primary.purple,
  },
  muted: {
    color: colors.text.secondary,
  },
  pct: {
    color: colors.text.muted,
  },
  track: {
    height: 3,
    backgroundColor: colors.background.dark4,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary.purple,
    borderRadius: borderRadius.full,
  },
});

// ---------------------------------------------------------------------------
// AnimatedTaskCard — FadeIn wrapper
// ---------------------------------------------------------------------------

interface AnimatedTaskCardProps {
  task: SharedTask;
  onPress: (task: SharedTask) => void;
  onClaim: (task: SharedTask) => void;
  onComplete: (task: SharedTask) => void;
  index: number;
}

const AnimatedTaskCard = memo(function AnimatedTaskCard({
  task,
  onPress,
  onClaim,
  onComplete,
  index,
}: AnimatedTaskCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = Math.min(index * 35, 280);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TaskCard
        task={task}
        onPress={onPress}
        onClaim={onClaim}
        onComplete={onComplete}
      />
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// TasksScreen
// ---------------------------------------------------------------------------

export const TasksScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const {
    getProjectTasks,
    fetchTasks,
    createTask,
    claimTask,
    completeTask,
    clearError,
    error,
    isLoading,
  } = useProjectsStore();

  const { getEpicsByProject, fetchEpics } = useEpicsStore();
  const { getSprintsByProject, fetchSprints } = useSprintsStore();

  const tasks = getProjectTasks(projectId);
  const epics = getEpicsByProject(projectId);
  const sprints = getSprintsByProject(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [epicFilter, setEpicFilter] = useState<string | undefined>(undefined);
  const [sprintFilter, setSprintFilter] = useState<string | undefined>(undefined);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchTasks(projectId);
    fetchEpics(projectId);
    fetchSprints(projectId);
  }, [projectId]);

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleCreateTask} style={styles.headerButton}>
          <Icon name="add" size={28} color={colors.primary.purple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (epicFilter && t.epic_id !== epicFilter) return false;
      if (sprintFilter && t.sprint_id !== sprintFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, epicFilter, sprintFilter]);

  const sortedTasks = useMemo(() => {
    const statusOrder: Record<string, number> = {
      backlog: 0, pending: 1, in_progress: 2, blocked: 3, review: 4, done: 5,
    };
    const priorityOrder: Record<string, number> = {
      critical: 0, high: 1, medium: 2, low: 3,
    };

    return [...filteredTasks].sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [filteredTasks]);

  const storyPoints = useMemo(() => {
    const total = tasks.reduce((sum, t) => sum + (t.story_points ?? 0), 0);
    const completed = tasks
      .filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points ?? 0), 0);
    return { total, completed };
  }, [tasks]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      map[t.status] = (map[t.status] ?? 0) + 1;
    }
    return map;
  }, [tasks]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleRefresh = useCallback(() => {
    fetchTasks(projectId);
  }, [projectId, fetchTasks]);

  const handleCreateTask = useCallback(() => {
    showPrompt(
      'New Task',
      'Enter task title:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (title: string | undefined) => {
            if (title) {
              try {
                await createTask(projectId, { title });
              } catch {
                showAlert('Error', 'Failed to create task');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }, [projectId, createTask]);

  const handlePressTask = useCallback(
    (task: SharedTask) => {
      showAlert(
        task.title,
        task.description || 'No description',
        [
          { text: 'Close', style: 'cancel' },
          task.status === 'pending'
            ? {
                text: 'Claim',
                onPress: async () => {
                  try {
                    await claimTask(task.id, 'mobile-instance');
                  } catch {
                    showAlert('Error', 'Failed to claim task');
                  }
                },
              }
            : null,
          task.status === 'in_progress'
            ? { text: 'Complete', onPress: () => handleCompleteTask(task) }
            : null,
        ].filter(Boolean) as { text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }[]
      );
    },
    [claimTask]
  );

  const handleCompleteTask = useCallback(
    (task: SharedTask) => {
      showPrompt(
        'Complete Task',
        'Enter completion summary:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async (summary: string | undefined) => {
              try {
                await completeTask(task.id, summary || 'Completed', []);
              } catch {
                showAlert('Error', 'Failed to complete task');
              }
            },
          },
        ],
        'plain-text'
      );
    },
    [completeTask]
  );

  const handleClaimTask = useCallback(
    async (task: SharedTask) => {
      try {
        await claimTask(task.id, 'mobile-instance');
      } catch {
        showAlert('Error', 'Failed to claim task');
      }
    },
    [claimTask]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item, index }: { item: SharedTask; index: number }) => (
      <AnimatedTaskCard
        task={item}
        onPress={handlePressTask}
        onClaim={handleClaimTask}
        onComplete={handleCompleteTask}
        index={index}
      />
    ),
    [handlePressTask, handleClaimTask, handleCompleteTask]
  );

  const keyExtractor = useCallback((item: SharedTask) => item.id, []);

  if (isLoading && tasks.length === 0) {
    return <LoadingSpinner text="Loading tasks..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchTasks(projectId)}
          onDismiss={clearError}
        />
      )}

      {/* Story points summary */}
      <StoryPointsHeader
        total={storyPoints.total}
        completed={storyPoints.completed}
      />

      {/* Toolbar: status filters + view toggle */}
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          style={styles.filtersScroll}
        >
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              isActive={statusFilter === f.key}
              accentColor={f.color}
              count={f.key === 'all' ? tasks.length : statusCounts[f.key] ?? 0}
              onPress={() => setStatusFilter(f.key)}
            />
          ))}
        </ScrollView>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </View>

      {/* Epic filter chips */}
      {epics.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.epicFiltersScroll}
          contentContainerStyle={styles.epicFiltersContent}
        >
          <Chip
            label="All Epics"
            isActive={epicFilter === undefined}
            accentColor={colors.primary.purple}
            onPress={() => setEpicFilter(undefined)}
          />
          {epics.map((epic) => (
            <Chip
              key={epic.id}
              label={epic.title}
              isActive={epicFilter === epic.id}
              accentColor={epic.color || colors.primary.indigo}
              onPress={() => setEpicFilter(epicFilter === epic.id ? undefined : epic.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Sprint filter chips */}
      {sprints.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sprintFiltersScroll}
          contentContainerStyle={styles.epicFiltersContent}
        >
          <Chip
            label="All Sprints"
            isActive={sprintFilter === undefined}
            accentColor={colors.primary.cyan}
            onPress={() => setSprintFilter(undefined)}
          />
          {sprints.map((sprint) => (
            <Chip
              key={sprint.id}
              label={sprint.name}
              isActive={sprintFilter === sprint.id}
              accentColor={colors.primary.cyan}
              onPress={() => setSprintFilter(sprintFilter === sprint.id ? undefined : sprint.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Content: List or Kanban */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          projectId={projectId}
          epicFilter={epicFilter}
          sprintFilter={sprintFilter}
        />
      ) : (
        <FlatList
          data={sortedTasks}
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
              icon="assignment"
              title="No tasks"
              description={
                statusFilter === 'all' && !epicFilter && !sprintFilter
                  ? 'Create a task to start organizing work'
                  : 'No tasks match the current filters'
              }
              actionLabel={
                statusFilter === 'all' && !epicFilter && !sprintFilter
                  ? 'Create Task'
                  : undefined
              }
              onAction={
                statusFilter === 'all' && !epicFilter && !sprintFilter
                  ? handleCreateTask
                  : undefined
              }
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateTask}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  headerButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.dark3,
    gap: spacing.sm,
  },
  filtersScroll: {
    flex: 1,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },

  // Epic/Sprint filter rows
  epicFiltersScroll: {
    backgroundColor: colors.background.dark1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sprintFiltersScroll: {
    backgroundColor: colors.background.dark1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  epicFiltersContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },

  // List
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 96,
    flexGrow: 1,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: Platform.OS === 'ios' ? 32 : spacing.lg,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
