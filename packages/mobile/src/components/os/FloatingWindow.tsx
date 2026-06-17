/**
 * FloatingWindow — an interactive, draggable, resizable window of the Claude OS
 * shell. The header is the drag handle and carries the three traffic-light
 * buttons (close / minimize / maximize); eight edge/corner handles resize the
 * window; tapping anywhere focuses it (z-order). Position and size are driven by
 * Reanimated shared values on the UI thread for smooth gestures, and committed
 * to the window-manager store on release (which clamps to the desktop).
 *
 * The content is an app from the registry: a native panel (def.render) or a
 * legacy screen rendered through ScreenWindowAdapter (navigation → windowApi).
 */

import React, { useCallback, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  borderRadius,
  colors,
  layout,
  shadows,
  spacing,
  typography,
} from "@/theme";
import { useWindowManagerStore } from "@/stores/windowManagerStore";
import { type SnapZone, WINDOW_MIN } from "@/utils/windowGeometry";
import { WindowIdProvider } from "./windowApi";
import { getApp } from "./appRegistry";
import { ScreenWindowAdapter } from "./ScreenWindowAdapter";
import { NATIVE_PANELS } from "./panels/registry";

const SYNC = { duration: 160 } as const;

interface HandleSpec {
  key: string;
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
  style: object;
}

const HANDLE_T = 12; // edge thickness / corner size

const HANDLES: HandleSpec[] = [
  {
    key: "l",
    left: true,
    style: { left: 0, top: HANDLE_T, bottom: HANDLE_T, width: HANDLE_T },
  },
  {
    key: "r",
    right: true,
    style: { right: 0, top: HANDLE_T, bottom: HANDLE_T, width: HANDLE_T },
  },
  {
    key: "t",
    top: true,
    style: { top: 0, left: HANDLE_T, right: HANDLE_T, height: HANDLE_T },
  },
  {
    key: "b",
    bottom: true,
    style: { bottom: 0, left: HANDLE_T, right: HANDLE_T, height: HANDLE_T },
  },
  {
    key: "tl",
    left: true,
    top: true,
    style: { left: 0, top: 0, width: HANDLE_T, height: HANDLE_T },
  },
  {
    key: "tr",
    right: true,
    top: true,
    style: { right: 0, top: 0, width: HANDLE_T, height: HANDLE_T },
  },
  {
    key: "bl",
    left: true,
    bottom: true,
    style: { left: 0, bottom: 0, width: HANDLE_T, height: HANDLE_T },
  },
  {
    key: "br",
    right: true,
    bottom: true,
    style: { right: 0, bottom: 0, width: HANDLE_T, height: HANDLE_T },
  },
];

interface FloatingWindowProps {
  windowId: string;
}

