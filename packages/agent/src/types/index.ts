/**
 * Types communs pour l'agent ClaudeNest
 */

import type { Logger as PinoLogger } from 'pino';

// ============================================
// Configuration
// ============================================

export interface AgentConfig {
  /** URL du serveur ClaudeNest */
  serverUrl: string;
  /** Token d'authentification de la machine */
  machineToken: string;
  /** Chemin vers l'exécutable Claude Code */
  claudePath: string;
  /** Chemins des projets à scanner pour les skills */
  projectPaths: string[];
  /** Chemin du cache local */
  cachePath: string;
  /** Niveau de log */
  logLevel: LogLevel;
  /** Configuration WebSocket */
  websocket?: WebSocketConfig;
  /** Configuration des sessions */
  sessions?: SessionManagerConfig;
}

export interface WebSocketConfig {
  /** Délai de reconnexion initial (ms) */
  reconnectDelay: number;
  /** Délai maximum de reconnexion (ms) */
  maxReconnectDelay: number;
  /** Nombre maximum de tentatives de reconnexion */
  maxReconnectAttempts: number;
  /** Intervalle de heartbeat (ms) */
  heartbeatInterval: number;
  /** Timeout pour les messages (ms) */
  messageTimeout: number;
}

export interface SessionManagerConfig {
  /** Nombre maximum de sessions simultanées */
  maxSessions: number;
  /** Dossier de travail par défaut */
  defaultCwd: string;
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ============================================
// Machine
// ============================================

export interface MachineInfo {
  id: string;
  name: string;
  platform: NodeJS.Platform;
  hostname: string;
  arch: string;
  nodeVersion: string;
  agentVersion: string;
  claudeVersion: string;
  claudePath: string;
  capabilities: MachineCapabilities;
  maxSessions: number;
}

export interface MachineCapabilities {
  supportsPTY: boolean;
  supportsTmux: boolean;
  supportsMCP: boolean;
  supportsSkills: boolean;
  availableSkills: string[];
  availableMCPs: string[];
}

export type MachineStatus = 'online' | 'offline' | 'connecting';

// ============================================
// Sessions
// ============================================

export interface Session {
  id: string;
  status: SessionStatus;
  pid?: number;
  projectPath?: string;
  initialPrompt?: string;
  mode: SessionMode;
  ptySize: PTYSize;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SessionConfig {
  projectPath?: string;
  initialPrompt?: string;
  mode?: SessionMode;
  ptySize?: PTYSize;
  env?: Record<string, string>;
  credentialEnv?: Record<string, string>;
}

export type SessionStatus = 
  | 'created' 
  | 'starting' 
  | 'running' 
  | 'waiting_input' 
  | 'completed' 
  | 'error' 
  | 'terminated';

export type SessionMode = 'interactive' | 'headless' | 'oneshot';

export interface PTYSize {
  cols: number;
  rows: number;
}

export interface SessionOutput {
  sessionId: string;
  type: 'output' | 'error' | 'status';
  data: string;
  timestamp: number;
}

export interface SessionInput {
  sessionId: string;
  data: string;
}

// ============================================
// WebSocket Messages
// ============================================

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  id: string;
}

export interface WebSocketResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

// Messages entrants (serveur → agent)
export type IncomingMessageType =
  | 'session:create'
  | 'session:terminate'
  | 'session:input'
  | 'session:resize'
  | 'skills:list'
  | 'mcp:list'
  | 'mcp:start'
  | 'mcp:stop'
  | 'context:get'
  | 'context:update'
  | 'task:claim'
  | 'task:complete'
  | 'file:lock'
  | 'file:unlock'
  | 'file:browse'
  | 'project:scan'
  | 'decompose:start'
  | OrchestratorIncomingMessage
  | 'ping';

// Messages sortants (agent → serveur)
export type OutgoingMessageType =
  | 'session:output'
  | 'session:status'
  | 'session:exited'
  | 'machine:info'
  | 'machine:status'
  | 'skills:discovered'
  | 'mcp:status'
  | 'context:sync'
  | 'task:update'
  | 'file:lock_update'
  | 'file:browse_result'
  | 'project:scan_result'
  | 'decompose:progress'
  | 'decompose:result'
  | OrchestratorOutgoingMessage
  | 'pong'
  | 'error';

// ============================================
// File Browser
// ============================================

export interface FileBrowseRequest {
  requestId: string;
  path?: string;
  dirsOnly?: boolean;
  showHidden?: boolean;
}

export interface FileBrowseEntry {
  name: string;
  type: 'directory' | 'file';
  size?: number;
  modifiedAt?: string;
}

export interface FileBrowseResult {
  requestId: string;
  path: string;
  homePath: string;
  entries: FileBrowseEntry[];
  error?: string;
}

// ============================================
// Skills & MCP
// ============================================

export interface Skill {
  name: string;
  description: string;
  path: string;
  version: string;
  category: string;
  commands?: SkillCommand[];
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface SkillCommand {
  name: string;
  description: string;
  usage: string;
}

export interface MCPServer {
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  autoStart: boolean;
  status: MCPStatus;
  tools?: MCPTool[];
}

export type MCPStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface MCPTool {
  name: string;
  description: string;
  parameters: unknown;
}

export interface DiscoveredCommand {
  name: string;
  description: string;
  category: string;
  source: string;
}

// ============================================
// Context
// ============================================

export interface ContextChunk {
  id: string;
  content: string;
  type: ContextChunkType;
  projectId: string;
  instanceId?: string;
  taskId?: string;
  files: string[];
  importanceScore: number;
  createdAt: Date;
  expiresAt?: Date;
}

export type ContextChunkType =
  | 'task_completion'
  | 'context_update'
  | 'file_change'
  | 'decision'
  | 'summary'
  | 'broadcast';

export interface ContextQuery {
  projectId: string;
  query: string;
  limit?: number;
  type?: ContextChunkType;
  instanceId?: string;
}

export interface ContextUpdate {
  projectId: string;
  content: string;
  type: ContextChunkType;
  files?: string[];
  importanceScore?: number;
}

export interface ProjectContext {
  projectId: string;
  summary: string;
  architecture: string;
  conventions: string;
  currentFocus: string;
  recentChanges: string;
  totalTokens: number;
  maxTokens: number;
}

// ============================================
// Tasks
// ============================================

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  claimedAt?: Date;
  dependencies: string[];
  blockedBy?: string;
  files: string[];
  estimatedTokens?: number;
  completedAt?: Date;
  completionSummary?: string;
  filesModified: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'review' | 'done';

// ============================================
// File Locks
// ============================================

export interface FileLock {
  id: string;
  projectId: string;
  path: string;
  lockedBy: string;
  reason?: string;
  lockedAt: Date;
  expiresAt: Date;
}

// ============================================
// Logging
// ============================================

export type Logger = PinoLogger;

export interface LogContext {
  [key: string]: unknown;
}

// ============================================
// Events
// ============================================

export interface AgentEvents {
  connected: () => void;
  disconnected: () => void;
  started: () => void;
  stopped: () => void;
  error: (error: Error) => void;
  sessionCreated: (session: Session) => void;
  sessionRecovered: (data: { sessionId: string }) => void;
  sessionEnded: (data: { sessionId: string; exitCode: number }) => void;
  output: (data: SessionOutput) => void;
  status: (data: { sessionId: string; status: SessionStatus }) => void;
  message: (msg: { type: string; payload: unknown }) => void;
  synced: () => void;
  taskClaimed: (task: unknown) => void;
  taskCompleted: (task: unknown) => void;
  exit: (data: { sessionId: string; exitCode: number }) => void;
  maxReconnectReached: () => void;
  projectUpdated: (data: { projectId: string }) => void;
  fileLocked: (data: { projectId: string; path: string }) => void;
  fileUnlocked: (data: { projectId: string; path: string }) => void;
  fullSync: () => void;
}

// ============================================
// Orchestrator
// ============================================

export interface OrchestratorConfig {
  /** Project ID to orchestrate */
  projectId: string;
  /** Project path on disk */
  projectPath: string;
  /** Min workers (always running) */
  minWorkers: number;
  /** Max workers (hard cap) */
  maxWorkers: number;
  /** Polling interval for new tasks (ms) */
  pollIntervalMs: number;
  /** Worker idle timeout before termination (ms) */
  workerIdleTimeoutMs: number;
  /** Whether to auto-scale based on pending tasks */
  autoScale: boolean;
}

export type OrchestratorStatus = 'idle' | 'running' | 'stopping' | 'stopped';

export interface OrchestratorState {
  status: OrchestratorStatus;
  projectId: string;
  workers: WorkerInfo[];
  pendingTasks: number;
  completedTasks: number;
  startedAt?: Date;
}

export interface WorkerInfo {
  id: string;
  sessionId: string;
  status: WorkerStatus;
  currentTaskId?: string;
  currentTaskTitle?: string;
  tasksCompleted: number;
  startedAt: Date;
  lastActivityAt: Date;
}

export type WorkerStatus =
  | 'starting'
  | 'idle'
  | 'claiming'
  | 'executing'
  | 'completing'
  | 'stopping'
  | 'exited';

export interface WorkerResult {
  workerId: string;
  taskId: string;
  success: boolean;
  summary?: string;
  filesModified?: string[];
  exitCode?: number;
  error?: string;
}

// ============================================
// Project Scan
// ============================================

export interface ProjectScanRequest {
  requestId: string;
  path: string;
}

export interface ProjectScanResult {
  requestId: string;
  projectName: string;
  techStack: string[];
  hasGit: boolean;
  readme: string | null;
  structure: string[];
  error?: string;
}

// Orchestrator WS message types (server → agent)
export type OrchestratorIncomingMessage =
  | 'orchestrator:start'
  | 'orchestrator:stop'
  | 'orchestrator:status'
  | 'orchestrator:scale';

// Orchestrator WS message types (agent → server)
export type OrchestratorOutgoingMessage =
  | 'orchestrator:started'
  | 'orchestrator:stopped'
  | 'orchestrator:state'
  | 'orchestrator:worker_spawned'
  | 'orchestrator:worker_exited'
  | 'orchestrator:task_claimed'
  | 'orchestrator:task_completed'
  | 'orchestrator:error';

// ============================================
// Decomposition (PRD → Master Plan)
// ============================================

export interface DecomposeStartPayload {
  projectId: string;
  projectPath: string;
  prompt: string;
  credentialEnv?: Record<string, string>;
}

export interface DecomposeProgressPayload {
  projectId: string;
  output: string;
  percent?: number;
}

export interface DecomposeResultPayload {
  projectId: string;
  success: boolean;
  plan?: MasterPlan;
  error?: string;
}

export interface MasterPlan {
  version: 1;
  prd_summary: string;
  waves: MasterPlanWave[];
}

export interface MasterPlanWave {
  id: number;
  name: string;
  description: string;
  tasks: MasterPlanTask[];
}

export interface MasterPlanTask {
  title: string;
  description: string;
  priority: TaskPriority;
  files: string[];
  estimated_tokens?: number;
  depends_on: string[];
}

// ============================================
// Utility Types
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}
