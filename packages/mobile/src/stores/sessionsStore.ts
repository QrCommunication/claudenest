/**
 * Sessions Store - Zustand
 * Manages session state and real-time output
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, SessionLog, SessionStatus, CreateSessionRequest } from '@/types';
import { sessionsApi } from '@/services/api';
import { websocket } from '@/services/websocket';

interface SessionOutput {
  sessionId: string;
  data: string;
  timestamp: number;
}

interface SessionsState {
  // State
  sessions: Session[];
  sessionOutputs: Map<string, string>; // sessionId -> accumulated output
  activeSessionIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  selectedSessionId: string | null;

  // Getters
  selectedSession: () => Session | undefined;
  getSessionById: (id: string) => Session | undefined;
  getSessionOutput: (sessionId: string) => string;
  getMachineSessions: (machineId: string) => Session[];

  // Actions
  fetchSessions: (machineId: string) => Promise<void>;
  fetchSession: (id: string) => Promise<Session>;
  createSession: (machineId: string, data: CreateSessionRequest) => Promise<Session>;
  terminateSession: (id: string) => Promise<void>;
  selectSession: (id: string | null) => void;
  appendOutput: (sessionId: string, data: string) => void;
  clearOutput: (sessionId: string) => void;
  updateSessionStatus: (id: string, status: SessionStatus) => void;
  subscribeToSession: (sessionId: string) => () => void;
  sendInput: (sessionId: string, data: string) => void;
  resizeSession: (sessionId: string, cols: number, rows: number) => void;
  clearError: () => void;
}

const MAX_OUTPUT_LENGTH = 100000; // Limit accumulated output

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      sessionOutputs: new Map(),
      activeSessionIds: new Set(),
      isLoading: false,
      error: null,
      selectedSessionId: null,

      // Getters
      selectedSession: () =>
        get().sessions.find((s) => s.id === get().selectedSessionId),
      getSessionById: (id: string) => get().sessions.find((s) => s.id === id),
      getSessionOutput: (sessionId: string) =>
        get().sessionOutputs.get(sessionId) || '',
      getMachineSessions: (machineId: string) =>
        get().sessions.filter((s) => s.machineId === machineId),

      // Actions
      fetchSessions: async (machineId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await sessionsApi.list(machineId);
          set((state) => ({
            sessions: [
              ...state.sessions.filter((s) => s.machineId !== machineId),
              ...response.data!,
            ],
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch sessions';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      fetchSession: async (id: string) => {
        const response = await sessionsApi.get(id);
        const session = response.data!;

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? session : s
          ),
        }));

        return session;
      },

      createSession: async (machineId: string, data: CreateSessionRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await sessionsApi.create(machineId, data);
          const session = response.data!;

          set((state) => ({
            sessions: [...state.sessions, session],
            activeSessionIds: new Set([...state.activeSessionIds, session.id]),
            isLoading: false,
          }));

          // Subscribe to real-time updates
          get().subscribeToSession(session.id);

          return session;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to create session';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      terminateSession: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          await sessionsApi.delete(id);

          set((state) => {
            const newActiveIds = new Set(state.activeSessionIds);
            newActiveIds.delete(id);

            return {
              sessions: state.sessions.map((s) =>
                s.id === id ? { ...s, status: 'terminated' as SessionStatus } : s
              ),
              activeSessionIds: newActiveIds,
              isLoading: false,
            };
          });

          // Unsubscribe from updates
          websocket.unsubscribeFromSession(id);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to terminate session';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      selectSession: (id: string | null) => {
        set({ selectedSessionId: id });
      },

      appendOutput: (sessionId: string, data: string) => {
        set((state) => {
          const currentOutput = state.sessionOutputs.get(sessionId) || '';
          let newOutput = currentOutput + data;

          // Trim if exceeds max length
          if (newOutput.length > MAX_OUTPUT_LENGTH) {
            newOutput = newOutput.slice(-MAX_OUTPUT_LENGTH);
          }

          const newOutputs = new Map(state.sessionOutputs);
          newOutputs.set(sessionId, newOutput);

          return { sessionOutputs: newOutputs };
        });
      },

      clearOutput: (sessionId: string) => {
        set((state) => {
          const newOutputs = new Map(state.sessionOutputs);
          newOutputs.delete(sessionId);
          return { sessionOutputs: newOutputs };
        });
      },

      updateSessionStatus: (id: string, status: SessionStatus) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        }));
      },

      subscribeToSession: (sessionId: string) => {
        // Subscribe to WebSocket updates
        websocket.subscribeToSession(sessionId);

        const unsubscribeOutput = websocket.on(
          'session:output',
          (payload: { sessionId: string; data: string }) => {
            if (payload.sessionId === sessionId) {
              get().appendOutput(sessionId, payload.data);
            }
          }
        );

        const unsubscribeStatus = websocket.on(
          'session:status',
          (payload: { sessionId: string; status: SessionStatus }) => {
            if (payload.sessionId === sessionId) {
              get().updateSessionStatus(sessionId, payload.status);
            }
          }
        );

        const unsubscribeEnded = websocket.on(
          'session:ended',
          (payload: { sessionId: string; exitCode: number }) => {
            if (payload.sessionId === sessionId) {
              get().updateSessionStatus(sessionId, 'completed');
              set((state) => {
                const newActiveIds = new Set(state.activeSessionIds);
                newActiveIds.delete(sessionId);
                return { activeSessionIds: newActiveIds };
              });
            }
          }
        );

        // Return cleanup function
        return () => {
          unsubscribeOutput();
          unsubscribeStatus();
          unsubscribeEnded();
          websocket.unsubscribeFromSession(sessionId);
        };
      },

      sendInput: (sessionId: string, data: string) => {
        websocket.sendSessionInput(sessionId, data);
      },

      resizeSession: (sessionId: string, cols: number, rows: number) => {
        websocket.resizeSession(sessionId, cols, rows);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sessions-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        selectedSessionId: state.selectedSessionId,
      }),
    }
  )
);
