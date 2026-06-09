/**
 * SkillDetailScreen
 * View, toggle, edit, and delete a single skill
 */

import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { machinesApi, api } from "@/services/api";
import { useFadeIn } from "@/utils/animations";
import type { Skill } from "@/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<SettingsStackParamList, "SkillDetail">;

// ==================== SKELETON ====================

const SkillSkeleton = memo(function SkillSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonContainer, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonDesc} />
      <View style={[styles.skeletonDesc, { width: "50%" }]} />
      <View style={styles.skeletonBlock} />
    </Animated.View>
  );
});

// ==================== EDIT MODAL ====================

interface EditModalProps {
  visible: boolean;
  initialContent: string;
  skillName: string;
  onSave: (content: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

const EditModal = memo(function EditModal({
  visible,
  initialContent,
  skillName,
  onSave,
  onClose,
  isSaving,
}: EditModalProps) {
  const [content, setContent] = useState(initialContent);

  // Sync when modal opens with fresh content
  useEffect(() => {
    if (visible) setContent(initialContent);
  }, [visible, initialContent]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              disabled={isSaving}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {skillName}
            </Text>
            <TouchableOpacity
              onPress={() => onSave(content)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary.purple} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Editor */}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.editorContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.editor}
              value={content}
              onChangeText={setContent}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
              placeholder="Skill content…"
              placeholderTextColor={colors.text.muted}
              scrollEnabled={false}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
});

// ==================== INFO ROW ====================

interface InfoRowProps {
  label: string;
  value: string | null | undefined;
}

const InfoRow = memo(function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
});

// ==================== TAG CHIP ====================

const TagChip = memo(function TagChip({ tag }: { tag: string }) {
  return (
    <View style={styles.tagChip}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>
  );
});

// ==================== CONTENT BLOCK ====================

interface ContentBlockProps {
  content: string;
}

const ContentBlock = memo(function ContentBlock({
  content,
}: ContentBlockProps) {
  if (!content.trim()) {
    return (
      <View style={styles.contentEmpty}>
        <Text style={styles.contentEmptyText}>No content</Text>
      </View>
    );
  }

  // Simple markdown-lite rendering: render lines as-is in a monospace block
  return (
    <ScrollView
      style={styles.contentBox}
      horizontal={false}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.contentText}>{content}</Text>
    </ScrollView>
  );
});

// ==================== MAIN SCREEN ====================

