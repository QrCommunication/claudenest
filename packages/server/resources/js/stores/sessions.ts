import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { 
  Session, 
  SessionLog, 
  CreateSessionPayload, 
  SessionStatus 
} from '@/types';
import { sessionsApi, machinesApi, type MachineApi } from '@/services/api';

interface SimpleMachine {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'connecting';
}

export interface SessionsState {
  sessions: Session[];
  currentSession: Session | null;
  logs: SessionLog[];
  machines: SimpleMachine[];
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useSessionsStore = defineStore('sessions', () => {
  // ============================================================================
  // State
  // ============================================================================
  
  const sessions = ref<Session[]>([]);
  const currentSession = ref<Session | null>(null);
  const logs = ref<SessionLog[]>([]);
  const machines = ref<SimpleMachine[]>([]);
  const isLoading = ref(false);
  const isConnecting = ref(false);
  const error = ref<string | null>(null);

  // ============================================================================
  // Getters
  // ============================================================================
  
  const runningSessions = computed(() => 
    sessions.value.filter(s => s.is_running)
  );
  
  const completedSessions = computed(() => 
    sessions.value.filter(s => s.is_completed)
  );
  
  const sessionsByMachine = computed(() => {
    const grouped = new Map<string, Session[]>();
    
    sessions.value.forEach(session => {
      const machineId = session.machine_id;
      if (!grouped.has(machineId)) {
        grouped.set(machineId, []);
      }
      grouped.get(machineId)!.push(session);
    });
    
    return grouped;
  });

  const getSessionById = computed(() => (id: string) => 
    sessions.value.find(s => s.id === id)
  );

  const getMachineById = computed(() => (id: string) => 
    machines.value.find(m => m.id === id)
  );

  // ============================================================================
  // Actions
  // ============================================================================
  
  /**
   * Fetch all machines
   */
  async function fetchMachines(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const data = await machinesApi.list();
      machines.value = data.map((m: MachineApi) => ({
        id: m.id,
        name: m.name,
        status: m.status,
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch machines';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch sessions for a machine
   */
  async function fetchSessions(machineId: string, page = 1): Promise<void> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const { sessions: data } = await sessionsApi.list(machineId, page);
      
      if (page === 1) {
        sessions.value = data;
      } else {
        sessions.value.push(...data);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sessions';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create a new session
   */
  async function createSession(machineId: string, payload: CreateSessionPayload): Promise<Session> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const session = await sessionsApi.create(machineId, payload);
      sessions.value.unshift(session);
      return session;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create session';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch session details
   */
  async function fetchSession(sessionId: string): Promise<Session> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const session = await sessionsApi.get(sessionId);
      currentSession.value = session;
      
      // Update in sessions list if exists
      const index = sessions.value.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        sessions.value[index] = session;
      }
      
      return session;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch session';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Terminate a session
   */
  async function terminateSession(sessionId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    
    try {
      await sessionsApi.terminate(sessionId);
      
      // Update local state
      const index = sessions.value.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        sessions.value[index] = {
          ...sessions.value[index],
          status: 'terminated' as SessionStatus,
          is_running: false,
          is_completed: true,
          completed_at: new Date().toISOString(),
        };
      }
      
      if (currentSession.value?.id === sessionId) {
        currentSession.value = {
          ...currentSession.value,
          status: 'terminated' as SessionStatus,
          is_running: false,
          is_completed: true,
          completed_at: new Date().toISOString(),
        };
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to terminate session';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch session logs
   */
  async function fetchLogs(sessionId: string, page = 1): Promise<void> {
    if (page === 1) {
      isLoading.value = true;
    }
    error.value = null;
    
    try {
      const { logs: data } = await sessionsApi.logs(sessionId, page);
      
      if (page === 1) {
        logs.value = data;
      } else {
        logs.value.push(...data);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch logs';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Attach to a running session
   */
  async function attachSession(sessionId: string): Promise<{ wsToken: string; wsUrl: string }> {
    isConnecting.value = true;
    error.value = null;
    
    try {
      const config = await sessionsApi.attach(sessionId);
      return {
        wsToken: config.ws_token || config.token || '',
        wsUrl: config.ws_url || config.wsUrl || '',
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to attach to session';
      throw err;
    } finally {
      isConnecting.value = false;
    }
  }

  /**
   * Resize session PTY
   */
  async function resizeSession(sessionId: string, cols: number, rows: number): Promise<void> {
    try {
      await sessionsApi.resize(sessionId, cols, rows);
      
      // Update local state
      if (currentSession.value?.id === sessionId) {
        currentSession.value.pty_size = { cols, rows };
      }
    } catch (err) {
      console.error('Failed to resize session:', err);
      throw err;
    }
  }

  /**
   * Add a log entry locally (for WebSocket updates)
   */
  function addLogEntry(log: SessionLog): void {
    logs.value.push(log);
  }

  /**
   * Update session status locally (for WebSocket updates)
   */
  function updateSessionStatus(sessionId: string, status: SessionStatus): void {
    const index = sessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions.value[index].status = status;
      sessions.value[index].is_running = ['running', 'waiting_input'].includes(status);
      sessions.value[index].is_completed = ['completed', 'error', 'terminated'].includes(status);
    }
    
    if (currentSession.value?.id === sessionId) {
      currentSession.value.status = status;
      currentSession.value.is_running = ['running', 'waiting_input'].includes(status);
      currentSession.value.is_completed = ['completed', 'error', 'terminated'].includes(status);
    }
  }

  /**
   * Clear current session
   */
  function clearCurrentSession(): void {
    currentSession.value = null;
    logs.value = [];
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Reset store state
   */
  function reset(): void {
    sessions.value = [];
    currentSession.value = null;
    logs.value = [];
    machines.value = [];
    isLoading.value = false;
    isConnecting.value = false;
    error.value = null;
  }

  // ============================================================================
  // Return
  // ============================================================================
  
  return {
    // State
    sessions,
    currentSession,
    logs,
    machines,
    isLoading,
    isConnecting,
    error,
    
    // Getters
    runningSessions,
    completedSessions,
    sessionsByMachine,
    getSessionById,
    getMachineById,
    
    // Actions
    fetchMachines,
    fetchSessions,
    createSession,
    fetchSession,
    terminateSession,
    fetchLogs,
    attachSession,
    resizeSession,
    addLogEntry,
    updateSessionStatus,
    clearCurrentSession,
    clearError,
    reset,
  };
});

export default useSessionsStore;
