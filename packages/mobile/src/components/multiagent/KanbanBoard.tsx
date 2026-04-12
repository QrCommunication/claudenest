/**
 * KanbanBoard Component
 * Horizontal scrollable Kanban board for mobile, with 6 columns.
 * Long-press on a task opens a bottom sheet to move it to another column.
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useFadeIn } from '@/utils/animations';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { tasksApi, epicsApi, sprintsApi } from '@/services/api';
import type { Epic, SharedTask, Sprint, TaskStatus } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  projectId: string;
  epicFilter?: string;
  sprintFilter?: string;
}

type ColumnConfig = {
  status: TaskStatus;
  label: string;
  color: string;
  bgColor: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMN_WIDTH = 280;

const COLUMNS: ColumnConfig[] = [
  { status: 'backlog',     label: 'Backlog',     color: colors.text.muted,          bgColor: 'rgba(100,116,139,0.15)' },
  { status: 'pending',     label: 'Pending',     color: colors.primary.indigo,      bgColor: 'rgba(99,102,241,0.15)'  },
  { status: 'in_progress', label: 'In Progress', color: colors.primary.cyan,        bgColor: 'rgba(34,211,238,0.15)'  },
  { status: 'blocked',     label: 'Blocked',     color: colors.semantic.error,      bgColor: 'rgba(239,68,68,0.15)'   },
  { status: 'review',      label: 'Review',      color: colors.semantic.warning,    bgColor: 'rgba(251,191,36,0.15)'  },
  { status: 'done',        label: 'Done',        color: colors.semantic.success,    bgColor: 'rgba(34,197,94,0.15)'   },
];

// ---------------------------------------------------------------------------
// MoveSheet — bottom sheet for column selection
// ---------------------------------------------------------------------------

interface MoveSheetProps {
  task: SharedTask | null;
  visible: boolean;
  onMove: (task: SharedTask, status: TaskStatus) => void;
  onClose: () => void;
}

const MoveSheet = memo(function MoveSheet({ task, visible, onMove, onClose }: MoveSheetProps) {
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 400,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  if (!task && !visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY }] }]}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.sheetTitle}>Move to column</Text>
        <Text style={sheetStyles.sheetSubtitle} numberOfLines={1}>{task?.title}</Text>
        <View style={sheetStyles.columnList}>
          {COLUMNS.map((col) => {
            const isCurrent = task?.status === col.status;
            return (
              <TouchableOpacity
                key={col.status}
                style={[sheetStyles.columnRow, isCurrent && sheetStyles.columnRowActive]}
                onPress={() => task && onMove(task, col.status)}
                disabled={isCurrent}
                activeOpacity={0.7}
              >
                <View style={[sheetStyles.colorDot, { backgroundColor: col.color }]} />
                <Text style={[sheetStyles.columnLabel, isCurrent && { color: col.color }]}>
                  {col.label}
                </Text>
                {isCurrent && (
                  <Icon name="check" size={16} color={col.color} style={sheetStyles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
});

// ---------------------------------------------------------------------------
// KanbanTaskCard — individual task card inside a column
// ---------------------------------------------------------------------------

interface KanbanTaskCardProps {
  task: SharedTask;
  onPress: (task: SharedTask) => void;
  onLongPress: (task: SharedTask) => void;
}

const KanbanTaskCard = memo(function KanbanTaskCard({
  task,
  onPress,
  onLongPress,
}: KanbanTaskCardProps) {
  const fadeStyle = useFadeIn();

  const priorityColor = useMemo(() => {
    switch (task.priority) {
      case 'critical': return colors.semantic.error;
      case 'high':     return colors.semantic.warning;
      case 'medium':   return colors.primary.purple;
      default:         return colors.text.muted;
    }
  }, [task.priority]);

  return (
    <Animated.View style={fadeStyle}>
      <TouchableOpacity
        style={cardStyles.container}
        onPress={() => onPress(task)}
        onLongPress={() => onLongPress(task)}
        activeOpacity={0.75}
        delayLongPress={350}
      >
        {/* Priority stripe */}
        <View style={[cardStyles.stripe, { backgroundColor: priorityColor }]} />

        <View style={cardStyles.body}>
          <Text style={cardStyles.title} numberOfLines={2}>{task.title}</Text>

          {task.description ? (
            <Text style={cardStyles.description} numberOfLines={2}>{task.description}</Text>
          ) : null}

          <View style={cardStyles.footer}>
            {task.story_points !== null && task.story_points !== undefined && (
              <View style={cardStyles.chip}>
                <Text style={cardStyles.chipText}>{task.story_points} pt</Text>
              </View>
            )}
            {task.labels && task.labels.length > 0 && (
              <View style={[cardStyles.chip, { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
                <Text style={[cardStyles.chipText, { color: colors.primary.indigo }]}>
                  {task.labels[0]}
                </Text>
              </View>
            )}
            {task.assignedTo && (
              <View style={cardStyles.assignee}>
                <Icon name="person" size={12} color={colors.text.muted} />
                <Text style={cardStyles.assigneeText} numberOfLines={1}>
                  {task.assignedTo.slice(0, 6)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// KanbanColumn — one column with header + FlatList
// ---------------------------------------------------------------------------

interface KanbanColumnProps {
  config: ColumnConfig;
  tasks: SharedTask[];
  onTaskPress: (task: SharedTask) => void;
  onTaskLongPress: (task: SharedTask) => void;
}

const KanbanColumn = memo(function KanbanColumn({
  config,
  tasks,
  onTaskPress,
  onTaskLongPress,
}: KanbanColumnProps) {
  const renderTask = useCallback(
    ({ item }: ListRenderItemInfo<SharedTask>) => (
      <KanbanTaskCard
        task={item}
        onPress={onTaskPress}
        onLongPress={onTaskLongPress}
      />
    ),
    [onTaskPress, onTaskLongPress]
  );

  const keyExtractor = useCallback((item: SharedTask) => item.id, []);

  return (
    <View style={[colStyles.column, { width: COLUMN_WIDTH }]}>
      {/* Header */}
      <View style={[colStyles.header, { backgroundColor: config.bgColor }]}>
        <View style={[colStyles.dot, { backgroundColor: config.color }]} />
        <Text style={[colStyles.headerLabel, { color: config.color }]}>{config.label}</Text>
        <View style={[colStyles.counter, { backgroundColor: config.color + '25' }]}>
          <Text style={[colStyles.counterText, { color: config.color }]}>{tasks.length}</Text>
        </View>
      </View>

      {/* Task list */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={keyExtractor}
        contentContainerStyle={colStyles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={colStyles.empty}>
            <Text style={colStyles.emptyText}>No tasks</Text>
          </View>
        }
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// FilterSelect — horizontal scrollable select for epics/sprints
// ---------------------------------------------------------------------------

interface FilterSelectProps<T extends { id: string; title?: string; name?: string }> {
  label: string;
  items: T[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  color: string;
}

function FilterSelect<T extends { id: string; title?: string; name?: string }>({
  label,
  items,
  selectedId,
  onSelect,
  color,
}: FilterSelectProps<T>) {
  return (
    <View style={filterStyles.wrapper}>
      <Text style={filterStyles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.scroll}
      >
        <TouchableOpacity
          style={[filterStyles.chip, !selectedId && { borderColor: color, backgroundColor: color + '20' }]}
          onPress={() => onSelect(undefined)}
          activeOpacity={0.7}
        >
          <Text style={[filterStyles.chipText, !selectedId && { color }]}>All</Text>
        </TouchableOpacity>
        {items.map((item) => {
          const isActive = selectedId === item.id;
          const display = item.title ?? item.name ?? item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[filterStyles.chip, isActive && { borderColor: color, backgroundColor: color + '20' }]}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[filterStyles.chipText, isActive && { color }]}>{display}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// KanbanBoard — main component
// ---------------------------------------------------------------------------

export const KanbanBoard = memo(function KanbanBoard({
  projectId,
  epicFilter: epicFilterProp,
  sprintFilter: sprintFilterProp,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [epicFilter, setEpicFilter] = useState<string | undefined>(epicFilterProp);
  const [sprintFilter, setSprintFilter] = useState<string | undefined>(sprintFilterProp);

  const [selectedTask, setSelectedTask] = useState<SharedTask | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Load data
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [tasksRes, epicsRes, sprintsRes] = await Promise.all([
          tasksApi.list(projectId),
          epicsApi.list(projectId),
          sprintsApi.list(projectId),
        ]);
        if (cancelled) return;
        setTasks(tasksRes.data ?? []);
        setEpics(epicsRes.data ?? []);
        setSprints(sprintsRes.data ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load tasks';
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projectId]);

  // Filtered tasks per column
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (epicFilter && t.epic_id !== epicFilter) return false;
      if (sprintFilter && t.sprint_id !== sprintFilter) return false;
      return true;
    });
  }, [tasks, epicFilter, sprintFilter]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, SharedTask[]> = {
      backlog: [], pending: [], in_progress: [], blocked: [], review: [], done: [],
    };
    for (const t of filteredTasks) {
      if (map[t.status]) map[t.status].push(t);
    }
    // Sort by sort_order within each column
    for (const key of Object.keys(map) as TaskStatus[]) {
      map[key].sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [filteredTasks]);

  // Handlers
  const handleTaskPress = useCallback((_task: SharedTask) => {
    // Task press — could navigate to task detail; left as extension point
  }, []);

  const handleTaskLongPress = useCallback((task: SharedTask) => {
    setSelectedTask(task);
    setSheetVisible(true);
  }, []);

  const handleMove = useCallback(async (task: SharedTask, status: TaskStatus) => {
    setSheetVisible(false);
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status } : t));
    try {
      await tasksApi.update(task.id, { status });
    } catch {
      // Rollback
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
    }
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  // Render states
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.stateText}>Loading board...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Icon name="error-outline" size={40} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Filters */}
      <View style={styles.filters}>
        <FilterSelect<Epic>
          label="Epic"
          items={epics}
          selectedId={epicFilter}
          onSelect={setEpicFilter}
          color={colors.primary.purple}
        />
        <FilterSelect<Sprint>
          label="Sprint"
          items={sprints}
          selectedId={sprintFilter}
          onSelect={setSprintFilter}
          color={colors.primary.cyan}
        />
      </View>

      {/* Board */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.board}
        decelerationRate="fast"
        snapToInterval={COLUMN_WIDTH + spacing.sm}
        snapToAlignment="start"
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            config={col}
            tasks={tasksByStatus[col.status]}
            onTaskPress={handleTaskPress}
            onTaskLongPress={handleTaskLongPress}
          />
        ))}
      </ScrollView>

      {/* Move bottom sheet */}
      <MoveSheet
        task={selectedTask}
        visible={sheetVisible}
        onMove={handleMove}
        onClose={handleCloseSheet}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.dark2,
  },
  stateText: {
    color: colors.text.secondary,
    fontSize: typography.size.base,
  },
  errorText: {
    color: colors.semantic.error,
    fontSize: typography.size.base,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  filters: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background.dark1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing.xs,
  },
  board: {
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
});

const colStyles = StyleSheet.create({
  column: {
    marginRight: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.dark3,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerLabel: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  counter: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  counterText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: typography.size.sm,
  },
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stripe: {
    width: 3,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  body: {
    flex: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 18,
  },
  description: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: typography.size.xs,
    color: colors.primary.purple,
    fontWeight: '600',
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  assigneeText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
  },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.background.dark3,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border.strong,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sheetSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  columnList: {
    gap: spacing.xs,
  },
  columnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  columnRowActive: {
    borderColor: colors.border.default,
    backgroundColor: colors.background.dark2,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  columnLabel: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});

const filterStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  scroll: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  chip: {
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
