/**
 * WindowFrame — terminal-window chrome for the "Claude OS" shell.
 *
 * Wraps any panel/board in a window: a header bar with traffic-light dots, a
 * monospace title (+ optional subtitle), an actions slot, and an accent-tinted
 * top edge with optional neon glow.
 *
 * Two modes, selected per-instance and fully backward compatible:
 *  - Decorative (default): the traffic lights are inert eye-candy, no gestures.
 *    This is how the screen panels (PlanningScreen, GitScreen, …) use it today.
 *  - Interactive: pass `controls` and/or `onDrag`/`onResize` and the frame turns
 *    into a real window — the red/amber/green dots become close/minimize/
 *    maximize buttons, the header drags, and a bottom-right grip resizes.
 *
 * WindowFrame stays STORE-AGNOSTIC: it only emits intents (`controls.*`) and
 * cumulative gesture translations (`onDrag`/`onResize`). The desktop host snapshots
 * the window bounds at gesture-start and commits the result via the window
 * manager store (see `utils/windowGeometry`). This keeps the frame presentational
 * and lets panels embed it without registering a managed window.
 */

import React, { memo, useMemo, useRef, type ReactNode } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ViewStyle,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import {
  borderRadius,
  colors,
  layout,
  shadows,
  spacing,
  typography,
} from "@/theme";

/** macOS traffic-light controls. Omit a handler to keep that dot decorative. */
export interface WindowFrameControls {
  /** Red dot → close the window. */
  onClose?: () => void;
  /** Amber dot → send the window to the taskbar/dock. */
  onMinimize?: () => void;
  /** Green dot → toggle full-bleed / restore floating geometry. */
  onToggleMaximize?: () => void;
  /** Current maximized state — flips the green-dot glyph + a11y label. */
  maximized?: boolean;
}

/**
 * A drag/resize gesture stream. `onMove` receives the cumulative translation
 * (logical px) since the gesture began — feed it to `dragTo`/`resizeFromGrip`
 * together with a bounds snapshot taken in `onStart`.
 */
export interface WindowFrameGesture {
  onStart?: () => void;
  onMove: (translation: { x: number; y: number }) => void;
  onEnd?: () => void;
}

interface WindowFrameProps {
  title: string;
  subtitle?: string;
  accent?: "purple" | "cyan";
  /** Right-aligned header slot (buttons, status, etc.). */
  actions?: ReactNode;
  children: ReactNode;
  /** Drop the inner padding (edge-to-edge content like a terminal or list). */
  flush?: boolean;
  /** Neon glow around the frame (active/focused window). */
  glow?: boolean;
  /** Window-control intents. When present, the traffic lights become buttons. */
  controls?: WindowFrameControls;
  /** Header drag → moves the window. When present the header bar is draggable. */
  onDrag?: WindowFrameGesture;
  /** Bottom-right grip drag → resizes the window. When present a grip appears. */
  onResize?: WindowFrameGesture;
  style?: ViewStyle;
}

interface TrafficSpec {
  color: string;
  handler?: () => void;
  /** MaterialIcons glyph shown when this dot is an active button. */
  icon: keyof typeof Icon.glyphMap;
  label: string;
}

/**
 * Build a stable PanResponder that forwards cumulative dx/dy to a gesture
 * stream. The latest callbacks are read through a ref so the responder closures
 * never go stale even though it is created once.
 */
function usePanGesture(gesture?: WindowFrameGesture) {
  const ref = useRef(gesture);
  ref.current = gesture;

  return useMemo(() => {
    if (!gesture) return null;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (
        _e: GestureResponderEvent,
        g: PanResponderGestureState,
      ) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => ref.current?.onStart?.(),
      onPanResponderMove: (_e, g) => ref.current?.onMove({ x: g.dx, y: g.dy }),
      onPanResponderRelease: () => ref.current?.onEnd?.(),
      onPanResponderTerminate: () => ref.current?.onEnd?.(),
    });
    // Created once; freshness handled via `ref`. Presence (not identity) of the
    // gesture decides whether a responder exists at all.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(gesture)]);
}

export const WindowFrame = memo(function WindowFrame({
  title,
  subtitle,
  accent = "purple",
  actions,
  children,
  flush = false,
  glow = false,
  controls,
  onDrag,
  onResize,
  style,
}: WindowFrameProps) {
  const accentColor =
    accent === "cyan" ? colors.accent.cyan : colors.accent.purple;

  const dragResponder = usePanGesture(onDrag);
  const resizeResponder = usePanGesture(onResize);

  const traffic: TrafficSpec[] = [
    {
      color: colors.status.error,
      handler: controls?.onClose,
      icon: "close",
      label: "Close window",
    },
    {
      color: colors.status.warning,
      handler: controls?.onMinimize,
      icon: "remove",
      label: "Minimize window",
    },
    {
      color: colors.status.success,
      handler: controls?.onToggleMaximize,
      icon: controls?.maximized ? "fullscreen-exit" : "crop-square",
      label: controls?.maximized ? "Restore window" : "Maximize window",
    },
  ];

  return (
    <View
      style={[
        styles.frame,
        { borderTopColor: accentColor },
        glow && (accent === "cyan" ? shadows.glowCyan : shadows.glow),
        style,
      ]}
    >
      <View style={styles.header} {...(dragResponder?.panHandlers ?? {})}>
        <View style={styles.lights}>
          {traffic.map((t) =>
            t.handler ? (
              <TouchableOpacity
                key={t.color}
                style={[styles.light, { backgroundColor: t.color }]}
                onPress={t.handler}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                activeOpacity={0.6}
              >
                <Icon name={t.icon} size={8} color="rgba(0,0,0,0.6)" />
              </TouchableOpacity>
            ) : (
              <View
                key={t.color}
                style={[styles.light, { backgroundColor: t.color }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            ),
          )}
        </View>
        <View
          style={styles.titleWrap}
          accessibilityRole="header"
          accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        >
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>{actions}</View>
      </View>

      <View style={[styles.body, !flush && styles.bodyPadded]}>{children}</View>

      {resizeResponder ? (
        <View
          style={styles.resizeGrip}
          {...resizeResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel="Resize window"
        >
          <Icon
            name="signal-cellular-4-bar"
            size={12}
            color={colors.text.muted}
            style={styles.resizeIcon}
          />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: colors.os.window.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.os.window.border,
    borderTopWidth: 2,
    overflow: "hidden",
  },
  header: {
    height: layout.os.windowHeaderHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.os.window.header,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  lights: {
    flexDirection: "row",
    gap: layout.os.trafficLightGap,
  },
  light: {
    width: layout.os.trafficLightSize,
    height: layout.os.trafficLightSize,
    borderRadius: layout.os.trafficLightSize / 2,
    opacity: 0.85,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  title: {
    ...typography.mono,
    color: colors.text.secondary,
    fontSize: 12,
  },
  subtitle: {
    ...typography.mono,
    color: colors.text.muted,
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  body: {
    flex: 1,
  },
  bodyPadded: {
    padding: spacing.md,
  },
  resizeGrip: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingRight: 3,
    paddingBottom: 3,
  },
  resizeIcon: {
    // Rotate the signal-bars glyph into a corner "grip" hint.
    transform: [{ rotate: "45deg" }],
    opacity: 0.7,
  },
});
