/**
 * ClaudeSessionsScreen
 * Lists the Claude Code sessions the agent discovered on a machine (the user's
 * own ~/.claude transcripts) and lets the user RESUME one remotely — the agent
 * relaunches it under tmux via `claude --resume` and a live terminal opens.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { claudeSessionsApi } from "@/services/api";
import { formatDistanceToNow } from "@/utils/date";
import {
  Card,
  Badge,
  Button,
  EmptyState,
  LoadingSpinner,
} from "@/components/common";
import type { DiscoveredSession } from "@/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MachinesStackParamList, "ClaudeSessions">;

export const ClaudeSessionsScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { machineId } = route.params;

  const [sessions, setSessions] = useState<DiscoveredSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await claudeSessionsApi.list(machineId);
      setSessions(res.data ?? []);
    } catch {
      // keep previous list; error surfaced on refresh
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    load();
  }, [load]);

  // Pull-to-refresh asks the agent to re-scan now.
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await claudeSessionsApi.refresh(machineId);
      setSessions(res.data ?? []);
    } catch {
      Alert.alert(
        "Error",
        "Could not refresh Claude sessions. Is the machine online?",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [machineId]);

  const handleResume = useCallback(
    async (item: DiscoveredSession) => {
      setAdoptingId(item.session_id);
      try {
        const res = await claudeSessionsApi.adopt(machineId, item.session_id);
        const agentSessionId = res.data?.agent_session_id;
        if (agentSessionId) {
          navigation.getParent()?.navigate("SessionsTab", {
            screen: "Session",
            params: { sessionId: agentSessionId },
          });
        }
      } catch (err) {
        const message =
          (err as { message?: string })?.message ??
          "Failed to resume this session.";
        Alert.alert("Resume failed", message);
      } finally {
        setAdoptingId(null);
      }
    },
    [machineId, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: DiscoveredSession }) => {
      const adopting = adoptingId === item.session_id;
      return (
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Icon
                name="forum"
                size={20}
                color={
                  item.is_live ? colors.semantic.success : colors.accent.purple
                }
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {item.project_name || item.project_slug || "Claude session"}
              </Text>
              <Text style={styles.path} numberOfLines={1}>
                {item.cwd}
              </Text>
            </View>
            {item.is_live ? <View style={styles.liveDot} /> : null}
          </View>

          {item.last_preview ? (
            <Text style={styles.preview} numberOfLines={2}>
              {item.last_preview}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.badges}>
              {item.is_live ? (
                <Badge text="LIVE" variant="success" />
              ) : (
                <Badge text="IDLE" variant="default" />
              )}
              {item.adopted ? <Badge text="ADOPTED" variant="primary" /> : null}
            </View>
            <Text style={styles.time}>
              {formatDistanceToNow(item.last_activity_at)}
            </Text>
          </View>

          <Button
            title={item.adopted ? "Open" : "Resume"}
            onPress={() => handleResume(item)}
            loading={adopting}
            leftIcon={
              <Icon
                name={item.adopted ? "open-in-new" : "play-arrow"}
                size={18}
                color={colors.text.primary}
              />
            }
          />
        </Card>
      );
    },
    [adoptingId, handleResume],
  );

  if (isLoading) {
    return <LoadingSpinner text="Scanning Claude sessions..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.purple}
            colors={[colors.accent.purple]}
          />
        }
        ListHeaderComponent={
          <Text style={styles.hint}>
            Your local Claude Code sessions on this machine. Pull to re-scan.
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="forum"
            title="No Claude sessions"
            description="Run `claude` on this machine, then pull to refresh."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  path: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.mono,
    color: colors.text.secondary,
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.success,
  },
  preview: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  time: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
});