export function FloatingWindow({ windowId }: FloatingWindowProps) {
  const win = useWindowManagerStore((s) => s.windows[windowId]);
  const focused = useWindowManagerStore((s) => s.focusedId === windowId);
  const resizeWindow = useWindowManagerStore((s) => s.resizeWindow);
  const focusWindow = useWindowManagerStore((s) => s.focusWindow);
  const minimizeWindow = useWindowManagerStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowManagerStore((s) => s.toggleMaximize);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);

  const bx = win?.bounds.x ?? 0;
  const by = win?.bounds.y ?? 0;
  const bw = win?.bounds.w ?? WINDOW_MIN.w;
  const bh = win?.bounds.h ?? WINDOW_MIN.h;

  const x = useSharedValue(bx);
  const y = useSharedValue(by);
  const w = useSharedValue(bw);
  const h = useSharedValue(bh);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const sw = useSharedValue(0);
  const sh = useSharedValue(0);

  // Keep shared values in sync with store-driven bounds (snap/tile/maximize/clamp).
  useEffect(() => {
    x.value = withTiming(bx, SYNC);
    y.value = withTiming(by, SYNC);
    w.value = withTiming(bw, SYNC);
    h.value = withTiming(bh, SYNC);
  }, [bx, by, bw, bh, x, y, w, h]);

  // On drag release, snap to an edge (half-screen left/right, or maximize at the
  // top) when the window is dropped against it; otherwise just commit the move.
  const commitMove = useCallback(
    (nx: number, ny: number) => {
      const st = useWindowManagerStore.getState();
      const dropped = st.windows[windowId];
      if (!dropped) return;
      const d = st.desktop;
      const m = 26;
      let zone: SnapZone | null = null;
      if (ny <= m) zone = "maximize";
      else if (nx <= m) zone = "left";
      else if (nx + dropped.bounds.w >= d.w - m) zone = "right";
      if (zone) st.snapWindow(windowId, zone);
      else st.moveWindow(windowId, Math.round(nx), Math.round(ny));
    },
    [windowId],
  );
  const commitResize = useCallback(
    (nx: number, ny: number, nw: number, nh: number) =>
      resizeWindow(windowId, {
        x: Math.round(nx),
        y: Math.round(ny),
        w: Math.round(nw),
        h: Math.round(nh),
      }),
    [resizeWindow, windowId],
  );
  const focusSelf = useCallback(
    () => focusWindow(windowId),
    [focusWindow, windowId],
  );
  const maximizeSelf = useCallback(
    () => toggleMaximize(windowId),
    [toggleMaximize, windowId],
  );

  const drag = Gesture.Pan()
    .onStart(() => {
      sx.value = x.value;
      sy.value = y.value;
      runOnJS(focusSelf)();
    })
    .onUpdate((e) => {
      x.value = sx.value + e.translationX;
      y.value = sy.value + e.translationY;
    })
    .onEnd(() => runOnJS(commitMove)(x.value, y.value));

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => runOnJS(maximizeSelf)());

  const headerGesture = Gesture.Race(doubleTap, drag);

  const containerStyle = useAnimatedStyle(() => ({
    width: w.value,
    height: h.value,
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  if (!win) return null;

  const accentColor =
    win.accent === "cyan" ? colors.accent.cyan : colors.accent.purple;

  return (
    <Animated.View
      style={[
        styles.window,
        { zIndex: win.zIndex, borderTopColor: accentColor },
        focused && (win.accent === "cyan" ? shadows.glowCyan : shadows.glow),
        containerStyle,
      ]}
      onTouchStart={() => {
        if (!focused) focusWindow(windowId);
      }}
    >
      <GestureDetector gesture={headerGesture}>
        <View style={styles.header}>
          <View style={styles.lights}>
            <TouchableOpacity
              style={[styles.light, { backgroundColor: colors.status.error }]}
              onPress={() => closeWindow(windowId)}
              accessibilityRole="button"
              accessibilityLabel={`Close ${win.title}`}
              hitSlop={8}
            />
            <TouchableOpacity
              style={[styles.light, { backgroundColor: colors.status.warning }]}
              onPress={() => minimizeWindow(windowId)}
              accessibilityRole="button"
              accessibilityLabel={`Minimize ${win.title}`}
              hitSlop={8}
            />
            <TouchableOpacity
              style={[styles.light, { backgroundColor: colors.status.success }]}
              onPress={maximizeSelf}
              accessibilityRole="button"
              accessibilityLabel={`Maximize ${win.title}`}
              hitSlop={8}
            />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {win.title}
          </Text>
          <View style={styles.lights} />
        </View>
      </GestureDetector>

      <WindowIdProvider value={win.id}>
        <View style={styles.body}>
          <AppHost appId={win.appId} params={win.params ?? {}} />
        </View>
      </WindowIdProvider>

      {HANDLES.map((spec) => (
        <ResizeHandle
          key={spec.key}
          spec={spec}
          x={x}
          y={y}
          w={w}
          h={h}
          sx={sx}
          sy={sy}
          sw={sw}
          sh={sh}
          onCommit={commitResize}
          onStart={focusSelf}
        />
      ))}
    </Animated.View>
  );
}

interface ResizeHandleProps {
  spec: HandleSpec;
  x: SharedValue<number>;
  y: SharedValue<number>;
  w: SharedValue<number>;
  h: SharedValue<number>;
  sx: SharedValue<number>;
  sy: SharedValue<number>;
  sw: SharedValue<number>;
  sh: SharedValue<number>;
  onCommit: (x: number, y: number, w: number, h: number) => void;
  onStart: () => void;
}

function ResizeHandle({
  spec,
  x,
  y,
  w,
  h,
  sx,
  sy,
  sw,
  sh,
  onCommit,
  onStart,
}: ResizeHandleProps) {
  const gesture = Gesture.Pan()
    .onStart(() => {
      sx.value = x.value;
      sy.value = y.value;
      sw.value = w.value;
      sh.value = h.value;
      runOnJS(onStart)();
    })
    .onUpdate((e) => {
      let nx = sx.value;
      let ny = sy.value;
      let nw = sw.value;
      let nh = sh.value;
      if (spec.left) {
        nx = sx.value + e.translationX;
        nw = sw.value - e.translationX;
      }
      if (spec.right) nw = sw.value + e.translationX;
      if (spec.top) {
        ny = sy.value + e.translationY;
        nh = sh.value - e.translationY;
      }
      if (spec.bottom) nh = sh.value + e.translationY;
      if (nw < WINDOW_MIN.w) {
        if (spec.left) nx = sx.value + (sw.value - WINDOW_MIN.w);
        nw = WINDOW_MIN.w;
      }
      if (nh < WINDOW_MIN.h) {
        if (spec.top) ny = sy.value + (sh.value - WINDOW_MIN.h);
        nh = WINDOW_MIN.h;
      }
      x.value = nx;
      y.value = ny;
      w.value = nw;
      h.value = nh;
    })
    .onEnd(() => runOnJS(onCommit)(x.value, y.value, w.value, h.value));

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.handle, spec.style]} />
    </GestureDetector>
  );
}

function AppHost({
  appId,
  params,
}: {
  appId: string;
  params: Record<string, unknown>;
}) {
  const native = NATIVE_PANELS[appId];
  if (native) return <>{native(params)}</>;

  const def = getApp(appId);
  if (!def) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Unknown app: {appId}</Text>
      </View>
    );
  }
  if (def.render) return <>{def.render(params)}</>;
  if (def.screen) {
    return (
      <ScreenWindowAdapter
        screen={def.screen}
        routeName={def.route}
        params={params}
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  window: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderTopWidth: 2,
    overflow: "hidden",
  },
  header: {
    height: layout.os.windowHeaderHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  lights: {
    flexDirection: "row",
    gap: layout.os.trafficLightGap,
    minWidth: 54,
  },
  light: {
    width: layout.os.trafficLightSize + 2,
    height: layout.os.trafficLightSize + 2,
    borderRadius: (layout.os.trafficLightSize + 2) / 2,
  },
  title: {
    ...typography.mono,
    flex: 1,
    textAlign: "center",
    color: colors.text.secondary,
    fontSize: 12,
  },
  body: {
    flex: 1,
  },
  handle: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  fallbackText: {
    ...typography.mono,
    color: colors.text.muted,
    fontSize: 12,
  },
});
