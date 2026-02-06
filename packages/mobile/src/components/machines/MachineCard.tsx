/**
 * MachineCard Component
 * Displays a machine/endpoint in a card format
 */

import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import type { Machine } from '@/types';
import { StatusDot, Badge } from '@/components/common';

interface MachineCardProps {
  machine: Machine;
  onPress: (machine: Machine) => void;
  onLongPress?: (machine: Machine) => void;
}

export const MachineCard = memo(function MachineCard({
  machine,
  onPress,
  onLongPress,
}: MachineCardProps) {
  const handlePress = useCallback(() => {
    onPress(machine);
  }, [machine, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(machine);
  }, [machine, onLongPress]);

  const getPlatformIcon = () => {
    switch (machine.platform) {
      case 'darwin':
        return 'laptop-mac';
      case 'win32':
        return 'laptop-windows';
      case 'linux':
        return 'computer';
      default:
        return 'computer';
    }
  };

  const getStatusLabel = () => {
    switch (machine.status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'connecting':
        return 'Connecting...';
      default:
        return machine.status;
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Animated.View
        style={styles.container}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${machine.name}, ${getStatusLabel()}`}
      >
        <Animated.View
          style={styles.touchable}
          onTouchEnd={handlePress}
          onTouchStart={(e) => {
            // Handle long press with timer
            const timer = setTimeout(() => {
              handleLongPress();
            }, 500);
            const clear = () => clearTimeout(timer);
            e.target?.addEventListener?.('touchend', clear, { once: true });
          }}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Icon name={getPlatformIcon()} size={24} color={colors.primary.purple} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {machine.name}
              </Text>
              <Text style={styles.hostname} numberOfLines={1}>
                {machine.hostname || machine.arch}
              </Text>
            </View>
            <StatusDot status={machine.status} size={10} pulse={machine.status === 'connecting'} />
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Icon name="memory" size={14} color={colors.text.muted} />
              <Text style={styles.detailText}>
                Claude {machine.claudeVersion || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="terminal" size={14} color={colors.text.muted} />
              <Text style={styles.detailText}>
                {machine.activeSessions || 0} active session
                {(machine.activeSessions || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Badge
              text={machine.platform}
              variant="default"
              size="small"
            />
            {machine.status === 'online' && (
              <Badge text="Ready" variant="success" size="small" />
            )}
          </View>
        </Animated.View>
      </Animated.View>
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
    overflow: 'hidden',
  },
  touchable: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  name: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hostname: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  details: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
