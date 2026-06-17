/**
 * NewProjectScreen
 * Simplified single-screen project creation form
 */

import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { showAlert } from "@/services/dialog";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { useMachinesStore } from "@/stores/machinesStore";
import { useProjectsStore } from "@/stores/projectsStore";
import { projectsApi } from "@/services/api";
import { FolderPickerModal } from "@/components/sessions/FolderPickerModal";
import { useFadeIn } from "@/utils/animations";
import { t } from "@/i18n";
import type { Machine, ProjectScanResult } from "@/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<ProjectsStackParamList, "NewProject">;

// ==================== MACHINE SELECTOR ====================

interface MachineSelectorProps {
  machines: Machine[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const MachineSelector = memo(function MachineSelector({
  machines,
  selectedId,
  onSelect,
}: MachineSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = machines.find((m) => m.id === selectedId);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.dropdownTriggerContent}>
          {selected ? (
            <>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      selected.status === "online"
                        ? colors.semantic.success
                        : selected.status === "connecting"
                          ? colors.semantic.warning
                          : colors.semantic.error,
                  },
                ]}
              />
              <Text style={styles.dropdownSelected}>{selected.name}</Text>
            </>
          ) : (
            <Text style={styles.dropdownPlaceholder}>{t("project.machinePlaceholder")}</Text>
          )}
        </View>
        <Icon
          name={open ? "expand-less" : "expand-more"}
          size={20}
          color={colors.text.muted}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          {machines.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <Text style={styles.dropdownEmptyText}>
                No machines available
              </Text>
            </View>
          ) : (
            machines.map((machine) => (
              <TouchableOpacity
                key={machine.id}
                style={[
                  styles.dropdownItem,
                  machine.id === selectedId && styles.dropdownItemSelected,
                ]}
                onPress={() => handleSelect(machine.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        machine.status === "online"
                          ? colors.semantic.success
                          : machine.status === "connecting"
                            ? colors.semantic.warning
                            : colors.semantic.error,
                    },
                  ]}
                />
                <View style={styles.dropdownItemInfo}>
                  <Text style={styles.dropdownItemName}>{machine.name}</Text>
                  <Text style={styles.dropdownItemHost}>
                    {machine.hostname}
                  </Text>
                </View>
                {machine.id === selectedId && (
                  <Icon name="check" size={16} color={colors.primary.purple} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
});

// ==================== FIELD WRAPPER ====================

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

const Field = memo(function Field({
  label,
  required,
  children,
  hint,
  error,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required && <Text style={styles.fieldRequired}>*</Text>}
      </View>
      {children}
      {hint && !error && <Text style={styles.fieldHint}>{hint}</Text>}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
});

// ==================== MAIN SCREEN ====================

export const NewProjectScreen = memo(function NewProjectScreen({
  navigation,
  route,
}: Props) {
  const fadeStyle = useFadeIn();

  // `projectId` present → edit mode (full context fields); absent → create.
  const editId = route.params?.projectId;
  const isEditing = !!editId;

  const {
    machines,
    fetchMachines,
    isLoading: machinesLoading,
  } = useMachinesStore();
  const {
    createProject,
    updateProject,
    updateContext,
    fetchContext,
    getProjectById,
    isLoading: projectLoading,
  } = useProjectsStore();

  const [machineId, setMachineId] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState("");
  const [projectName, setProjectName] = useState("");
  const [summary, setSummary] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [conventions, setConventions] = useState("");
  const [currentFocus, setCurrentFocus] = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ProjectScanResult | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const summaryRef = useRef<TextInput>(null);

  // Load machines on mount (create mode only — path/machine are immutable once
  // the project exists).
  useEffect(() => {
    if (!isEditing) fetchMachines();
  }, [isEditing, fetchMachines]);

  // Edit mode: prefill name + the full context (fetchContext loads the detailed
  // architecture/conventions/currentFocus/recentChanges into the store project).
  useEffect(() => {
    if (!editId) return;
    void fetchContext(editId);
    const project = getProjectById(editId);
    if (project) {
      setProjectName(project.name);
      setNameManuallyEdited(true);
      setSummary(project.summary || "");
      setArchitecture(project.architecture || "");
      setConventions(project.conventions || "");
      setCurrentFocus(project.currentFocus || "");
      setRecentChanges(project.recentChanges || "");
    }
  }, [editId, fetchContext, getProjectById]);

  // Auto-select first online machine
  useEffect(() => {
    if (!machineId && machines.length > 0) {
      const onlineMachine = machines.find((m) => m.status === "online");
      if (onlineMachine) setMachineId(onlineMachine.id);
    }
  }, [machines, machineId]);

  // Auto-generate project name from path (unless manually edited)
  useEffect(() => {
    if (!nameManuallyEdited && projectPath.trim()) {
      const segments = projectPath
        .replace(/\\/g, "/")
        .split("/")
        .filter(Boolean);
      const lastSegment = segments[segments.length - 1] ?? "";
      if (lastSegment) {
        setProjectName(lastSegment);
      }
    }
  }, [projectPath, nameManuallyEdited]);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};

    // Machine + path are required only when creating (immutable afterwards).
    if (!isEditing) {
      if (!machineId) next.machine = t("project.machineRequired");
      if (!projectPath.trim()) next.projectPath = t("project.pathRequired");
    }
    if (!projectName.trim()) next.projectName = t("project.nameRequired");

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [isEditing, machineId, projectPath, projectName]);

  // The full context payload shared by create (follow-up PATCH) and edit.
  const contextPayload = useCallback(
    () => ({
      summary: summary.trim(),
      architecture: architecture.trim(),
      conventions: conventions.trim(),
      currentFocus: currentFocus.trim(),
      recentChanges: recentChanges.trim(),
    }),
    [summary, architecture, conventions, currentFocus, recentChanges],
  );

  // Preview the project on disk: confirms the path exists and auto-detects the
  // real name + tech stack before creating (wires the ProjectScan endpoint).
  const handleScan = useCallback(async () => {
    if (!machineId) {
      setErrors((e) => ({ ...e, machine: t("project.machineRequired") }));
      return;
    }
    if (!projectPath.trim()) {
      setErrors((e) => ({ ...e, projectPath: t("project.pathRequired") }));
      return;
    }
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await projectsApi.scan(machineId, projectPath.trim());
      const result = res.data ?? null;
      setScanResult(result);
      if (!nameManuallyEdited && result?.project_name) {
        setProjectName(result.project_name);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("project.scanFailed");
      showAlert(t("project.scanFailed"), message);
    } finally {
      setIsScanning(false);
    }
  }, [machineId, projectPath, nameManuallyEdited]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const ctx = contextPayload();
      if (isEditing && editId) {
        // Name lives on the project; the context fields go through the
        // dedicated context endpoint (camelCase — distinct from the bare
        // project PATCH which is snake_case and name-only here).
        await updateProject(editId, { name: projectName.trim() });
        await updateContext(editId, ctx);
        navigation.goBack();
        return;
      }

      const project = await createProject(machineId!, {
        name: projectName.trim(),
        projectPath: projectPath.trim(),
      });

      // Persist any context provided at creation as a follow-up PATCH (the
      // create endpoint only accepts name + path).
      const hasContext = Object.values(ctx).some((v) => v.length > 0);
      if (hasContext) {
        try {
          await updateContext(project.id, ctx);
        } catch {
          // Non-fatal: the project exists; context can be edited later.
        }
      }

      navigation.replace("ProjectDetail", { projectId: project.id });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEditing
            ? t("project.editFailed")
            : t("project.createFailed");
      showAlert(t("common.error"), message);
    } finally {
      setIsSaving(false);
    }
  }, [
    validate,
    contextPayload,
    isEditing,
    editId,
    updateProject,
    updateContext,
    createProject,
    machineId,
    projectName,
    projectPath,
    navigation,
  ]);

  const isSubmitting = projectLoading || isSaving;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <Animated.View style={[styles.flex, fadeStyle]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Icon
                name={isEditing ? "edit-note" : "folder-shared"}
                size={32}
                color={colors.primary.purple}
              />
              <Text style={styles.sectionTitle}>
                {isEditing ? t("project.editTitle") : t("project.newTitle")}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {isEditing
                  ? t("project.editSubtitle")
                  : t("project.newSubtitle")}
              </Text>
            </View>

            {/* Machine + path are creation-only (immutable once the project
                exists). In edit mode we jump straight to name + context. */}
            {!isEditing && (
              <>
                {/* Machine selector */}
                <Field
                  label={t("project.machineLabel")}
                  required
                  error={errors.machine}
                  hint={t("project.machineHint")}
                >
                  {machinesLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator
                        size="small"
                        color={colors.primary.purple}
                      />
                      <Text style={styles.loadingText}>{t("project.machineLoading")}</Text>
                    </View>
                  ) : (
                    <MachineSelector
                      machines={machines}
                      selectedId={machineId}
                      onSelect={setMachineId}
                    />
                  )}
                </Field>

                {/* Project path */}
                <Field
                  label={t("project.pathLabel")}
                  required
                  error={errors.projectPath}
                  hint={t("project.pathHint")}
                >
                  <TextInput
                    style={[
                      styles.input,
                      errors.projectPath ? styles.inputError : null,
                    ]}
                    value={projectPath}
                    onChangeText={setProjectPath}
                    placeholder="/home/user/my-project"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => nameRef.current?.focus()}
                  />
                  <View style={styles.pathActions}>
                    <TouchableOpacity
                      style={styles.browseBtn}
                      onPress={() => {
                        if (!machineId) {
                          setErrors((e) => ({
                            ...e,
                            machine: "Please select a machine",
                          }));
                          return;
                        }
                        setPickerVisible(true);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Browse folders on the machine"
                    >
                      <Icon
                        name="folder-open"
                        size={16}
                        color={colors.primary.purple}
                      />
                      <Text style={styles.browseBtnText}>{t("project.browse")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.scanBtn, isScanning && styles.scanBtnBusy]}
                      onPress={handleScan}
                      disabled={isScanning || !projectPath.trim()}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Scan path to detect the project"
                      accessibilityState={{
                        disabled: isScanning,
                        busy: isScanning,
                      }}
                    >
                      {isScanning ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.accent.cyan}
                        />
                      ) : (
                        <Icon
                          name="radar"
                          size={16}
                          color={colors.accent.cyan}
                        />
                      )}
                      <Text style={styles.scanBtnText}>
                        {isScanning ? t("project.scanning") : t("project.scan")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {scanResult ? (
                    <View
                      style={styles.scanResult}
                      accessible
                      accessibilityLabel={`Detected ${scanResult.project_name}${scanResult.has_git ? ", git repository" : ""}, tech: ${scanResult.tech_stack.join(", ") || "unknown"}`}
                    >
                      <View style={styles.scanResultHead}>
                        <Icon
                          name="check-circle"
                          size={14}
                          color={colors.semantic.success}
                        />
                        <Text style={styles.scanResultName} numberOfLines={1}>
                          {scanResult.project_name || "Project"}
                        </Text>
                        {scanResult.has_git ? (
                          <View style={styles.gitPill}>
                            <Icon
                              name="merge-type"
                              size={10}
                              color={colors.accent.purple}
                            />
                            <Text style={styles.gitPillText}>git</Text>
                          </View>
                        ) : null}
                      </View>
                      {scanResult.tech_stack.length > 0 ? (
                        <View style={styles.techRow}>
                          {scanResult.tech_stack.slice(0, 6).map((t) => (
                            <View key={t} style={styles.techChip}>
                              <Text style={styles.techChipText}>{t}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.scanResultMuted}>
                          No tech stack detected
                        </Text>
                      )}
                    </View>
                  ) : null}
                </Field>
              </>
            )}

            {/* Project name */}
            <Field
              label={t("project.nameLabel")}
              required
              error={errors.projectName}
              hint={
                isEditing
                  ? t("project.nameHintEdit")
                  : t("project.nameHintCreate")
              }
            >
              <TextInput
                ref={nameRef}
                style={[
                  styles.input,
                  errors.projectName ? styles.inputError : null,
                ]}
                value={projectName}
                onChangeText={(text) => {
                  setProjectName(text);
                  setNameManuallyEdited(true);
                }}
                placeholder="my-project"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => summaryRef.current?.focus()}
              />
            </Field>

            {/* Summary (optional) */}
            <Field
              label={t("project.summaryLabel")}
              hint={t("project.summaryHint")}
            >
              <TextInput
                ref={summaryRef}
                style={[styles.input, styles.inputMultiline]}
                value={summary}
                onChangeText={setSummary}
                placeholder={t("project.summaryPlaceholder")}
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="default"
              />
            </Field>

            {/* Architecture (optional) */}
            <Field
              label={t("project.architectureLabel")}
              hint={t("project.architectureHint")}
            >
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={architecture}
                onChangeText={setArchitecture}
                placeholder={t("project.architecturePlaceholder")}
                placeholderTextColor={colors.text.muted}
                multiline
                textAlignVertical="top"
              />
            </Field>

            {/* Conventions (optional) */}
            <Field
              label={t("project.conventionsLabel")}
              hint={t("project.conventionsHint")}
            >
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={conventions}
                onChangeText={setConventions}
                placeholder={t("project.conventionsPlaceholder")}
                placeholderTextColor={colors.text.muted}
                multiline
                textAlignVertical="top"
              />
            </Field>

            {/* Current focus (optional) */}
            <Field
              label={t("project.currentFocusLabel")}
              hint={t("project.currentFocusHint")}
            >
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={currentFocus}
                onChangeText={setCurrentFocus}
                placeholder={t("project.currentFocusPlaceholder")}
                placeholderTextColor={colors.text.muted}
                multiline
                textAlignVertical="top"
              />
            </Field>

            {/* Recent changes (optional) */}
            <Field
              label={t("project.recentChangesLabel")}
              hint={t("project.recentChangesHint")}
            >
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={recentChanges}
                onChangeText={setRecentChanges}
                placeholder={t("project.recentChangesPlaceholder")}
                placeholderTextColor={colors.text.muted}
                multiline
                textAlignVertical="top"
              />
            </Field>

            {/* Bottom spacer for keyboard */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Submit button — pinned above keyboard */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <>
                  <Icon
                    name={isEditing ? "save" : "add-circle-outline"}
                    size={20}
                    color={colors.text.primary}
                  />
                  <Text style={styles.submitText}>
                    {isEditing ? t("project.saveBtn") : t("project.createBtn")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {machineId ? (
        <FolderPickerModal
          visible={pickerVisible}
          machineId={machineId}
          onClose={() => setPickerVisible(false)}
          onSelect={(path) => {
            setProjectPath(path);
            setScanResult(null);
            setErrors((e) => ({ ...e, projectPath: "" }));
          }}
        />
      ) : null}
    </SafeAreaView>
  );
});

