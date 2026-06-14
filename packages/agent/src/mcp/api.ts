/**
 * ClaudeNest MCP API client
 * Native fetch, 10 s timeout, 1 retry on network/5xx, never on 4xx.
 * All responses are `{success, data, meta}` or `{success:false, error:{code,message}}`.
 */

/** Required environment variables – validated at boot in index.ts. */
export interface McpEnv {
  apiUrl: string;
  token: string;
  projectId: string;
  instanceId: string;
  sessionId?: string;
  projectPath?: string;
}

/** Shape of a successful server response. */
interface ApiOk<T> {
  success: true;
  data: T;
  meta: Record<string, unknown>;
}

/** Shape of an error server response. */
interface ApiError {
  success: false;
  error: { code: string; message: string };
}

type ApiResponse<T> = ApiOk<T> | ApiError;

/** Result returned by every fetch helper – either data or an error string. */
export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = AbortSignal.timeout(TIMEOUT_MS);

  // Combine caller abort + our timeout
  const signal = AbortSignal.any([controller.signal, timeout]);

  try {
    const response = await fetch(url, { ...options, signal });

    // Retry on server errors (5xx) but NOT on client errors (4xx)
    if (response.status >= 500 && retries > 0) {
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  } catch (err) {
    // Network failure / timeout → retry once
    if (retries > 0) {
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

async function apiRequest<T>(
  env: McpEnv,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<FetchResult<T>> {
  const url = `${env.apiUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Instance-ID": env.instanceId,
  };

  const options: RequestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetchWithRetry(url, options);

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      return {
        ok: false,
        error: `HTTP ${response.status}: non-JSON response from server`,
      };
    }

    // Narrow via the `success` discriminant field
    if (
      typeof raw !== "object" ||
      raw === null ||
      !("success" in raw)
    ) {
      return { ok: false, error: `HTTP ${response.status}: unexpected response shape` };
    }

    const payload = raw as ApiResponse<T>;

    if (!payload.success) {
      const err = (payload as ApiError).error;
      return { ok: false, error: `[${err.code}] ${err.message}` };
    }

    return { ok: true, data: (payload as ApiOk<T>).data };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        return { ok: false, error: "Request timed out after 10 s" };
      }
      return { ok: false, error: `Network error: ${err.message}` };
    }
    return { ok: false, error: "Unknown network error" };
  }
}

// ─── Typed wrappers ──────────────────────────────────────────────────────────

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "review"
  | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: string;
  files?: string[];
  labels?: string[];
  story_points?: number;
  dependencies?: string[];
  blocked_by?: string;
  assigned_to?: string;
  completion_summary?: string;
  due_date?: string;
}

export interface FileLockStatus {
  is_locked: boolean;
  locked_by: string | null;
}

export interface ContextChunk {
  id: string;
  content: string;
  type: string;
  instance_id?: string;
  task_id?: string;
  files?: string[];
  importance_score?: number;
  similarity?: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  project_path: string;
  summary?: string;
  architecture?: string;
  conventions?: string;
  current_focus?: string;
  recent_changes?: string;
  total_tokens?: number;
  max_tokens?: number;
  settings?: Record<string, unknown>;
}

/** GET /api/projects/{p}/tasks */
export function taskList(
  env: McpEnv,
  status?: string,
): Promise<FetchResult<Task[]>> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<Task[]>(
    env,
    "GET",
    `/api/projects/${env.projectId}/tasks${qs}`,
  );
}

/** GET /api/projects/{p}/tasks/next-available */
export function taskNextAvailable(
  env: McpEnv,
): Promise<FetchResult<Task | null>> {
  return apiRequest<Task | null>(
    env,
    "GET",
    `/api/projects/${env.projectId}/tasks/next-available`,
  );
}

/** POST /api/projects/{p}/tasks/claim-next */
export function taskClaimNext(
  env: McpEnv,
): Promise<FetchResult<Task | null>> {
  return apiRequest<Task | null>(
    env,
    "POST",
    `/api/projects/${env.projectId}/tasks/claim-next`,
    { instance_id: env.instanceId },
  );
}

/** POST /api/tasks/{id}/claim */
export function taskClaim(
  env: McpEnv,
  taskId: string,
): Promise<FetchResult<Task>> {
  return apiRequest<Task>(env, "POST", `/api/tasks/${taskId}/claim`, {
    instance_id: env.instanceId,
  });
}

/** POST /api/tasks/{id}/release */
export function taskRelease(
  env: McpEnv,
  taskId: string,
  reason?: string,
): Promise<FetchResult<Task>> {
  return apiRequest<Task>(env, "POST", `/api/tasks/${taskId}/release`, {
    reason: reason ?? null,
  });
}

/** POST /api/tasks/{id}/complete */
export function taskComplete(
  env: McpEnv,
  taskId: string,
  summary: string,
  filesModified: string[],
): Promise<FetchResult<Task>> {
  return apiRequest<Task>(env, "POST", `/api/tasks/${taskId}/complete`, {
    instance_id: env.instanceId,
    summary,
    files_modified: filesModified,
  });
}

/** POST /api/projects/{p}/locks */
export function lockAcquire(
  env: McpEnv,
  path: string,
  reason?: string,
): Promise<FetchResult<{ id: string; path: string; locked_by: string }>> {
  return apiRequest(env, "POST", `/api/projects/${env.projectId}/locks`, {
    path,
    reason,
  });
}

/** POST /api/projects/{p}/locks/release */
export function lockRelease(
  env: McpEnv,
  path: string,
): Promise<FetchResult<null>> {
  return apiRequest<null>(
    env,
    "POST",
    `/api/projects/${env.projectId}/locks/release`,
    { path, instance_id: env.instanceId },
  );
}

/** POST /api/projects/{p}/locks/check  (single path) */
export function lockCheck(
  env: McpEnv,
  path: string,
): Promise<FetchResult<FileLockStatus>> {
  return apiRequest<FileLockStatus>(
    env,
    "POST",
    `/api/projects/${env.projectId}/locks/check`,
    { path },
  );
}

/** POST /api/projects/{p}/context/query */
export function contextQuery(
  env: McpEnv,
  query: string,
  limit: number,
): Promise<FetchResult<ContextChunk[]>> {
  return apiRequest<ContextChunk[]>(
    env,
    "POST",
    `/api/projects/${env.projectId}/context/query`,
    { query, limit },
  );
}

/** POST /api/projects/{p}/context/chunks */
export function contextAdd(
  env: McpEnv,
  content: string,
  type: string,
  files: string[],
  importance: number,
): Promise<FetchResult<{ id: string; type: string; created_at: string }>> {
  return apiRequest(
    env,
    "POST",
    `/api/projects/${env.projectId}/context/chunks`,
    {
      content,
      type,
      instance_id: env.instanceId,
      files,
      importance_score: importance,
      generate_embedding: false,
    },
  );
}

/** POST /api/projects/{p}/broadcast */
export function broadcastMessage(
  env: McpEnv,
  message: string,
  type: string,
): Promise<FetchResult<unknown>> {
  return apiRequest(
    env,
    "POST",
    `/api/projects/${env.projectId}/broadcast`,
    { message, type, instance_id: env.instanceId },
  );
}

/** POST /api/instances/{i}/heartbeat */
export function instanceHeartbeat(
  env: McpEnv,
  status: "idle" | "busy" | "active",
): Promise<FetchResult<unknown>> {
  return apiRequest(
    env,
    "POST",
    `/api/instances/${env.instanceId}/heartbeat`,
    { status },
  );
}

/** GET /api/projects/{p} */
export function projectShow(env: McpEnv): Promise<FetchResult<Project>> {
  return apiRequest<Project>(
    env,
    "GET",
    `/api/projects/${env.projectId}`,
  );
}

// ─── Planning types ──────────────────────────────────────────────────────────

export interface Epic {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  status: "open" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  sort_order?: number;
  started_at?: string;
  completed_at?: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  status: "planning" | "active" | "completed" | "cancelled";
  start_date?: string;
  end_date?: string;
  velocity?: number;
  capacity?: number;
  sort_order?: number;
}

export interface PlanningContext {
  project: Project;
  tasks: Task[];
  epics: Epic[];
  sprints: Sprint[];
  stats: {
    total_tasks?: number;
    pending?: number;
    in_progress?: number;
    done?: number;
    backlog?: number;
    total_story_points?: number;
    completed_story_points?: number;
    [key: string]: unknown;
  };
}

// ─── Planning API functions ──────────────────────────────────────────────────

/** POST /api/projects/{p}/epics */
export function epicCreate(
  env: McpEnv,
  payload: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    priority?: string;
  },
): Promise<FetchResult<Epic>> {
  return apiRequest<Epic>(
    env,
    "POST",
    `/api/projects/${env.projectId}/epics`,
    payload as Record<string, unknown>,
  );
}

/** POST /api/projects/{p}/tasks */
export function taskCreate(
  env: McpEnv,
  payload: {
    title: string;
    description?: string;
    priority?: string;
    story_points?: number;
    epic_id?: string;
    sprint_id?: string;
    parent_id?: string;
    files?: string[];
    dependencies?: string[];
  },
): Promise<FetchResult<Task>> {
  return apiRequest<Task>(
    env,
    "POST",
    `/api/projects/${env.projectId}/tasks`,
    payload as Record<string, unknown>,
  );
}

/** PATCH /api/tasks/{id} */
export function taskUpdate(
  env: McpEnv,
  taskId: string,
  payload: {
    title?: string;
    description?: string;
    priority?: string;
    story_points?: number;
    epic_id?: string;
    sprint_id?: string;
    status?: string;
  },
): Promise<FetchResult<Task>> {
  return apiRequest<Task>(
    env,
    "PATCH",
    `/api/tasks/${taskId}`,
    payload as Record<string, unknown>,
  );
}

/** POST /api/projects/{p}/sprints */
export function sprintCreate(
  env: McpEnv,
  payload: {
    name: string;
    goal?: string;
    start_date?: string;
    end_date?: string;
    capacity?: number;
  },
): Promise<FetchResult<Sprint>> {
  return apiRequest<Sprint>(
    env,
    "POST",
    `/api/projects/${env.projectId}/sprints`,
    payload as Record<string, unknown>,
  );
}

/** GET /api/projects/{p}/planning/context */
export function planningContext(
  env: McpEnv,
): Promise<FetchResult<PlanningContext>> {
  return apiRequest<PlanningContext>(
    env,
    "GET",
    `/api/projects/${env.projectId}/planning/context`,
  );
}

/** Orchestrator status returned by start. */
export interface OrchestratorStatus {
  status: string;
  active: boolean;
  workers: unknown[];
  pendingTasks: number;
  completedTasks: number;
}

/** POST /api/projects/{p}/orchestrator/start — launch the worker pool. */
export function orchestratorStart(
  env: McpEnv,
  payload: { max_workers?: number; permission_mode?: string } = {},
): Promise<FetchResult<OrchestratorStatus>> {
  return apiRequest<OrchestratorStatus>(
    env,
    "POST",
    `/api/projects/${env.projectId}/orchestrator/start`,
    payload as Record<string, unknown>,
  );
}

// ─── Decomposition API ─────────────────────────────────────────────────────────

/**
 * POST /api/projects/{p}/decompose/submit — hand the generated master plan
 * back to the server. This replaces the legacy `claude -p` stdout-parsing
 * path: the decomposition session runs interactively (on the subscription)
 * and submits its result through this MCP tool. The server validates, stores
 * `master_plan`, broadcasts `decompose:result`, and tears the session down.
 */
export function submitMasterPlan(
  env: McpEnv,
  plan: Record<string, unknown>,
): Promise<FetchResult<{ created?: number; waves?: number }>> {
  return apiRequest(
    env,
    "POST",
    `/api/projects/${env.projectId}/decompose/submit`,
    { master_plan: plan },
  );
}
