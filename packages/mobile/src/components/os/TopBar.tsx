/**
 * TopBar — the GNOME-style menu bar of the Claude OS shell.
 *
 * Left: an Activities button that opens the app launcher. Middle: the list of
 * open windows in the active workspace (tap = focus/restore) and the workspace
 * pips (tap = switch, + = new desktop). Right: a connection dot and the clock.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@/theme";
import {
  selectOrderedWindows,
  useWindowManagerStore,
} from "@/stores/windowManagerStore";
import { useAuthStore } from "@/stores/authStore";

const BAR_HEIGHT = 40;

interface TopBarProps {
  launcherOpen: boolean;
  onToggleLauncher: () => void;
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

export function TopBar({ launcherOpen, onToggleLauncher }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const time = useClock();

  const windowsRecord = useWindowManagerStore((s) => s.windows);
  const activeWorkspaceId = useWindowManagerStore((s) => s.activeWorkspaceId);
  const focusedId = useWindowManagerStore((s) => s.focusedId);
  const workspaceOrder = useWindowManagerStore((s) => s.workspaceOrder);
  const workspaces = useWindowManagerStore((s) => s.workspaces);
  const restoreWindow = useWindowManagerStore((s) => s.restoreWindow);
  const switchWorkspace = useWindowManagerStore((s) => s.switchWorkspace);
  const createWorkspace = useWindowManagerStore((s) => s.createWorkspace);
  const tileAll = useWindowManagerStore((s) => s.tileAll);
  const cascadeAll = useWindowManagerStore((s) => s.cascadeAll);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const windows = useMemo(
    () => selectOrderedWindows({ windows: windowsRecord, activeWorkspaceId }),
    [windowsRecord, activeWorkspaceId],
  );

  return (
    <View
      style={[
        styles.bar,
        { height: BAR_HEIGHT + insets.top, paddingTop: insets.top },
      ]}
    >
      <TouchableOpacity
        style={styles.activities}
        onPress={onToggleLauncher}
        accessibilityRole="button"
        accessibilityState={{ expanded: launcherOpen }}
        accessibilityLabel="Activities — app launcher"
      >
        <Icon name="apps" size={18} color={colors.accent.purple} />
        <Text style={styles.activitiesText}>Activities</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.windowList}
        style={styles.windowListWrap}
      >
        {windows.map((win) => {
          const active = win.id === focusedId;
          return (
            <TouchableOpacity
              key={win.id}
              style={[styles.winPill, active && styles.winPillActive]}
              onPress={() => restoreWindow(win.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${win.title}${win.state === "minimized" ? ", minimized" : ""}`}
            >
              <Icon
                name={win.icon as keyof typeof Icon.glyphMap}
                size={13}
                color={active ? colors.accent.purple : colors.text.muted}
              />
              <Text
                style={[
                  styles.winPillText,
                  win.state === "minimized" && styles.winPillMin,
                ]}
                numberOfLines={1}
              >
                {win.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.arrange}>
        <TouchableOpacity
          onPress={tileAll}
          style={styles.arrangeBtn}
          accessibilityRole="button"
          accessibilityLabel="Tile windows"
          hitSlop={6}
        >
          <Icon name="grid-view" size={16} color={colors.text.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={cascadeAll}
          style={styles.arrangeBtn}
          accessibilityRole="button"
          accessibilityLabel="Cascade windows"
          hitSlop={6}
        >
          <Icon name="layers" size={16} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.pips}>
        {workspaceOrder.map((wsId, i) => {
          const active = wsId === activeWorkspaceId;
          return (
            <TouchableOpacity
              key={wsId}
              style={[styles.pip, active && styles.pipActive]}
              onPress={() => switchWorkspace(wsId)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${workspaces[wsId]?.name ?? `Desk ${i + 1}`}`}
            />
          );
        })}
        <TouchableOpacity
          style={styles.addPip}
          onPress={() => createWorkspace()}
          accessibilityRole="button"
          accessibilityLabel="New desktop"
        >
          <Icon name="add" size={14} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.status}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isAuthenticated
                ? colors.status.online
                : colors.status.idle,
            },
          ]}
        />
        <Text style={styles.clock}>{time}</Text>
      </View>
    </View>
  );
}

export const TOP_BAR_HEIGHT = BAR_HEIGHT;

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.strong,
  },
  activities: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  activitiesText: {
    ...typography.mono,
    fontSize: 12,
    color: colors.text.secondary,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border.default,
  },
  windowListWrap: {
    flex: 1,
  },
  windowList: {
    alignItems: "center",
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  winPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: 150,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.input,
  },
  winPillActive: {
    borderColor: colors.accent.purple,
    backgroundColor: colors.bg.hover,
  },
  winPillText: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.secondary,
    maxWidth: 110,
  },
  winPillMin: {
    color: colors.text.muted,
    fontStyle: "italic",
  },
  arrange: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrangeBtn: {
    padding: 4,
  },
  pips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.xs,
  },
  pip: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: "transparent",
  },
  pipActive: {
    backgroundColor: colors.accent.purple,
    borderColor: colors.accent.purple,
  },
  addPip: {
    paddingHorizontal: 2,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clock: {
    ...typography.mono,
    fontSize: 12,
    color: colors.text.secondary,
  },
});
