import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { borderRadius } from "./borderRadius";
import { shadows } from "./shadows";
import { layout, breakpoints } from "./layout";

export {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  breakpoints,
};
export type { DeviceClass, Layout } from "./layout";

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
} as const;

export type Theme = typeof theme;

// Hook pour utiliser le thème
export const useTheme = () => theme;
