/**
 * TasksScreen
 * Displays and manages project tasks
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '@/theme';
import { useProjectsStore } from '@/stores/projectsStore';
import type { SharedTask } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

import { LoadingSpinner, EmptyState, ErrorMessage, Button } from '@/components/common';
import { TaskCard } from '@/components/multiagent';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'Tasks'>;

export const TasksScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const {
    getProjectTasks,
    fetchTasks,
    createTask,
    claimTask,
    completeTask,
    clearError,
    error,
    isLoading,
  } = useProjectsStore();

  const tasks = getProjectTasks(projectId);

  useEffect(() => {
    fetchTasks(projectId);
  }, [projectId]);

  // Set up header with add button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleCreateTask} style={styles.headerButton}>
          <Icon name="add" size={28} color={colors.primary.purple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleCreateTask = useCallback(() => {
    Alert.prompt(
      'New Task',
      'Enter task title:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (title) => {
            if (title) {
              try {
                await createTask(projectId, { title });
              } catch (error) {
                Alert.alert('Error', 'Failed to create task');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }, [projectId, createTask]);

  const handlePressTask = useCallback(
    (task: SharedTask) => {
      Alert.alert(
        task.title,
        task.description || 'No description',
        [
          { text: 'Close', style: 'cancel' },
          task.status === 'pending'
            ? {
                text: 'Claim',
                onPress: async () => {
                  try {
                    await claimTask(task.id, 'mobile-instance');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to claim task');
                  }
                },
              }
            : null,
          task.status === 'in_progress'
            ? {
                text: 'Complete',
                onPress: () => handleCompleteTask(task),
              }
            : null,
        ].filter(Boolean) as { text: string; onPress?: () => void; style?: string }[]
      );
    },
    [claimTask]
  );

  const handleCompleteTask = useCallback(
    (task: SharedTask) => {
      Alert.prompt(
        'Complete Task',
        'Enter completion summary:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async (summary) => {
              try {
                await completeTask(task.id, summary || 'Completed', []);
              } catch (error) {
                Alert.alert('Error', 'Failed to complete task');
              }
            },
          },
        ],
        'plain-text'
      );
    },
    [completeTask]
  );

  const handleClaimTask = useCallback(
    async (task: SharedTask) => {
      try {
        await claimTask(task.id, 'mobile-instance');
      } catch (error) {
        Alert.alert('Error', 'Failed to claim task');
      }
    },
    [claimTask]
  );

  const handleCompleteTaskFromCard = useCallback(
    async (task: SharedTask) => {
      handleCompleteTask(task);
    },
    [handleCompleteTask]
  );

  const renderItem = useCallback(
    ({ item }: { item: SharedTask }) => (
      <TaskCard
        task={item}
        onPress={handlePressTask}
        onClaim={handleClaimTask}
        onComplete={handleCompleteTaskFromCard}
      />
    ),
    [handlePressTask, handleClaimTask, handleCompleteTaskFromCard]
  );

  const keyExtractor = useCallback((item: SharedTask) => item.id, []);

  // Sort tasks by status and priority
  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder = { pending: 0, in_progress: 1, blocked: 2, review: 3, done: 4 };
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (isLoading && tasks.length === 0) {
    return <LoadingSpinner text="Loading tasks..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage message={error} onRetry={() => fetchTasks(projectId)} onDismiss={clearError} />
      )}

      <FlatList
        data={sortedTasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="assignment"
            title="No tasks"
            description="Create a task to start organizing work"
            actionLabel="Create Task"
            onAction={handleCreateTask}
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
  headerButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
