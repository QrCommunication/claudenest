/**
 * LocksScreen
 * Displays and manages file locks
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { useProjectsStore } from '@/stores/projectsStore';
import type { FileLock } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

import { LoadingSpinner, EmptyState, ErrorMessage } from '@/components/common';
import { LockCard } from '@/components/multiagent';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'Locks'>;

export const LocksScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const {
    getProjectLocks,
    fetchLocks,
    createLock,
    deleteLock,
    clearError,
    error,
    isLoading,
  } = useProjectsStore();

  const locks = getProjectLocks(projectId);

  useEffect(() => {
    fetchLocks(projectId);
  }, [projectId]);

  // Set up header with add button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleCreateLock} style={styles.headerButton}>
          <Icon name="add" size={28} color={colors.primary.purple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleCreateLock = useCallback(() => {
    Alert.prompt(
      'Lock File',
      'Enter file path to lock:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          onPress: async (path) => {
            if (path) {
              try {
                await createLock(projectId, path, 'Locked from mobile app');
              } catch (error) {
                Alert.alert('Error', 'Failed to lock file');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }, [projectId, createLock]);

  const handleUnlock = useCallback(
    async (lock: FileLock) => {
      Alert.alert(
        'Unlock File?',
        `Are you sure you want to unlock "${lock.path}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unlock',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteLock(projectId, lock.path);
              } catch (error) {
                Alert.alert('Error', 'Failed to unlock file');
              }
            },
          },
        ]
      );
    },
    [projectId, deleteLock]
  );

  const renderItem = useCallback(
    ({ item }: { item: FileLock }) => (
      <LockCard lock={item} onUnlock={handleUnlock} canUnlock={true} />
    ),
    [handleUnlock]
  );

  const keyExtractor = useCallback((item: FileLock) => item.id, []);

  if (isLoading && locks.length === 0) {
    return <LoadingSpinner text="Loading locks..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage message={error} onRetry={() => fetchLocks(projectId)} onDismiss={clearError} />
      )}

      <FlatList
        data={locks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="lock-open"
            title="No file locks"
            description="Files locked by Claude instances will appear here"
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
