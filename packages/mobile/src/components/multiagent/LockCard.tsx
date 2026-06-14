/**
 * LockCard Component
 * Displays a file lock with its advanced attributes: lock type (exclusive vs
 * shared reader), optional line-range scope, time remaining and queue position.
 */

import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useFadeIn } from "@/utils/animations";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import type { FileLock } from "@/types";

interface LockCardProps {
  lock: FileLock;
  onUnlock?: (lock: FileLock) => void;
  canUnlock?: boolean;
}

function formatRemaining(seconds: number | null): string | null {
  if (seconds == null) return null;
  if (seconds <= 0) return "expired";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const LockCard = memo(function LockCard({
  lock,
  onUnlock,
  canUnlock,
}: LockCardProps) {
  const handleUnlock = useCallback(() => {
    onUnlock?.(lock);
  }, [lock, onUnlock]);

  const fileName = lock.path.split("/").pop() || lock.path;
  const directory = lock.path.split("/").slice(0, -1).join("/") || "/";

  const isShared = lock.lock_type === "shared";
  const typeColor = isShared ? colors.accent.cyan : colors.status.warning;
  const remaining = formatRemaining(lock.remaining_seconds);
  const range = lock.line_range
    ? `L${lock.line_range.start}-${lock.line_range.end}`
    : null;

  const fadeStyle = useFadeIn();

  return (
    <Animated.View style={fadeStyle}>
      <View style={styles.container}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${typeColor}15` }]}
        >
          <Icon
            name={isShared ? "visibility" : "lock"}
            size={20}
            color={typeColor}
          />
        </View>

        <View
          style={styles.content}
          accessible
          accessibilityLabel={[
            `Lock on ${fileName}`,
            isShared ? "shared reader" : "exclusive writer",
            range ?? "whole file",
            `held by ${lock.locked_by}`,
            remaining ? `${remaining} left` : null,
          ]
            .filter(Boolean)
            .join(", ")}
        >
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.directory} numberOfLines={1}>
            {directory}
          </Text>

          <View style={styles.badges}>
            <View style={[styles.pill, { backgroundColor: `${typeColor}22` }]}>
              <Text style={[styles.pillText, { color: typeColor }]}>
                {isShared ? "shared" : "exclusive"}
              </Text>
            </View>
            {range ? (
              <View style={styles.pillOutline}>
                <Icon name="code" size={10} color={colors.text.muted} />
                <Text style={styles.pillOutlineText}>{range}</Text>
              </View>
            ) : (
              <View style={styles.pillOutline}>
                <Text style={styles.pillOutlineText}>whole file</Text>
              </View>
            )}
            {lock.queue_position != null && lock.queue_position > 0 ? (
              <View style={styles.pillOutline}>
                <Icon name="schedule" size={10} color={colors.text.muted} />
                <Text style={styles.pillOutlineText}>
                  queue #{lock.queue_position}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.details}>
            <Text style={styles.lockedBy} numberOfLines={1}>
              by {lock.locked_by}
              {remaining ? `  ·  ${remaining} left` : ""}
            </Text>
            {lock.reason ? (
              <Text style={styles.reason} numberOfLines={1}>
                {lock.reason}
              </Text>
            ) : null}
          </View>
        </View>

        {canUnlock && (
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={handleUnlock}
            accessibilityRole="button"
            accessibilityLabel={`Unlock ${fileName}`}
          >
            <Icon name="lock-open" size={18} color={colors.semantic.error} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  directory: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  pill: {
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  pillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  pillOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  pillOutlineText: {
    ...typography.mono,
    fontSize: 9,
    color: colors.text.muted,
  },
  details: {
    marginTop: spacing.sm,
  },
  lockedBy: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  reason: {
    fontSize: typography.size.xs,
    color: colors.semantic.warning,
    marginTop: 2,
  },
  unlockButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
});
