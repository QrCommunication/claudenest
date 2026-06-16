/**
 * Orchestrator Store - Zustand
 * Multi-agent orchestration state, aligned on the v1.5 server contract
 * (/projects/{id}/orchestrator/start|stop|status).
 *
 * Orchestration no longer goes through runnerApi — the runner endpoints
 * still exist server-side (health/progress) but are NOT used here anymore.
 */

import { create } from "zustand";
import { getApiErrorCode, orchestratorApi } from "@/services/api";
import type {
  OrchestratorStartRequest,
  OrchestratorStatus,
  SpawnWorkerRequest,
} from "@/types";

/**
 * Payload of an orchestrator instance update pushed over WebSocket.
 * The websocket handler (owned by another module) calls
 * `useOrchestratorStore.getState().applyInstanceUpdate(payload)` with this
 * exact snake_case shape (server event payload, forwarded untouched).
 */
export interface OrchestratorInstanceUpdate {
  id: string;
  status: string;
  current_task_id: string | null;
  session_id: string | null;
}

interface OrchestratorState {
  // State
  status: OrchestratorStatus | null;
  isLoading: boolean;
  error: string | null;
  /** Server error code of the last failed action (e.g. 'PLAN_001', 'MCH_002'). */
  errorCode: string | null;

  // Actions
  start: (projectId: string, opts: OrchestratorStartRequest) => Promise<void>;
  stop: (projectId: string) => Promise<void>;
  fetchStatus: (projectId: string) => Promise<void>;
  /**
   * Spawn one extra orchestrated worker on demand. Refreshes the status so the
   * new worker appears (the POST returns the worker Session, not the pool
   * status). Errors surface 'MACHINE_OFFLINE' (422) via errorCode.
   */
  spawnWorker: (projectId: string, opts?: SpawnWorkerRequest) => Promise<void>;
  /** Terminate a single worker by its session id, then refresh the status. */
  terminateWorker: (projectId: string, sessionId: string) => Promise<void>;
  applyInstanceUpdate: (payload: OrchestratorInstanceUpdate) => void;
  clearError: () => void;
}

/**
 * Build the error slice from an unknown rejection. The axios interceptor
 * rejects with a flattened ApiError (plain object, NOT an Error instance),
 * so the message is read structurally rather than via `instanceof Error`.
 */
const toErrorState = (err: unknown, fallback: string) => {
  const message =
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message
      : fallback;
  return { error: message, errorCode: getApiErrorCode(err) };
};

export const useOrchestratorStore = create<OrchestratorState>()((set, get) => ({
  // Initial state
  status: null,
  isLoading: false,
  error: null,
  errorCode: null,

  // Actions
  start: async (projectId, opts) => {
    set({ isLoading: true, error: null, errorCode: null });

    try {
      const response = await orchestratorApi.start(projectId, opts);
      set({ status: response.data ?? null, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        ...toErrorState(err, "Failed to start orchestrator"),
      });
      throw err;
    }
  },

  stop: async (projectId) => {
    set({ isLoading: true, error: null, errorCode: null });

    try {
      const response = await orchestratorApi.stop(projectId);

      if (response.data) {
        set({ status: response.data, isLoading: false });
      } else {
        // No status body — patch the local snapshot; the next fetchStatus
        // re-syncs with the server truth.
        const current = get().status;
        const next: OrchestratorStatus | null = current
          ? { ...current, status: "stopped", active: false }
          : null;
        set({ status: next, isLoading: false });
      }
    } catch (err) {
      set({
        isLoading: false,
        ...toErrorState(err, "Failed to stop orchestrator"),
      });
      throw err;
    }
  },

  fetchStatus: async (projectId) => {
    set({ isLoading: true, error: null, errorCode: null });

    try {
      const response = await orchestratorApi.status(projectId);
      set({ status: response.data ?? null, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        ...toErrorState(err, "Failed to fetch orchestrator status"),
      });
      throw err;
    }
  },

  spawnWorker: async (projectId, opts) => {
    set({ isLoading: true, error: null, errorCode: null });

    try {
      // The POST returns the new worker Session (not the pool status); refresh
      // the orchestrator status so the worker shows up in the list.
      await orchestratorApi.spawnWorker(projectId, opts);
      await get().fetchStatus(projectId);
    } catch (err) {
      set({
        isLoading: false,
        ...toErrorState(err, "Failed to spawn worker"),
      });
      throw err;
    }
  },

  terminateWorker: async (projectId, sessionId) => {
    set({ isLoading: true, error: null, errorCode: null });

    try {
      await orchestratorApi.terminateWorker(projectId, sessionId);
      // Re-sync with server truth (the worker leaves the pool); a `.session.*`
      // / `.instance.updated` push may also arrive and patch in place.
      await get().fetchStatus(projectId);
    } catch (err) {
      set({
        isLoading: false,
        ...toErrorState(err, "Failed to terminate worker"),
      });
      throw err;
    }
  },

  applyInstanceUpdate: (payload) => {
    const current = get().status;
    if (!current) return;

    let changed = false;
    const workers = current.workers.map((worker) => {
      if (worker.id !== payload.id) return worker;
      changed = true;
      return {
        ...worker,
        status: payload.status,
        sessionId: payload.session_id,
        currentTaskId: payload.current_task_id,
        // The push payload carries no title — keep it only while it still
        // describes the same task; fetchStatus repopulates it otherwise.
        currentTaskTitle:
          payload.current_task_id === worker.currentTaskId
            ? worker.currentTaskTitle
            : null,
      };
    });

    // Unknown worker id (e.g. spawned after the last fetch): never invent
    // partial workers locally — a fetchStatus refresh owns that case.
    if (!changed) return;

    set({ status: { ...current, workers } });
  },

  clearError: () => set({ error: null, errorCode: null }),
}));
