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
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  magicLink?: boolean;
}

// ==================== MACHINE TYPES ====================

export type MachineStatus = 'online' | 'offline' | 'connecting';
export type MachinePlatform = 'darwin' | 'win32' | 'linux';

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

export type SessionMode = 'interactive' | 'headless' | 'oneshot';
export type SessionStatus = 
  | 'created' 
  | 'starting' 
  | 'running' 
  | 'waiting_input' 
  | 'completed' 
  | 'error' 
  | 'terminated';

export interface Session {
  id: string;
  machineId: string;
  userId: string;
  mode: SessionMode;
  projectPath: string | null;
  initialPrompt: string | null;
  status: SessionStatus;
  pid: number | null;
  exitCode: number | null;
  ptySize: {
    cols: number;
    rows: number;
  };
  totalTokens: number | null;
  totalCost: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionLog {
  id: number;
  sessionId: string;
  type: 'output' | 'input' | 'status' | 'error';
  data: string;
  metadata: Record<string, unknown>;
  createdAt: string;
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
  broadcastLevel: 'all' | 'team' | 'none';
}

// ==================== TASK TYPES ====================

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'review' | 'done';

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
}

// ==================== CONTEXT TYPES ====================

export type ContextChunkType = 
  | 'task_completion' 
  | 'context_update' 
  | 'file_change' 
  | 'decision' 
  | 'summary' 
  | 'broadcast';

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

export type InstanceStatus = 'active' | 'idle' | 'busy' | 'disconnected';

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
  | 'task_claimed' 
  | 'task_completed' 
  | 'context_updated' 
  | 'file_locked' 
  | 'file_unlocked' 
  | 'broadcast' 
  | 'conflict' 
  | 'instance_connected' 
  | 'instance_disconnected';

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
  | 'session:output'
  | 'session:input'
  | 'session:status'
  | 'session:resize'
  | 'machine:status'
  | 'project:broadcast'
  | 'task:updated'
  | 'context:updated'
  | 'file:locked'
  | 'file:unlocked'
  | 'instance:connected'
  | 'instance:disconnected';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: string;
}

// ==================== NAVIGATION TYPES ====================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
};

export type MainTabParamList = {
  Machines: undefined;
  Sessions: undefined;
  Projects: undefined;
  Settings: undefined;
};

export type MachinesStackParamList = {
  MachinesList: undefined;
  MachineDetail: { machineId: string };
  PairMachine: undefined;
};

export type SessionsStackParamList = {
  SessionsList: { machineId?: string };
  Session: { sessionId: string };
  NewSession: { machineId: string };
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
  Tasks: { projectId: string };
  Context: { projectId: string };
  Locks: { projectId: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Skills: { machineId: string };
  MCPServers: { machineId: string };
  Commands: { machineId: string };
  About: undefined;
};

// ==================== THEME TYPES ====================

export type ColorScheme = 'light' | 'dark';

// ==================== UTIL TYPES ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface ApiError {
  code: string;
  message: string;
  status: number;
}
