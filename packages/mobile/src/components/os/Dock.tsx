/**
 * ClaudeOSDock — the "taskbar" of the Claude OS shell.
 *
 * A floating dock that surfaces every LIVE session as an app icon: status dot,
 * needs-attention badge, and a tap that switches to its terminal. It is the
 * cross-screen switcher that makes the multi-session workflow feel like an OS.
 *
 * Auto-hides when: signed out, no live sessions, or the terminal itself is open
 * (the Session screen already shows that session — no need to stack a bar).
 * On phone it floats above the bottom tab bar; on tablet (left rail, no bottom
 * bar) it docks bottom-centered macOS-style.
 */

import React, { memo, useCallback, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  borderRadius,
  colors,
  layout,
  shadows,
  spacing,
  typography,
} from "@/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useCurrentRouteName } from "@/hooks/useCurrentRouteName";
import { useAuthStore } from "@/stores/authStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useAttentionStore } from "@/stores/attentionStore";
import { navigateToSession } from "@/navigation/navigationRef";
import { showAlert } from "@/services/dialog";
import {
  isLiveSession,
  sessionLabel,
  sessionStatusColor,
} from "@/utils/sessionStatus";
import type { Session } from "@/types";

interface DockItemProps {
  session: Session;
  active: boolean;
  needsAttention: boolean;
  onLongPress: () => void;
}

const DockItem = memo(function DockItem({
  session,
  active,
  needsAttention,
  onLongPress,
}: DockItemProps) {
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.8}
      onPress={() => navigateToSession(session.id)}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`Open session ${sessionLabel(session)} (long-press to terminate)`}
    >
      <View
        style={[
          styles.tile,
          active && styles.tileActive,
          active && shadows.glow,
        ]}
      >
        <Icon
          name={session.orchestrated ? "smart-toy" : "terminal"}
          size={20}
          color={active ? colors.accent.purple : colors.text.secondary}
        />
        <View
          style={[
            styles.statusDot,
            { backgroundColor: sessionStatusColor(session.status) },
          ]}
        />
        {needsAttention ? <View style={styles.attentionDot} /> : null}
      </View>
      <Text
        style={[styles.label, active && styles.labelActive]}
        numberOfLines={1}
      >
        {sessionLabel(session)}
      </Text>
    </TouchableOpacity>
  );
});

export const ClaudeOSDock = memo(function ClaudeOSDock() {
  const insets = useSafeAreaInsets();
  const { isExpanded } = useResponsiveLayout();
  const routeName = useCurrentRouteName();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessions = useSessionsStore((s) => s.sessions);
  const selectedId = useSessionsStore((s) => s.selectedSessionId);
  const terminateSession = useSessionsStore((s) => s.terminateSession);
  const attention = useAttentionStore((s) => s.bySession);

  const live = useMemo(() => sessions.filter(isLiveSession), [sessions]);

  const handleTerminate = useCallback(
    (session: Session) => {
      showAlert(
        "Terminate session",
        `Stop "${sessionLabel(session)}"? The running Claude session will be ended.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Terminate",
            style: "destructive",
            onPress: () => {
              void terminateSession(session.id).catch(() =>
                showAlert("Error", "Failed to terminate the session."),
              );
            },
          },
        ],
      );
    },
    [terminateSession],
  );
  const attentionCount = useMemo(
    () => live.filter((s) => attention[s.id]).length,
    [live, attention],
  );

  // Hide on the terminal screen (it already shows that session) and login.
  if (!isAuthenticated || live.length === 0 || routeName === "Session") {
    return null;
  }

  const bottomOffset = isExpanded
    ? insets.bottom + spacing.md
    : insets.bottom + 66 + spacing.sm;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.layer,
        { left: isExpanded ? layout.os.railWidth : 0, bottom: bottomOffset },
      ]}
    >
      <View style={styles.dock}>
        <View style={styles.handle}>
          <Icon name="dock" size={14} color={colors.accent.cyan} />
          <Text style={styles.handleText}>{live.length}</Text>
          {attentionCount > 0 ? (
            <View style={styles.handleBadge}>
              <Text style={styles.handleBadgeText}>{attentionCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.divider} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {live.map((s) => (
            <DockItem
              key={s.id}
              session={s}
              active={s.id === selectedId}
              needsAttention={Boolean(attention[s.id])}
              onLongPress={() => handleTerminate(s)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

const TILE = 46;

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    right: 0,
    alignItems: "center",
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "94%",
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    ...shadows.lg,
  },
  handle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.xs,
  },
  handleText: {
    ...typography.mono,
    fontSize: 12,
    color: colors.text.secondary,
  },
  handleBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.status.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  handleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.text.inverse,
  },
  divider: {
    width: 1,
    height: TILE,
    backgroundColor: colors.border.default,
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  item: {
    alignItems: "center",
    width: 60,
    gap: 3,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  tileActive: {
    borderColor: colors.accent.purple,
    backgroundColor: colors.bg.hover,
  },
  statusDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.bg.input,
  },
  attentionDot: {
    position: "absolute",
    top: 3,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.error,
    borderWidth: 1,
    borderColor: colors.bg.input,
  },
  label: {
    ...typography.mono,
    fontSize: 10,
    color: colors.text.muted,
    maxWidth: 60,
    textAlign: "center",
  },
  labelActive: {
    color: colors.accent.purple,
  },
});
