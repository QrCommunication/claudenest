/**
 * SessionCard Component
 * Displays a session in a card format
 */

import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useFadeIn } from "@/utils/animations";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import type { Session, SessionStatus } from "@/types";
import { StatusDot, Badge } from "@/components/common";
import { useAttentionStore } from "@/stores/attentionStore";
import { formatDistanceToNow } from "@/utils/date";

interface SessionCardProps {
  session: Session;
  onPress: (session: Session) => void;
  machineName?: string;
}

export const SessionCard = memo(function SessionCard({
  session,
  onPress,
  machineName,
}: SessionCardProps) {
  const handlePress = useCallback(() => {
    onPress(session);
  }, [session, onPress]);

  // Realtime needs-attention flag (worker paused, permission request…).
  // Cleared when the session's terminal screen is opened.
  const needsAttention = useAttentionStore((s) =>
    Boolean(s.bySession[session.id]),
  );

  const getStatusVariant = (status: SessionStatus) => {
    switch (status) {
      case "running":
        return "success";
      case "waiting_input":
        return "warning";
      case "completed":
        return "primary";
      case "error":
      case "terminated":
        return "error";
      default:
        return "default";
    }
  };

  const getModeIcon = () => {
    switch (session.mode) {
      case "interactive":
        return "chat";
      case "headless":
        return "headset";
      case "oneshot":
        return "flash-on";
      default:
        return "terminal";
    }
  };

  const fadeStyle = useFadeIn();

  return (
    <Animated.View
      style={[styles.container, fadeStyle]}
      onTouchEnd={handlePress}
    >
      <View>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon
              name={getModeIcon()}
              size={20}
              color={colors.primary.purple}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.mode}>
              {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}{" "}
              Session
            </Text>
            {machineName && (
              <Text style={styles.machineName} numberOfLines={1}>
                {machineName}
              </Text>
            )}
          </View>
          <StatusDot
            status={session.status === "running" ? "online" : "offline"}
            size={8}
            pulse={session.status === "running"}
          />
        </View>

        {session.project_path && (
          <View style={styles.detailRow}>
            <Icon name="folder" size={14} color={colors.text.muted} />
            <Text style={styles.detailText} numberOfLines={1}>
              {session.project_path.split("/").pop()}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.badgesRow}>
            <Badge
              text={session.status}
              variant={getStatusVariant(session.status)}
              size="small"
            />
            {needsAttention && (
              <View style={styles.attentionBadge}>
                <Icon
                  name="notification-important"
                  size={12}
                  color={colors.semantic.warning}
                />
                <Text style={styles.attentionText}>Needs input</Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(session.created_at)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.base,
    backgroundColor: colors.background.dark2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  mode: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  machineName: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detailText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  attentionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: `${colors.semantic.warning}1f`,
    borderWidth: 1,
    borderColor: `${colors.semantic.warning}59`,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  attentionText: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.semantic.warning,
  },
  timestamp: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
});
