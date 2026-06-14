/**
 * NewSessionScreen
 * Creates an interactive session on a machine (v1.5 contract):
 * - Optional shared project binding (multi-agent context) — selecting one
 *   auto-fills and locks the project path.
 * - Claude Code permission mode (default / acceptEdits / plan /
 *   bypassPermissions) forwarded to the agent.
 * The legacy headless/oneshot modes are dead server-side and were removed.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/dialog";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { borderRadius, colors, spacing, typography } from "@/theme";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useMachinesStore } from "@/stores/machinesStore";
import { getApiErrorCode, projectsApi } from "@/services/api";
import { Button, Input, LoadingSpinner } from "@/components/common";
import { FolderPickerModal } from "@/components/sessions/FolderPickerModal";
import type { PermissionMode, SharedProject } from "@/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionsStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<SessionsStackParamList, "NewSession">;

interface PermissionModeOption {
  value: PermissionMode;
  label: string;
  description: string;
}

const PERMISSION_MODES: PermissionModeOption[] = [
  {
    value: "default",
    label: "Default",
    description: "Ask before sensitive actions",
  },
  {
    value: "acceptEdits",
    label: "Accept edits",
    description: "Auto-approve file edits",
  },
  {
    value: "plan",
    label: "Plan",
    description: "Read-only planning mode",
  },
  {
    value: "bypassPermissions",
    label: "Bypass",
    description: "Skip every permission prompt",
  },
];

export const NewSessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { machineId } = route.params;
  const [projectPath, setProjectPath] = useState("");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [permissionMode, setPermissionMode] =
    useState<PermissionMode>("default");
  const [pickerVisible, setPickerVisible] = useState(false);

  // Shared projects available on this machine (optional binding).
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const { createSession, isLoading } = useSessionsStore();
  const { getMachineById } = useMachinesStore();

  const machine = getMachineById(machineId);
  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;
  // Selecting a shared project locks the path to the project's directory.
  const isPathLocked = selectedProject !== null;

  useEffect(() => {
    let cancelled = false;
    projectsApi
      .list(machineId)
      .then((res) => {
        if (!cancelled) setProjects(res.data ?? []);
      })
      .catch(() => {
        // Optional feature — the picker simply stays empty.
      });
    return () => {
      cancelled = true;
    };
  }, [machineId]);

  const handleSelectProject = useCallback((project: SharedProject | null) => {
    if (project) {
      setSelectedProjectId(project.id);
      setProjectPath(project.projectPath);
    } else {
      setSelectedProjectId(null);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!machine) {
      showAlert("Error", "Machine not found");
      return;
    }

    if (machine.status !== "online") {
      showAlert("Error", "Machine is offline. Please wake it first.");
      return;
    }

    try {
      const session = await createSession(machineId, {
        mode: "interactive",
        project_path: projectPath.trim() || undefined,
        initial_prompt: initialPrompt.trim() || undefined,
        shared_project_id: selectedProjectId ?? undefined,
        permission_mode: permissionMode,
      });

      // Navigate to the new session
      navigation.replace("Session", { sessionId: session.id });
    } catch (err: unknown) {
      const code = getApiErrorCode(err);
      showAlert(
        "Error",
        code === "PLAN_001"
          ? "Too many concurrent sessions (PLAN_001) — stop another running session and retry."
          : "Failed to create session. Please try again.",
      );
    }
  }, [
    machine,
    machineId,
    projectPath,
    initialPrompt,
    selectedProjectId,
    permissionMode,
    createSession,
    navigation,
  ]);

  if (!machine) {
    return <LoadingSpinner text="Loading machine..." fullScreen />;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Machine Info */}
        <View style={styles.machineInfo}>
          <Icon name="computer" size={20} color={colors.primary.purple} />
          <Text style={styles.machineName}>{machine.name}</Text>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  machine.status === "online"
                    ? colors.semantic.success
                    : colors.semantic.error,
              },
            ]}
          />
        </View>

        {/* Shared project binding (optional) */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Project (optional)</Text>
            <Text style={styles.sectionHelper}>
              Bind the session to a multi-agent project: it joins the shared
              context, tasks and file locks.
            </Text>
            <View style={styles.projectChips}>
              <TouchableOpacity
                style={[
                  styles.projectChip,
                  selectedProjectId === null && styles.projectChipSelected,
                ]}
                onPress={() => handleSelectProject(null)}
                activeOpacity={0.7}
              >
                <Icon
                  name="block"
                  size={14}
                  color={
                    selectedProjectId === null
                      ? colors.primary.purple
                      : colors.text.muted
                  }
                />
                <Text
                  style={[
                    styles.projectChipText,
                    selectedProjectId === null &&
                      styles.projectChipTextSelected,
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {projects.map((project) => {
                const isSelected = selectedProjectId === project.id;
                return (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectChip,
                      isSelected && styles.projectChipSelected,
                    ]}
                    onPress={() => handleSelectProject(project)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="folder-shared"
                      size={14}
                      color={
                        isSelected ? colors.primary.purple : colors.text.muted
                      }
                    />
                    <Text
                      style={[
                        styles.projectChipText,
                        isSelected && styles.projectChipTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Input
            label="Project Path (optional)"
            placeholder="~ (machine home directory)"
            value={projectPath}
            onChangeText={setProjectPath}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isPathLocked}
            helper={
              isPathLocked
                ? "Locked to the shared project's directory."
                : "Leave empty to use the machine's home directory, type a path, or browse."
            }
            leftIcon={
              <Icon
                name={isPathLocked ? "lock" : "folder"}
                size={20}
                color={colors.text.muted}
              />
            }
            rightIcon={
              isPathLocked ? undefined : (
                <Pressable
                  onPress={() => {
                    if (machine.status !== "online") {
                      showAlert(
                        "Machine offline",
                        "Bring the machine online to browse its folders.",
                      );
                      return;
                    }
                    setPickerVisible(true);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Browse folders"
                >
                  <Icon
                    name="folder-open"
                    size={20}
                    color={colors.accent.purple}
                  />
                </Pressable>
              )
            }
          />

          <Input
            label="Initial Prompt (optional)"
            placeholder="Enter initial instructions for Claude..."
            value={initialPrompt}
            onChangeText={setInitialPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            inputStyle={styles.promptInput}
          />
        </View>

        {/* Permission mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Mode</Text>
          <View style={styles.permissionList}>
            {PERMISSION_MODES.map((mode) => {
              const isSelected = permissionMode === mode.value;
              return (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.permissionRow,
                    isSelected && styles.permissionRowSelected,
                  ]}
                  onPress={() => setPermissionMode(mode.value)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Icon
                    name={
                      isSelected
                        ? "radio-button-checked"
                        : "radio-button-unchecked"
                    }
                    size={18}
                    color={
                      isSelected ? colors.primary.purple : colors.text.muted
                    }
                  />
                  <View style={styles.permissionTextWrap}>
                    <Text
                      style={[
                        styles.permissionLabel,
                        isSelected && styles.permissionLabelSelected,
                      ]}
                    >
                      {mode.label}
                    </Text>
                    <Text style={styles.permissionDescription}>
                      {mode.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Create Button */}
        <Button
          title="Create Session"
          onPress={handleCreate}
          loading={isLoading}
          disabled={machine.status !== "online" || isLoading}
          size="large"
          style={styles.createButton}
        />

        {machine.status !== "online" && (
          <Text style={styles.offlineWarning}>
            Machine is offline. Wake it before creating a session.
          </Text>
        )}
      </View>

      <FolderPickerModal
        visible={pickerVisible}
        machineId={machineId}
        onClose={() => setPickerVisible(false)}
        onSelect={setProjectPath}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  content: {
    padding: spacing.xl,
  },
  machineInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  machineName: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  sectionHelper: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  projectChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  projectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.dark3,
    maxWidth: "100%",
  },
  projectChipSelected: {
    borderColor: colors.primary.purple,
    backgroundColor: "rgba(168,85,247,0.15)",
  },
  projectChipText: {
    fontSize: typography.size.sm,
    fontWeight: "500",
    color: colors.text.secondary,
    flexShrink: 1,
  },
  projectChipTextSelected: {
    color: colors.primary.purple,
    fontWeight: "600",
  },
  permissionList: {
    gap: spacing.sm,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  permissionRowSelected: {
    borderColor: colors.primary.purple,
    backgroundColor: "rgba(168,85,247,0.10)",
  },
  permissionTextWrap: {
    flex: 1,
    gap: 1,
  },
  permissionLabel: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  permissionLabelSelected: {
    color: colors.primary.purple,
  },
  permissionDescription: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  promptInput: {
    minHeight: 100,
  },
  createButton: {
    marginTop: spacing.md,
  },
  offlineWarning: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
