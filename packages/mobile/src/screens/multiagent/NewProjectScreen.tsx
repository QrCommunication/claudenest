/**
 * NewProjectScreen
 * Simplified single-screen project creation form
 */

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { showAlert } from "@/services/dialog";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useMachinesStore } from '@/stores/machinesStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useFadeIn } from '@/utils/animations';
import type { Machine } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'NewProject'>;

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
    [onSelect]
  );

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          open && styles.dropdownTriggerOpen,
        ]}
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
                      selected.status === 'online'
                        ? colors.semantic.success
                        : selected.status === 'connecting'
                        ? colors.semantic.warning
                        : colors.semantic.error,
                  },
                ]}
              />
              <Text style={styles.dropdownSelected}>{selected.name}</Text>
            </>
          ) : (
            <Text style={styles.dropdownPlaceholder}>Select a machine…</Text>
          )}
        </View>
        <Icon
          name={open ? 'expand-less' : 'expand-more'}
          size={20}
          color={colors.text.muted}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          {machines.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <Text style={styles.dropdownEmptyText}>No machines available</Text>
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
                        machine.status === 'online'
                          ? colors.semantic.success
                          : machine.status === 'connecting'
                          ? colors.semantic.warning
                          : colors.semantic.error,
                    },
                  ]}
                />
                <View style={styles.dropdownItemInfo}>
                  <Text style={styles.dropdownItemName}>{machine.name}</Text>
                  <Text style={styles.dropdownItemHost}>{machine.hostname}</Text>
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

const Field = memo(function Field({ label, required, children, hint, error }: FieldProps) {
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
}: Props) {
  const fadeStyle = useFadeIn();

  const { machines, fetchMachines, isLoading: machinesLoading } = useMachinesStore();
  const { createProject, isLoading: projectLoading } = useProjectsStore();

  const [machineId, setMachineId] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState('');
  const [projectName, setProjectName] = useState('');
  const [summary, setSummary] = useState('');
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nameRef = useRef<TextInput>(null);
  const summaryRef = useRef<TextInput>(null);

  // Load machines on mount
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Auto-select first online machine
  useEffect(() => {
    if (!machineId && machines.length > 0) {
      const onlineMachine = machines.find((m) => m.status === 'online');
      if (onlineMachine) setMachineId(onlineMachine.id);
    }
  }, [machines, machineId]);

  // Auto-generate project name from path (unless manually edited)
  useEffect(() => {
    if (!nameManuallyEdited && projectPath.trim()) {
      const segments = projectPath.replace(/\\/g, '/').split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1] ?? '';
      if (lastSegment) {
        setProjectName(lastSegment);
      }
    }
  }, [projectPath, nameManuallyEdited]);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};

    if (!machineId) next.machine = 'Please select a machine';
    if (!projectPath.trim()) next.projectPath = 'Project path is required';
    if (!projectName.trim()) next.projectName = 'Project name is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [machineId, projectPath, projectName]);

  const handleCreate = useCallback(async () => {
    if (!validate()) return;

    try {
      const project = await createProject(machineId!, {
        name: projectName.trim(),
        projectPath: projectPath.trim(),
      });

      // If summary was provided, update context (best-effort)
      // The API create endpoint does not accept summary directly
      // It would require a follow-up PATCH — skipped for MVP

      navigation.replace('ProjectDetail', { projectId: project.id });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create project';
      showAlert('Error', message);
    }
  }, [validate, createProject, machineId, projectName, projectPath, navigation]);

  const isSubmitting = projectLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
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
              <Icon name="folder-shared" size={32} color={colors.primary.purple} />
              <Text style={styles.sectionTitle}>New Multi-Agent Project</Text>
              <Text style={styles.sectionSubtitle}>
                Create a shared project to coordinate multiple Claude instances
              </Text>
            </View>

            {/* Machine selector */}
            <Field
              label="Machine"
              required
              error={errors.machine}
              hint="Only online machines can host a new project"
            >
              {machinesLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary.purple} />
                  <Text style={styles.loadingText}>Loading machines…</Text>
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
              label="Project Path"
              required
              error={errors.projectPath}
              hint="Absolute path on the host machine, e.g. /home/user/my-project"
            >
              <TextInput
                style={[styles.input, errors.projectPath ? styles.inputError : null]}
                value={projectPath}
                onChangeText={setProjectPath}
                placeholder="/home/user/my-project"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => nameRef.current?.focus()}
              />
            </Field>

            {/* Project name */}
            <Field
              label="Project Name"
              required
              error={errors.projectName}
              hint="Auto-generated from path — you can customize it"
            >
              <TextInput
                ref={nameRef}
                style={[styles.input, errors.projectName ? styles.inputError : null]}
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
              label="Summary"
              hint="Optional — brief description of the project"
            >
              <TextInput
                ref={summaryRef}
                style={[styles.input, styles.inputMultiline]}
                value={summary}
                onChangeText={setSummary}
                placeholder="What does this project do?"
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="default"
              />
            </Field>

            {/* Bottom spacer for keyboard */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Submit button — pinned above keyboard */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <>
                  <Icon name="add-circle-outline" size={20} color={colors.text.primary} />
                  <Text style={styles.submitText}>Create Project</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },

  // Field wrapper
  field: {
    marginBottom: spacing.md,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 2,
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldRequired: {
    fontSize: typography.size.sm,
    color: colors.primary.purple,
    fontWeight: '700',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.size.base,
    color: colors.text.primary,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.semantic.error + '80',
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: spacing.sm + 2,
  },

  // Machine dropdown
  dropdownTrigger: {
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary.purple,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontWeight: '500',
  },
  dropdownItemHost: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  dropdownEmpty: {
    padding: spacing.md,
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
