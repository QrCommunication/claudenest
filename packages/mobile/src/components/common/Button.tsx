/**
 * Button Component
 * Variantes : primary, secondary, ghost, danger
 * Tailles : sm (32h), md (40h), lg (48h)
 */

import React, { memo, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, borderRadius, typography } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const HEIGHT: Record<ButtonSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

const FONT_SIZE: Record<ButtonSize, number> = {
  sm: typography.size.sm,
  md: typography.size.base,
  lg: typography.size.md,
};

const PADDING_H: Record<ButtonSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
};

export const Button = memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!isDisabled) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    }
  }, [isDisabled, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const containerStyle: ViewStyle = {
    height: HEIGHT[size],
    paddingHorizontal: PADDING_H[size],
  };

  const textColor = (() => {
    if (isDisabled) return colors.text.disabled;
    switch (variant) {
      case 'secondary': return colors.accent.purple;
      case 'ghost': return colors.accent.purple;
      case 'danger': return colors.text.primary;
      default: return colors.text.primary;
    }
  })();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        containerStyle,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.text.primary : colors.accent.purple}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          <Text
            style={[
              styles.text,
              { color: textColor, fontSize: FONT_SIZE[size] },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  // Variants
  primary: {
    backgroundColor: colors.accent.purple,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.purple,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.status.error,
  },
  disabled: {
    opacity: 0.4,
  },
});
