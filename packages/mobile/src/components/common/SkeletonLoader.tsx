/**
 * SkeletonLoader Component
 * Shimmer animé pour les états de chargement
 * Utilise Reanimated pour des animations fluides sur le thread UI
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, borderRadius, spacing } from '@/theme';

// ---------------------------------------------------------------------------
// Primitive Skeleton
// ---------------------------------------------------------------------------

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = memo(function Skeleton({
  width,
  height,
  borderRadius: radius = borderRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.bg.hover,
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

// ---------------------------------------------------------------------------
// Variante : Card skeleton
// ---------------------------------------------------------------------------

interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard = memo(function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={11} style={styles.mt6} />
        </View>
        <Skeleton width={48} height={20} borderRadius={borderRadius.sm} />
      </View>
      {/* Body rows */}
      <View style={styles.cardBody}>
        <Skeleton width="100%" height={11} />
        <Skeleton width="75%" height={11} style={styles.mt6} />
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Variante : Text skeleton
// ---------------------------------------------------------------------------

interface SkeletonTextProps {
  lines?: number;
  style?: ViewStyle;
}

export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  style,
}: SkeletonTextProps) {
  const widths: Array<`${number}%`> = ['100%', '80%', '60%', '90%', '70%'];

  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={widths[i % widths.length]}
          height={12}
          style={i > 0 ? styles.mt8 : undefined}
        />
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Variante : Avatar skeleton
// ---------------------------------------------------------------------------

interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const SkeletonAvatar = memo(function SkeletonAvatar({
  size = 40,
  style,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: 6,
  },
  cardBody: {
    gap: 6,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
});
