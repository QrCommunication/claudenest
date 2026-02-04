/**
 * Typography Configuration
 */

export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    mono: 'Menlo', // iOS default monospace
  },

  // Font sizes
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },

  // Shorthand aliases for backward compatibility
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  small: 14,
  caption: 12,
} as const;

export type Typography = typeof typography;
