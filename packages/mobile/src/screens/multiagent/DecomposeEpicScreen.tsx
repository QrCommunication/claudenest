/**
 * DecomposeEpicScreen
 * Turn a PRD into an epic: the server spawns a sandboxed interactive session
 * that submits a master plan (arrives via the `decompose:result` broadcast),
 * then "Create epic" materializes the epic + its sprints + tasks from the plan.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { WindowFrame } from "@/components/os";
import { showAlert } from "@/services/dialog";
import { websocket } from "@/services/websocket";
import { decomposeApi } from "@/services/api";
import { useCredentialsStore } from "@/stores/credentialsStore";
import { useEpicsStore } from "@/stores/epicsStore";

type Props = NativeStackScreenProps<ProjectsStackParamList, "DecomposeEpic">;

type Phase = "input" | "decomposing" | "ready" | "creating";

const MIN_PRD = 20;

export const DecomposeEpicScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const getDefaultCredential = useCredentialsStore(
    (s) => s.getDefaultCredential,
  );
  const fetchCredentials = useCredentialsStore((s) => s.fetchCredentials);
  const fetchEpics = useEpicsStore((s) => s.fetchEpics);

  const [title, setTitle] = useState("");
  const [prd, setPrd] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const phaseRef = useRef<Phase>("input");
  phaseRef.current = phase;

  useEffect(() => {
    void fetchCredentials();
  }, [fetchCredentials]);

  // Wait for the slim `decompose:result` broadcast (the full plan is persisted
  // server-side in project.master_plan; we only need the "done" signal).
  useEffect(() => {
    websocket.subscribeToProject(projectId);
    const off = websocket.on("project:broadcast", (raw) => {
      const p = raw as { type?: string };
      if (p.type === "decompose:result" && phaseRef.current === "decomposing") {
        setPhase("ready");
      }
    });
    return off;
  }, [projectId]);

  const handleDecompose = useCallback(async () => {
    if (prd.trim().length < MIN_PRD) {
      showAlert("PRD too short", `Write at least ${MIN_PRD} characters.`);
      return;
    }
    const credential = getDefaultCredential();
    if (!credential) {
      showAlert(
        "No credential",
        "Add a default Claude credential in Settings before decomposing.",
      );
      return;
    }
    setPhase("decomposing");
    try {
      await decomposeApi.decompose(projectId, prd.trim(), credential.id);
    } catch {
      setPhase("input");
      showAlert("Error", "Failed to start decomposition (machine offline?).");
    }
  }, [prd, projectId, getDefaultCredential]);

  const handleCreateEpic = useCallback(async () => {
    if (title.trim().length === 0) {
      showAlert("Title required", "Give the epic a title.");
      return;
    }
    setPhase("creating");
    try {
      const res = await decomposeApi.createEpicFromPlan(projectId, {
        title: title.trim(),
      });
      await fetchEpics(projectId);
      const created = res.data?.created ?? 0;
      const sprints = res.data?.sprints ?? 0;
      showAlert(
        "Epic created",
        `${created} task${created !== 1 ? "s" : ""} across ${sprints} sprint${
          sprints !== 1 ? "s" : ""
        }.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch {
      setPhase("ready");
      showAlert("Error", "Failed to create epic from the plan.");
    }
  }, [title, projectId, fetchEpics, navigation]);

  const decomposing = phase === "decomposing";
  const ready = phase === "ready";
  const creating = phase === "creating";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <WindowFrame title="epic.title" style={styles.window}>
          <TextInput
            style={styles.titleInput}
            placeholder="Epic title (e.g. Billing v2)"
            placeholderTextColor={colors.text.muted}
            value={title}
            onChangeText={setTitle}
            editable={!creating}
          />
        </WindowFrame>

        <WindowFrame
          title="prd"
          subtitle={`${prd.trim().length} chars`}
          accent="cyan"
          style={styles.window}
        >
          <TextInput
            style={styles.prdInput}
            placeholder="Paste a product requirements doc — goals, features, constraints…"
            placeholderTextColor={colors.text.muted}
            value={prd}
            onChangeText={setPrd}
            multiline
            textAlignVertical="top"
            editable={phase === "input"}
          />
        </WindowFrame>

        {decomposing ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.accent.purple} />
            <Text style={styles.statusText}>
              Decomposing… a sandboxed session is drafting the master plan. This
              can take a few minutes — keep this screen open.
            </Text>
          </View>
        ) : null}

        {ready ? (
          <View style={styles.readyBox}>
            <Icon name="check-circle" size={18} color={colors.status.success} />
            <Text style={styles.readyText}>
              Master plan ready. Create the epic to materialize its sprints and
              tasks.
            </Text>
          </View>
        ) : null}

        {phase === "input" || decomposing ? (
          <TouchableOpacity
            style={[styles.primaryBtn, decomposing && styles.btnDisabled]}
            onPress={handleDecompose}
            disabled={decomposing}
            activeOpacity={0.85}
          >
            <Icon name="auto-awesome" size={18} color={colors.text.inverse} />
            <Text style={styles.primaryBtnText}>
              {decomposing ? "Decomposing…" : "Decompose PRD"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, creating && styles.btnDisabled]}
            onPress={handleCreateEpic}
            disabled={creating}
            activeOpacity={0.85}
          >
            <Icon name="playlist-add" size={18} color={colors.text.inverse} />
            <Text style={styles.primaryBtnText}>
              {creating ? "Creating…" : "Create epic from plan"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  window: {
    minHeight: 80,
  },
  titleInput: {
    color: colors.text.primary,
    fontSize: 15,
    paddingVertical: spacing.xs,
  },
  prdInput: {
    ...typography.mono,
    color: colors.text.primary,
    fontSize: 13,
    minHeight: 180,
    lineHeight: 19,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.md,
  },
  statusText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  readyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: `${colors.status.success}14`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.status.success}55`,
    padding: spacing.md,
  },
  readyText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent.purple,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: "700",
  },
});
