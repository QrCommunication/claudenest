/**
 * FolderPickerModal
 * Remote filesystem browser for a machine — the mobile counterpart of the
 * web's RemoteFileTree. Starts at the user's home directory (the agent
 * resolves it), lets the user drill into folders, and returns the chosen
 * absolute path. Manual entry stays available in the parent screen.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { Modal, Button } from "@/components/common";
import { machinesApi } from "@/services/api";
import type { FileEntry } from "@/types";

interface Props {
  visible: boolean;
  machineId: string;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export const FolderPickerModal: React.FC<Props> = ({
  visible,
  machineId,
  onClose,
  onSelect,
}) => {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [homePath, setHomePath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadDirectory = useCallback(
    async (path?: string) => {
      setIsLoading(true);
      setError(false);
      try {
        const res = await machinesApi.browse(machineId, { path });
        const data = res.data;
        if (data) {
          // Directories first, then alphabetical — folders are what matters here.
          const dirs = (data.entries ?? []).filter(
            (e) => e.type === "directory",
          );
          setEntries(dirs);
          setCurrentPath(data.path);
          setHomePath(data.home_path);
        }
      } catch {
        setError(true);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    },
    [machineId],
  );

  // (Re)load the home directory each time the picker opens.
  useEffect(() => {
    if (visible) {
      setCurrentPath("");
      setEntries([]);
      loadDirectory();
    }
  }, [visible, loadDirectory]);

  const canGoUp = useMemo(
    () => Boolean(currentPath) && currentPath !== homePath,
    [currentPath, homePath],
  );

  const goUp = useCallback(() => {
    const parent = currentPath.replace(/\/[^/]+$/, "");
    if (parent && parent.length >= homePath.length) {
      loadDirectory(parent);
    }
  }, [currentPath, homePath, loadDirectory]);

  const enterFolder = useCallback(
    (entry: FileEntry) => {
      const next = `${currentPath}/${entry.name}`;
      loadDirectory(next);
    },
    [currentPath, loadDirectory],
  );

  const handleSelect = useCallback(() => {
    if (currentPath) {
      onSelect(currentPath);
      onClose();
    }
  }, [currentPath, onSelect, onClose]);

  // Human-friendly current location (collapse home to ~).
  const displayPath = useMemo(() => {
    if (!currentPath) return "…";
    if (homePath && currentPath.startsWith(homePath)) {
      return "~" + currentPath.slice(homePath.length);
    }
    return currentPath;
  }, [currentPath, homePath]);

  const renderItem = useCallback(
    ({ item }: { item: FileEntry }) => (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => enterFolder(item)}
      >
        <Icon name="folder" size={20} color={colors.accent.purple} />
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <Icon name="chevron-right" size={20} color={colors.text.muted} />
      </Pressable>
    ),
    [enterFolder],
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Select folder"
      footer={
        <Button
          title={`Use ${displayPath}`}
          onPress={handleSelect}
          disabled={!currentPath || isLoading}
          leftIcon={<Icon name="check" size={18} color={colors.text.primary} />}
        />
      }
    >
      {/* Current location */}
      <View style={styles.locationBar}>
        <Icon name="place" size={16} color={colors.accent.cyan} />
        <Text style={styles.locationText} numberOfLines={1}>
          {displayPath}
        </Text>
      </View>

      <View style={styles.listWrap}>
        {/* Up row */}
        {canGoUp && (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={goUp}
          >
            <Icon name="arrow-upward" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowName, styles.upName]}>..</Text>
          </Pressable>
        )}

        {isLoading && entries.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.accent.purple} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>Could not browse this machine.</Text>
            <Button
              title="Retry"
              variant="secondary"
              size="sm"
              onPress={() => loadDirectory(currentPath || undefined)}
            />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>No sub-folders here.</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.name}
            renderItem={renderItem}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  locationText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.mono,
    color: colors.accent.cyan,
  },
  listWrap: {
    height: 320,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowPressed: {
    backgroundColor: colors.bg.hover,
  },
  rowName: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  upName: {
    fontFamily: typography.fontFamily.mono,
    color: colors.text.secondary,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
});
