/**
 * useResponsiveLayout — the backbone of the phone/tablet "Claude OS" shell.
 *
 * React Native has no CSS media queries, so every adaptive layout reads from
 * this hook. `deviceClass` is derived from the SHORT side (stable identity: a
 * phone in landscape stays a phone), while the multi-pane flags read the
 * CURRENT width (the space actually available drives rail/split decisions).
 */

import { useWindowDimensions } from "react-native";
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

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
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
