/**
 * API Client Service
 * Handles all HTTP communication with the ClaudeNest server
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse, ApiError } from "@/types";

// Lazy import to break require cycle: authStore → api → authStore
// getAuthStore().getState() is accessed at runtime, not at import time
const getAuthStore = () => require("@/stores/authStore").useAuthStore;

// API Configuration — override via EXPO_PUBLIC_API_URL in .env
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://claudenest.io";
// Server routes are /api/* (no /v1 prefix)

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getAuthStore().getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized — session expired, force re-login.
    // Public auth endpoints are excluded: a 401 there means invalid
    // credentials / expired MFA token, not an expired session.
    const requestUrl = originalRequest?.url ?? "";
    const isPublicAuthRoute =
      requestUrl === "/auth/login" ||
      requestUrl === "/auth/mfa/verify" ||
      requestUrl === "/auth/mfa/resend";
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRoute
    ) {
      originalRequest._retry = true;
      getAuthStore().getState().logout();
    }

    // Format error for consistent handling
    const apiError: ApiError = {
      code: error.response?.data?.error?.code || "UNKNOWN_ERROR",
      message:
        error.response?.data?.error?.message ||
        error.message ||
        "An unexpected error occurred",
      status: error.response?.status || 500,
    };

    return Promise.reject(apiError);
  },
);

// Generic API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data),
};

/**
 * Extract the server-side API error code (e.g. "PLAN_001", "MCH_002") from
 * any error raised by this client. Handles both the flattened ApiError shape
 * produced by the response interceptor ({ code, message, status }) and a raw
 * AxiosError (error.response.data.error.code). Returns null when the server
 * did not provide a code.
 */
export const getApiErrorCode = (err: unknown): string | null => {
  if (typeof err !== "object" || err === null) return null;

  // Flattened ApiError from the response interceptor above. "UNKNOWN_ERROR"
  // is the interceptor's fallback when the server sent no code — report null
  // so callers can distinguish "no server code" from a real contract code.
  const flat = err as Partial<ApiError>;
  if (typeof flat.code === "string" && flat.code !== "UNKNOWN_ERROR") {
    return flat.code;
  }

  // Raw AxiosError shape (errors that bypassed the interceptor).
  const raw = err as { response?: { data?: { error?: { code?: unknown } } } };
  const code = raw.response?.data?.error?.code;
  return typeof code === "string" ? code : null;
};

// Auth contract shapes
export interface LoginSuccessData {
  user: import("@/types").User;
  token: string;
  expires_at: string;
}

// Returned by POST /auth/login when MFA is enabled for the account.
// No token is issued yet — the client must call POST /auth/mfa/verify.
export interface MfaChallengeData {
  mfa_required: true;
  mfa_method: "email" | "totp";
  mfa_token: string;
}

// Specific API endpoints
export const authApi = {
  loginWithPassword: (email: string, password: string) =>
    api.post<LoginSuccessData | MfaChallengeData>("/auth/login", {
      email,
      password,
    }),

  // code = 6-digit TOTP, 6-digit email OTP, or a recovery code.
  // After 5 failures the mfa_token is invalidated server-side (re-login).
  verifyMfa: (mfaToken: string, code: string) =>
    api.post<LoginSuccessData>("/auth/mfa/verify", {
      mfa_token: mfaToken,
      code,
    }),

  // Email method only — resends the OTP using a live mfa_token.
  resendMfa: (mfaToken: string) =>
    api.post<{ message: string }>("/auth/mfa/resend", {
      mfa_token: mfaToken,
    }),

  // Single-use 60s ticket for the /ws/terminal WebSocket — the bearer token
  // must never transit in a URL (proxy/nginx access logs).
  wsTicket: () =>
    api.post<{ ticket: string; expires_in: number }>("/auth/ws-ticket"),

  logout: () => api.post("/auth/logout"),

  me: () => api.get<import("@/types").User>("/auth/me"),
};

