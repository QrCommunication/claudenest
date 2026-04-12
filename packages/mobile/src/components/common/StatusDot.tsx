/**
 * StatusDot Component
 * Shows a colored dot indicating status with pulse animation
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';
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
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulse && (status === 'connecting' || status === 'busy')) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      scale.setValue(1);
    }
  }, [status, pulse, scale]);

  const getColor = () => {
    switch (status) {
      case 'online': return colors.status.online;
      case 'offline':
      case 'error': return colors.status.offline;
      case 'connecting': return colors.status.connecting;
      case 'busy': return colors.status.busy;
      case 'idle': return colors.status.idle;
      default: return colors.text.muted;
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
          transform: [{ scale }],
        },
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
