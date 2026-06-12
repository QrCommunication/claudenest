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
}

export interface ProjectSettings {
  maxContextTokens: number;
  summarizeThreshold: number;
  contextRetentionDays: number;
  taskTimeoutMinutes: number;
  lockTimeoutMinutes: number;
  broadcastLevel: "all" | "team" | "none";
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
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface FileLock {
  id: string;
  projectId: string;
  path: string;
  lockedBy: string;
  reason: string | null;
  lockedAt: string;
  expiresAt: string;
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
