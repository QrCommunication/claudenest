/**
 * GitScreen
 * Worktree status + pull-request tracking for a shared project (web parity:
 * components/multiagent/GitPanel.vue). Every call is proxied by the server to
 * the sandboxed agent, so this is read + merge only — no local git.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { GitFileChange, MergeMethod, PullRequest } from "@/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { WindowFrame, SegmentedControl } from "@/components/os";
import type { SegmentOption } from "@/components/os";
import { EmptyState, ErrorMessage } from "@/components/common";
import { useGitStore } from "@/stores/gitStore";

type Props = NativeStackScreenProps<ProjectsStackParamList, "Git">;

const MERGE_METHODS: SegmentOption<MergeMethod>[] = [
  { value: "squash", label: "Squash", icon: "merge-type" },
  { value: "merge", label: "Merge", icon: "call-merge" },
  { value: "rebase", label: "Rebase", icon: "low-priority" },
];

// Porcelain code → color (first non-space char of the 2-letter code).
function fileColor(code: string): string {
  const c = code.trim().charAt(0);
  switch (c) {
    case "?":
    case "A":
      return colors.status.success;
    case "M":
      return colors.status.warning;
    case "D":
      return colors.status.error;
    case "R":
    case "C":
      return colors.status.info;
    default:
      return colors.text.muted;
  }
}

function Pill({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg ?? `${color}22` }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function FileRow({ file }: { file: GitFileChange }) {
  const color = fileColor(file.code);
  return (
    <View style={styles.fileRow}>
      <Text style={[styles.fileCode, { color }]}>
        {file.code.trim() || "•"}
      </Text>
      <Text style={styles.filePath} numberOfLines={1}>
        {file.path}
      </Text>
    </View>
  );
}

interface PullRow {
  pr: PullRequest;
  method: MergeMethod;
  merging: boolean;
  onMerge: (n: number) => void;
  onOpen: (url: string) => void;
}

function PullRequestRow({ pr, method, merging, onMerge, onOpen }: PullRow) {
  const mergeable = pr.mergeable === "MERGEABLE";
  const conflicting = pr.mergeable === "CONFLICTING";
  return (
    <View style={styles.prRow}>
      <TouchableOpacity
        style={styles.prHead}
        activeOpacity={0.7}
        onPress={() => onOpen(pr.url)}
        accessibilityRole="link"
        accessibilityLabel={`Pull request ${pr.number}: ${pr.title}`}
        accessibilityHint="Opens on GitHub"
      >
        <Text style={styles.prNumber}>#{pr.number}</Text>
        <Text style={styles.prTitle} numberOfLines={1}>
          {pr.title}
        </Text>
        <Icon name="open-in-new" size={14} color={colors.text.muted} />
      </TouchableOpacity>

      <View style={styles.prMeta}>
        <Icon name="commit" size={13} color={colors.text.muted} />
        <Text style={styles.prBranch} numberOfLines={1}>
          {pr.headRefName} → {pr.baseRefName}
        </Text>
      </View>

      <View style={styles.prBadges}>
        {pr.isDraft ? <Pill label="draft" color={colors.text.muted} /> : null}
        {conflicting ? (
          <Pill label="conflicts" color={colors.status.error} />
        ) : null}
        {mergeable ? (
          <Pill label="mergeable" color={colors.status.success} />
        ) : null}
        {pr.author?.login ? (
          <Pill label={`@${pr.author.login}`} color={colors.accent.cyan} />
        ) : null}
      </View>

      <TouchableOpacity
        style={[
          styles.mergeBtn,
          (pr.isDraft || conflicting || merging) && styles.mergeBtnDisabled,
        ]}
        disabled={pr.isDraft || conflicting || merging}
        onPress={() => onMerge(pr.number)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Merge pull request ${pr.number} with ${method}`}
        accessibilityState={{
          disabled: pr.isDraft || conflicting || merging,
          busy: merging,
        }}
      >
        <Icon
          name={merging ? "hourglass-empty" : "merge-type"}
          size={16}
          color={colors.text.inverse}
        />
        <Text style={styles.mergeBtnText}>
          {merging ? "Merging…" : `Merge (${method})`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export const GitScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;
  const {
    status,
    pulls,
    isLoadingStatus,
    isLoadingPulls,
    mergingNumber,
    error,
    refresh,
    mergePull,
    clearError,
  } = useGitStore();

  const [method, setMethod] = useState<MergeMethod>("squash");

  useEffect(() => {
    void refresh(projectId);
  }, [projectId, refresh]);

  const onRefresh = useCallback(() => {
    void refresh(projectId);
  }, [projectId, refresh]);

  const onMerge = useCallback(
    (n: number) => {
      void mergePull(projectId, n, method);
    },
    [projectId, method, mergePull],
  );

  const onOpen = useCallback((url: string) => {
    void WebBrowser.openBrowserAsync(url);
  }, []);

  const refreshing = isLoadingStatus || isLoadingPulls;

  const statusSummary = useMemo(() => {
    if (!status) return "—";
    const parts: string[] = [];
    if (status.branch) parts.push(status.branch);
    if (status.ahead) parts.push(`↑${status.ahead}`);
    if (status.behind) parts.push(`↓${status.behind}`);
    parts.push(status.clean ? "clean" : `${status.files.length} changes`);
    return parts.join(" · ");
  }, [status]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent.purple}
        />
      }
    >
      {error ? (
        <ErrorMessage
          message={error}
          onRetry={() => {
            clearError();
            void refresh(projectId);
          }}
        />
      ) : null}

      <WindowFrame
        title="git.status"
        subtitle={statusSummary}
        actions={
          status?.sandboxed ? (
            <Pill label="sandboxed" color={colors.accent.cyan} />
          ) : undefined
        }
        style={styles.window}
      >
        {status ? (
          <>
            <View style={styles.statRow}>
              <Icon
                name="account-tree"
                size={16}
                color={colors.accent.purple}
              />
              <Text style={styles.branch}>{status.branch ?? "detached"}</Text>
              <View style={styles.flex} />
              <Pill label={`↑ ${status.ahead}`} color={colors.status.success} />
              <Pill
                label={`↓ ${status.behind}`}
                color={colors.status.warning}
              />
            </View>

            {status.last_commit ? (
              <Text style={styles.lastCommit} numberOfLines={2}>
                {status.last_commit}
              </Text>
            ) : null}

            {status.clean ? (
              <View style={styles.cleanRow}>
                <Icon
                  name="check-circle"
                  size={15}
                  color={colors.status.success}
                />
                <Text style={styles.cleanText}>Working tree clean</Text>
              </View>
            ) : (
              <View style={styles.fileList}>
                {status.files.map((f) => (
                  <FileRow key={f.path} file={f} />
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.muted}>
            {isLoadingStatus ? "Loading status…" : "No status"}
          </Text>
        )}
      </WindowFrame>

      <WindowFrame
        title="pull-requests"
        subtitle={`${pulls.length} open`}
        accent="cyan"
        style={styles.window}
      >
        <View style={styles.methodBar}>
          <SegmentedControl
            options={MERGE_METHODS}
            value={method}
            onChange={setMethod}
            accent="cyan"
          />
        </View>

        {pulls.length === 0 ? (
          <EmptyState
            icon="merge-type"
            title="No open pull requests"
            description={
              isLoadingPulls
                ? "Loading…"
                : "Merged sprints and worker PRs appear here."
            }
          />
        ) : (
          pulls.map((pr) => (
            <PullRequestRow
              key={pr.number}
              pr={pr}
              method={method}
              merging={mergingNumber === pr.number}
              onMerge={onMerge}
              onOpen={onOpen}
            />
          ))
        )}
      </WindowFrame>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    minHeight: 120,
  },
  flex: { flex: 1 },
  muted: {
    ...typography.mono,
    color: colors.text.muted,
    fontSize: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  branch: {
    ...typography.mono,
    color: colors.text.primary,
    fontSize: 13,
  },
  lastCommit: {
    ...typography.mono,
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  cleanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  cleanText: {
    color: colors.status.success,
    fontSize: 13,
    fontWeight: "600",
  },
  fileList: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fileCode: {
    ...typography.mono,
    fontSize: 12,
    width: 22,
    textAlign: "center",
  },
  filePath: {
    ...typography.mono,
    color: colors.text.secondary,
    fontSize: 12,
    flex: 1,
  },
  methodBar: {
    marginBottom: spacing.md,
  },
  prRow: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  prHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  prNumber: {
    ...typography.mono,
    color: colors.accent.cyan,
    fontSize: 13,
    fontWeight: "700",
  },
  prTitle: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  prMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  prBranch: {
    ...typography.mono,
    color: colors.text.muted,
    fontSize: 11,
    flex: 1,
  },
  prBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  mergeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.accent.purple,
    borderRadius: borderRadius.base,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  mergeBtnDisabled: {
    opacity: 0.4,
  },
  mergeBtnText: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: "700",
  },
  pill: {
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
