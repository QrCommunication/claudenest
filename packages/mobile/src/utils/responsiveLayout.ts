/**
 * Pure responsive-layout classification — no React/RN imports, so the
 * breakpoint logic that drives the whole phone/tablet "Claude OS" shell is
 * unit-testable. `useResponsiveLayout` is a thin hook around `classifyLayout`.
 *
 * `deviceClass` uses the SHORT side (stable identity: a phone in landscape stays
 * a phone), while the multi-pane flags use the CURRENT width (the space actually
 * available is what decides rail/split layouts — so a phone in landscape can get
 * the expanded two-pane treatment).
 */

import { breakpoints, type DeviceClass } from "@/theme";

export interface ResponsiveLayout {
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  deviceClass: DeviceClass;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Worthwhile to show a two-pane (rail + content) layout at this width. */
  isExpanded: boolean;
  /** Very wide — allow a third pane and cap content width. */
  isWide: boolean;
}

export function classifyLayout(
  width: number,
  height: number,
): ResponsiveLayout {
  const shortSide = Math.min(width, height);
  const orientation: "portrait" | "landscape" =
    width >= height ? "landscape" : "portrait";

  const deviceClass: DeviceClass =
    shortSide >= breakpoints.desktop
      ? "desktop"
      : shortSide >= breakpoints.tablet
        ? "tablet"
        : "phone";

  return {
    width,
    height,
    orientation,
    deviceClass,
    isPhone: deviceClass === "phone",
    isTablet: deviceClass === "tablet",
    isDesktop: deviceClass === "desktop",
    isExpanded: width >= breakpoints.tablet,
    isWide: width >= breakpoints.desktop,
  };
}
