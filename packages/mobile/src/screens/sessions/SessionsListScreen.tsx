/**
 * SessionsListScreen
 * Displays list of sessions with filters, header stats, FAB, and FadeIn animations.
 */

import React, { useEffect, useCallback, useState, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useSessionsStore } from '@/stores/sessionsStore';
import { useMachinesStore } from '@/stores/machinesStore';
import { useFadeIn } from '@/utils/animations';
import type { Session, SessionStatus } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SessionsStackParamList } from '@/navigation/types';

import {
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from '@/components/common';
import { SessionCard } from '@/components/sessions';

type Props = NativeStackScreenProps<SessionsStackParamList, 'SessionsList'>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'active' | 'completed';

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const ACTIVE_STATUSES: SessionStatus[] = ['starting', 'running', 'waiting_input'];
const COMPLETED_STATUSES: SessionStatus[] = ['completed', 'terminated', 'error'];

// ---------------------------------------------------------------------------
// FilterChip
// ---------------------------------------------------------------------------

interface FilterChipProps {
  label: string;
  isActive: boolean;
  count: number;
  onPress: () => void;
}

const FilterChip = memo(function FilterChip({ label, isActive, count, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
      <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
        <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------
// AnimatedSessionCard — FadeIn wrapper for list items
// ---------------------------------------------------------------------------

interface AnimatedSessionCardProps {
  session: Session;
  onPress: (session: Session) => void;
  machineName?: string;
  index: number;
}

const AnimatedSessionCard = memo(function AnimatedSessionCard({
  session,
  onPress,
  machineName,
  index,
}: AnimatedSessionCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const delay = Math.min(index * 40, 300);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <SessionCard
        session={session}
        onPress={onPress}
        machineName={machineName}
      />
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// SessionsListScreen
// ---------------------------------------------------------------------------

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

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const headerFade = useFadeIn(320);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (machineId) {
      fetchSessions(machineId);
    } else {
      fetchMachines().then(() => {
        machines.forEach((m) => fetchSessions(m.id));
      });
    }
  }, [machineId]);

  // ---------------------------------------------------------------------------
  // Header button
  // ---------------------------------------------------------------------------

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNewSession}
          style={styles.headerButton}
        >
          <Icon name="add" size={28} color={colors.primary.purple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, machineId, machines]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const baseSessions = useMemo(() => {
    const base = machineId
      ? sessions.filter((s) => s.machine_id === machineId)
      : sessions;
    return [...base].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [sessions, machineId]);

  const activeSessions = useMemo(
    () => baseSessions.filter((s) => ACTIVE_STATUSES.includes(s.status)),
    [baseSessions]
  );
  const completedSessions = useMemo(
    () => baseSessions.filter((s) => COMPLETED_STATUSES.includes(s.status)),
    [baseSessions]
  );

  const filteredSessions = useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return activeSessions;
      case 'completed':
        return completedSessions;
      default:
        return baseSessions;
    }
  }, [activeFilter, baseSessions, activeSessions, completedSessions]);

  const counts = useMemo(
    () => ({
      all: baseSessions.length,
      active: activeSessions.length,
      completed: completedSessions.length,
    }),
    [baseSessions, activeSessions, completedSessions]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleRefresh = useCallback(() => {
    if (machineId) {
      fetchSessions(machineId);
    } else {
      machines.forEach((m) => fetchSessions(m.id));
    }
  }, [machineId, machines, fetchSessions]);

  const handleNewSession = useCallback(() => {
    const targetMachine = machineId || machines[0]?.id || '';
    navigation.navigate('NewSession', { machineId: targetMachine });
  }, [navigation, machineId, machines]);

  const handlePressSession = useCallback(
    (session: Session) => {
      navigation.navigate('Session', { sessionId: session.id });
    },
    [navigation]
  );

  const getMachineName = useCallback(
    (mid: string) => machines.find((m) => m.id === mid)?.name,
    [machines]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item, index }: { item: Session; index: number }) => (
      <AnimatedSessionCard
        session={item}
        onPress={handlePressSession}
        machineName={!machineId ? getMachineName(item.machine_id) : undefined}
        index={index}
      />
    ),
    [handlePressSession, machineId, getMachineName]
  );

  const keyExtractor = useCallback((item: Session) => item.id, []);

  if (isLoading && sessions.length === 0) {
    return <LoadingSpinner text="Loading sessions..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage message={error} onRetry={handleRefresh} onDismiss={clearError} />
      )}

      {/* Header Stats */}
      <Animated.View style={[styles.statsHeader, headerFade]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeSessions.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{baseSessions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedSessions.length}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </Animated.View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            isActive={activeFilter === f.key}
            count={counts[f.key]}
            onPress={() => setActiveFilter(f.key)}
          />
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filteredSessions}
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
            description={
              activeFilter === 'all'
                ? 'Start a new session to interact with Claude'
                : `No ${activeFilter} sessions`
            }
            actionLabel={activeFilter === 'all' ? 'New Session' : undefined}
            onAction={activeFilter === 'all' ? handleNewSession : undefined}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewSession}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  headerButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },

  // Stats header
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark3,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.subtle,
  },

  // Filters
  filtersContainer: {
    marginTop: spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.dark3,
  },
  filterChipActive: {
    borderColor: colors.primary.purple,
    backgroundColor: 'rgba(168,85,247,0.15)',
  },
  filterChipText: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.primary.purple,
    fontWeight: '600',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.dark4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(168,85,247,0.3)',
  },
  filterBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.text.muted,
  },
  filterBadgeTextActive: {
    color: colors.primary.purple,
  },

  // List
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 96,
    flexGrow: 1,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: Platform.OS === 'ios' ? 32 : spacing.lg,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
