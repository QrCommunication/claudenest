/**
 * AppDock — the bottom dock of the Claude OS shell: a launcher of pinned apps.
 * Each tile opens (or focuses) its app as a window; a small dot marks apps that
 * already have an open window. A leading "Apps" button opens the full launcher.
 */

import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, shadows, spacing, typography } from "@/theme";
import { useWindowManagerStore } from "@/stores/windowManagerStore";
import { LAUNCHER_APPS, type AppDefinition } from "./appRegistry";

interface AppDockProps {
  onOpenLauncher: () => void;
}

export function AppDock({ onOpenLauncher }: AppDockProps) {
  const insets = useSafeAreaInsets();
  const openApp = useWindowManagerStore((s) => s.openApp);
  const windowsRecord = useWindowManagerStore((s) => s.windows);

  const openAppIds = useMemo(
    () => new Set(Object.values(windowsRecord).map((w) => w.appId)),
    [windowsRecord],
  );

  const launch = (def: AppDefinition) =>
    openApp({
      appId: def.id,
      title: def.title,
      icon: def.icon,
      accent: def.accent,
      singleInstance: def.singleInstance,
      size: def.defaultSize,
    });

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <View style={[styles.dock, { marginBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={styles.appsButton}
          onPress={onOpenLauncher}
          accessibilityRole="button"
          accessibilityLabel="Open the app launcher"
        >
          <Icon name="grid-view" size={20} color={colors.accent.cyan} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {LAUNCHER_APPS.map((def) => {
            const open = openAppIds.has(def.id);
            return (
              <TouchableOpacity
                key={def.id}
                style={styles.item}
                onPress={() => launch(def)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${def.title}`}
              >
                <View style={styles.tile}>
                  <Icon
                    name={def.icon as keyof typeof Icon.glyphMap}
                    size={22}
                    color={
                      def.accent === "cyan"
                        ? colors.accent.cyan
                        : colors.accent.purple
                    }
                  />
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {def.title}
                </Text>
                <View style={[styles.runDot, !open && styles.runDotHidden]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const TILE = 46;

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "96%",
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    ...shadows.lg,
  },
  appsButton: {
    width: TILE,
    height: TILE,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    height: TILE,
    backgroundColor: colors.border.default,
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
    alignItems: "flex-start",
  },
  item: {
    width: 60,
    alignItems: "center",
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
  label: {
    ...typography.mono,
    fontSize: 10,
    color: colors.text.muted,
    maxWidth: 60,
    textAlign: "center",
  },
  runDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent.cyan,
  },
  runDotHidden: {
    opacity: 0,
  },
});
