/**
 * Machines Store - Zustand
 * Manages machine/endpoint state
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Machine, MachineStatus } from '@/types';
import { machinesApi } from '@/services/api';
import { websocket } from '@/services/websocket';

interface MachinesState {
  // State
  machines: Machine[];
  isLoading: boolean;
  error: string | null;
  selectedMachineId: string | null;
  lastUpdated: number;

  // Getters (computed)
  onlineMachines: () => Machine[];
  offlineMachines: () => Machine[];
  selectedMachine: () => Machine | undefined;
  getMachineById: (id: string) => Machine | undefined;

  // Actions
  fetchMachines: () => Promise<void>;
  refreshMachines: () => Promise<void>;
  createMachine: (data: { name: string; token: string }) => Promise<Machine>;
  updateMachine: (id: string, data: Partial<Machine>) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
  wakeMachine: (id: string) => Promise<void>;
  updateMachineStatus: (id: string, status: MachineStatus) => void;
  selectMachine: (id: string | null) => void;
  clearError: () => void;
  subscribeToMachineUpdates: (machineId: string) => () => void;
}

export const useMachinesStore = create<MachinesState>()(
  persist(
    (set, get) => ({
      // Initial state
      machines: [],
      isLoading: false,
      error: null,
      selectedMachineId: null,
      lastUpdated: 0,

      // Getters
      onlineMachines: () => get().machines.filter((m) => m.status === 'online'),
      offlineMachines: () => get().machines.filter((m) => m.status === 'offline'),
      selectedMachine: () =>
        get().machines.find((m) => m.id === get().selectedMachineId),
      getMachineById: (id: string) => get().machines.find((m) => m.id === id),

      // Actions
      fetchMachines: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await machinesApi.list();
          set({
            machines: response.data!,
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch machines';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      refreshMachines: async () => {
        // Skip if recently updated (30s cache)
        if (Date.now() - get().lastUpdated < 30000) {
          return;
        }
        return get().fetchMachines();
      },

      createMachine: async (data: { name: string; token: string }) => {
        set({ isLoading: true, error: null });

        try {
          const response = await machinesApi.create(data);
          const newMachine = response.data!;
          set((state) => ({
            machines: [...state.machines, newMachine],
            isLoading: false,
          }));
          return newMachine;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to create machine';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      updateMachine: async (id: string, data: Partial<Machine>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await machinesApi.update(id, data);
          const updatedMachine = response.data!;
          set((state) => ({
            machines: state.machines.map((m) =>
              m.id === id ? updatedMachine : m
            ),
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to update machine';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      deleteMachine: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          await machinesApi.delete(id);
          set((state) => ({
            machines: state.machines.filter((m) => m.id !== id),
            isLoading: false,
            selectedMachineId:
              state.selectedMachineId === id ? null : state.selectedMachineId,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to delete machine';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      wakeMachine: async (id: string) => {
        try {
          await machinesApi.wake(id);
          // Optimistically update status
          get().updateMachineStatus(id, 'connecting');
        } catch (err) {
          console.error('Failed to wake machine:', err);
          throw err;
        }
      },

      updateMachineStatus: (id: string, status: MachineStatus) => {
        set((state) => ({
          machines: state.machines.map((m) =>
            m.id === id ? { ...m, status } : m
          ),
        }));
      },

      selectMachine: (id: string | null) => {
        set({ selectedMachineId: id });
      },

      clearError: () => set({ error: null }),

      subscribeToMachineUpdates: (machineId: string) => {
        // Subscribe to WebSocket updates for this machine
        websocket.subscribeToMachine(machineId);

        const unsubscribeStatus = websocket.on(
          'machine:status',
          (payload: { machineId: string; status: MachineStatus }) => {
            if (payload.machineId === machineId) {
              get().updateMachineStatus(machineId, payload.status);
            }
          }
        );

        // Return cleanup function
        return () => {
          unsubscribeStatus();
          websocket.unsubscribeFromMachine(machineId);
        };
      },
    }),
    {
      name: 'machines-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        machines: state.machines,
        selectedMachineId: state.selectedMachineId,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
