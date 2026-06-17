/**
 * TabletDesktop — the host of the Claude OS shell (tablet / large screens only).
 *
 * Lays out the GNOME TopBar, the floating windows of the active workspace, the
 * bottom AppDock launcher, and the Launcher overlay. It measures its own work
 * area and feeds the size to the window-manager store so geometry (clamp, tile,
 * snap, maximize) is always relative to the real desktop.
 */

import React, { useMemo, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/theme";
import {
  selectOrderedWindows,
  useWindowManagerStore,
} from "@/stores/windowManagerStore";
import { TopBar } from "./TopBar";
import { AppDock } from "./AppDock";
import { Launcher } from "./Launcher";
import { FloatingWindow } from "./FloatingWindow";

export function TabletDesktop() {
  const [launcherOpen, setLauncherOpen] = useState(false);

  const windowsRecord = useWindowManagerStore((s) => s.windows);
  const activeWorkspaceId = useWindowManagerStore((s) => s.activeWorkspaceId);
  const setDesktopSize = useWindowManagerStore((s) => s.setDesktopSize);

  const visibleIds = useMemo(
    () =>
      selectOrderedWindows({ windows: windowsRecord, activeWorkspaceId })
        .filter((w) => w.state !== "minimized")
        .map((w) => w.id),
    [windowsRecord, activeWorkspaceId],
  );

  const onWorkAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDesktopSize({ w: Math.round(width), h: Math.round(height) });
    }
  };

  return (
    <View style={styles.root}>
      <TopBar
        launcherOpen={launcherOpen}
        onToggleLauncher={() => setLauncherOpen((v) => !v)}
      />

      <View style={styles.workArea} onLayout={onWorkAreaLayout}>
        {visibleIds.length === 0 ? (
          <View style={styles.empty} pointerEvents="none">
            <Icon name="desktop-windows" size={44} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Claude OS</Text>
            <Text style={styles.emptyHint}>
              Open an app from the dock below or from Activities.
            </Text>
          </View>
        ) : null}

        {visibleIds.map((id) => (
          <FloatingWindow key={id} windowId={id} />
        ))}

        <AppDock onOpenLauncher={() => setLauncherOpen(true)} />

        {launcherOpen ? (
          <Launcher onClose={() => setLauncherOpen(false)} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  workArea: {
    flex: 1,
    position: "relative",
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
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.mono,
    fontSize: 18,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  emptyHint: {
    ...typography.mono,
    fontSize: 12,
    color: colors.text.muted,
  },
});