export const machinesApi = {
  list: () => api.get<import("@/types").Machine[]>("/machines"),

  get: (id: string) => api.get<import("@/types").Machine>(`/machines/${id}`),

  create: (data: { name: string; token: string }) =>
    api.post<import("@/types").Machine>("/machines", data),

  update: (id: string, data: Partial<import("@/types").Machine>) =>
    api.patch<import("@/types").Machine>(`/machines/${id}`, data),

  delete: (id: string) => api.delete(`/machines/${id}`),

  wake: (id: string) => api.post(`/machines/${id}/wake`),

  getEnvironment: (id: string) =>
    api.get<import("@/types").MachineCapabilities>(
      `/machines/${id}/environment`,
    ),

  // Browse the machine's remote filesystem. Omit `path` to start at the
  // user's home directory (the agent resolves ~ and returns home_path).
  browse: (id: string, params?: { path?: string; show_hidden?: boolean }) =>
    api.get<import("@/types").BrowseResult>(`/machines/${id}/browse`, {
      params: {
        dirs_only: true,
        ...(params?.path ? { path: params.path } : {}),
        ...(params?.show_hidden ? { show_hidden: true } : {}),
      },
    }),

  // Single page of skills. Server defaults to per_page=15, so always pass a
  // large page size when a full list is wanted (see getAllSkills).
  getSkills: (
    id: string,
    params?: {
      search?: string;
      category?: string;
      enabled?: boolean;
      page?: number;
      per_page?: number;
    },
  ) =>
    api.get<import("@/types").Skill[]>(`/machines/${id}/skills`, {
      params: {
        per_page: params?.per_page ?? 200,
        ...(params?.page ? { page: params.page } : {}),
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.category ? { category: params.category } : {}),
        ...(params?.enabled !== undefined ? { enabled: params.enabled } : {}),
      },
    }),

  // Fetch EVERY skill the agent reported, paginating through all pages so the
  // UI never silently caps at the server's default page size.
  getAllSkills: async (id: string): Promise<import("@/types").Skill[]> => {
    const first = await machinesApi.getSkills(id, { page: 1, per_page: 200 });
    const all = [...(first.data ?? [])];
    const lastPage =
      (first.meta as { pagination?: { last_page?: number } } | undefined)
        ?.pagination?.last_page ?? 1;
    for (let page = 2; page <= lastPage; page++) {
      const res = await machinesApi.getSkills(id, { page, per_page: 200 });
      all.push(...(res.data ?? []));
    }
    return all;
  },

  getMCP: (id: string) =>
    api.get<import("@/types").MCPServer[]>(`/machines/${id}/mcp`),

  getCommands: (id: string) => api.get<string[]>(`/machines/${id}/commands`),
};

export const pairingApi = {
  complete: (code: string, name?: string) =>
    api.post<{
      machine: import("@/types").Machine;
      pairing: { code: string; completed_at: string };
    }>(`/pairing/${code}/complete`, name ? { name } : undefined),
};

export const sessionsApi = {
  list: (machineId: string) =>
    api.get<import("@/types").Session[]>(`/machines/${machineId}/sessions`),

  get: (id: string) => api.get<import("@/types").Session>(`/sessions/${id}`),

  create: (machineId: string, data: import("@/types").CreateSessionRequest) =>
    api.post<import("@/types").Session>(
      `/machines/${machineId}/sessions`,
      data,
    ),

  delete: (id: string) => api.delete(`/sessions/${id}`),

  getLogs: (id: string, params?: { limit?: number; before?: string }) =>
    api.get<import("@/types").SessionLog[]>(`/sessions/${id}/logs`, { params }),

  attach: (id: string) => api.post(`/sessions/${id}/attach`),
};

