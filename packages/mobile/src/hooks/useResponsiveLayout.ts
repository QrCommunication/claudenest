/**
 * useResponsiveLayout — the backbone of the phone/tablet "Claude OS" shell.
 *
 * React Native has no CSS media queries, so every adaptive layout reads from
 * this hook. The classification logic lives in the pure, unit-tested
 * `classifyLayout` helper; this hook only feeds it the live window dimensions.
 */

import { useWindowDimensions } from "react-native";
import {
  classifyLayout,
  type ResponsiveLayout,
} from "@/utils/responsiveLayout";

export type { ResponsiveLayout };

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return classifyLayout(width, height);
}
