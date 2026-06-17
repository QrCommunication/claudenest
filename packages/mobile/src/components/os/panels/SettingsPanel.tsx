/**
 * SettingsPanel — native OS panel for Settings (replaces the menu-list screen).
 * App actions become an icon grid; machines are a quick list that opens each
 * machine's panel; sign-out sits at the bottom. Reuses the auth + machines
 * stores so it always reflects real state.
 */

import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { useAuthStore } from "@/stores/authStore";
import { useMachinesStore } from "@/stores/machinesStore";
import { showAlert } from "@/services/dialog";
import { useWindowApi } from "../windowApi";
import { resolveRoute } from "../appRegistry";
import { OSNavGrid, type NavGridItem } from "./OSPrimitives";

export function SettingsPanel() {
  const { user, logout } = useAuthStore();
  const machines = useMachinesStore((s) => s.machines);
  const windowApi = useWindowApi();

  const open = (route: string, params?: Record<string, unknown>) => {
    const input = resolveRoute(route, params);
    if (input) windowApi.openApp(input);
  };

  const items: NavGridItem[] = [
    {
      key: "credentials",
      icon: "vpn-key",
      label: "Credentials",
      accent: "cyan",
      onPress: () => open("Credentials"),
    },
    {
      key: "about",
      icon: "info",
      label: "About",
      accent: "purple",
      onPress: () => open("About"),
    },
    {
      key: "help",
      icon: "help-outline",
      label: "Help",
      accent: "cyan",
      onPress: () => {
        Linking.openURL("https://docs.claudenest.app");
      },
    },
    {
      key: "feedback",
      icon: "feedback",
      label: "Feedback",
      accent: "cyan",
      onPress: () => {
        Linking.openURL("mailto:support@claudenest.app");
      },
    },
  ];

  const handleLogout = () => {
    showAlert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Icon name="person" size={26} color={colors.accent.purple} />
        </View>
        <View style={styles.userText}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || user?.email || "Account"}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>App</Text>
      <OSNavGrid items={items} />

      {machines.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Machines</Text>
          <View style={styles.machineList}>
            {machines.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.machineRow}
                onPress={() => open("MachineDetail", { machineId: m.id })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${m.name}`}
              >
                <Icon name="computer" size={18} color={colors.text.secondary} />
                <Text style={styles.machineName} numberOfLines={1}>
                  {m.name}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        m.status === "online"
                          ? colors.status.online
                          : colors.status.idle,
                    },
                  ]}
                />
                <Icon
                  name="chevron-right"
                  size={18}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      <TouchableOpacity
        style={styles.signOut}
        onPress={handleLogout}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Icon name="logout" size={18} color={colors.status.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.secondary },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.hover,
    alignItems: "center",
    justifyContent: "center",
  },
  userText: { flex: 1 },
  userName: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.text.primary,
  },
  userEmail: {
    ...typography.mono,
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  machineList: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: "hidden",
  },
  machineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  machineName: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.error,
    backgroundColor: colors.bg.card,
    marginTop: spacing.sm,
  },
  signOutText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.status.error,
  },
});
