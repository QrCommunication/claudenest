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
  userId: string;
  name: string;
  platform: MachinePlatform;
  hostname: string;
  arch: string;
  nodeVersion: string;
  agentVersion: string;
  claudeVersion: string;
  claudePath: string;
  status: MachineStatus;
  lastSeenAt: string | null;
  connectedAt: string | null;
  capabilities: Record<string, unknown>;
  maxSessions: number;
  activeSessions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MachineCapabilities {
  supportsPTY: boolean;
  maxSessions: number;
  supportedModes: string[];
  skillsPath: string | null;
  mcpPath: string | null;
}

// ==================== SESSION TYPES ====================

export type SessionMode = "interactive" | "headless" | "oneshot";
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

export interface CreateSessionRequest {
  mode?: SessionMode;
  projectPath?: string;
  initialPrompt?: string;
  ptySize?: {
    cols: number;
    rows: number;
  };
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
  name: string;
  path: string;
  description: string | null;
  version: string | null;
  author: string | null;
  tags: string[];
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