// Claude sessions discovered on a machine (the user's own running/past sessions)
export const claudeSessionsApi = {
  list: (machineId: string, liveOnly = false) =>
    api.get<import("@/types").DiscoveredSession[]>(
      `/machines/${machineId}/claude-sessions`,
      { params: { live_only: liveOnly ? 1 : 0 } },
    ),

  refresh: (machineId: string) =>
    api.post<import("@/types").DiscoveredSession[]>(
      `/machines/${machineId}/claude-sessions/refresh`,
    ),

  adopt: (machineId: string, sessionId: string, credentialId?: string | null) =>
    api.post<{
      session_id: string;
      agent_session_id: string;
      session: import("@/types").Session;
    }>(`/machines/${machineId}/claude-sessions/${sessionId}/adopt`, {
      credential_id: credentialId ?? null,
    }),
};

export const projectsApi = {
  list: (machineId: string) =>
    api.get<import("@/types").SharedProject[]>(
      `/machines/${machineId}/projects`,
    ),

  listArchived: (machineId: string) =>
    api.get<import("@/types").SharedProject[]>(
      `/machines/${machineId}/projects`,
      { params: { archived: true } },
    ),

  archive: (id: string) =>
    api.post<import("@/types").SharedProject>(`/projects/${id}/archive`),

  unarchive: (id: string) =>
    api.post<import("@/types").SharedProject>(`/projects/${id}/unarchive`),

  recover: (id: string) =>
    api.post<import("@/types").SharedProject>(`/projects/${id}/recover`),

  get: (id: string) =>
    api.get<import("@/types").SharedProject>(`/projects/${id}`),

  create: (machineId: string, data: { name: string; projectPath: string }) =>
    api.post<import("@/types").SharedProject>(
      `/machines/${machineId}/projects`,
      data,
    ),

  update: (id: string, data: Partial<import("@/types").SharedProject>) =>
    api.patch<import("@/types").SharedProject>(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),

  getContext: (id: string) =>
    api.get<{
      summary: string;
      architecture: string;
      conventions: string;
      currentFocus: string;
      recentChanges: string;
    }>(`/projects/${id}/context`),

  queryContext: (id: string, query: string) =>
    api.post<import("@/types").ContextChunk[]>(
      `/projects/${id}/context/query`,
      { query },
    ),

  updateContext: (id: string, data: Partial<import("@/types").SharedProject>) =>
    api.patch(`/projects/${id}/context`, data),

  getChunks: (id: string, params?: { type?: string; limit?: number }) =>
    api.get<import("@/types").ContextChunk[]>(
      `/projects/${id}/context/chunks`,
      { params },
    ),

  summarize: (id: string) =>
    api.post<{ summary: string }>(`/projects/${id}/context/summarize`),

  getInstances: (id: string) =>
    api.get<import("@/types").ClaudeInstance[]>(`/projects/${id}/instances`),

  getActivity: (id: string, params?: { limit?: number }) =>
    api.get<import("@/types").ActivityLog[]>(`/projects/${id}/activity`, {
      params,
    }),

  broadcast: (id: string, message: string) =>
    api.post(`/projects/${id}/broadcast`, { message }),

  // Sessions attached to a shared project. The optional status filter is
  // sent as CSV per the server contract (?status=running,waiting_input).
  sessions: (projectId: string, status?: string[]) =>
    api.get<import("@/types").Session[]>(`/projects/${projectId}/sessions`, {
      params:
        status && status.length > 0 ? { status: status.join(",") } : undefined,
    }),
};

