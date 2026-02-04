import { api } from '@/composables/useApi';
import type { 
  ApiResponse, 
  Session, 
  SessionLog, 
  CreateSessionPayload, 
  ResizeSessionPayload, 
  SessionInputPayload,
  WebSocketConfig 
} from '@/types';

// Helper to extract data from response
function extractData<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error('API request failed');
  }
  return response.data.data;
}

// ============================================================================
// Sessions API
// ============================================================================

export const sessionsApi = {
  /**
   * List sessions for a machine
   */
  async list(machineId: string, page = 1, perPage = 20): Promise<{ sessions: Session[]; meta: { pagination: NonNullable<ApiResponse<unknown>['meta']['pagination']> } }> {
    const response = await api.get<ApiResponse<Session[]>>(`/machines/${machineId}/sessions`, {
      params: { page, per_page: perPage },
    });
    return {
      sessions: extractData(response),
      meta: response.data.meta as { pagination: NonNullable<ApiResponse<unknown>['meta']['pagination']> },
    };
  },

  /**
   * Create a new session
   */
  async create(machineId: string, payload: CreateSessionPayload): Promise<Session> {
    const response = await api.post<ApiResponse<Session>>(`/machines/${machineId}/sessions`, payload);
    return extractData(response);
  },

  /**
   * Get session details
   */
  async get(sessionId: string): Promise<Session> {
    const response = await api.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
    return extractData(response);
  },

  /**
   * Terminate a session
   */
  async terminate(sessionId: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/sessions/${sessionId}`);
  },

  /**
   * Get session logs
   */
  async logs(sessionId: string, page = 1, perPage = 100): Promise<{ logs: SessionLog[]; meta: { pagination: NonNullable<ApiResponse<unknown>['meta']['pagination']> } }> {
    const response = await api.get<ApiResponse<SessionLog[]>>(`/sessions/${sessionId}/logs`, {
      params: { page, per_page: perPage },
    });
    return {
      logs: extractData(response),
      meta: response.data.meta as { pagination: NonNullable<ApiResponse<unknown>['meta']['pagination']> },
    };
  },

  /**
   * Attach to a running session (get WebSocket token)
   */
  async attach(sessionId: string): Promise<WebSocketConfig> {
    const response = await api.post<ApiResponse<WebSocketConfig>>(`/sessions/${sessionId}/attach`);
    return extractData(response);
  },

  /**
   * Send input to a session
   */
  async sendInput(sessionId: string, data: string): Promise<void> {
    const payload: SessionInputPayload = { data };
    await api.post<ApiResponse<null>>(`/sessions/${sessionId}/input`, payload);
  },

  /**
   * Resize session PTY
   */
  async resize(sessionId: string, cols: number, rows: number): Promise<{ pty_size: { cols: number; rows: number } }> {
    const payload: ResizeSessionPayload = { cols, rows };
    const response = await api.post<ApiResponse<{ pty_size: { cols: number; rows: number } }>>(`/sessions/${sessionId}/resize`, payload);
    return extractData(response);
  },
};

// ============================================================================
// Machines API
// ============================================================================

export interface MachineApi {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'connecting';
  platform?: string;
  hostname?: string;
  arch?: string;
  max_sessions?: number;
  active_sessions_count?: number;
  capabilities?: string[];
}

export const machinesApi = {
  /**
   * List all machines
   */
  async list(): Promise<MachineApi[]> {
    const response = await api.get<ApiResponse<MachineApi[]>>('/machines');
    return extractData(response);
  },

  /**
   * Get machine details
   */
  async get(machineId: string): Promise<MachineApi> {
    const response = await api.get<ApiResponse<MachineApi>>(`/machines/${machineId}`);
    return extractData(response);
  },
};

export default api;
