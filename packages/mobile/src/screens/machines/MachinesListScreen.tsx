/**
 * MachinesListScreen
 * Displays list of connected machines
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '@/theme';
import { useMachinesStore } from '@/stores/machinesStore';
import type { Machine } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MachinesStackParamList } from '@/navigation/types';

import {
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from '@/components/common';
import { MachineCard } from '@/components/machines';

type Props = NativeStackScreenProps<MachinesStackParamList, 'MachinesList'>;

export const MachinesListScreen: React.FC<Props> = ({ navigation }) => {
  const {
    machines,
    isLoading,
    error,
    fetchMachines,
    refreshMachines,
    deleteMachine,
    clearError,
  } = useMachinesStore();

  useEffect(() => {
    fetchMachines();
  }, []);

  // Set up navigation header with add button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('PairMachine')}
          style={styles.headerButton}
        >
          <Icon name="add" size={28} color={colors.primary.purple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    refreshMachines();
  }, [refreshMachines]);

  const handlePressMachine = useCallback(
    (machine: Machine) => {
      navigation.navigate('MachineDetail', { machineId: machine.id });
    },
    [navigation]
  );

  const handleLongPressMachine = useCallback(
    (machine: Machine) => {
      Alert.alert(
        machine.name,
        'What would you like to do?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Machine?',
                `Are you sure you want to remove "${machine.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteMachine(machine.id),
                  },
                ]
              );
            },
          },
        ]
      );
    },
    [deleteMachine]
  );

  const renderItem = useCallback(
    ({ item }: { item: Machine }) => (
      <MachineCard
        machine={item}
        onPress={handlePressMachine}
        onLongPress={handleLongPressMachine}
      />
    ),
    [handlePressMachine, handleLongPressMachine]
  );

  const keyExtractor = useCallback((item: Machine) => item.id, []);

  if (isLoading && machines.length === 0) {
    return <LoadingSpinner text="Loading machines..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage message={error} onRetry={fetchMachines} onDismiss={clearError} />
      )}

      <FlatList
        data={machines}
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
            icon="computer"
            title="No machines connected"
            description="Add a machine to start controlling Claude remotely"
            actionLabel="Add Machine"
            onAction={() => navigation.navigate('PairMachine')}
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
