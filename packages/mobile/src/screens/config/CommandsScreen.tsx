/**
 * CommandsScreen
 * Displays available commands for a machine
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { machinesApi } from "@/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "@/navigation/types";

import { LoadingSpinner, EmptyState, Card } from "@/components/common";

type Props = NativeStackScreenProps<SettingsStackParamList, "Commands">;

export const CommandsScreen: React.FC<Props> = ({ route }) => {
  const { machineId } = route.params;
  const [commands, setCommands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    loadCommands();
  }, [machineId]);

  const loadCommands = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await machinesApi.getCommands(machineId);
      setCommands(response.data || []);
    } catch (err) {
      console.error("Failed to load commands:", err);
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  const handleCopy = useCallback(async (command: string) => {
    await Clipboard.setStringAsync(command);
    setCopiedCommand(command);
    setTimeout(
      () =>
        setCopiedCommand((current) => (current === command ? null : current)),
      1500,
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const isCopied = item === copiedCommand;
      return (
        <TouchableOpacity
          style={styles.commandCard}
          onPress={() => handleCopy(item)}
          activeOpacity={0.7}
        >
          <Icon name="terminal" size={20} color={colors.primary.purple} />
          <Text style={styles.commandText} numberOfLines={1}>
            {item}
          </Text>
          <Icon
            name={isCopied ? "check-circle" : "content-copy"}
            size={18}
            color={isCopied ? colors.semantic.success : colors.text.muted}
          />
        </TouchableOpacity>
      );
    },
    [handleCopy, copiedCommand],
  );

  const keyExtractor = useCallback(
    (item: string, index: number) => `${item}-${index}`,
    [],
  );

  if (isLoading) {
    return <LoadingSpinner text="Loading commands..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={commands}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="terminal"
            title="No commands"
            description="No custom commands configured on this machine"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  commandCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  commandText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
});