// ==================== STYLES ====================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Section header
  sectionHeader: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },

  // Field wrapper
  field: {
    marginBottom: spacing.md,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: 2,
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldRequired: {
    fontSize: typography.size.sm,
    color: colors.primary.purple,
    fontWeight: "700",
  },
  fieldHint: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  fieldError: {
    fontSize: typography.size.xs,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },

  // Inputs
  input: {
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.size.base,
    color: colors.text.primary,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.semantic.error + "80",
  },
  pathActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.primary.purple + "55",
    backgroundColor: colors.primary.purple + "14",
  },
  browseBtnText: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.primary.purple,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.accent.cyan + "55",
    backgroundColor: colors.accent.cyan + "14",
  },
  scanBtnBusy: {
    opacity: 0.7,
  },
  scanBtnText: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.accent.cyan,
  },
  scanResult: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.input,
    gap: spacing.xs,
  },
  scanResultHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  scanResultName: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.text.primary,
  },
  scanResultMuted: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  gitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.purple + "22",
  },
  gitPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.accent.purple,
  },
  techRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  techChip: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  techChipText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: spacing.sm + 2,
  },

  // Machine dropdown
  dropdownTrigger: {
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary.purple,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  dropdownSelected: {
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  dropdownPlaceholder: {
    fontSize: typography.size.base,
    color: colors.text.muted,
  },
  dropdownList: {
    backgroundColor: colors.background.dark3,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary.purple,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(168, 85, 247, 0.08)",
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontWeight: "500",
  },
  dropdownItemHost: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  dropdownEmpty: {
    padding: spacing.md,
    alignItems: "center",
  },
  dropdownEmptyText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },

  // Status dot
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },

  // Loading state
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },

  // Footer / submit
  bottomSpacer: {
    height: spacing.xl,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.dark1,
  },
  submitButton: {
    backgroundColor: colors.primary.purple,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
