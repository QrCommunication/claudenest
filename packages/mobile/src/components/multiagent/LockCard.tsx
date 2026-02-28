/**
 * LockCard Component
 * Displays a file lock in a card format
 */

import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import type { FileLock } from '@/types';

interface LockCardProps {
  lock: FileLock;
  onUnlock?: (lock: FileLock) => void;
  canUnlock?: boolean;
}

export const LockCard = memo(function LockCard({
  lock,
  onUnlock,
  canUnlock,
}: LockCardProps) {
  const handleUnlock = useCallback(() => {
    onUnlock?.(lock);
  }, [lock, onUnlock]);

  const fileName = lock.path.split('/').pop() || lock.path;
  const directory = lock.path.split('/').slice(0, -1).join('/') || '/';

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name="lock" size={20} color={colors.semantic.warning} />
        </View>

        <View style={styles.content}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.directory} numberOfLines={1}>
            {directory}
          </Text>
          <View style={styles.details}>
            <Text style={styles.lockedBy}>
              by {lock.lockedBy}
            </Text>
            {lock.reason && (
              <Text style={styles.reason} numberOfLines={1}>
                {lock.reason}
              </Text>
            )}
          </View>
        </View>

        {canUnlock && (
          <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
            <Icon name="lock-open" size={18} color={colors.semantic.error} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    backgroundColor: colors.semantic.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  directory: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  details: {
    marginTop: spacing.xs,
  },
  lockedBy: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  reason: {
    fontSize: typography.size.xs,
    color: colors.semantic.warning,
    marginTop: 2,
  },
  unlockButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
});