export const tasksApi = {
  list: (projectId: string) =>
    api.get<import("@/types").SharedTask[]>(`/projects/${projectId}/tasks`),

  get: (id: string) => api.get<import("@/types").SharedTask>(`/tasks/${id}`),

  create: (projectId: string, data: Partial<import("@/types").SharedTask>) =>
    api.post<import("@/types").SharedTask>(
      `/projects/${projectId}/tasks`,
      data,
    ),

  update: (id: string, data: Partial<import("@/types").SharedTask>) =>
    api.patch<import("@/types").SharedTask>(`/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/tasks/${id}`),

  claim: (id: string, instanceId: string) =>
    api.post<import("@/types").SharedTask>(`/tasks/${id}/claim`, {
      instance_id: instanceId,
    }),

  release: (id: string) => api.post(`/tasks/${id}/release`),

  complete: (id: string, summary: string, filesModified: string[]) =>
    api.post<import("@/types").SharedTask>(`/tasks/${id}/complete`, {
      summary,
      files_modified: filesModified,
    }),

  getSubtasks: (id: string) =>
    api.get<import("@/types").SharedTask[]>(`/tasks/${id}/subtasks`),

  move: (
    id: string,
    data: {
      epic_id?: string | null;
      sprint_id?: string | null;
      sort_order?: number;
    },
  ) => api.post<import("@/types").SharedTask>(`/tasks/${id}/move`, data),
};

export const planningApi = {
  getContext: (projectId: string) =>
    api.get<{ context: string; suggestions: string[] }>(
      `/projects/${projectId}/planning/context`,
    ),

  execute: (
    projectId: string,
    data: { prompt: string; options?: Record<string, unknown> },
  ) =>
    api.post<{ result: string }>(
      `/projects/${projectId}/planning/execute`,
      data,
    ),

  // Spawns an interactive planning session for the project (HTTP 201).
  // Errors: 400 machine offline, 403 PLAN_001 — see getApiErrorCode().
  createSession: (
    projectId: string,
    data: import("@/types").PlanningSessionRequest,
  ) =>
    api.post<import("@/types").Session>(
      `/projects/${projectId}/planning/session`,
      data,
    ),
};

export const runnerApi = {
  getHealth: (projectId: string) =>
    api.get<{ status: string; details: Record<string, unknown> }>(
      `/projects/${projectId}/runner/health`,
    ),

  autoUpdate: (projectId: string) =>
    api.post<{ updated: boolean; message: string }>(
      `/projects/${projectId}/runner/auto-update`,
    ),

  getProgress: (projectId: string) =>
    api.get<{
      progress: number;
      current_task: string | null;
      details: Record<string, unknown>;
    }>(`/projects/${projectId}/runner/progress`),
};

// Multi-agent orchestrator (server contract v1.5). Orchestration no longer
// goes through runnerApi — these endpoints own the worker pool lifecycle.
// Error codes: 403 PLAN_001 (plan cap exceeded), 422 MCH_002 (machine
// offline) — read them with getApiErrorCode().
export const orchestratorApi = {
  start: (
    projectId: string,
    data: import("@/types").OrchestratorStartRequest,
  ) =>
    api.post<import("@/types").OrchestratorStatus>(
      `/projects/${projectId}/orchestrator/start`,
      data,
    ),

  stop: (projectId: string) =>
    api.post<import("@/types").OrchestratorStatus>(
      `/projects/${projectId}/orchestrator/stop`,
    ),

  status: (projectId: string) =>
    api.get<import("@/types").OrchestratorStatus>(
      `/projects/${projectId}/orchestrator/status`,
    ),
};

export const epicsApi = {
  list: (projectId: string) =>
    api.get<import("@/types").Epic[]>(`/projects/${projectId}/epics`),

  get: (id: string) => api.get<import("@/types").Epic>(`/epics/${id}`),

  create: (projectId: string, data: Partial<import("@/types").Epic>) =>
    api.post<import("@/types").Epic>(`/projects/${projectId}/epics`, data),

  update: (id: string, data: Partial<import("@/types").Epic>) =>
    api.patch<import("@/types").Epic>(`/epics/${id}`, data),

  delete: (id: string) => api.delete(`/epics/${id}`),

  reorder: (id: string, sortOrder: number) =>
    api.post(`/epics/${id}/reorder`, { sort_order: sortOrder }),
};

