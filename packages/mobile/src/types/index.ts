/**
 * Type Definitions for ClaudeNest Mobile
 */

// ==================== AUTH TYPES ====================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ==================== MACHINE TYPES ====================

export type MachineStatus = "online" | "offline" | "connecting";
export type MachinePlatform = "darwin" | "win32" | "linux";

export interface Machine {
  id: string;
  user_id?: string;
  name: string;
  display_name?: string;
  platform: MachinePlatform;
  hostname: string;
  arch: string;
  node_version: string;
  agent_version: string;
  claude_version: string;
  claude_path: string;
  status: MachineStatus;
  is_online?: boolean;
  last_seen_at: string | null;
  last_seen_human?: string | null;
  connected_at: string | null;
  capabilities: Record<string, unknown>;
  max_sessions: number;
  active_sessions_count?: number;
  can_accept_more_sessions?: boolean;
  created_at: string;
  created_at_human?: string;
  updated_at: string;
}

export interface MachineCapabilities {
  supportsPTY: boolean;
  maxSessions: number;
  supportedModes: string[];
  skillsPath: string | null;
  mcpPath: string | null;
}

// ==================== FILE BROWSER TYPES ====================

export interface FileEntry {
  name: string;
  type: "directory" | "file";
  size?: number;
  modifiedAt?: string;
}

/** Result of browsing a machine's remote filesystem. */
export interface BrowseResult {
  path: string;
  home_path: string;
  entries: FileEntry[];
}

// ==================== SESSION TYPES ====================

export type SessionMode = "interactive" | "headless" | "oneshot";

/**
 * Claude Code permission mode forwarded to the agent when spawning sessions
 * (server contract v1.5 — orchestrator/start and session create).
 */
export type PermissionMode =
  | "default"
  | "acceptEdits"
  | "plan"
  | "bypassPermissions";

export type SessionStatus =
  | "created"
  | "starting"
  | "running"
  | "waiting_input"
  | "completed"
  | "error"
  | "terminated";

