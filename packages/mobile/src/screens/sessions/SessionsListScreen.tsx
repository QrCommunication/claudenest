/**
 * SessionsListScreen
 * Displays list of active sessions
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '@/theme';
import { useSessionsStore } from '@/stores/sessionsStore';
import { useMachinesStore } from '@/stores/machinesStore';
import type { Session } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SessionsStackParamList } from '@/navigation/types';

import {
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from '@/components/common';
import { SessionCard } from '@/components/sessions';

type Props = NativeStackScreenProps<SessionsStackParamList, 'SessionsList'>;

export const SessionsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { machineId } = route.params || {};
  const {
    sessions,
    isLoading,
    error,
    fetchSessions,
    clearError,
  } = useSessionsStore();
  const { machines, fetchMachines } = useMachinesStore();

  useEffect(() => {
    if (machineId) {
      fetchSessions(machineId);
    } else {
      // Fetch sessions for all machines
      fetchMachines().then(() => {
        machines.forEach((m) => fetchSessions(m.id));
      });
    }
  }, [machineId]);

  // Set up navigation header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (machineId) {
              navigation.navigate('NewSession', { machineId });
            } else {
              // Show machine selection
              navigation.navigate('NewSession', { machineId: machines[0]?.id || '' });
            }
          }}
          style={styles.headerButton}
        >
          <Icon name="add" size={28} color={colors.primary.purple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, machineId, machines]);

  const handleRefresh = useCallback(() => {
    if (machineId) {
      fetchSessions(machineId);
    } else {
      machines.forEach((m) => fetchSessions(m.id));
    }
  }, [machineId, machines, fetchSessions]);

  const handlePressSession = useCallback(
    (session: Session) => {
      navigation.navigate('Session', { sessionId: session.id });
    },
    [navigation]
  );

  const getMachineName = useCallback(
    (machineId: string) => {
      return machines.find((m) => m.id === machineId)?.name;
    },
    [machines]
  );

  const renderItem = useCallback(
    ({ item }: { item: Session }) => (
      <SessionCard
        session={item}
        onPress={handlePressSession}
        machineName={!machineId ? getMachineName(item.machineId) : undefined}
      />
    ),
    [handlePressSession, machineId, getMachineName]
  );

  const keyExtractor = useCallback((item: Session) => item.id, []);

  const filteredSessions = machineId
    ? sessions.filter((s) => s.machineId === machineId)
    : sessions;

  // Sort by created date (newest first)
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (isLoading && sessions.length === 0) {
    return <LoadingSpinner text="Loading sessions..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage message={error} onRetry={handleRefresh} onDismiss={clearError} />
      )}

      <FlatList
        data={sortedSessions}
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
            icon="terminal"
            title="No sessions"
            description="Start a new session to interact with Claude"
            actionLabel="New Session"
            onAction={() =>
              navigation.navigate('NewSession', { machineId: machineId || machines[0]?.id || '' })
            }
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
