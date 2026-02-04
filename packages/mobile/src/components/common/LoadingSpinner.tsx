/**
 * LoadingSpinner Component
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text,
  size = 'large',
  fullScreen = false,
}) => {
  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary.purple} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark2,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  text: {
    marginTop: spacing.md,
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
});
