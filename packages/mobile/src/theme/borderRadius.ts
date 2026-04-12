/**
 * Border Radius Configuration
 */

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
  // Legacy aliases
  base: 8,
} as const;

export type BorderRadius = typeof borderRadius;
