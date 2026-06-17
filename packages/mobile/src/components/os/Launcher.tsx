/**
 * Launcher — the full-screen "Activities" app grid of the Claude OS shell.
 *
 * Shows every launchable app as an icon tile, grouped by category. Tapping a
 * tile opens (or focuses) its window and dismisses the launcher; tapping the
 * backdrop dismisses it. This is the "everything is an icon" entry point.
 */

import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { useWindowManagerStore } from "@/stores/windowManagerStore";
import {
  LAUNCHER_APPS,
  type AppCategory,
  type AppDefinition,
} from "./appRegistry";

interface LauncherProps {
  onClose: () => void;
}

const SECTIONS: { key: AppCategory; label: string }[] = [
  { key: "infra", label: "Infrastructure" },
  { key: "project", label: "Project" },
  { key: "system", label: "System" },
];

export function Launcher({ onClose }: LauncherProps) {
  const openApp = useWindowManagerStore((s) => s.openApp);

  const launch = (def: AppDefinition) => {
    openApp({
      appId: def.id,
      title: def.title,
      icon: def.icon,
      accent: def.accent,
      singleInstance: def.singleInstance,
      size: def.defaultSize,
    });
    onClose();
  };

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.panel} onPress={() => {}}>
        <View style={styles.headerRow}>
          <Icon name="apps" size={18} color={colors.accent.purple} />
          <Text style={styles.heading}>Applications</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close launcher"
            hitSlop={10}
          >
            <Icon name="close" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {SECTIONS.map((section) => {
            const apps = LAUNCHER_APPS.filter(
              (d) => d.category === section.key,
            );
            if (apps.length === 0) return null;
            return (
              <View key={section.key} style={styles.section}>
                <Text style={styles.sectionLabel}>{section.label}</Text>
                <View style={styles.grid}>
                  {apps.map((def) => (
                    <TouchableOpacity
                      key={def.id}
                      style={styles.cell}
                      onPress={() => launch(def)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${def.title}`}
                    >
                      <View
                        style={[
                          styles.tile,
                          {
                            borderColor:
                              def.accent === "cyan"
                                ? colors.accent.cyan
                                : colors.accent.purple,
                          },
                        ]}
                      >
                        <Icon
                          name={def.icon as keyof typeof Icon.glyphMap}
                          size={26}
                          color={
                            def.accent === "cyan"
                              ? colors.accent.cyan
                              : colors.accent.purple
                          }
                        />
                      </View>
                      <Text style={styles.cellLabel} numberOfLines={1}>
                        {def.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,6,14,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  panel: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "86%",
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.mono,
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  cell: {
    width: 84,
    alignItems: "center",
    gap: spacing.xs,
  },
  tile: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellLabel: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 84,
  },
});
