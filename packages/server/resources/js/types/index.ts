// ==================== MACHINE TYPES ====================

export type MachineStatus = 'online' | 'offline' | 'connecting';
export type MachinePlatform = 'darwin' | 'win32' | 'linux';

export interface Machine {
  id: string;
  name: string;
  display_name: string;
  platform: MachinePlatform;
  hostname: string | null;
  arch: string | null;
  status: MachineStatus;
  is_online: boolean;
  claude_version: string | null;
  agent_version: string | null;
  node_version: string | null;
  claude_path: string | null;
  capabilities: string[];
  max_sessions: number;
  active_sessions_count: number;
  can_accept_more_sessions: boolean;
  last_seen_at: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
  last_seen_human: string | null;
  created_at_human: string;
}

export interface MachineEnvironment {
  platform: MachinePlatform;
  hostname: string | null;
  arch: string | null;
  node_version: string | null;
  agent_version: string | null;
  claude_version: string | null;
  claude_path: string | null;
  capabilities: string[];
  max_sessions: number;
}

// ==================== SESSION TYPES ====================

export type SessionStatus = 'created' | 'starting' | 'running' | 'waiting_input' | 'completed' | 'error' | 'terminated';
export type SessionMode = 'interactive' | 'headless' | 'oneshot';

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
  pty_size: { cols: number; rows: number };
  total_tokens: number;
  total_cost: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  duration: number | null;
  formatted_duration: string;
  is_running: boolean;
  is_completed: boolean;
}

export interface SessionLog {
  id: string;
  session_id: string;
  type: 'input' | 'output' | 'error' | 'system';
  data: string;
  timestamp: string;
  created_at: string;
}

export interface CreateSessionPayload {
  mode?: SessionMode;
  project_path?: string;
  initial_prompt?: string;
  pty_size?: { cols: number; rows: number };
}

export interface ResizeSessionPayload {
  cols: number;
  rows: number;
}

export interface SessionInputPayload {
  data: string;
}

// ==================== WEBSOCKET TYPES ====================

export interface WebSocketConfig {
  session_id: string;
  token: string;
  ws_url: string;
  ws_token?: string;
  wsUrl?: string;
}

export interface SessionOutputEvent {
  session_id: string;
  type: 'output' | 'error' | 'status';
  data: string;
  timestamp: string;
}

export interface SessionInputEvent {
  session_id: string;
  data: string;
  timestamp: string;
}