export interface Session {
  id: string;
  machine_id: string;
  user_id: string;
  mode: SessionMode;
  project_path: string | null;
  initial_prompt: string | null;
  status: SessionStatus;
  pid: number | null;
  exit_code: number | null;
  pty_size: {
    cols: number;
    rows: number;
  };
  total_tokens: number | null;
  total_cost: number | null;
  /** Shared project this session belongs to (orchestrator/planning sessions). */
  shared_project_id: string | null;
  /** True when the session was spawned by the multi-agent orchestrator. */
  orchestrated: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionLog {
  id: number;
  session_id: string;
  type: "output" | "input" | "status" | "error";
  data: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Field names follow the Laravel API contract (snake_case) — camelCase
// variants are silently dropped by the server-side validation.
export interface CreateSessionRequest {
  mode?: SessionMode;
  project_path?: string;
  initial_prompt?: string;
  credential_id?: string;
  /** Attach the session to a shared project (multi-agent context). */
  shared_project_id?: string;
  permission_mode?: PermissionMode;
  pty_size?: {
    cols: number;
    rows: number;
  };
}

/**
 * A Claude Code session discovered by the agent on the machine (scanned from
 * the user's own ~/.claude transcripts), optionally adopted for remote resume.
 */
export interface DiscoveredSession {
  id: string;
  machine_id: string;
  session_id: string;
  project_slug: string;
  cwd: string;
  project_name: string;
  transcript_path: string;
  is_live: boolean;
  pid: number | null;
  tty: string | null;
  started_at: string | null;
  last_activity_at: string | null;
  last_activity_human: string | null;
  size_bytes: number;
  last_preview: string | null;
  adopted: boolean;
  agent_session_id: string | null;
}

// ==================== PROJECT TYPES ====================

export interface SharedProject {
  id: string;
  userId: string;
  machineId: string;
  name: string;
  projectPath: string;
  summary: string;
  architecture: string;
  conventions: string;
  currentFocus: string;
  recentChanges: string;
  totalTokens: number;
  maxTokens: number;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
  /** Set when the project is archived (reversible — nothing is deleted). */
  archivedAt?: string | null;
}

export interface ProjectSettings {
  maxContextTokens: number;
  summarizeThreshold: number;
  contextRetentionDays: number;
  taskTimeoutMinutes: number;
  lockTimeoutMinutes: number;
  broadcastLevel: "all" | "team" | "none";
}

/**
 * Token cost + budget for a project.
 * Mirrors GET /projects/{id}/token-budget (ProjectController::tokenBudget).
 * `tokens.used/max/percent` are the canonical project-level budget counter;
 * `input/output/session_total` are the session-derived split backing the cost.
 * The server returns RAW snake_case (not a camelCase Resource) — typed verbatim.
 */
export interface TokenBudget {
  tokens: {
    used: number;
    max: number | null;
    percent: number;
    limit_reached: boolean;
    input: number;
    output: number;
    session_total: number;
  };
  cost: {
    estimated_usd: number;
    currency: string;
    pricing_model: string;
  };
  sessions_count: number;
}

// ==================== TASK TYPES ====================

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus =
  | "backlog"
  | "pending"
  | "in_progress"
  | "blocked"
  | "review"
  | "done";

export interface SharedTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string | null;
  claimedAt: string | null;
  dependencies: string[];
  blockedBy: string | null;
  files: string[];
  estimatedTokens: number | null;
  completedAt: string | null;
  completionSummary: string | null;
  filesModified: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  epic_id: string | null;
  sprint_id: string | null;
  parent_id: string | null;
  story_points: number | null;
  due_date: string | null;
  sort_order: number;
  labels: string[];
  has_subtasks: boolean;
  subtasks_count: number;
  completed_subtasks_count: number;
}

// ==================== EPIC TYPES ====================
export type EpicStatus = "open" | "in_progress" | "done";

/**
 * AI decomposition lifecycle of an epic built from a PRD. `null` = never
 * decomposed (manual epic). Mirrors the backend Epic enum + the
 * `epics.decomposition_status` CHECK (idle|pending|running|completed|failed).
 */
export type DecompositionStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed";

/**
 * Epic-level pull request state (finalize flow). `null` = no PR opened yet.
 * Mirrors the backend Epic `PR_STATES` constant + the `epics.pr_state` CHECK.
 */
export type EpicPrState = "open" | "merged" | "closed";

export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  color: string;
  icon: string | null;
  status: EpicStatus;
  priority: TaskPriority;
  sort_order: number;
  tasks_count: number;
  completed_tasks_count: number;
  // Remaining tasks (SharedTask::scopeRemaining): not done AND not stranded in
  // a closed sprint, on the archive-aware visible set (0 once archived).
  remaining_tasks_count: number;
  progress_percentage: number;
  // AI decomposition state (null = never decomposed).
  decomposition_status: DecompositionStatus | null;
  decomposition_session_id: string | null;
  decomposition_error: string | null;
  decomposed_at: string | null;
  // Archive state (NULL archived_at = active).
  archived_at: string | null;
  is_archived: boolean;
  // Epic-level pull request (finalize flow). `pr_state` null = no PR opened yet.
  pr_url: string | null;
  pr_number: number | null;
  pr_state: EpicPrState | null;
  pr_branch: string | null;
  has_pull_request: boolean;
  finalized_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEpicForm {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  priority?: TaskPriority;
}

export interface UpdateEpicForm {
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: EpicStatus;
  priority?: TaskPriority;
}

/**
 * Payload of `POST /projects/{id}/epics/decompose`
 * (DecompositionController::decomposeEpic): creates the epic up-front in the
 * `running` decomposition state and spawns an async Claude session that builds
 * its sprints/tasks from the PRD. Mirrors the controller validation rules.
 */
export interface DecomposeEpicForm {
  title: string;
  prd: string;
  credential_id: string;
  description?: string;
  color?: string;
  icon?: string;
  priority?: TaskPriority;
}

/**
 * Response data of the epic-decompose endpoint. The plan is NOT awaited:
 * the epic is returned in its `running` state and its sprints/tasks land later
 * over the realtime `.epic.decomposition` signal.
 */
export interface DecomposeEpicResponse {
  epic: Epic;
  session_id: string;
  status: "decomposing";
  message: string;
}

// ==================== SPRINT TYPES ====================
export type SprintStatus = "planning" | "active" | "completed" | "cancelled";

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  velocity: number | null;
  capacity: number | null;
  sort_order: number;
  tasks_count: number;
  completed_tasks_count: number;
  total_story_points: number;
  completed_story_points: number;
  progress_percentage: number;
  remaining_days: number | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface BurndownDataPoint {
  date: string;
  remaining: number;
  completed: number;
  ideal: number;
}

// ==================== CONTEXT TYPES ====================

export type ContextChunkType =
  | "task_completion"
  | "context_update"
  | "file_change"
  | "decision"
  | "summary"
  | "broadcast";

export interface ContextChunk {
  id: string;
  projectId: string;
  content: string;
  type: ContextChunkType;
  embedding: number[] | null;
  instanceId: string | null;
  taskId: string | null;
  files: string[];
  importanceScore: number;
  createdAt: string;
  expiresAt: string | null;
}

// ==================== INSTANCE TYPES ====================

export type InstanceStatus = "active" | "idle" | "busy" | "disconnected";

export interface ClaudeInstance {
  id: string;
  projectId: string;
  sessionId: string | null;
  machineId: string;
  status: InstanceStatus;
  currentTaskId: string | null;
  contextTokens: number;
  maxContextTokens: number;
  tasksCompleted: number;
  connectedAt: string;
  lastActivityAt: string;
  disconnectedAt: string | null;
}

// ==================== FILE LOCK TYPES ====================

export type LockType = "exclusive" | "shared";

export interface FileLockLineRange {
  start: number;
  end: number;
}

/**
 * The server lock endpoints return snake_case (and the list omits project_id),
 * unlike the camelCase Resources elsewhere. `project_id` is stamped client-side
 * in fetchLocks so the per-project getter works.
 */
export interface FileLock {
  id: string;
  project_id: string;
  path: string;
  locked_by: string;
  reason: string | null;
  lock_type: LockType;
  line_range: FileLockLineRange | null;
  queue_position: number | null;
  locked_at: string;
  expires_at: string;
  remaining_seconds: number | null;
}

// ==================== ACTIVITY TYPES ====================

export type ActivityType =
  | "task_claimed"
  | "task_completed"
  | "context_updated"
  | "file_locked"
  | "file_unlocked"
  | "broadcast"
  | "conflict"
  | "instance_connected"
  | "instance_disconnected";

export interface ActivityLog {
  id: string;
  projectId: string;
  instanceId: string | null;
  type: ActivityType;
  details: Record<string, unknown>;
  createdAt: string;
}

// ==================== SKILL TYPES ====================

export interface Skill {
  id: string;
  name: string;
  display_name: string | null;
  path: string;
  description: string | null;
  category: string | null;
  category_color: string | null;
  version: string | null;
  enabled: boolean;
  tags: string[];
  has_config?: boolean;
  discovered_at_human?: string | null;
}

// ==================== MCP TYPES ====================

export interface MCPServer {
  name: string;
  enabled: boolean;
  command: string;
  args: string[];
  env: Record<string, string>;
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// ==================== ORCHESTRATOR TYPES ====================
// Server contract v1.5 — /api/projects/{id}/orchestrator/*. Unlike most
// resources, the status payload is returned in camelCase and kept as-is.

export interface OrchestratorWorker {
  id: string;
  sessionId: string | null;
  status: string;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  tasksCompleted: number;
}

export interface OrchestratorStatus {
  status: "running" | "stopped";
  active: boolean;
  workers: OrchestratorWorker[];
  tasks: {
    pending: number;
    in_progress: number;
    done: number;
  };
  pendingTasks: number;
  completedTasks: number;
  orchestration: Record<string, unknown> | null;
}

/**
 * Body of POST /projects/{id}/orchestrator/start (snake_case request).
 * Errors: 403 PLAN_001 (plan cap exceeded), 422 MCH_002 (machine offline).
 */
export interface OrchestratorStartRequest {
  /** Parallel worker count — server validates the 1-10 range. */
  max_workers: number;
  permission_mode?: PermissionMode;
  /** Also spawn a coordinator session supervising the workers. */
  coordinator?: boolean;
  /**
   * Credential the workers run under (web parity: StartOrchestratorConfig).
   * Omit / empty → the user's default credential. A provided id MUST belong to
   * the requesting user (server-side IDOR guard, `Rule::exists`).
   */
  credential_id?: string;
}

/**
 * Body of POST /projects/{id}/planning/session — spawns an interactive
 * planning session (HTTP 201). Errors: 400 machine offline, 403 PLAN_001.
 */
export interface PlanningSessionRequest {
  /** Project brief — server caps at 4000 characters. */
  brief: string;
  credential_id?: string;
}

/**
 * Body of POST /projects/{id}/workers — spawns a single orchestrated worker
 * session (HTTP 201, returns the worker Session). Mirrors SpawnWorkerRequest.
 * Both fields are optional; when omitted the worker runs under the default
 * permission mode and the user's default credential. A provided `credential_id`
 * MUST belong to the requesting user (server-side IDOR guard).
 */
export interface SpawnWorkerRequest {
  permission_mode?: PermissionMode;
  credential_id?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    pagination?: {
      currentPage: number;
      perPage: number;
      total: number;
      lastPage: number;
    };
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    pagination: {
      currentPage: number;
      perPage: number;
      total: number;
      lastPage: number;
    };
    timestamp: string;
    requestId: string;
  };
}

// ==================== WEBSOCKET TYPES ====================

export type WebSocketMessageType =
  | "session:output"
  | "session:input"
  | "session:status"
  | "session:resize"
  | "machine:status"
  | "project:broadcast"
  | "task:updated"
  | "context:updated"
  | "file:locked"
  | "file:unlocked"
  | "instance:connected"
  | "instance:disconnected";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: string;
}

