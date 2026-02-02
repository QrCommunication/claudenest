/**
 * ErrorMessage Component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  return (
    <View style={styles.container}>
      <Icon name="error-outline" size={20} color={colors.semantic.error} />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.actionButton}>
            <Text style={styles.actionText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Icon name="close" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.error + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  message: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.semantic.error,
  },
  dismissButton: {
    padding: 4,
    marginLeft: spacing.xs,
  },
});
