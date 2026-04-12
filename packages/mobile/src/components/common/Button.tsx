/**
 * Button Component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
  type TouchableOpacityProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, borderRadius, typography } from '@/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Size styles declared outside StyleSheet.create to allow nested objects
const sizeStyles: Record<'small' | 'medium' | 'large', { container: ViewStyle; text: TextStyle }> = {
  small: {
    container: { paddingVertical: 8, paddingHorizontal: 16 },
    text: { fontSize: typography.size.sm },
  },
  medium: {
    container: { paddingVertical: 12, paddingHorizontal: 24 },
    text: { fontSize: typography.size.base },
  },
  large: {
    container: { paddingVertical: 16, paddingHorizontal: 32 },
    text: { fontSize: typography.size.md },
  },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getSizeStyles = () => sizeStyles[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return colors.text.disabled;
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary.purple;
      default:
        return colors.text.primary;
    }
  };

  const buttonContent = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.primary : colors.primary.purple}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, { color: getTextColor() }, getSizeStyles().text]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </View>
  );

  if (variant === 'primary' && !isDisabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isDisabled}
        style={[styles.container, getSizeStyles().container, style]}
        {...props}
      >
        <LinearGradient
          colors={colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, getSizeStyles().container]}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[
        styles.container,
        getSizeStyles().container,
        getVariantStyles(),
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {buttonContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
  },
  // Variants
  primary: {},
  secondary: {
    backgroundColor: colors.background.dark4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.purple,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.semantic.error,
  },
  disabled: {
    opacity: 0.5,
  },
});
