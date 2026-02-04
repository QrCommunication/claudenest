/**
 * ProjectScreen
 * Detailed view of a multi-agent project
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useProjectsStore } from '@/stores/projectsStore';
import { Card, CardHeader, CardContent, LoadingSpinner } from '@/components/common';
import { InstanceCard } from '@/components/multiagent';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'ProjectDetail'>;

const ACTION_ITEMS = [
  { key: 'tasks', icon: 'assignment', label: 'Tasks', color: colors.primary.purple },
  { key: 'context', icon: 'description', label: 'Context', color: colors.semantic.info },
  { key: 'locks', icon: 'lock', label: 'Locks', color: colors.semantic.warning },
  { key: 'broadcast', icon: 'campaign', label: 'Broadcast', color: colors.semantic.success },
];

export const ProjectScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const {
    getProjectById,
    fetchProject,
    fetchInstances,
    fetchTasks,
    fetchLocks,
    getProjectInstances,
    subscribeToProject,
    broadcast,
  } = useProjectsStore();

  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const project = getProjectById(projectId);
  const instances = getProjectInstances(projectId);

  useEffect(() => {
    fetchProject(projectId);
    fetchInstances(projectId);
    fetchTasks(projectId);
    fetchLocks(projectId);

    const unsubscribe = subscribeToProject(projectId);
    return unsubscribe;
  }, [projectId]);

  const handleAction = useCallback(
    (key: string) => {
      switch (key) {
        case 'tasks':
          navigation.navigate('Tasks', { projectId });
          break;
        case 'context':
          navigation.navigate('Context', { projectId });
          break;
        case 'locks':
          navigation.navigate('Locks', { projectId });
          break;
        case 'broadcast':
          handleBroadcast();
          break;
      }
    },
    [navigation, projectId]
  );

  const handleBroadcast = useCallback(() => {
    Alert.prompt(
      'Broadcast Message',
      'Send a message to all instances in this project:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message) => {
            if (message) {
              setIsBroadcasting(true);
              try {
                await broadcast(projectId, message);
                Alert.alert('Success', 'Message broadcasted to all instances');
              } catch (error) {
                Alert.alert('Error', 'Failed to broadcast message');
              } finally {
                setIsBroadcasting(false);
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }, [projectId, broadcast]);

  if (!project) {
    return <LoadingSpinner text="Loading project..." fullScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Project Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Icon name="folder-shared" size={32} color={colors.primary.purple} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{project.name}</Text>
            <Text style={styles.path} numberOfLines={1}>
              {project.projectPath}
            </Text>
          </View>
        </View>
      </Card>

      {/* Actions Grid */}
      <View style={styles.actionsGrid}>
        {ACTION_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.actionCard}
            onPress={() => handleAction(item.key)}
            disabled={item.key === 'broadcast' && isBroadcasting}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: item.color + '15' },
              ]}
            >
              <Icon name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.actionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      {project.summary && (
        <Card style={styles.sectionCard}>
          <CardHeader title="Summary" />
          <CardContent>
            <Text style={styles.summaryText}>{project.summary}</Text>
          </CardContent>
        </Card>
      )}

      {/* Current Focus */}
      {project.currentFocus && (
        <Card style={styles.sectionCard}>
          <CardHeader title="Current Focus" />
          <CardContent>
            <Text style={styles.focusText}>{project.currentFocus}</Text>
          </CardContent>
        </Card>
      )}

      {/* Active Instances */}
      <Card style={styles.sectionCard}>
        <CardHeader
          title="Active Instances"
          rightContent={
            <Text style={styles.instanceCount}>{instances.length}</Text>
          }
        />
        {instances.length > 0 ? (
          instances.map((instance) => (
            <InstanceCard key={instance.id} instance={instance} />
          ))
        ) : (
          <CardContent>
            <Text style={styles.noInstances}>No active instances</Text>
          </CardContent>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  headerCard: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.dark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  path: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  actionCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 66, 97, 0.5)',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  sectionCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  summaryText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  focusText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  instanceCount: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.primary.purple,
  },
  noInstances: {
    fontSize: typography.size.base,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
