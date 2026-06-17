/**
 * TabletDesktop — floating-window host for the "Claude OS" shell on tablets.
 *
 * Composes the three window-manager pieces into a real desktop:
 *  - reads the managed windows from `windowManagerStore`,
 *  - renders each non-minimized window as an absolutely-positioned, interactive
 *    `WindowFrame` (close/minimize/maximize + header drag + corner resize),
 *  - stacks them by most-recently-focused order, and
 *  - docks a `WindowTaskbar` at the bottom for restore/switch.
 *
 * Gated on the breakpoint: it only mounts on tablet/desktop (`isExpanded`). On
 * phones the shell stays single-pane (full-screen navigation + session Dock),
 * so this host renders nothing.
 *
 * Window *content* is supplied by the host's parent via the `renderWindow`
 * render-prop, keeping TabletDesktop decoupled from how sessions/panels map to
 * screens (that wiring is a separate task). All geometry math is delegated to
 * the pure, unit-tested `utils/windowGeometry` helpers.
 */

import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, spacing } from "@/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  useWindowManagerStore,
  selectOrderedWindows,
} from "@/stores/windowManagerStore";
import {
  dragTo,
  resizeFromGrip,
  windowLayoutRect,
} from "@/utils/windowGeometry";
import type { ManagedWindow } from "@/types";
import { WindowFrame } from "./WindowFrame";
import { WindowTaskbar } from "./WindowTaskbar";

interface Size {
  width: number;
  height: number;
}

interface DesktopWindowProps {
  window: ManagedWindow;
  container: Size;
  /** Pixels reserved at the bottom for the taskbar (maximize stops above it). */
  bottomGutter: number;
  focused: boolean;
  children: ReactNode;
}

const DesktopWindow = memo(function DesktopWindow({
  window,
  container,
  bottomGutter,
  focused,
  children,
}: DesktopWindowProps) {
  const moveWindow = useWindowManagerStore((s) => s.moveWindow);
  const resizeWindow = useWindowManagerStore((s) => s.resizeWindow);
  const focusWindow = useWindowManagerStore((s) => s.focusWindow);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const minimizeWindow = useWindowManagerStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowManagerStore((s) => s.toggleMaximize);

  // Bounds snapshot taken when a drag/resize begins, so each move applies the
  // cumulative translation against a fixed origin (no drift / feedback loop).
  const dragOrigin = useRef(window.bounds);
  const resizeOrigin = useRef(window.bounds);

  const onDrag = useMemo(
    () => ({
      onStart: () => {
        dragOrigin.current =
          useWindowManagerStore.getState().windows[window.id]?.bounds ??
          window.bounds;
        focusWindow(window.id);
      },
      onMove: (t: { x: number; y: number }) =>
        moveWindow(window.id, dragTo(dragOrigin.current, t, container)),
    }),
    [window.id, window.bounds, container, focusWindow, moveWindow],
  );

  const onResize = useMemo(
    () => ({
      onStart: () => {
        resizeOrigin.current =
          useWindowManagerStore.getState().windows[window.id]?.bounds ??
          window.bounds;
        focusWindow(window.id);
      },
      onMove: (t: { x: number; y: number }) =>
        resizeWindow(window.id, resizeFromGrip(resizeOrigin.current, t)),
    }),
    [window.id, window.bounds, focusWindow, resizeWindow],
  );

  const rect = windowLayoutRect(window, container, bottomGutter);

  return (
    <View
      style={[
        styles.window,
        {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          // Higher focusSeq = more recently focused = drawn on top.
          zIndex: window.focusSeq + 1,
        },
      ]}
    >
      <WindowFrame
        title={window.title}
        subtitle={window.kind}
        glow={focused}
        flush
        controls={{
          onClose: () => closeWindow(window.id),
          onMinimize: () => minimizeWindow(window.id),
          onToggleMaximize: () => toggleMaximize(window.id),
          maximized: window.maximized,
        }}
        onDrag={onDrag}
        // A maximized window has no floating size to grip — resize is floating-only.
        onResize={window.maximized ? undefined : onResize}
        style={styles.frame}
      >
        {children}
      </WindowFrame>
    </View>
  );
});

interface TabletDesktopProps {
  /** Render the content hosted inside a given managed window. */
  renderWindow: (window: ManagedWindow) => ReactNode;
  /** Optional empty-state shown when no window is open. */
  empty?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const TabletDesktop = memo(function TabletDesktop({
  renderWindow,
  empty,
  style,
}: TabletDesktopProps) {
  const { isExpanded } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const windows = useWindowManagerStore(selectOrderedWindows);
  const focusedId = useWindowManagerStore((s) => s.focusedId);
  const [container, setContainer] = useState<Size | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainer((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  }, []);

  // Tablet/desktop only — the phone shell stays single-pane.
  if (!isExpanded) return null;

  // Room the maximized windows leave for the docked taskbar at the bottom.
  const taskbarReserve =
    insets.bottom + spacing.md + layout.os.dockHeight + spacing.sm;
  const visible = windows.filter((w) => !w.minimized);

  return (
    <View style={[styles.surface, style]} onLayout={onLayout}>
      {windows.length === 0 ? <View style={styles.empty}>{empty}</View> : null}

      {container
        ? visible.map((w) => (
            <DesktopWindow
              key={w.id}
              window={w}
              container={container}
              bottomGutter={taskbarReserve}
              focused={w.id === focusedId}
            >
              {renderWindow(w)}
            </DesktopWindow>
          ))
        : null}

      <View
        style={[styles.taskbarSlot, { bottom: insets.bottom + spacing.md }]}
        pointerEvents="box-none"
      >
        <WindowTaskbar style={styles.taskbar} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    overflow: "hidden",
  },
  empty: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  window: {
    position: "absolute",
  },
  frame: {
    flex: 1,
  },
  taskbarSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  taskbar: {
    maxWidth: "94%",
  },
});
