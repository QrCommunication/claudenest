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
  /** Normalized tech stack detected at project creation (wizard scan + AI). */
  techStack?: string[];
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
  current_focus?: string;
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

export type TaskStatus = 'backlog' | 'pending' | 'in_progress' | 'blocked' | 'review' | 'done';
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
  wave?: number;
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
  epic_id?: string;
  sprint_id?: string;
  parent_id?: string;
  story_points?: number;
  due_date?: string;
  labels?: string[];
}

export interface UpdateTaskForm {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  files?: string[];
  estimated_tokens?: number;
  epic_id?: string;
  sprint_id?: string;
  parent_id?: string;
  story_points?: number;
  due_date?: string;
  labels?: string[];
}

// ==================== EPIC TYPES ====================

export type EpicStatus = 'open' | 'in_progress' | 'done';

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

// ==================== SPRINT TYPES ====================

export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

/**
 * Lightweight task shape embedded in the sprint detail endpoint
 * (`GET /sprints/{id}` → SprintResource `whenLoaded('tasks')`).
 * Only the fields the sprint detail view needs are serialized.
 */
export interface SprintTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  story_points: number | null;
  assigned_to: string | null;
}

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
  /**
   * Remaining tasks (SharedTask::scopeRemaining): excludes done tasks AND
   * tasks stranded in a closed sprint. Single source of truth shared with the
   * project/sprint stats counters.
   */
  remaining_tasks_count?: number;
  total_story_points: number;
  completed_story_points: number;
  progress_percentage: number;
  remaining_days: number | null;
  is_overdue: boolean;
  /**
   * Embedded task list — only present on the sprint detail endpoint
   * (eager-loaded). Absent on the paginated index listing.
   */
  tasks?: SprintTask[];
  created_at: string;
  updated_at: string;
}

export interface CreateSprintForm {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
}

export interface UpdateSprintForm {
  name?: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
  status?: SprintStatus;
}

export interface BurndownDataPoint {
  date: string;
  remaining: number;
  completed: number;
  ideal: number;
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

/** Lock granularity: an exclusive (writer) lock blocks every other lock on the
 *  path; a shared (reader) lock only conflicts with an exclusive one. Mirrors
 *  FileLock::LOCK_TYPES on the backend. */
export type LockType = 'exclusive' | 'shared';

/** Optional line-range scope of a lock. A null/absent range means the whole
 *  file is locked (overlaps every range). Mirrors the `line_range` jsonb column. */
export interface LockLineRange {
  start: number;
  end: number;
}

export interface FileLock {
  id: string;
  path: string;
  locked_by: string;
  reason: string | null;
  locked_at: string;
  expires_at: string;
  remaining_seconds: number;
  /** Advanced attributes — backend always serializes them via lockData()/
   *  getActiveLocks(); kept optional so partial/legacy payloads stay assignable. */
  lock_type?: LockType;
  line_range?: LockLineRange | null;
  queue_position?: number | null;
}

export interface CreateLockForm {
  path: string;
  instance_id: string;
  reason?: string;
  duration_minutes?: number;
  lock_type?: LockType;
  line_range?: LockLineRange | null;
}

/**
 * Enriched 409 conflict payload returned by the lock acquire endpoint
 * (FileLockController::conflictResponse). Lets the UI explain *why* an
 * acquisition was refused: who holds the path, with which lock type and range,
 * versus what was requested.
 */
export interface LockConflict {
  conflict: true;
  holder: string;
  holder_lock_type: LockType;
  holder_line_range: LockLineRange | null;
  requested_lock_type: LockType;
  requested_line_range: LockLineRange | null;
  expires_at: string | null;
  remaining_seconds: number;
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
  | 'instance_disconnected'
  | 'epic_updated'
  | 'sprint_started'
  | 'sprint_completed';

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
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-500' },
  { id: 'pending', title: 'Pending', color: 'bg-gray-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-brand-purple' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-500' },
  { id: 'review', title: 'Review', color: 'bg-brand-cyan' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

// ==================== ORCHESTRATION TYPES ====================

export type OrchestratorStatus = 'idle' | 'running' | 'stopping' | 'stopped';

export interface OrchestrationStats {
  instances: {
    total: number;
    idle: number;
    busy: number;
    active: number;
  };
  tasks: {
    pending: number;
    in_progress: number;
    completed: number;
    blocked: number;
  };
  total_tasks_completed: number;
}

export interface DispatchResult {
  dispatched: Array<{
    task_id: string;
    instance_id: string;
  }>;
  count: number;
}

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

