/**
 * Input Component
 */

import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            error && styles.inputContainerError,
            props.editable === false && styles.inputContainerDisabled,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              inputStyle,
            ]}
            placeholderTextColor={colors.text.muted}
            secureTextEntry={secureTextEntry}
            {...props}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helper ? (
          <Text style={styles.helperText}>{helper}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.background.dark4,
  },
  inputContainerError: {
    borderColor: colors.semantic.error,
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    paddingLeft: spacing.md,
    marginRight: spacing.xs,
  },
  rightIcon: {
    paddingRight: spacing.md,
    marginLeft: spacing.xs,
  },
  errorText: {
    fontSize: typography.size.xs,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
