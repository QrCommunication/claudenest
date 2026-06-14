/**
 * Responsive layout + "Claude OS" chrome tokens.
 *
 * React Native has no CSS media queries — breakpoints are consumed at runtime
 * via `useResponsiveLayout()`. This module is dimensional/structural only;
 * brand colors live in `colors.ts` and glow/elevation in `shadows.ts`.
 */

/** Width thresholds in dp (RN convention: ~600dp short side ≈ tablet). */
export const breakpoints = {
  phone: 0,
  tablet: 600,
  desktop: 1024,
} as const;

export type DeviceClass = "phone" | "tablet" | "desktop";

export const layout = {
  breakpoints,

  /** Chrome dimensions for the OS-style shell (dock, windows, rails). */
  os: {
    /** Bottom taskbar / dock. */
    dockHeight: 60,
    dockItemSize: 44,
    dockIconSize: 22,
    /** Terminal-window header (traffic lights + mono title). */
    windowHeaderHeight: 38,
    trafficLightSize: 10,
    trafficLightGap: 7,
    /** Tablet "desktop" left rail. */
    railWidth: 248,
    railCollapsedWidth: 64,
    /** Readable content cap on wide screens. */
    contentMaxWidth: 1080,
    gutter: 16,
  },
} as const;

export type Layout = typeof layout;