export const SkillDetailScreen = memo(function SkillDetailScreen({
  route,
  navigation,
}: Props) {
  const { machineId, skillPath } = route.params;
  const fadeStyle = useFadeIn();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [skillContent, setSkillContent] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch skill details via the skills endpoint with path
      const response = await api.get<{
        skill: Skill;
        content: string;
        enabled: boolean;
      }>(`/machines/${machineId}/skills/${encodeURIComponent(skillPath)}`);
      const data = response.data!;
      setSkill(data.skill);
      setSkillContent(data.content ?? "");
      setEnabled(data.enabled ?? true);
    } catch (err) {
      // Fallback: list all skills and find by path
      try {
        const listResponse = await machinesApi.getSkills(machineId);
        const found = listResponse.data?.find((s) => s.path === skillPath);
        if (found) {
          setSkill(found);
          setSkillContent("");
          setEnabled(true);
        } else {
          throw new Error("Skill not found");
        }
      } catch (fallbackErr) {
        const message =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Failed to load skill";
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [machineId, skillPath]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = useCallback(
    async (value: boolean) => {
      setIsToggling(true);
      try {
        await api.post(
          `/machines/${machineId}/skills/${encodeURIComponent(skillPath)}/toggle`,
          { enabled: value },
        );
        setEnabled(value);
      } catch (err) {
        Alert.alert("Error", "Failed to toggle skill");
      } finally {
        setIsToggling(false);
      }
    },
    [machineId, skillPath],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Skill?",
      `Are you sure you want to delete "${skill?.name ?? skillPath}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await api.delete(
                `/machines/${machineId}/skills/${encodeURIComponent(skillPath)}`,
              );
              navigation.goBack();
            } catch (err) {
              Alert.alert("Error", "Failed to delete skill");
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [skill, skillPath, machineId, navigation]);

  const handleSave = useCallback(
    async (content: string) => {
      setIsSaving(true);
      try {
        await api.patch(
          `/machines/${machineId}/skills/${encodeURIComponent(skillPath)}`,
          { content },
        );
        setSkillContent(content);
        setEditModalVisible(false);
      } catch (err) {
        Alert.alert("Error", "Failed to save skill");
      } finally {
        setIsSaving(false);
      }
    },
    [machineId, skillPath],
  );

  // ---- Loading ----
  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkillSkeleton />
      </View>
    );
  }

  // ---- Error ----
  if (error || !skill) {
    return (
      <View style={styles.centerState}>
        <Icon name="error-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.centerTitle}>Failed to load skill</Text>
        <Text style={styles.centerSubtitle}>{error ?? "Skill not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <Icon
                name="auto-awesome"
                size={24}
                color={colors.primary.purple}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.skillName}>{skill.name}</Text>
              {skill.path && (
                <Text style={styles.skillPath} numberOfLines={2}>
                  {skill.path}
                </Text>
              )}
            </View>
          </View>

          {/* Enabled toggle */}
          <View style={styles.toggleRow}>
            {isToggling ? (
              <ActivityIndicator size="small" color={colors.primary.purple} />
            ) : (
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                trackColor={{
                  false: colors.background.dark4,
                  true: colors.primary.purple + "80",
                }}
                thumbColor={enabled ? colors.primary.purple : colors.text.muted}
                ios_backgroundColor={colors.background.dark4}
              />
            )}
            <Text
              style={[
                styles.toggleLabel,
                enabled ? styles.toggleEnabled : styles.toggleDisabled,
              ]}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </View>

        {/* ── Metadata ── */}
        <View style={styles.metaSection}>
          {skill.description && (
            <Text style={styles.description}>{skill.description}</Text>
          )}

          <View style={styles.infoList}>
            <InfoRow label="Version" value={skill.version} />
            <InfoRow label="Category" value={skill.category} />
          </View>

          {skill.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {skill.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </View>
          )}
        </View>

        {/* ── Content (markdown) ── */}
        <View style={styles.contentSection}>
          <View style={styles.contentSectionHeader}>
            <Text style={styles.sectionLabel}>Content</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="edit" size={16} color={colors.primary.purple} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ContentBlock content={skillContent} />
        </View>

        {/* ── Danger Zone ── */}
        <View style={styles.dangerSection}>
          <Text style={styles.sectionLabel}>Danger Zone</Text>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isDeleting && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.semantic.error} />
            ) : (
              <Icon
                name="delete-outline"
                size={20}
                color={colors.semantic.error}
              />
            )}
            <Text style={styles.deleteButtonText}>Delete Skill</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit modal */}
      <EditModal
        visible={editModalVisible}
        initialContent={skillContent}
        skillName={skill.name}
        onSave={handleSave}
        onClose={() => setEditModalVisible(false)}
        isSaving={isSaving}
      />
    </Animated.View>
  );
});

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    flex: 1,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  skillName: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
  },
  skillPath: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  toggleRow: {
    alignItems: "center",
    gap: spacing.xs,
  },
  toggleLabel: {
    fontSize: typography.size.xs,
    fontWeight: "600",
  },
  toggleEnabled: {
    color: colors.semantic.success,
  },
  toggleDisabled: {
    color: colors.text.muted,
  },

  // Metadata
  metaSection: {
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  infoList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  infoLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  infoValue: {
    fontSize: typography.size.sm,
    color: colors.text.primary,
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tagChip: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: typography.size.xs,
    color: colors.primary.indigo,
    fontWeight: "500",
  },

  // Content section
  contentSection: {
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  contentSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderRadius: borderRadius.sm,
  },
  editButtonText: {
    fontSize: typography.size.xs,
    fontWeight: "600",
    color: colors.primary.purple,
  },
  contentBox: {
    maxHeight: 300,
    padding: spacing.md,
  },
  contentText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  contentEmpty: {
    padding: spacing.md,
    alignItems: "center",
  },
  contentEmptyText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    fontStyle: "italic",
  },

  // Danger zone
  dangerSection: {
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.semantic.error + "30",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.semantic.error,
  },

  // Center states
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background.dark1,
  },
  centerTitle: {
    fontSize: typography.size.lg,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  centerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.purple,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
  },

  // Skeleton
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  skeletonTitle: {
    height: 20,
    width: 140,
    backgroundColor: colors.background.dark4,
    borderRadius: borderRadius.sm,
  },
  skeletonBadge: {
    height: 28,
    width: 60,
    backgroundColor: colors.background.dark4,
    borderRadius: borderRadius.md,
  },
  skeletonDesc: {
    height: 14,
    width: "80%",
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.sm,
  },
  skeletonBlock: {
    height: 120,
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
  },

  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background.dark1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  modalCancelText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  modalSaveText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.primary.purple,
  },
  editorContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  editor: {
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.text.primary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 20,
    minHeight: 300,
  },
});
