/**
 * MachineDetailPanel — native OS panel for a machine. The machine's actions
 * (new session, Claude sessions, skills, MCP, commands) become an icon grid
 * that open their own windows; below it, live system info. Reuses the machines
 * store (and its realtime subscription) so it always reflects real state.
 */

import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { useMachinesStore } from "@/stores/machinesStore";
import {
  Card,
  CardContent,
  CardHeader,
  LoadingSpinner,
} from "@/components/common";
import { showAlert } from "@/services/dialog";
import { useWindowApi } from "../windowApi";
import { resolveRoute } from "../appRegistry";
import { OSNavGrid, type NavGridItem } from "./OSPrimitives";

export function MachineDetailPanel({ machineId }: { machineId: string }) {
  const { getMachineById, deleteMachine, subscribeToMachineUpdates } =
    useMachinesStore();
  const windowApi = useWindowApi();

  const machine = getMachineById(machineId);

  useEffect(
    () => subscribeToMachineUpdates(machineId),
    [machineId, subscribeToMachineUpdates],
  );

  const open = (route: string) => {
    const input = resolveRoute(route, { machineId });
    if (input) windowApi.openApp(input);
  };

  if (!machine) {
    return <LoadingSpinner text="Loading machine..." fullScreen />;
  }

  const platformIcon =
    machine.platform === "darwin"
      ? "laptop-mac"
      : machine.platform === "win32"
        ? "laptop-windows"
        : "computer";

  const statusColor =
    machine.status === "online"
      ? colors.status.online
      : machine.status === "connecting"
        ? colors.status.warning
        : colors.status.error;

  const items: NavGridItem[] = [
    {
      key: "new-session",
      icon: "add",
      label: "New Session",
      accent: "purple",
      onPress: () => open("NewSession"),
    },
    {
      key: "claude-sessions",
      icon: "smart-toy",
      label: "Sessions",
      accent: "purple",
      onPress: () => open("ClaudeSessions"),
    },
    {
      key: "skills",
      icon: "extension",
      label: "Skills",
      accent: "cyan",
      onPress: () => open("Skills"),
    },
    {
      key: "mcp",
      icon: "dns",
      label: "MCP",
      accent: "cyan",
      onPress: () => open("MCPServers"),
    },
    {
      key: "commands",
      icon: "code",
      label: "Commands",
      accent: "cyan",
      onPress: () => open("Commands"),
    },
  ];

  const handleDelete = () => {
    showAlert("Delete Machine?", `Remove "${machine.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMachine(machineId);
            windowApi.close();
          } catch {
            showAlert("Error", "Failed to delete machine");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Icon name={platformIcon} size={28} color={colors.accent.purple} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {machine.name}
          </Text>
          <Text style={styles.hostname} numberOfLines={1}>
            {machine.hostname}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={styles.status}>{machine.status || "unknown"}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Actions</Text>
      <OSNavGrid items={items} />

      <Card style={styles.card}>
        <CardHeader title="System Information" />
        <CardContent>
          <InfoRow label="Platform" value={machine.platform || "N/A"} />
          <InfoRow label="Architecture" value={machine.arch || "N/A"} />
          <InfoRow label="Node" value={machine.node_version || "N/A"} />
          <InfoRow label="Agent" value={machine.agent_version || "N/A"} />
          <InfoRow label="Claude" value={machine.claude_version || "N/A"} />
          <InfoRow
            label="Max Sessions"
            value={String(machine.max_sessions ?? "N/A")}
          />
        </CardContent>
      </Card>

      <TouchableOpacity
        style={styles.delete}
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete machine"
      >
        <Icon name="delete" size={18} color={colors.status.error} />
        <Text style={styles.deleteText}>Delete Machine</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.secondary },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.hover,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  name: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
  },
  hostname: {
    ...typography.mono,
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  status: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textTransform: "capitalize",
  },
  sectionLabel: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {},
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  infoLabel: { fontSize: typography.size.base, color: colors.text.secondary },
  infoValue: {
    flexShrink: 1,
    fontSize: typography.size.base,
    fontWeight: "500",
    color: colors.text.primary,
  },
  delete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.error,
    backgroundColor: colors.bg.card,
  },
  deleteText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.status.error,
  },
});
