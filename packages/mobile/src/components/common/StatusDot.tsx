/**
 * StatusDot Component
 * Dot coloré avec pulse Reanimated pour le statut online
 */

import React, { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme';

type StatusValue =
  | 'online'
  | 'offline'
  | 'connecting'
  | 'busy'
  | 'idle'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | string;

type DotSize = 'sm' | 'md' | 'lg';

interface StatusDotProps {
  status: StatusValue;
  size?: DotSize | number;
  pulse?: boolean;
}

const SIZE_MAP: Record<DotSize, number> = {
  sm: 8,
  md: 10,
  lg: 14,
};

const STATUS_COLOR: Record<string, string> = {
  online: colors.status.online,
  offline: colors.status.offline,
  error: colors.status.error,
  connecting: colors.status.connecting,
  busy: colors.status.busy,
  idle: colors.status.idle,
  success: colors.status.success,
  warning: colors.status.warning,
  info: colors.status.info,
};

function resolveSize(size: DotSize | number): number {
  if (typeof size === 'number') return size;
  return SIZE_MAP[size] ?? SIZE_MAP.md;
}

function resolveColor(status: StatusValue): string {
  return STATUS_COLOR[status] ?? colors.text.muted;
}

const PULSE_STATUSES = new Set(['online', 'connecting', 'busy']);

export const StatusDot = memo(function StatusDot({
  status,
  size = 'md',
  pulse,
}: StatusDotProps) {
  const dotSize = resolveSize(size);
  const dotColor = resolveColor(status);
  const shouldPulse = pulse !== undefined ? pulse : PULSE_STATUSES.has(status);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (shouldPulse) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [shouldPulse, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: dotColor,
        },
        animatedStyle,
      ]}
      accessibilityLabel={`Status: ${status}`}
    />
  );
});

const styles = StyleSheet.create({
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
});