// ==================== NAVIGATION TYPES ====================
// Source of truth: navigation/types.ts — re-export from there
export type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  MachinesStackParamList,
  SessionsStackParamList,
  ProjectsStackParamList,
  SettingsStackParamList,
} from "@/navigation/types";

// ==================== THEME TYPES ====================

export type ColorScheme = "light" | "dark";

// ==================== UTIL TYPES ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ============================================================
// Git worktree + pull requests (web parity: stores/git.ts)
// ============================================================

export interface GitFileChange {
  path: string;
  /** Two-letter porcelain code, e.g. " M", "??", "A ". */
  code: string;
}

export interface GitStatus {
  branch: string | null;
  ahead: number;
  behind: number;
  clean: boolean;
  files: GitFileChange[];
  remote_url: string | null;
  last_commit: string | null;
  sandboxed: boolean;
}

export interface PullRequest {
  number: number;
  title: string;
  headRefName: string;
  baseRefName: string;
  isDraft: boolean;
  mergeable?: string;
  mergeStateStatus?: string;
  url: string;
  createdAt: string;
  author?: { login?: string } | null;
}

export type MergeMethod = "squash" | "merge" | "rebase";

// ============================================================
// Audit trail (web parity: components/multiagent/AuditTrail.vue)
// ============================================================

