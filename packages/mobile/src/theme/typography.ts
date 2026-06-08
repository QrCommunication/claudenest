/**
 * Typography Configuration
 */

export const typography = {
  // Styles composés (usage direct)
  h1: {
    fontSize: 30,
    fontFamily: "SpaceGrotesk_700Bold" as const,
    fontWeight: "700" as const,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_600SemiBold" as const,
    fontWeight: "600" as const,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_600SemiBold" as const,
    fontWeight: "600" as const,
  },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: "500" as const, letterSpacing: 0.3 },
  mono: { fontSize: 13, fontFamily: "SpaceMono_400Regular" as const },

  // Font families
  fontFamily: {
    regular: "SpaceGrotesk_400Regular",
    medium: "SpaceGrotesk_500Medium",
    semiBold: "SpaceGrotesk_600SemiBold",
    bold: "SpaceGrotesk_700Bold",
    mono: "SpaceMono_400Regular",
  },

  // Font sizes (legacy granular)
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  weight: {
    normal: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
  },
} as const;

export type Typography = typeof typography;
