// ==================== PROJECT TYPES ====================

export interface SharedProject {
  id: string;
  machine_id: string;
  name: string;
  project_path: string;
  summary: string;
  architecture: string;
  conventions: string;
  current_focus: string;
  recent_changes: string;
  total_tokens: number;
  max_tokens: number;
  token_usage_percent: number;
  is_token_limit_reached: boolean;
  active_instances_count: number;
  pending_tasks_count: number;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
}

export interface ProjectSettings {
  maxContextTokens: number;
  summarizeThreshold: number;
  contextRetentionDays: number;
  taskTimeoutMinutes: number;
  lockTimeoutMinutes: number;
  broadcastLevel: 'all' | 'managers' | 'none';
}

export interface ProjectStats {
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  active_instances: number;
  context_chunks: number;
  active_locks: number;
  token_usage: {
    current: number;
    max: number;
    percent: number;
  };
  activity_last_24h: number;
}

export interface CreateProjectForm {
  name: string;
  project_path: string;
  summary?: string;
  architecture?: string;
  conventions?: string;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectForm {
  name?: string;
  summary?: string;
  architecture?: string;
  conventions?: string;
  current_focus?: string;
  recent_changes?: string;
  max_tokens?: number;
  settings?: Partial<ProjectSettings>;
}

// ==================== TASK TYPES ====================

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SharedTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_claimed: boolean;
  is_completed: boolean;
  is_blocked: boolean;
  assigned_to: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Detailed fields
  files?: string[];
  estimated_tokens?: number;
  dependencies?: string[];
  blocked_by?: string | null;
  completion_summary?: string;
  files_modified?: string[];
  created_by?: string;
  duration?: number | null;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  priority?: TaskPriority;
  files?: string[];
  estimated_tokens?: number;
  dependencies?: string[];
}

export interface UpdateTaskForm {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  files?: string[];
  estimated_tokens?: number;
}

export interface CompleteTaskForm {
  summary: string;
  files_modified?: string[];
  instance_id: string;
}

// ==================== CONTEXT TYPES ====================

export type ContextChunkType = 'task_completion' | 'context_update' | 'file_change' | 'decision' | 'summary' | 'broadcast';

export interface ContextChunk {
  id: string;
  project_id: string;
  content: string;
  type: ContextChunkType;
  instance_id: string | null;
  task_id: string | null;
  files: string[];
  importance_score: number;
  similarity?: number;
  expires_at: string | null;
  created_at: string;
}

export interface ProjectContext {
  summary: string;
  architecture: string;
  conventions: string;
  current_focus: string;
  recent_changes: string;
  total_tokens: number;
  max_tokens: number;
  token_usage_percent: number;
  is_token_limit_reached: boolean;
}

export interface UpdateContextForm {
  summary?: string;
  architecture?: string;
  conventions?: string;
  current_focus?: string;
  recent_changes?: string;
}

export interface ContextQueryResult {
  id: string;
  content: string;
  type: ContextChunkType;
  instance_id: string | null;
  task_id: string | null;
  files: string[];
  importance_score: number;
  similarity: number | null;
  created_at: string;
}

// ==================== FILE LOCK TYPES ====================

export interface FileLock {
  id: string;
  path: string;
  locked_by: string;
  reason: string | null;
  locked_at: string;
  expires_at: string;
  remaining_seconds: number;
}

export interface CreateLockForm {
  path: string;
  instance_id: string;
  reason?: string;
  duration_minutes?: number;
}

// ==================== CLAUDE INSTANCE TYPES ====================

export type InstanceStatus = 'active' | 'idle' | 'busy' | 'disconnected' | 'unknown';

export interface ClaudeInstance {
  id: string;
  status: InstanceStatus;
  is_connected: boolean;
  is_available: boolean;
  context_tokens: number;
  context_usage_percent: number;
  max_context_tokens: number;
  tasks_completed: number;
  current_task: {
    id: string;
    title: string;
  } | null;
  uptime: number | null;
  connected_at: string;
  last_activity_at: string;
}

// ==================== ACTIVITY TYPES ====================

export type ActivityType = 
  | 'task_claimed'
  | 'task_released'
  | 'task_completed'
  | 'file_locked'
  | 'file_unlocked'
  | 'context_updated'
  | 'broadcast'
  | 'instance_connected'
  | 'instance_disconnected';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  message: string;
  icon: string;
  color: string;
  instance_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// ==================== BROADCAST TYPES ====================

export interface BroadcastMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  sender_id: string;
  sender_name: string;
  timestamp: string;
}

// ==================== KANBAN TYPES ====================

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'pending', title: 'Pending', color: 'bg-gray-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-brand-purple' },
  { id: 'review', title: 'Review', color: 'bg-brand-cyan' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    request_id: string;
  };
  error?: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}

