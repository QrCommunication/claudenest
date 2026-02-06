/**
 * TaskCard Component
 * Displays a shared task in a card format
 */

import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import type { SharedTask, TaskPriority, TaskStatus } from '@/types';
import { Badge } from '@/components/common';

interface TaskCardProps {
  task: SharedTask;
  onPress: (task: SharedTask) => void;
  onClaim?: (task: SharedTask) => void;
  onComplete?: (task: SharedTask) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  onPress,
  onClaim,
  onComplete,
}: TaskCardProps) {
  const handlePress = useCallback(() => {
    onPress(task);
  }, [task, onPress]);

  const handleClaim = useCallback(() => {
    onClaim?.(task);
  }, [task, onClaim]);

  const handleComplete = useCallback(() => {
    onComplete?.(task);
  }, [task, onComplete]);

  const getPriorityVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusVariant = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'review':
        return 'info';
      case 'blocked':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const isPending = task.status === 'pending';
  const isInProgress = task.status === 'in_progress';

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {task.title}
            </Text>
            {task.description && (
              <Text style={styles.description} numberOfLines={2}>
                {task.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.badgeRow}>
            <Badge
              text={task.priority}
              variant={getPriorityVariant(task.priority)}
              size="small"
            />
            <Badge
              text={task.status}
              variant={getStatusVariant(task.status)}
              size="small"
            />
          </View>

          {task.assignedTo && (
            <View style={styles.assignment}>
              <Icon name="person" size={14} color={colors.text.muted} />
              <Text style={styles.assignmentText} numberOfLines={1}>
                {task.assignedTo}
              </Text>
            </View>
          )}

          {task.files && task.files.length > 0 && (
            <View style={styles.files}>
              <Icon name="description" size={14} color={colors.text.muted} />
              <Text style={styles.filesText}>
                {task.files.length} file{task.files.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {isPending && onClaim && (
            <TouchableOpacity style={styles.actionButton} onPress={handleClaim}>
              <Text style={styles.actionButtonText}>Claim</Text>
            </TouchableOpacity>
          )}
          {isInProgress && onComplete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
            >
              <Text style={[styles.actionButtonText, styles.completeButtonText]}>
                Complete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  details: {
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  assignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assignmentText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  files: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filesText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.primary.purple + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.primary.purple,
  },
  completeButton: {
    backgroundColor: colors.semantic.success + '20',
  },
  completeButtonText: {
    color: colors.semantic.success,
  },
});