export interface AuditEntry {
  id: string;
  type: string;
  message: string;
  icon: string | null;
  color: string | null;
  instance_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string | null;
  created_at_human: string | null;
}

// ─── Runner Agent (health monitor) ───────────────────────────────────────────
// Server returns RAW snake_case arrays (RunnerController → RunnerAgentService),
// NOT a camelCase Resource — type the shape verbatim.

export interface RunnerTasksCheck {
  total: number;
  completed: number;
  blocked: number;
  overdue: number;
  unestimated: number;
}

export interface RunnerActiveSprintCheck {
  id: string;
  name: string;
  progress: number;
  remaining_days: number | null;
  is_overdue: boolean;
}

export interface RunnerSprintsCheck {
  active: RunnerActiveSprintCheck | null;
  planning_count: number;
  completed_count: number;
}

export interface RunnerEpicCheck {
  id: string;
  title: string;
  status: string;
  progress: number;
}

export type RunnerAlertLevel = "warning" | "critical";

export interface RunnerAlert {
  level: RunnerAlertLevel;
  message: string;
  type: string;
}

export interface RunnerHealth {
  project_id: string;
  checked_at: string;
  tasks: RunnerTasksCheck;
  sprints: RunnerSprintsCheck;
  epics: RunnerEpicCheck[];
  alerts: RunnerAlert[];
  recommendations: string[];
}

export interface RunnerAutoUpdate {
  type: string;
  id: string;
  title?: string;
  name?: string;
}

export interface RunnerAutoUpdateResult {
  updates: RunnerAutoUpdate[];
  count: number;
}

// ─── Project scan (path preview before creation) ─────────────────────────────
// ProjectScanController returns a RAW snake_case preview of a project on disk.
export interface ProjectScanResult {
  project_name: string;
  tech_stack: string[];
  has_git: boolean;
  readme: string | null;
  structure: string[];
}

// ==================== WINDOW MANAGER (OS SHELL) TYPES ====================
// Local UI state for the "Claude OS" shell (WindowFrame chrome + Dock taskbar).
// Not a server contract — purely client-side window bookkeeping.

/** What a managed window represents in the OS shell. */
export type WindowKind = "session" | "panel";

/**
 * Floating geometry of a window in the desktop host's coordinate space
 * (logical pixels, origin top-left). Persists even while a window is
 * maximized, so restoring brings back the prior floating size/position.
 */
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A window tracked by the OS-shell window manager. The windowed entity is keyed
 * by `id` (e.g. a session id). `openSeq`/`focusSeq` are monotonic sequence
 * numbers (NOT timestamps) so ordering is deterministic and test-friendly:
 *  - openSeq  → stable taskbar/dock order (icons don't jump on focus)
 *  - focusSeq → most-recently-focused order (drives stacking + next-focus pick)
 */
export interface ManagedWindow {
  id: string;
  kind: WindowKind;
  title: string;
  /** MaterialIcons name for the dock/taskbar icon (optional). */
  icon?: string;
  /** Minimized = present in the taskbar but not the foreground window. */
  minimized: boolean;
  /**
   * Maximized = rendered full-bleed by the host. `bounds` is preserved so
   * un-maximizing restores the prior floating geometry.
   */
  maximized: boolean;
  /** Floating geometry used when the window is neither minimized nor maximized. */
  bounds: WindowBounds;
  /** Stable creation order — drives the taskbar display order. */
  openSeq: number;
  /** Last-focused order — higher = more recently focused. */
  focusSeq: number;
}

/** Input accepted when opening/registering a window. */
export interface OpenWindowInput {
  id: string;
  kind: WindowKind;
  title: string;
  icon?: string;
  /** Optional initial geometry; missing fields fall back to a cascade default. */
  bounds?: Partial<WindowBounds>;
}
