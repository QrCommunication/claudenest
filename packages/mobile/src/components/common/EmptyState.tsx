/**
 * EmptyState Component
 * State vide avec icône MaterialIcons, titre, description et CTA optionnel
 * Animation FadeIn + scale au montage via Reanimated
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface EmptyStateProps {
  icon?: MaterialIconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo(function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(350).delay(80)}
      style={styles.container}
    >
      <Animated.View
        entering={ZoomIn.duration(400).delay(120).springify()}
        style={styles.iconContainer}
      >
        <MaterialIcons name={icon} size={40} color={colors.text.muted} />
      </Animated.View>

      <Text style={styles.title}>{title}</Text>

      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="md"
          style={styles.actionButton}
        />
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionButton: {
    minWidth: 140,
  },
});
