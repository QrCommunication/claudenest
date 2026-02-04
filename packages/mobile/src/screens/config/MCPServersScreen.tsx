/**
 * MCPServersScreen
 * Displays MCP server configuration
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { machinesApi } from '@/services/api';
import type { MCPServer } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/navigation/types';

import { LoadingSpinner, EmptyState, Card } from '@/components/common';

type Props = NativeStackScreenProps<SettingsStackParamList, 'MCPServers'>;

const MCPServerCard: React.FC<{ server: MCPServer }> = ({ server }) => {
  const [enabled, setEnabled] = useState(server.enabled);

  return (
    <Card style={styles.serverCard}>
      <View style={styles.serverHeader}>
        <View style={styles.iconContainer}>
          <Icon
            name={enabled ? 'link' : 'link-off'}
            size={24}
            color={enabled ? colors.semantic.success : colors.text.muted}
          />
        </View>
        <View style={styles.serverInfo}>
          <Text style={styles.serverName}>{server.name}</Text>
          <Text style={styles.serverCommand} numberOfLines={1}>
            {server.command} {server.args.join(' ')}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.background.dark4, true: colors.primary.purple + '50' }}
          thumbColor={enabled ? colors.primary.purple : colors.text.muted}
        />
      </View>

      {server.tools.length > 0 && (
        <View style={styles.toolsSection}>
          <Text style={styles.toolsTitle}>Tools ({server.tools.length})</Text>
          <View style={styles.toolsList}>
            {server.tools.slice(0, 3).map((tool, index) => (
              <View key={index} style={styles.toolBadge}>
                <Text style={styles.toolName}>{tool.name}</Text>
              </View>
            ))}
            {server.tools.length > 3 && (
              <Text style={styles.moreTools}>+{server.tools.length - 3} more</Text>
            )}
          </View>
        </View>
      )}
    </Card>
  );
};

export const MCPServersScreen: React.FC<Props> = ({ route }) => {
  const { machineId } = route.params;
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, [machineId]);

  const loadServers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await machinesApi.getMCP(machineId);
      setServers(response.data || []);
    } catch (err) {
      console.error('Failed to load MCP servers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  const renderItem = useCallback(
    ({ item }: { item: MCPServer }) => <MCPServerCard server={item} />,
    []
  );

  const keyExtractor = useCallback((item: MCPServer) => item.name, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading MCP servers..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={servers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="extension"
            title="No MCP servers"
            description="No MCP servers configured on this machine"
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
  serverCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    backgroundColor: colors.background.dark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  serverCommand: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
    marginTop: 2,
  },
  toolsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 66, 97, 0.3)',
  },
  toolsTitle: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  toolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toolBadge: {
    backgroundColor: colors.primary.purple + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  toolName: {
    fontSize: typography.size.xs,
    color: colors.primary.purple,
  },
  moreTools: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    paddingVertical: 4,
  },
});