export const sprintsApi = {
  list: (projectId: string) =>
    api.get<import("@/types").Sprint[]>(`/projects/${projectId}/sprints`),

  get: (id: string) => api.get<import("@/types").Sprint>(`/sprints/${id}`),

  create: (projectId: string, data: Partial<import("@/types").Sprint>) =>
    api.post<import("@/types").Sprint>(`/projects/${projectId}/sprints`, data),

  update: (id: string, data: Partial<import("@/types").Sprint>) =>
    api.patch<import("@/types").Sprint>(`/sprints/${id}`, data),

  delete: (id: string) => api.delete(`/sprints/${id}`),

  start: (id: string) =>
    api.post<import("@/types").Sprint>(`/sprints/${id}/start`),

  complete: (id: string) =>
    api.post<import("@/types").Sprint>(`/sprints/${id}/complete`),

  getBurndown: (id: string) =>
    api.get<{
      sprint: import("@/types").Sprint;
      burndown: import("@/types").BurndownDataPoint[];
    }>(`/sprints/${id}/burndown`),
};

export const locksApi = {
  list: (projectId: string) =>
    api.get<import("@/types").FileLock[]>(`/projects/${projectId}/locks`),

  create: (projectId: string, path: string, reason?: string) =>
    api.post<import("@/types").FileLock>(`/projects/${projectId}/locks`, {
      path,
      reason,
    }),

  delete: (projectId: string, path: string) =>
    api.delete(`/projects/${projectId}/locks/${path}`),

  forceDelete: (projectId: string, path: string) =>
    api.delete(`/projects/${projectId}/locks/${path}/force`),
};

export const credentialsApi = {
  list: () => apiClient.get("/credentials"),

  get: (id: string) => apiClient.get(`/credentials/${id}`),

  create: (data: {
    name: string;
    auth_type: "api_key" | "oauth";
    claude_dir_mode: "shared" | "isolated";
    api_key?: string;
    access_token?: string;
    refresh_token?: string;
  }) => apiClient.post("/credentials", data),

  update: (
    id: string,
    data: {
      name?: string;
      api_key?: string;
      access_token?: string;
      refresh_token?: string;
      claude_dir_mode?: "shared" | "isolated";
    },
  ) => apiClient.patch(`/credentials/${id}`, data),

  delete: (id: string) => apiClient.delete(`/credentials/${id}`),

  setDefault: (id: string) => apiClient.patch(`/credentials/${id}/default`),

  test: (id: string) => apiClient.post(`/credentials/${id}/test`),

  refresh: (id: string) => apiClient.post(`/credentials/${id}/refresh`),

  initiateOAuth: (id: string) =>
    apiClient.post(`/credentials/${id}/oauth/initiate`),
};

// ============================================================
// Git worktree + pull requests (server proxies to the sandboxed agent)
// ============================================================
export const gitApi = {
  status: (projectId: string) =>
    api.get<import("@/types").GitStatus>(`/projects/${projectId}/git/status`),

  pulls: (projectId: string) =>
    api.get<{
      pulls: import("@/types").PullRequest[];
      sandboxed: boolean;
    }>(`/projects/${projectId}/pulls`),

  merge: (
    projectId: string,
    number: number,
    method: import("@/types").MergeMethod = "squash",
    deleteBranch = true,
  ) =>
    api.post<{ merged: boolean; number: number; sandboxed: boolean }>(
      `/projects/${projectId}/pulls/${number}/merge`,
      { method, delete_branch: deleteBranch },
    ),
};

// ============================================================
// Audit trail (paginated activity log, no plan gating)
// ============================================================
export const auditApi = {
  list: (
    projectId: string,
    params?: {
      page?: number;
      per_page?: number;
      type?: string;
      instance_id?: string;
      from?: string;
      to?: string;
    },
  ) =>
    api.get<import("@/types").AuditEntry[]>(`/projects/${projectId}/audit`, {
      params,
    }),
};

export default apiClient;
