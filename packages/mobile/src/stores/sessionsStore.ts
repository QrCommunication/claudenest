/**
 * Sessions Store - Zustand
 * Manages session state and real-time output
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Session,
  SessionLog,
  SessionStatus,
  CreateSessionRequest,
} from "@/types";
import { sessionsApi } from "@/services/api";
import { websocket } from "@/services/websocket";

interface SessionOutput {
  sessionId: string;
  data: string;
  timestamp: number;
}

// Sessions whose output currently streams over the direct /ws/terminal
// socket. While a session is in this set, the Reverb `session:output`
// listener is muted — Reverb broadcasts go through the server-side queue
// (hundreds of ms behind the direct relay) and rendering both paths would
// duplicate every byte on screen. Mirrors the web client's gating
// (resources/js/services/websocket.ts). Module-level (not store state):
// it gates a listener, it never drives UI renders.
const directOutputSessions = new Set<string>();

interface SessionsState {
  // State
  sessions: Session[];
  sessionOutputs: Map<string, string>; // sessionId -> accumulated output
  // Monotonic count of bytes EVER appended per session. The output buffer
  // above is front-trimmed at MAX_OUTPUT_LENGTH, so consumers that stream
  // deltas (the terminal WebView) must diff on this counter, not on
  // buffer.length (which freezes once the buffer saturates).
  sessionOutputTotals: Map<string, number>;
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
  createSession: (
    machineId: string,
    data: CreateSessionRequest,
  ) => Promise<Session>;
  terminateSession: (id: string) => Promise<void>;
  selectSession: (id: string | null) => void;
  appendOutput: (sessionId: string, data: string) => void;
  setDirectOutput: (sessionId: string, enabled: boolean) => void;
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
      sessionOutputTotals: new Map(),
      activeSessionIds: new Set(),
      isLoading: false,
      error: null,
      selectedSessionId: null,

      // Getters
      selectedSession: () =>
        get().sessions.find((s) => s.id === get().selectedSessionId),
      getSessionById: (id: string) => get().sessions.find((s) => s.id === id),
      getSessionOutput: (sessionId: string) =>
        get().sessionOutputs.get(sessionId) || "",
      getMachineSessions: (machineId: string) =>
        get().sessions.filter((s) => s.machine_id === machineId),

      // Actions
      fetchSessions: async (machineId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await sessionsApi.list(machineId);
          const fresh = response.data!;
          // Dedup by id: drop this machine's stale rows AND any leftover copy
          // sharing an id (guards against persisted/legacy-shaped duplicates).
          const freshIds = new Set(fresh.map((s) => s.id));
          set((state) => ({
            sessions: [
              ...state.sessions.filter(
                (s) => s.machine_id !== machineId && !freshIds.has(s.id),
              ),
              ...fresh,
            ],
            isLoading: false,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch sessions";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      fetchSession: async (id: string) => {
        const response = await sessionsApi.get(id);
        const session = response.data!;

        // UPSERT, not just update: sessions created elsewhere (adopting a
        // discovered Claude session, deep links) are not in the list yet — a
        // map() alone was a no-op and getSessionById() stayed undefined, so
        // the Session screen spun on "Loading session..." forever.
        set((state) => ({
          sessions: state.sessions.some((s) => s.id === id)
            ? state.sessions.map((s) => (s.id === id ? session : s))
            : [...state.sessions, session],
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
            err instanceof Error ? err.message : "Failed to create session";
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
                s.id === id
                  ? { ...s, status: "terminated" as SessionStatus }
                  : s,
              ),
              activeSessionIds: newActiveIds,
              isLoading: false,
            };
          });

          // Unsubscribe from updates
          websocket.unsubscribeFromSession(id);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to terminate session";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      selectSession: (id: string | null) => {
        set({ selectedSessionId: id });
      },

      appendOutput: (sessionId: string, data: string) => {
        set((state) => {
          const currentOutput = state.sessionOutputs.get(sessionId) || "";
          let newOutput = currentOutput + data;

          // Trim if exceeds max length
          if (newOutput.length > MAX_OUTPUT_LENGTH) {
            newOutput = newOutput.slice(-MAX_OUTPUT_LENGTH);
          }

          const newOutputs = new Map(state.sessionOutputs);
          newOutputs.set(sessionId, newOutput);

          const newTotals = new Map(state.sessionOutputTotals);
          newTotals.set(
            sessionId,
            (state.sessionOutputTotals.get(sessionId) ?? 0) + data.length,
          );

          return { sessionOutputs: newOutputs, sessionOutputTotals: newTotals };
        });
      },

      setDirectOutput: (sessionId: string, enabled: boolean) => {
        if (enabled) directOutputSessions.add(sessionId);
        else directOutputSessions.delete(sessionId);
      },

      clearOutput: (sessionId: string) => {
        set((state) => {
          const newOutputs = new Map(state.sessionOutputs);
          newOutputs.delete(sessionId);
          const newTotals = new Map(state.sessionOutputTotals);
          newTotals.delete(sessionId);
          return { sessionOutputs: newOutputs, sessionOutputTotals: newTotals };
        });
      },

      updateSessionStatus: (id: string, status: SessionStatus) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, status } : s,
          ),
        }));
      },

      subscribeToSession: (sessionId: string) => {
        // Subscribe to WebSocket updates
        websocket.subscribeToSession(sessionId);

        const unsubscribeOutput = websocket.on(
          "session:output",
          (raw: unknown) => {
            const payload = raw as { sessionId: string; data: string };
            if (
              payload.sessionId === sessionId &&
              !directOutputSessions.has(sessionId)
            ) {
              get().appendOutput(sessionId, payload.data);
            }
          },
        );

        const unsubscribeStatus = websocket.on(
          "session:status",
          (raw: unknown) => {
            const payload = raw as { sessionId: string; status: SessionStatus };
            if (payload.sessionId === sessionId) {
              get().updateSessionStatus(sessionId, payload.status);
            }
          },
        );

        const unsubscribeEnded = websocket.on(
          "session:ended",
          (raw: unknown) => {
            const payload = raw as { sessionId: string; exitCode: number };
            if (payload.sessionId === sessionId) {
              get().updateSessionStatus(sessionId, "completed");
              set((state) => {
                const newActiveIds = new Set(state.activeSessionIds);
                newActiveIds.delete(sessionId);
                return { activeSessionIds: newActiveIds };
              });
            }
          },
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
      name: "sessions-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 persisted `sessions` (server state) which produced stale duplicates
      // after the camelCase→snake_case fix. Drop any persisted sessions.
      migrate: (persisted) => {
        if (
          persisted &&
          typeof persisted === "object" &&
          "sessions" in persisted
        ) {
          delete (persisted as { sessions?: unknown }).sessions;
        }
        return persisted as unknown;
      },
      // Sessions are fetched fresh from the API; never persist them.
      partialize: (state) => ({
        selectedSessionId: state.selectedSessionId,
      }),
    },
  ),
);
