/**
 * ProjectsListScreen
 * Displays list of multi-agent projects
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useProjectsStore } from '@/stores/projectsStore';
import { useMachinesStore } from '@/stores/machinesStore';
import type { SharedProject } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

import { LoadingSpinner, EmptyState, ErrorMessage, Card } from '@/components/common';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'ProjectsList'>;

const ProjectCard: React.FC<{
  project: SharedProject;
  onPress: () => void;
}> = ({ project, onPress }) => (
  <Card onPress={onPress} style={styles.projectCard}>
    <View style={styles.projectHeader}>
      <View style={styles.iconContainer}>
        <Icon name="folder-shared" size={24} color={colors.primary.purple} />
      </View>
      <View style={styles.projectInfo}>
        <Text style={styles.projectName} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={styles.projectPath} numberOfLines={1}>
          {project.projectPath}
        </Text>
      </View>
    </View>
    {project.summary && (
      <Text style={styles.projectSummary} numberOfLines={2}>
        {project.summary}
      </Text>
    )}
    <View style={styles.projectStats}>
      <View style={styles.stat}>
        <Icon name="memory" size={14} color={colors.text.muted} />
        <Text style={styles.statText}>
          {Math.round(project.totalTokens / 1000)}k tokens
        </Text>
      </View>
    </View>
  </Card>
);

export const ProjectsListScreen: React.FC<Props> = ({ navigation }) => {
  const { projects, isLoading, error, fetchProjects, clearError } = useProjectsStore();
  const { machines, fetchMachines } = useMachinesStore();

  useEffect(() => {
    fetchMachines().then(() => {
      machines.forEach((m) => fetchProjects(m.id));
    });
  }, []);

  const handleRefresh = useCallback(() => {
    machines.forEach((m) => fetchProjects(m.id));
  }, [machines, fetchProjects]);

  const handlePressProject = useCallback(
    (project: SharedProject) => {
      navigation.navigate('ProjectDetail', { projectId: project.id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: SharedProject }) => (
      <ProjectCard project={item} onPress={() => handlePressProject(item)} />
    ),
    [handlePressProject]
  );

  const keyExtractor = useCallback((item: SharedProject) => item.id, []);

  if (isLoading && projects.length === 0) {
    return <LoadingSpinner text="Loading projects..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage message={error} onRetry={handleRefresh} onDismiss={clearError} />
      )}

      <FlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary.purple}
            colors={[colors.primary.purple]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-shared"
            title="No projects"
            description="Create a project to enable multi-agent collaboration"
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
    flexGrow: 1,
  },
  projectCard: {
    marginBottom: spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.dark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  projectPath: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  projectSummary: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  projectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
});
