/**
 * MachineDetailScreen
 * Detailed view of a machine with actions
 */

import React, { useEffect, useState, useCallback } from 'react';
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
import { useMachinesStore } from '@/stores/machinesStore';
import { Button, Card, CardHeader, CardContent, LoadingSpinner } from '@/components/common';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MachinesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MachinesStackParamList, 'MachineDetail'>;

export const MachineDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { machineId } = route.params;
  const { getMachineById, wakeMachine, deleteMachine, subscribeToMachineUpdates } = useMachinesStore();
  const [isWaking, setIsWaking] = useState(false);

  const machine = getMachineById(machineId);

  useEffect(() => {
    // Subscribe to WebSocket updates for this machine
    const unsubscribe = subscribeToMachineUpdates(machineId);
    return unsubscribe;
  }, [machineId, subscribeToMachineUpdates]);

  const handleWake = useCallback(async () => {
    setIsWaking(true);
    try {
      await wakeMachine(machineId);
    } catch (error) {
      Alert.alert('Error', 'Failed to wake machine. Please try again.');
    } finally {
      setIsWaking(false);
    }
  }, [machineId, wakeMachine]);

  const handleNewSession = useCallback(() => {
    navigation.navigate('SessionsList', { machineId });
    // Navigate to new session screen
    navigation.getParent()?.navigate('SessionsTab', {
      screen: 'NewSession',
      params: { machineId },
    });
  }, [machineId, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Machine?',
      `Are you sure you want to remove "${machine?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMachine(machineId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete machine');
            }
          },
        },
      ]
    );
  }, [machine, machineId, deleteMachine, navigation]);

  if (!machine) {
    return <LoadingSpinner text="Loading machine..." fullScreen />;
  }

  const getPlatformIcon = () => {
    switch (machine.platform) {
      case 'darwin':
        return 'laptop-mac';
      case 'win32':
        return 'laptop-windows';
      case 'linux':
        return 'computer';
      default:
        return 'computer';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Icon name={getPlatformIcon()} size={40} color={colors.primary.purple} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{machine.name}</Text>
            <Text style={styles.hostname}>{machine.hostname}</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      machine.status === 'online'
                        ? colors.semantic.success
                        : machine.status === 'connecting'
                        ? colors.semantic.warning
                        : colors.semantic.error,
                  },
                ]}
              />
              <Text style={styles.status}>
                {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {machine.status === 'offline' && (
          <Button
            title={isWaking ? 'Waking...' : 'Wake Machine'}
            onPress={handleWake}
            loading={isWaking}
            leftIcon={<Icon name="power-settings-new" size={20} color={colors.text.primary} />}
          />
        )}
        <Button
          title="New Session"
          onPress={handleNewSession}
          variant="secondary"
          leftIcon={<Icon name="add" size={20} color={colors.text.primary} />}
        />
      </View>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <CardHeader title="System Information" />
        <CardContent>
          <InfoRow label="Platform" value={machine.platform} />
          <InfoRow label="Architecture" value={machine.arch} />
          <InfoRow label="Node Version" value={machine.nodeVersion} />
          <InfoRow label="Agent Version" value={machine.agentVersion} />
          <InfoRow label="Claude Version" value={machine.claudeVersion || 'N/A'} />
          <InfoRow label="Max Sessions" value={machine.maxSessions.toString()} />
        </CardContent>
      </Card>

      {/* Last Seen */}
      <Card style={styles.infoCard}>
        <CardHeader title="Connection" />
        <CardContent>
          <InfoRow
            label="Last Seen"
            value={
              machine.lastSeenAt
                ? new Date(machine.lastSeenAt).toLocaleString()
                : 'Never'
            }
          />
          <InfoRow
            label="Connected At"
            value={
              machine.connectedAt
                ? new Date(machine.connectedAt).toLocaleString()
                : 'Never'
            }
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.infoCard, styles.dangerCard]}>
        <CardHeader title="Danger Zone" />
        <CardContent>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
            <Icon name="delete" size={20} color={colors.semantic.error} />
            <Text style={styles.dangerText}>Delete Machine</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>
    </ScrollView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

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
    width: 70,
    height: 70,
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
  hostname: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  status: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  actionsContainer: {
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  infoLabel: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.size.base,
    fontWeight: '500',
    color: colors.text.primary,
  },
  dangerCard: {
    borderColor: colors.semantic.error + '30',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dangerText: {
    marginLeft: spacing.sm,
    fontSize: typography.size.base,
    color: colors.semantic.error,
    fontWeight: '600',
  },
});
