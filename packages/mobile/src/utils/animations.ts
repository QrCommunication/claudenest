/**
 * Animation utilities using RN's built-in Animated API
 * Replaces react-native-reanimated for simple enter animations
 */

import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/** Simple fade-in on mount. Returns an animated style object. */
export function useFadeIn(duration = 300) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration]);

  return { opacity };
}
