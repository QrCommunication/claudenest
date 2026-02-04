/**
 * Badge Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface BadgeProps {
  text: string | number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'small' | 'medium';
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'small',
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return { backgroundColor: colors.semantic.success + '20', color: colors.semantic.success };
      case 'warning':
        return { backgroundColor: colors.semantic.warning + '20', color: colors.semantic.warning };
      case 'error':
        return { backgroundColor: colors.semantic.error + '20', color: colors.semantic.error };
      case 'info':
        return { backgroundColor: colors.semantic.info + '20', color: colors.semantic.info };
      case 'primary':
        return { backgroundColor: colors.primary.purple + '20', color: colors.primary.purple };
      default:
        return { backgroundColor: colors.background.dark4, color: colors.text.secondary };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyle.backgroundColor,
          paddingVertical: size === 'small' ? 2 : 4,
          paddingHorizontal: size === 'small' ? 6 : 10,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variantStyle.color, fontSize: size === 'small' ? 10 : 12 },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.base,
  },
  text: {
    fontWeight: '600',
  },
});
