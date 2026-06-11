/**
 * MCPToolsScreen
 * Lists tools available for a given MCP server, with inline execution
 */

import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Platform,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { Modal } from "@/components/common";
import { machinesApi, api } from "@/services/api";
import { useFadeIn } from "@/utils/animations";
import type { MCPTool, MCPServer } from "@/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<SettingsStackParamList, "MCPTools">;

// ==================== PARAMETER INPUT ====================

interface ParamInputProps {
  paramKey: string;
  schema: unknown;
  value: string;
  onChange: (key: string, value: string) => void;
}

const ParamInput = memo(function ParamInput({
  paramKey,
  schema,
  value,
  onChange,
}: ParamInputProps) {
  const s = schema as Record<string, unknown> | null;
  const description =
    typeof s?.description === "string" ? s.description : undefined;
  const type = typeof s?.type === "string" ? s.type : "string";
  const isOptional =
    !s?.required &&
    !(
      Array.isArray((s as Record<string, unknown> | null)?.required) &&
      (s as Record<string, unknown>).required
    );

  return (
    <View style={styles.paramField}>
      <View style={styles.paramLabelRow}>
        <Text style={styles.paramKey}>{paramKey}</Text>
        <Text style={styles.paramType}>{type}</Text>
        {isOptional && <Text style={styles.paramOptional}>optional</Text>}
      </View>
      {description && (
        <Text style={styles.paramDescription}>{description}</Text>
      )}
      <TextInput
        style={styles.paramInput}
        value={value}
        onChangeText={(v) => onChange(paramKey, v)}
        placeholder={`Enter ${paramKey}…`}
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={type === "object" || type === "array"}
        numberOfLines={type === "object" || type === "array" ? 3 : 1}
        textAlignVertical={
          type === "object" || type === "array" ? "top" : "center"
        }
      />
    </View>
  );
});

// ==================== EXECUTE MODAL ====================

interface ExecuteModalProps {
  tool: MCPTool | null;
  machineId: string;
  serverName: string;
  onClose: () => void;
}

