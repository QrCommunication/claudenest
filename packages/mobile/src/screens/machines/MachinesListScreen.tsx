/**
 * MachinesListScreen
 * Displays list of connected machines with stats, filters, and stagger animations.
 */

import React, { useEffect, useCallback, useState, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'online' | 'offline';

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'offline', label: 'Offline' },
];

// ---------------------------------------------------------------------------
// FilterChip
// ---------------------------------------------------------------------------

interface FilterChipProps {
  label: string;
  isActive: boolean;
  count: number;
  accentColor?: string;
  onPress: () => void;
}

const FilterChip = memo(function FilterChip({
  label,
  isActive,
  count,
  accentColor = colors.primary.purple,
  onPress,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isActive && { borderColor: accentColor, backgroundColor: accentColor + '18' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, isActive && { color: accentColor, fontWeight: '600' }]}>
        {label}
      </Text>
      <View
        style={[
          styles.filterBadge,
          isActive && { backgroundColor: accentColor + '30' },
        ]}
      >
        <Text style={[styles.filterBadgeText, isActive && { color: accentColor }]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------
// AnimatedMachineCard — stagger FadeIn for list items
// ---------------------------------------------------------------------------

interface AnimatedMachineCardProps {
  machine: Machine;
  onPress: (machine: Machine) => void;
  onLongPress: (machine: Machine) => void;
  index: number;
}

const AnimatedMachineCard = memo(function AnimatedMachineCard({
  machine,
  onPress,
  onLongPress,
  index,
}: AnimatedMachineCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 360);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <MachineCard
        machine={machine}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// MachinesListScreen
// ---------------------------------------------------------------------------

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

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [headerOpacity]);

  // ---------------------------------------------------------------------------
  // Header button
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const onlineMachines = useMemo(
    () => machines.filter((m) => m.status === 'online'),
    [machines]
  );
  const offlineMachines = useMemo(
    () => machines.filter((m) => m.status !== 'online'),
    [machines]
  );

  const filteredMachines = useMemo(() => {
    switch (activeFilter) {
      case 'online':
        return onlineMachines;
      case 'offline':
        return offlineMachines;
      default:
        return machines;
    }
  }, [activeFilter, machines, onlineMachines, offlineMachines]);

  const counts = useMemo(
    () => ({
      all: machines.length,
      online: onlineMachines.length,
      offline: offlineMachines.length,
    }),
    [machines, onlineMachines, offlineMachines]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

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
      Alert.alert(machine.name, 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
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
      ]);
    },
    [deleteMachine]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item, index }: { item: Machine; index: number }) => (
      <AnimatedMachineCard
        machine={item}
        onPress={handlePressMachine}
        onLongPress={handleLongPressMachine}
        index={index}
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

      {/* Stats Header */}
      <Animated.View style={[styles.statsHeader, { opacity: headerOpacity }]}>
        {/* Online indicator */}
        <View style={styles.statRow}>
          <View style={[styles.statusDot, { backgroundColor: colors.status.online }]} />
          <Text style={styles.statOnline}>{onlineMachines.length} online</Text>
          <Text style={styles.statSeparator}>/</Text>
          <Text style={styles.statTotal}>{machines.length} total</Text>
        </View>

        {/* Mini progress bar */}
        {machines.length > 0 && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(onlineMachines.length / machines.length) * 100}%` },
              ]}
            />
          </View>
        )}
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
            accentColor={
              f.key === 'online'
                ? colors.status.online
                : f.key === 'offline'
                ? colors.status.offline
                : colors.primary.purple
            }
            onPress={() => setActiveFilter(f.key)}
          />
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filteredMachines}
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
            title={
              activeFilter === 'all'
                ? 'No machines connected'
                : `No ${activeFilter} machines`
            }
            description={
              activeFilter === 'all'
                ? 'Add a machine to start controlling Claude remotely'
                : `Switch filter to see other machines`
            }
            actionLabel={activeFilter === 'all' ? 'Add Machine' : undefined}
            onAction={
              activeFilter === 'all'
                ? () => navigation.navigate('PairMachine')
                : undefined
            }
          />
        }
      />
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
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statOnline: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.status.online,
  },
  statSeparator: {
    fontSize: typography.size.base,
    color: colors.text.muted,
    marginHorizontal: 2,
  },
  statTotal: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.background.dark4,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.status.online,
    borderRadius: borderRadius.full,
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
  filterChipText: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    color: colors.text.secondary,
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
  filterBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.text.muted,
  },

  // List
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
