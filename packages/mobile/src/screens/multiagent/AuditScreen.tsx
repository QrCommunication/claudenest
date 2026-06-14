/**
 * AuditScreen
 * Paginated audit trail for a shared project (web parity: AuditTrail.vue).
 * Open to any project member — read-only history of activity_log events.
 */

import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { AuditEntry } from "@/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { WindowFrame } from "@/components/os";
import { EmptyState, ErrorMessage } from "@/components/common";
import { useAuditStore } from "@/stores/auditStore";

type Props = NativeStackScreenProps<ProjectsStackParamList, "Audit">;

type IconName = React.ComponentProps<typeof Icon>["name"];

// Activity type → icon + accent. Client-side derivation keeps us independent of
// the server's icon/color strings while staying readable for known events.
function typeMeta(type: string): { icon: IconName; color: string } {
  if (type.startsWith("task_"))
    return { icon: "assignment", color: colors.accent.purple };
  if (type.startsWith("file_") || type.includes("lock"))
    return { icon: "lock", color: colors.status.warning };
  if (type.startsWith("instance_") || type.includes("worker"))
    return { icon: "smart-toy", color: colors.accent.cyan };
  if (type.startsWith("sprint_"))
    return { icon: "loop", color: colors.status.info };
  if (type.startsWith("epic_"))
    return { icon: "flag", color: colors.accent.indigo };
  if (type.includes("coordinator"))
    return { icon: "hub", color: colors.status.warning };
  if (type.includes("broadcast"))
    return { icon: "campaign", color: colors.accent.cyan };
  if (type.includes("archiv"))
    return { icon: "archive", color: colors.text.muted };
  if (type.includes("context"))
    return { icon: "description", color: colors.status.success };
  return { icon: "history", color: colors.text.muted };
}

const AuditRow = React.memo(function AuditRow({
  entry,
}: {
  entry: AuditEntry;
}) {
  const { icon, color } = typeMeta(entry.type);
  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { borderColor: `${color}55` }]}>
        <Icon name={icon} size={16} color={color} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.message} numberOfLines={2}>
          {entry.message}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.typePill, { backgroundColor: `${color}1f` }]}>
            <Text style={[styles.typeText, { color }]}>{entry.type}</Text>
          </View>
          {entry.instance_id ? (
            <Text style={styles.instance} numberOfLines={1}>
              {entry.instance_id.slice(0, 12)}
            </Text>
          ) : null}
          <View style={styles.flex} />
          <Text style={styles.time}>{entry.created_at_human ?? ""}</Text>
        </View>
      </View>
    </View>
  );
});

export const AuditScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;
  const {
    entries,
    isLoading,
    isLoadingMore,
    error,
    page,
    lastPage,
    fetch,
    loadMore,
  } = useAuditStore();

  useEffect(() => {
    void fetch(projectId);
  }, [projectId, fetch]);

  const onEndReached = useCallback(() => {
    void loadMore(projectId);
  }, [projectId, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: AuditEntry }) => <AuditRow entry={item} />,
    [],
  );

  return (
    <View style={styles.container}>
      <WindowFrame
        title="audit.log"
        subtitle={`${entries.length}${page < lastPage ? "+" : ""} events`}
        accent="cyan"
        flush
        style={styles.window}
      >
        {error ? (
          <ErrorMessage message={error} onRetry={() => void fetch(projectId)} />
        ) : null}
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void fetch(projectId)}
              tintColor={colors.accent.cyan}
            />
          }
          ListEmptyComponent={
            isLoading ? null : (
              <EmptyState
                icon="history"
                title="No activity yet"
                description="Task claims, locks, merges and orchestration events appear here."
              />
            )
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                style={styles.footer}
                color={colors.accent.purple}
              />
            ) : null
          }
        />
      </WindowFrame>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    padding: spacing.md,
  },
  window: {
    flex: 1,
  },
  list: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  flex: { flex: 1 },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    backgroundColor: colors.bg.input,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  message: {
    color: colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  typePill: {
    borderRadius: borderRadius.full,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  typeText: {
    ...typography.mono,
    fontSize: 9,
    fontWeight: "700",
  },
  instance: {
    ...typography.mono,
    fontSize: 10,
    color: colors.text.muted,
  },
  time: {
    fontSize: 10,
    color: colors.text.muted,
  },
  footer: {
    paddingVertical: spacing.md,
  },
});
