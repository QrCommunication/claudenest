/**
 * NotificationBanner
 * Non-blocking in-app banner for realtime `session.notification` events
 * (worker paused after nudges, permission requests…). Mounted once at the app
 * root next to DialogHost; wires the websocket feed into services/inAppNotify.
 * Tapping the banner opens the related session's terminal screen.
 */
import React, { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, shadows, spacing, typography } from "@/theme";
import {
  handleSessionNotification,
  useInAppNotifyStore,
} from "@/services/inAppNotify";
import { websocket } from "@/services/websocket";
import { navigateToSession } from "@/navigation/navigationRef";

export const NotificationBanner: React.FC = () => {
  const notification = useInAppNotifyStore((s) => s.current);
  const dismiss = useInAppNotifyStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  // Wire the realtime feed once for the whole app (host lives at the root).
  useEffect(
    () => websocket.on("session:notification", handleSessionNotification),
    [],
  );

  const handlePress = useCallback(() => {
    const sessionId = notification?.sessionId;
    dismiss();
    if (sessionId) {
      navigateToSession(sessionId);
    }
  }, [notification?.sessionId, dismiss]);

  if (!notification) return null;

  return (
    <Animated.View
      key={notification.id}
      entering={FadeInUp.duration(180)}
      exiting={FadeOutUp.duration(140)}
      style={[styles.wrapper, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={notification.title}
        onPress={handlePress}
        style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          {notification.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          onPress={dismiss}
          hitSlop={8}
          style={styles.close}
        >
          <Text style={styles.closeLabel}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.strong,
    ...shadows.md,
  },
  pressed: {
    backgroundColor: colors.bg.hover,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  message: {
    marginTop: 2,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: colors.text.secondary,
  },
  close: {
    padding: spacing.xs,
  },
  closeLabel: {
    fontSize: typography.size.base,
    color: colors.text.muted,
  },
});
