/**
 * WindowTaskbar — macOS-like taskbar for the "Claude OS" window manager.
 *
 * Lists every OPEN managed window (sessions + panels) in stable creation order,
 * with a readable picked-state for the focused window and a dimmed look for the
 * minimized ones. Tapping a tile behaves like the macOS dock:
 *  - minimized window  → restore (un-minimize + raise)
 *  - focused window    → minimize (toggle it down to the bar)
 *  - other open window → focus (raise it)
 *
 * Driven entirely by `windowManagerStore` — distinct from `ClaudeOSDock`, which
 * is session-centric. This bar is meant to be hosted by the tablet desktop
 * (see the TabletDesktop task); it renders only the bar and lets the host
 * position it (pass `style`). Auto-hides when no window is open.
 */

import React, { memo, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import {
  useWindowManagerStore,
  selectOrderedWindows,
  resolveTaskbarTap,
} from "@/stores/windowManagerStore";
import type { ManagedWindow, WindowKind } from "@/types";

/** Fallback dock icon per window kind when a window has no explicit `icon`. */
const KIND_ICON: Record<WindowKind, keyof typeof Icon.glyphMap> = {
  session: "terminal",
  panel: "dashboard",
};

interface TaskbarItemProps {
  window: ManagedWindow;
  focused: boolean;
  onPress: (window: ManagedWindow) => void;
}

const TaskbarItem = memo(function TaskbarItem({
  window,
  focused,
  onPress,
}: TaskbarItemProps) {
  const iconName =
    (window.icon as keyof typeof Icon.glyphMap) ?? KIND_ICON[window.kind];
  const state = focused ? "focused" : window.minimized ? "minimized" : "open";

  return (
    <TouchableOpacity
      style={[
        styles.item,
        focused && styles.itemFocused,
        focused && shadows.glow,
        window.minimized && styles.itemMinimized,
      ]}
      activeOpacity={0.8}
      onPress={() => onPress(window)}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={`${window.title}, ${state} window`}
      accessibilityHint={
        window.minimized
          ? "Restore window"
          : focused
            ? "Minimize window"
            : "Bring window to front"
      }
    >
      <Icon
        name={iconName}
        size={18}
        color={focused ? colors.os.item.selectedText : colors.os.item.restText}
      />
      <Text
        style={[styles.label, focused && styles.labelFocused]}
        numberOfLines={1}
      >
        {window.title}
      </Text>
      {window.minimized ? (
        <View
          style={styles.minimizedDot}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
    </TouchableOpacity>
  );
});

interface WindowTaskbarProps {
  /** Container override so the host can position the bar (e.g. absolute). */
  style?: ViewStyle;
}

export const WindowTaskbar = memo(function WindowTaskbar({
  style,
}: WindowTaskbarProps) {
  const windows = useWindowManagerStore(selectOrderedWindows);
  const focusedId = useWindowManagerStore((s) => s.focusedId);
  const restoreWindow = useWindowManagerStore((s) => s.restoreWindow);
  const minimizeWindow = useWindowManagerStore((s) => s.minimizeWindow);
  const focusWindow = useWindowManagerStore((s) => s.focusWindow);

  const handlePress = useCallback(
    (window: ManagedWindow) => {
      switch (resolveTaskbarTap(window, focusedId)) {
        case "restore":
          restoreWindow(window.id);
          break;
        case "minimize":
          minimizeWindow(window.id);
          break;
        case "focus":
          focusWindow(window.id);
          break;
      }
    },
    [focusedId, restoreWindow, minimizeWindow, focusWindow],
  );

  if (windows.length === 0) return null;

  return (
    <View
      style={[styles.bar, style]}
      accessibilityRole="tablist"
      accessibilityLabel={`Open windows, ${windows.length}`}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {windows.map((w) => (
          <TaskbarItem
            key={w.id}
            window={w}
            focused={w.id === focusedId}
            onPress={handlePress}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    minHeight: layout.os.dockHeight,
    justifyContent: "center",
    backgroundColor: colors.os.dock.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.os.dock.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    ...shadows.lg,
  },
  scroll: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: 180,
    height: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.os.item.rest,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  itemFocused: {
    backgroundColor: colors.os.item.selected,
    borderColor: colors.os.item.selectedBorder,
  },
  itemMinimized: {
    opacity: 0.5,
  },
  label: {
    ...typography.mono,
    fontSize: 12,
    color: colors.os.item.restText,
    flexShrink: 1,
  },
  labelFocused: {
    color: colors.os.item.selectedText,
  },
  minimizedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.text.muted,
  },
});
