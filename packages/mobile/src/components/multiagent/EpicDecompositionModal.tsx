/**
 * EpicDecompositionModal
 * Single-action PRD wizard: turn a product requirements doc into an epic.
 *
 * Mirrors the web `EpicDecompositionModal.vue` (the async flow): a single
 * "Decompose with AI" action POSTs to `/projects/{id}/epics/decompose`, which
 * creates the epic up-front in its `running` decomposition state and spawns a
 * sandboxed session. The sprints/tasks arrive later over the realtime
 * `.epic.decomposition` signal — so the modal does NOT await the plan; it just
 * fires `onStarted` once the run is launched, then closes.
 *
 * Distinct from the older two-step `DecomposeEpicScreen` (decompose → wait →
 * create-from-plan), which it supersedes for the epics board flow.
 */

import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Modal } from "@/components/common";
import { t } from "@/i18n";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { useCredentialsStore } from "@/stores/credentialsStore";
import { useEpicsStore } from "@/stores/epicsStore";
import type { Credential } from "@/stores/credentialsStore";

// ==================== CONSTANTS ====================

const PRD_MIN_LENGTH = 20;
const PRD_MAX_LENGTH = 50000;
const TITLE_MAX_LENGTH = 255;

// ==================== PROPS ====================

interface EpicDecompositionModalProps {
  visible: boolean;
  projectId: string;
  onClose: () => void;
  /**
   * The async "Decompose with AI" run was launched: the epic exists (running);
   * its sprints/tasks arrive later on the realtime `.epic.decomposition` signal.
   */
  onStarted?: () => void;
}

// ==================== CREDENTIAL OPTION ====================

interface CredentialOptionProps {
  credential: Credential;
  selected: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
}