export interface SessionStatusEvent {
  session_id: string;
  status: SessionStatus;
  timestamp: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// ==================== TERMINAL TYPES ====================

export interface TerminalTheme {
  foreground: string;
  background: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface TerminalOptions {
  cols?: number;
  rows?: number;
  fontFamily: string;
  fontSize: number;
  theme: TerminalTheme;
  cursorBlink: boolean;
  cursorStyle?: 'block' | 'bar' | 'underline';
  scrollback: number;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiMeta {
  timestamp: string;
  request_id: string;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ApiMeta;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: ApiMeta & {
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

// ==================== USER TYPES ====================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires_at: string;
  };
  meta: ApiMeta;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// ==================== FORM TYPES ====================

export interface CreateMachineForm {
  name: string;
  platform: MachinePlatform;
  hostname?: string;
  arch?: string;
  max_sessions?: number;
  capabilities?: string[];
}

export interface UpdateMachineForm {
  name?: string;
  max_sessions?: number;
  capabilities?: string[];
  claude_version?: string;
  claude_path?: string;
}

// ==================== TOAST TYPES ====================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
// ==================== MACHINE TYPES ====================

export type MachineStatus = 'online' | 'offline' | 'connecting';
export type MachinePlatform = 'darwin' | 'win32' | 'linux';

export interface Machine {
  id: string;
  name: string;
  display_name: string;
  platform: MachinePlatform;
  hostname: string | null;
  arch: string | null;
  status: MachineStatus;
  is_online: boolean;
  claude_version: string | null;
  agent_version: string | null;
  node_version: string | null;
  claude_path: string | null;
  capabilities: string[];
  max_sessions: number;
  active_sessions_count: number;
  can_accept_more_sessions: boolean;
  last_seen_at: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
  last_seen_human: string | null;
  created_at_human: string;
}

export interface MachineEnvironment {
  platform: MachinePlatform;
  hostname: string | null;
  arch: string | null;
  node_version: string | null;
  agent_version: string | null;
  claude_version: string | null;
  claude_path: string | null;
  capabilities: string[];
  max_sessions: number;
}

// ==================== SESSION TYPES ====================

export type SessionStatus = 'created' | 'starting' | 'running' | 'waiting_input' | 'completed' | 'error' | 'terminated';
export type SessionMode = 'interactive' | 'headless' | 'oneshot';

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
  pty_size: { cols: number; rows: number };
  total_tokens: number;
  total_cost: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  duration: number | null;
  formatted_duration: string;
  is_running: boolean;
  is_completed: boolean;
  command_count?: number;
  ended_at?: string;
}

export interface SessionLog {
  id: string;
  session_id: string;
  type: 'input' | 'output' | 'error' | 'system';
  data: string;
  timestamp: string;
  created_at: string;
}

export interface CreateSessionPayload {
  mode?: SessionMode;
  project_path?: string;
  initial_prompt?: string;
  pty_size?: { cols: number; rows: number };
}

export interface ResizeSessionPayload {
  cols: number;
  rows: number;
}

export interface SessionInputPayload {
  data: string;
}

// ==================== WEBSOCKET TYPES ====================

export interface WebSocketConfig {
  session_id: string;
  token: string;
  ws_url: string;
  ws_token?: string;
  wsUrl?: string;
}

export interface SessionOutputEvent {
  session_id: string;
  type: 'output' | 'error' | 'status';
  data: string;
  timestamp: string;
}

export interface SessionInputEvent {
  session_id: string;
  data: string;
  timestamp: string;
}

export interface SessionStatusEvent {
  session_id: string;
  status: SessionStatus;
  timestamp: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// ==================== TERMINAL TYPES ====================

export interface TerminalTheme {
  foreground: string;
  background: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface TerminalOptions {
  cols?: number;
  rows?: number;
  fontFamily: string;
  fontSize: number;
  theme: TerminalTheme;
  cursorBlink: boolean;
  cursorStyle?: 'block' | 'bar' | 'underline';
  scrollback: number;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiMeta {
  timestamp: string;
  request_id: string;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ApiMeta;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: ApiMeta & {
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

// ==================== USER TYPES ====================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires_at: string;
  };
  meta: ApiMeta;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// ==================== FORM TYPES ====================

export interface CreateMachineForm {
  name: string;
  platform: MachinePlatform;
  hostname?: string;
  arch?: string;
  max_sessions?: number;
  capabilities?: string[];
}

export interface UpdateMachineForm {
  name?: string;
  max_sessions?: number;
  capabilities?: string[];
  claude_version?: string;
  claude_path?: string;
}

// ==================== TOAST TYPES ====================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ==================== NAVIGATION TYPES ====================

export interface NavItem {
  name: string;
  path: string;
  icon: string;
}

// ==================== PROJECT TYPES ====================

export type ProjectStatus = 'active' | 'paused' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

// ==================== TASK TYPES ====================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

// Re-export all types from skills module
export * from './skills';

// ==================== TABLE TYPES ====================

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  formatter?: (row: T) => string;
}

// ==================== SELECT TYPES ====================

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// ==================== ACTIVITY TYPES ====================

export type ActivityType = 'session_start' | 'session_end' | 'task_complete' | 'machine_connect' | 'machine_disconnect' | 'skill_run';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ==================== STATS TYPES ====================

export interface Stats {
  machinesOnline: number;
  machinesTotal: number;
  activeSessions: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

// Re-export multiagent types
export * from './multiagent';
