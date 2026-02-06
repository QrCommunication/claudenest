/**
 * StatusDot Component
 * Shows a colored dot indicating status
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '@/theme';

interface StatusDotProps {
  status: 'online' | 'offline' | 'connecting' | 'busy' | 'idle' | 'error' | string;
  size?: number;
  pulse?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 12,
  pulse = false,
}) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (pulse && (status === 'connecting' || status === 'busy')) {
      scale.value = withRepeat(
        withSequence(
          withSpring(1.2, { damping: 2 }),
          withSpring(1, { damping: 2 })
        ),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [status, pulse, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getColor = () => {
    switch (status) {
      case 'online':
        return colors.status.online;
      case 'offline':
      case 'error':
        return colors.status.offline;
      case 'connecting':
        return colors.status.connecting;
      case 'busy':
        return colors.status.busy;
      case 'idle':
        return colors.status.idle;
      default:
        return colors.text.muted;
    }
  };

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getColor(),
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    shadowColor: colors.shadow.default,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