const CredentialOption = memo(function CredentialOption({
  credential,
  selected,
  disabled,
  onSelect,
}: CredentialOptionProps) {
  const handlePress = useCallback(
    () => onSelect(credential.id),
    [credential.id, onSelect],
  );

  return (
    <TouchableOpacity
      style={[styles.credRow, selected && styles.credRowSelected]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${credential.name} (${credential.auth_type})`}
    >
      <Icon
        name={selected ? "radio-button-checked" : "radio-button-unchecked"}
        size={18}
        color={selected ? colors.accent.purple : colors.text.muted}
      />
      <Text
        style={[styles.credName, selected && styles.credNameSelected]}
        numberOfLines={1}
      >
        {credential.name}
      </Text>
      <Text style={styles.credMeta}>{credential.auth_type}</Text>
      {credential.is_default ? (
        <Icon name="star" size={14} color={colors.status.success} />
      ) : null}
    </TouchableOpacity>
  );
});

// ==================== MAIN MODAL ====================

export const EpicDecompositionModal = memo(function EpicDecompositionModal({
  visible,
  projectId,
  onClose,
  onStarted,
}: EpicDecompositionModalProps) {
  const credentials = useCredentialsStore((s) => s.credentials);
  const fetchCredentials = useCredentialsStore((s) => s.fetchCredentials);
  const getDefaultCredential = useCredentialsStore(
    (s) => s.getDefaultCredential,
  );
  const decomposeEpic = useEpicsStore((s) => s.decomposeEpic);

  const [epicTitle, setEpicTitle] = useState("");
  const [prd, setPrd] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset + preload credentials (auto-selecting the default) whenever it opens.
  useEffect(() => {
    if (!visible) return;
    setEpicTitle("");
    setPrd("");
    setCredentialId("");
    setError(null);
    setIsSubmitting(false);

    const preload = async () => {
      if (useCredentialsStore.getState().credentials.length === 0) {
        await fetchCredentials();
      }
      const fallback = getDefaultCredential();
      if (fallback) setCredentialId(fallback.id);
    };
    void preload();
  }, [visible, fetchCredentials, getDefaultCredential]);

  const trimmedTitle = epicTitle.trim();
  const trimmedPrdLength = prd.trim().length;
  const prdOverLimit = prd.length > PRD_MAX_LENGTH;

  const canDecompose =
    trimmedTitle.length > 0 &&
    trimmedPrdLength >= PRD_MIN_LENGTH &&
    !prdOverLimit &&
    credentialId.length > 0 &&
    !isSubmitting;

  const handleDecompose = useCallback(async () => {
    if (
      trimmedTitle.length === 0 ||
      trimmedPrdLength < PRD_MIN_LENGTH ||
      prdOverLimit ||
      credentialId.length === 0 ||
      isSubmitting
    ) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await decomposeEpic(projectId, {
        title: trimmedTitle,
        prd,
        credential_id: credentialId,
      });
      onStarted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("epicDecomp.failed"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    trimmedTitle,
    trimmedPrdLength,
    prdOverLimit,
    credentialId,
    isSubmitting,
    decomposeEpic,
    projectId,
    prd,
    onStarted,
    onClose,
  ]);

  const hasCredentials = credentials.length > 0;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("epicDecomp.title")}
      footer={
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, !canDecompose && styles.btnDisabled]}
            onPress={handleDecompose}
            disabled={!canDecompose}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Icon name="auto-awesome" size={16} color={colors.text.inverse} />
            )}
            <Text style={styles.submitText}>
              {isSubmitting
                ? t("epicDecomp.submitting")
                : t("epicDecomp.submit")}
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Epic title */}
        <Text style={styles.label}>{t("epicDecomp.epicName")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("epicDecomp.epicNamePlaceholder")}
          placeholderTextColor={colors.text.muted}
          value={epicTitle}
          onChangeText={setEpicTitle}
          editable={!isSubmitting}
          maxLength={TITLE_MAX_LENGTH}
          returnKeyType="next"
        />

        {/* PRD */}
        <Text style={styles.label}>{t("epicDecomp.prd")}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={t("epicDecomp.prdPlaceholder")}
          placeholderTextColor={colors.text.muted}
          value={prd}
          onChangeText={setPrd}
          editable={!isSubmitting}
          multiline
          textAlignVertical="top"
          maxLength={PRD_MAX_LENGTH}
        />
        <Text style={[styles.charCount, prdOverLimit && styles.charCountOver]}>
          {prd.length} / {PRD_MAX_LENGTH}
        </Text>

        {/* Credential */}
        <Text style={styles.label}>{t("epicDecomp.credential")}</Text>
        {hasCredentials ? (
          <View style={styles.credList}>
            {credentials.map((cred) => (
              <CredentialOption
                key={cred.id}
                credential={cred}
                selected={cred.id === credentialId}
                disabled={isSubmitting}
                onSelect={setCredentialId}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noCredBox}>
            <Icon name="vpn-key-off" size={16} color={colors.text.secondary} />
            <Text style={styles.noCredText}>
              {t("epicDecomp.noCredential")}
            </Text>
          </View>
        )}

        <Text style={styles.hint}>{t("epicDecomp.hint")}</Text>

        {error ? (
          <View style={styles.errorRow}>
            <Icon name="error-outline" size={14} color={colors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </Modal>
  );
});

// ==================== STYLES ====================

const styles = StyleSheet.create({
  scroll: {
    // Cap height so the sheet stays usable with the keyboard up.
    maxHeight: 460,
  },
  scrollContent: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textarea: {
    ...typography.mono,
    minHeight: 150,
    fontSize: 13,
    lineHeight: 19,
    paddingTop: spacing.sm,
  },
  charCount: {
    textAlign: "right",
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  charCountOver: {
    color: colors.status.error,
  },
  credList: {
    gap: spacing.xs,
  },
  credRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  credRowSelected: {
    borderColor: colors.accent.purple,
    backgroundColor: `${colors.accent.purple}14`,
  },
  credName: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  credNameSelected: {
    color: colors.accent.purple,
    fontWeight: "600",
  },
  credMeta: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  noCredBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
  },
  noCredText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  hint: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: `${colors.status.error}18`,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: `${colors.status.error}40`,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.status.error,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
  },
  cancelText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  submitBtn: {
    flex: 2,
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.inverse,
  },
});