const ExecuteModal = memo(function ExecuteModal({
  tool,
  machineId,
  serverName,
  onClose,
}: ExecuteModalProps) {
  const [params, setParams] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Reset state when tool changes
  useEffect(() => {
    setParams({});
    setResult(null);
  }, [tool?.name]);

  const handleParamChange = useCallback((key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleExecute = useCallback(async () => {
    if (!tool) return;

    setIsExecuting(true);
    setResult(null);

    try {
      // Parse param values: try JSON for object/array types, fallback to string
      const schema = tool.parameters as Record<string, Record<string, unknown>>;
      const properties = (schema?.properties ?? {}) as Record<
        string,
        Record<string, unknown>
      >;

      const parsedParams: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(params)) {
        const propSchema = properties[key];
        const propType = propSchema?.type as string | undefined;
        if ((propType === "object" || propType === "array") && raw.trim()) {
          try {
            parsedParams[key] = JSON.parse(raw);
          } catch {
            parsedParams[key] = raw;
          }
        } else if (raw.trim()) {
          parsedParams[key] = raw;
        }
      }

      const response = await api.post<{ result: unknown }>(
        `/machines/${machineId}/mcp/${encodeURIComponent(serverName)}/execute`,
        { tool: tool.name, parameters: parsedParams },
      );

      const raw = response.data?.result;
      setResult(typeof raw === "string" ? raw : JSON.stringify(raw, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      setResult(`Error: ${message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [tool, params, machineId, serverName]);

  if (!tool) return null;

  const schema = tool.parameters as Record<string, unknown>;
  const properties = ((schema?.properties as Record<string, unknown>) ??
    {}) as Record<string, unknown>;
  const paramKeys = Object.keys(properties);

  return (
    <Modal
      visible={!!tool}
      onClose={onClose}
      title={tool.name}
      footer={
        <TouchableOpacity
          style={[
            styles.executeButton,
            isExecuting && styles.executeButtonDisabled,
          ]}
          onPress={handleExecute}
          disabled={isExecuting}
          activeOpacity={0.8}
        >
          {isExecuting ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <>
              <Icon name="play-arrow" size={20} color={colors.text.primary} />
              <Text style={styles.executeButtonText}>Execute</Text>
            </>
          )}
        </TouchableOpacity>
      }
    >
      <ScrollView
        style={styles.modalScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tool description */}
        {tool.description && (
          <Text style={styles.modalDescription}>{tool.description}</Text>
        )}

        {/* Parameters */}
        {paramKeys.length > 0 ? (
          <View style={styles.paramSection}>
            <Text style={styles.sectionLabel}>Parameters</Text>
            {paramKeys.map((key) => (
              <ParamInput
                key={key}
                paramKey={key}
                schema={properties[key]}
                value={params[key] ?? ""}
                onChange={handleParamChange}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noParams}>
            <Text style={styles.noParamsText}>This tool has no parameters</Text>
          </View>
        )}

        {/* Result */}
        {result !== null && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionLabel}>Result</Text>
            <ScrollView
              style={styles.resultBox}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Text style={styles.resultText}>{result}</Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
});

// ==================== TOOL ITEM ====================

interface ToolItemProps {
  tool: MCPTool;
  onExecute: (tool: MCPTool) => void;
  isFirst: boolean;
}

const ToolItem = memo(function ToolItem({
  tool,
  onExecute,
  isFirst,
}: ToolItemProps) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const schema = tool.parameters as Record<string, unknown>;
  const properties = (schema?.properties as Record<string, unknown>) ?? {};
  const paramKeys = Object.keys(properties);

  const toggleExpand = useCallback(() => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded((v) => !v);
  }, [expanded, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={[styles.toolItem, !isFirst && styles.toolItemBorder]}>
      {/* Tool header row */}
      <View style={styles.toolHeader}>
        <TouchableOpacity
          style={styles.toolHeaderLeft}
          onPress={paramKeys.length > 0 ? toggleExpand : undefined}
          activeOpacity={paramKeys.length > 0 ? 0.7 : 1}
        >
          <View style={styles.toolNameRow}>
            <Icon name="extension" size={16} color={colors.primary.cyan} />
            <Text style={styles.toolName}>{tool.name}</Text>
            {paramKeys.length > 0 && (
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <Icon name="expand-more" size={18} color={colors.text.muted} />
              </Animated.View>
            )}
          </View>
          {tool.description && (
            <Text
              style={styles.toolDescription}
              numberOfLines={expanded ? undefined : 2}
            >
              {tool.description}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolExecuteBtn}
          onPress={() => onExecute(tool)}
          activeOpacity={0.8}
        >
          <Icon name="play-arrow" size={18} color={colors.primary.purple} />
        </TouchableOpacity>
      </View>

      {/* Collapsible parameters */}
      {expanded && paramKeys.length > 0 && (
        <View style={styles.toolParams}>
          <Text style={styles.toolParamsLabel}>Parameters</Text>
          {paramKeys.map((key) => {
            const propSchema =
              (properties[key] as Record<string, unknown>) ?? {};
            const type = (propSchema.type as string) ?? "any";
            const desc = propSchema.description as string | undefined;
            return (
              <View key={key} style={styles.toolParamRow}>
                <View style={styles.toolParamHeader}>
                  <Text style={styles.toolParamKey}>{key}</Text>
                  <Text style={styles.toolParamType}>{type}</Text>
                </View>
                {desc && <Text style={styles.toolParamDesc}>{desc}</Text>}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

// ==================== SKELETON ====================

const ToolSkeleton = memo(function ToolSkeleton() {
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
    <Animated.View style={[styles.skeleton, { opacity }]}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.skeletonItem, i > 0 && styles.toolItemBorder]}
        >
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonDot} />
            <View style={styles.skeletonName} />
          </View>
          <View style={styles.skeletonDesc} />
        </View>
      ))}
    </Animated.View>
  );
});

// ==================== MAIN SCREEN ====================

export const MCPToolsScreen = memo(function MCPToolsScreen({ route }: Props) {
  const { machineId, serverName } = route.params;
  const fadeStyle = useFadeIn();

  const [tools, setTools] = useState<MCPTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);

  const loadTools = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      setError(null);

      try {
        // Fetch all MCP servers, find the matching one
        const response = await machinesApi.getMCP(machineId);
        const servers: MCPServer[] = response.data ?? [];
        const server = servers.find((s) => s.name === serverName);
        setTools(server?.tools ?? []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load tools";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [machineId, serverName],
  );

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTools(true);
  }, [loadTools]);

  const handleExecute = useCallback((tool: MCPTool) => {
    setSelectedTool(tool);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTool(null);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: MCPTool; index: number }) => (
      <ToolItem tool={item} onExecute={handleExecute} isFirst={index === 0} />
    ),
    [handleExecute],
  );

  const keyExtractor = useCallback((item: MCPTool) => item.name, []);

  // ---- Loading skeleton ----
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ToolSkeleton />
      </View>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <View style={styles.centerState}>
        <Icon name="error-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.centerTitle}>Failed to load tools</Text>
        <Text style={styles.centerSubtitle}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadTools()}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <FlatList
        data={tools}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          tools.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.purple}
            colors={[colors.primary.purple]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Icon name="dns" size={16} color={colors.text.muted} />
            <Text style={styles.listHeaderText}>{serverName}</Text>
            <View style={styles.toolCount}>
              <Text style={styles.toolCountText}>{tools.length} tools</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centerState}>
            <Icon name="extension-off" size={48} color={colors.text.muted} />
            <Text style={styles.centerTitle}>No tools available</Text>
            <Text style={styles.centerSubtitle}>
              This MCP server has not registered any tools
            </Text>
          </View>
        }
      />

      <ExecuteModal
        tool={selectedTool}
        machineId={machineId}
        serverName={serverName}
        onClose={handleCloseModal}
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

  // List
  listContent: {
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  listHeaderText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    flex: 1,
  },
  toolCount: {
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  toolCountText: {
    fontSize: typography.size.xs,
    color: colors.primary.purple,
    fontWeight: "600",
  },

  // Tool item — borderless cards with top separator
  toolItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  toolItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  toolHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  toolHeaderLeft: {
    flex: 1,
  },
  toolNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  toolName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
  },
  toolDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  toolExecuteBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  // Tool parameters (expanded)
  toolParams: {
    marginTop: spacing.sm,
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary.cyan + "60",
  },
  toolParamsLabel: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  toolParamRow: {
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  toolParamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  toolParamKey: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.primary,
  },
  toolParamType: {
    fontSize: typography.size.xs,
    color: colors.primary.cyan,
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  toolParamDesc: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 2,
  },

  // States
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
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
  skeleton: {
    padding: spacing.md,
  },
  skeletonItem: {
    paddingVertical: spacing.md,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  skeletonDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background.dark3,
  },
  skeletonName: {
    height: 16,
    width: 120,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.dark3,
  },
  skeletonDesc: {
    height: 12,
    width: "70%",
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.dark3,
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
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.text.primary,
    flex: 1,
  },
  modalContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalScroll: {
    // Cap so the param/result list scrolls inside the modal sheet.
    maxHeight: 460,
  },
  modalDescription: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.dark1,
  },

  // Param inputs in modal
  paramSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  paramField: {
    marginBottom: spacing.md,
  },
  paramLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  paramKey: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.primary,
  },
  paramType: {
    fontSize: typography.size.xs,
    color: colors.primary.cyan,
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  paramOptional: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontStyle: "italic",
  },
  paramDescription: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  paramInput: {
    backgroundColor: colors.background.dark2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.base,
    color: colors.text.primary,
    minHeight: 44,
  },
  noParams: {
    padding: spacing.md,
    alignItems: "center",
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  noParamsText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },

  // Result
  resultSection: {
    marginTop: spacing.md,
  },
  resultBox: {
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 200,
  },
  resultText: {
    fontSize: 12,
    color: colors.terminal.foreground,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 18,
  },

  // Execute button
  executeButton: {
    backgroundColor: colors.primary.purple,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 52,
  },
  executeButtonDisabled: {
    opacity: 0.6,
  },
  executeButtonText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
