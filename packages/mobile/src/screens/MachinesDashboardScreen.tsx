/**
 * MachinesDashboardScreen — Liste des machines connectées
 * Affiche le statut temps réel + bouton Launch Session
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/authStore';
import { machinesApi } from '@/services/api';
import type { Machine } from '@/types';
import type { RootStackParamList } from '@/navigation/SimpleNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Machines'>;

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e',
  offline: '#64748b',
  connecting: '#fbbf24',
};

const PLATFORM_EMOJI: Record<string, string> = {
  darwin: '🍎',
  win32: '🪟',
  linux: '🐧',
};

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#64748b';
  return (
    <View
      style={{
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: color,
        shadowColor: color,
        shadowOpacity: 0.7,
        shadowRadius: 4,
        elevation: 2,
      }}
    />
  );
}

interface MachineCardProps {
  machine: Machine;
  onLaunch: () => void;
}

function MachineCard({ machine, onLaunch }: MachineCardProps) {
  const isOnline = machine.status === 'online';
  const platformEmoji = PLATFORM_EMOJI[machine.platform ?? 'linux'] ?? '🖥️';
  const sessionCount = machine.active_sessions_count ?? 0;

  return (
    <View className="bg-bg2 rounded-2xl p-4 mb-3 border border-bg4">
      {/* ── Header row ── */}
      <View className="flex-row items-center gap-x-2.5 mb-3">
        <StatusDot status={machine.status} />
        <Text className="text-white font-semibold text-base flex-1" numberOfLines={1}>
          {machine.name}
        </Text>
        <View className="bg-bg3 px-2.5 py-0.5 rounded-lg flex-row items-center gap-x-1">
          <Text style={{ fontSize: 12 }}>{platformEmoji}</Text>
          <Text className="text-muted text-xs capitalize">{machine.platform ?? 'linux'}</Text>
        </View>
      </View>

      {/* ── Meta ── */}
      {machine.hostname ? (
        <Text className="text-text-secondary text-sm mb-1" numberOfLines={1}>
          {machine.hostname}
        </Text>
      ) : null}
      {machine.last_seen_human ? (
        <Text className="text-muted text-xs mb-3">
          Vu {machine.last_seen_human}
        </Text>
      ) : null}

      {/* ── Footer row ── */}
      <View className="flex-row items-center justify-between mt-1">
        <Text className="text-muted text-xs">
          {sessionCount} session{sessionCount !== 1 ? 's' : ''} active{sessionCount !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: isOnline ? '#a855f7' : '#3b4261' }}
          onPress={isOnline ? onLaunch : undefined}
          disabled={!isOnline}
          activeOpacity={0.8}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: isOnline ? 'white' : '#64748b' }}
          >
            {isOnline ? 'Launch Session' : 'Hors ligne'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────
// Main screen
// ──────────────────────────────────────────────────────────

export function MachinesDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuthStore();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMachines = useCallback(async () => {
    try {
      const response = await machinesApi.list();
      const data = response.data;
      setMachines(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Impossible de charger les machines.');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchMachines().finally(() => setIsLoading(false));
  }, [fetchMachines]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchMachines();
    setIsRefreshing(false);
  }, [fetchMachines]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Machine>) => (
      <MachineCard
        machine={item}
        onLaunch={() =>
          navigation.navigate('LaunchSession', {
            machineId: item.id,
            machineName: item.name,
          })
        }
      />
    ),
    [navigation]
  );

  const onlineMachinesCount = machines.filter((m) => m.status === 'online').length;

  return (
    <View className="flex-1 bg-bg1">
      <StatusBar style="light" backgroundColor="#1a1b26" />

      {/* ── Custom header ── */}
      <View className="bg-bg2 px-5 pt-14 pb-4 border-b border-bg4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-bold">Machines</Text>
            <Text className="text-text-secondary text-xs mt-0.5">
              {user?.name ?? user?.email}
            </Text>
          </View>
          <TouchableOpacity
            className="px-3 py-2 rounded-xl bg-bg3 border border-bg4"
            onPress={handleLogout}
          >
            <Text className="text-text-secondary text-sm">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Online indicator */}
        {!isLoading && machines.length > 0 ? (
          <View className="flex-row items-center gap-x-1.5 mt-3">
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: onlineMachinesCount > 0 ? '#22c55e' : '#64748b',
              }}
            />
            <Text className="text-muted text-xs">
              {onlineMachinesCount}/{machines.length} en ligne
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Content ── */}
      <View className="flex-1 px-4 pt-4">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#a855f7" />
            <Text className="text-muted text-sm mt-3">Chargement des machines…</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-4xl mb-4">⚠️</Text>
            <Text className="text-white font-semibold text-base mb-2 text-center">
              Erreur de connexion
            </Text>
            <Text className="text-text-secondary text-sm text-center mb-6">{error}</Text>
            <TouchableOpacity
              className="bg-primary px-6 py-3 rounded-xl"
              onPress={fetchMachines}
            >
              <Text className="text-white font-medium">Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={machines}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#a855f7"
                colors={['#a855f7']}
              />
            }
            ListHeaderComponent={
              machines.length > 0 ? (
                <Text className="text-muted text-xs font-medium uppercase tracking-widest mb-3">
                  {machines.length} machine{machines.length !== 1 ? 's' : ''}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center py-20">
                <Text style={{ fontSize: 56, marginBottom: 16 }}>🖥️</Text>
                <Text className="text-white font-semibold text-lg mb-2">
                  Aucune machine
                </Text>
                <Text className="text-text-secondary text-sm text-center px-8">
                  Installez l'agent ClaudeNest sur votre machine pour commencer.
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </View>
  );
}
