/**
 * InstanceCard Component
 * Displays a Claude instance in a card format
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import type { ClaudeInstance, InstanceStatus } from '@/types';
import { StatusDot } from '@/components/common';

interface InstanceCardProps {
  instance: ClaudeInstance;
}

export const InstanceCard = memo(function InstanceCard({
  instance,
}: InstanceCardProps) {
  const getStatusLabel = (status: InstanceStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'idle':
        return 'Idle';
      case 'busy':
        return 'Busy';
      case 'disconnected':
        return 'Disconnected';
      default:
        return status;
    }
  };

  const contextPercentage = Math.round(
    (instance.contextTokens / instance.maxContextTokens) * 100
  );

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="smart-toy" size={20} color={colors.primary.cyan} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.id} numberOfLines={1}>
              {instance.id.slice(0, 8)}...
            </Text>
            <Text style={styles.status}>
              {getStatusLabel(instance.status)}
            </Text>
          </View>
          <StatusDot status={instance.status === 'active' ? 'online' : instance.status} size={10} pulse={instance.status === 'busy'} />
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{instance.tasksCompleted}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{contextPercentage}%</Text>
            <Text style={styles.statLabel}>Context</Text>
          </View>
        </View>

        {instance.currentTaskId && (
          <View style={styles.currentTask}>
            <Icon name="assignment" size={14} color={colors.text.muted} />
            <Text style={styles.currentTaskText} numberOfLines={1}>
              Working on task...
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 66, 97, 0.5)',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    backgroundColor: colors.background.dark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  id: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  status: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.base,
    padding: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.background.dark4,
  },
  currentTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 66, 97, 0.3)',
  },
  currentTaskText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    flex: 1,
  },
});
