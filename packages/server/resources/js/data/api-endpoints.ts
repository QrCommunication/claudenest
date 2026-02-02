/**
 * ClaudeNest API Endpoints Documentation
 * 
 * This file contains the complete API reference for ClaudeNest.
 * Last updated: 2026-02-02
 */

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  params?: ApiParam[];
  query?: ApiParam[];
  body?: string;
  response: string;
  errors?: string[];
}

export interface ApiCategory {
  id: string;
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export const apiCategories: ApiCategory[] = [
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'Manage user authentication, tokens, and OAuth flows.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate user with email and password.',
        body: `{
  "email": "user@example.com",
  "password": "your-password",
  "remember": true
}`,
        response: `{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "email_verified_at": "2026-01-15T10:30:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    },
    "token": "1|laravel_sanctum_token_string_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['AUTH_002: Invalid credentials (401)']
      },
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register a new user account.',
        body: `{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "secure-password",
  "password_confirmation": "secure-password"
}`,
        response: `{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "1|laravel_sanctum_token_string_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['Validation error (422)']
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Get current authenticated user information.',
        response: `{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "email_verified_at": "2026-01-15T10:30:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  },
  "meta": { /* meta object */ }
}`,
        errors: ['Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'Logout user and revoke current token.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Refresh the authentication token.',
        response: `{
  "success": true,
  "data": {
    "token": "2|new_laravel_sanctum_token_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/auth/tokens',
        description: 'List all personal access tokens for the user.',
        response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "API Access Token",
      "abilities": ["*"],
      "last_used_at": "2026-02-02T16:00:00Z",
      "expires_at": "2026-03-04T17:00:00Z",
      "is_active": true,
      "created_at": "2026-02-01T10:00:00Z"
    }
  ],
  "meta": { /* meta object */ }
}`,
        errors: ['Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/auth/tokens',
        description: 'Create a new personal access token.',
        body: `{
  "name": "Mobile App Token",
  "abilities": ["machines:read", "sessions:write"],
  "expires_in_days": 90
}`,
        response: `{
  "success": true,
  "data": {
    "token": "3|new_token_plain_text_here",
    "name": "Mobile App Token",
    "abilities": ["machines:read", "sessions:write"],
    "expires_at": "2026-05-03T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['Validation error (422)', 'Unauthenticated (401)']
      },
      {
        method: 'DELETE',
        path: '/api/auth/tokens/{id}',
        description: 'Revoke a personal access token.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['AUTH_001: Token not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/auth/{provider}/redirect',
        description: 'Get OAuth redirect URL for Google or GitHub.',
        query: [
          { name: 'provider', type: 'string', required: true, description: 'OAuth provider: google or github' }
        ],
        response: `{
  "success": true,
  "data": {
    "redirect_url": "https://accounts.google.com/o/oauth2/auth?..."
  },
  "meta": { /* meta object */ }
}`,
        errors: ['AUTH_001: Invalid provider (400)']
      },
      {
        method: 'GET',
        path: '/api/auth/{provider}/callback',
        description: 'Handle OAuth callback and authenticate user.',
        query: [
          { name: 'provider', type: 'string', required: true, description: 'OAuth provider: google or github' }
        ],
        response: `{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "1|oauth_token_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['AUTH_001: Authentication failed (401)']
      }
    ]
  },
  {
    id: 'machines',
    title: 'Machines',
    description: 'Manage registered machines (agents) and their configuration.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/machines',
        description: 'List all machines for the authenticated user.',
        query: [
          { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 15)' },
          { name: 'search', type: 'string', required: false, description: 'Search by name or hostname' },
          { name: 'status', type: 'string', required: false, description: 'Filter by status: online, offline, connecting, error' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "MacBook-Pro-Work",
      "platform": "darwin",
      "hostname": "macbook-pro.local",
      "arch": "arm64",
      "status": "online",
      "is_online": true,
      "capabilities": ["claude_code", "git", "docker", "wake_on_lan"],
      "max_sessions": 10,
      "active_sessions_count": 3,
      "last_seen_at": "2026-02-02T16:55:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123",
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}`,
        errors: ['Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines',
        description: 'Register a new machine or update existing one.',
        body: `{
  "name": "MacBook-Pro-Work",
  "platform": "darwin",
  "hostname": "macbook-pro.local",
  "arch": "arm64",
  "node_version": "20.11.0",
  "agent_version": "1.0.0",
  "claude_version": "0.2.29",
  "claude_path": "/usr/local/bin/claude",
  "capabilities": ["claude_code", "git", "docker"],
  "max_sessions": 10
}`,
        response: `{
  "success": true,
  "data": {
    "machine": { /* machine object */ },
    "token": "machine_token_here"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/machines/{id}',
        description: 'Get detailed information about a specific machine.',
        response: `{
  "success": true,
  "data": { /* full machine object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'PATCH',
        path: '/api/machines/{id}',
        description: 'Update machine configuration.',
        body: `{
  "name": "MacBook-Pro-Updated",
  "max_sessions": 15,
  "capabilities": ["claude_code", "git", "docker", "wake_on_lan"]
}`,
        response: `{
  "success": true,
  "data": { /* updated machine object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'Validation error (422)']
      },
      {
        method: 'DELETE',
        path: '/api/machines/{id}',
        description: 'Delete a machine and terminate all active sessions.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{id}/regenerate-token',
        description: 'Generate a new authentication token for the machine.',
        response: `{
  "success": true,
  "data": {
    "token": "new_machine_token_here"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/machines/{id}/environment',
        description: 'Get machine environment information.',
        response: `{
  "success": true,
  "data": {
    "platform": "darwin",
    "hostname": "macbook-pro.local",
    "arch": "arm64",
    "node_version": "20.11.0",
    "agent_version": "1.0.0",
    "claude_version": "0.2.29",
    "claude_path": "/usr/local/bin/claude",
    "capabilities": ["claude_code", "git", "docker", "wake_on_lan"],
    "max_sessions": 10
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'MCH_002: Machine is offline (400)']
      },
      {
        method: 'POST',
        path: '/api/machines/{id}/wake',
        description: 'Send Wake-on-LAN signal to a machine.',
        response: `{
  "success": true,
  "data": {
    "message": "Wake-on-LAN signal sent",
    "machine": { /* machine object */ }
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'MCH_003: Machine does not support Wake-on-LAN (400)', 'MCH_004: Machine is already online (400)']
      }
    ]
  },
  {
    id: 'sessions',
    title: 'Sessions',
    description: 'Manage Claude Code sessions on your machines.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/machines/{machine}/sessions',
        description: 'List all sessions for a machine.',
        query: [
          { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 20)' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "machine_id": "550e8400-e29b-41d4-a716-446655440001",
      "mode": "interactive",
      "project_path": "/home/user/project",
      "initial_prompt": "Help me refactor this code",
      "status": "running",
      "is_running": true,
      "is_completed": false,
      "pid": 12345,
      "exit_code": null,
      "pty_size": { "cols": 120, "rows": 40 },
      "total_tokens": 15000,
      "total_cost": 0.15,
      "duration": 3600,
      "formatted_duration": "1h 0m",
      "started_at": "2026-02-02T16:00:00Z",
      "completed_at": null,
      "created_at": "2026-02-02T16:00:00Z"
    }
  ],
  "meta": {
    "pagination": { /* pagination info */ },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/sessions',
        description: 'Create a new Claude Code session.',
        body: `{
  "mode": "interactive",
  "project_path": "/home/user/project",
  "initial_prompt": "Help me refactor this code",
  "pty_size": {
    "cols": 120,
    "rows": 40
  }
}`,
        response: `{
  "success": true,
  "data": { /* session object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'MCH_002: Machine is offline (400)', 'Validation error (422)']
      },
      {
        method: 'GET',
        path: '/api/sessions/{id}',
        description: 'Get session details.',
        response: `{
  "success": true,
  "data": {
    /* session object with recent_logs */
  },
  "meta": { /* meta object */ }
}`,
        errors: ['SES_001: Session not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'DELETE',
        path: '/api/sessions/{id}',
        description: 'Terminate a running session.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['SES_001: Session not found (404)', 'SES_003: Session already terminated (400)']
      },
      {
        method: 'GET',
        path: '/api/sessions/{id}/logs',
        description: 'Get session logs/history.',
        query: [
          { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 100)' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "type": "output",
      "data": "I'll help you refactor this code...",
      "metadata": {},
      "created_at": "2026-02-02T16:00:01Z"
    }
  ],
  "meta": {
    "pagination": { /* pagination info */ },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['SES_001: Session not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/sessions/{id}/attach',
        description: 'Get WebSocket token for attaching to a session.',
        response: `{
  "success": true,
  "data": {
    "ws_token": "hex_token_here",
    "session_id": "550e8400-e29b-41d4-a716-446655440002",
    "ws_url": "wss://claudenest.example.com:8080"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['SES_001: Session not found or not running (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/sessions/{id}/input',
        description: 'Send input to a running session.',
        body: `{
  "data": "Yes, proceed with the refactoring"
}`,
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['SES_001: Session not found or not running (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/sessions/{id}/resize',
        description: 'Resize the PTY dimensions of a session.',
        body: `{
  "cols": 150,
  "rows": 50
}`,
        response: `{
  "success": true,
  "data": {
    "pty_size": { "cols": 150, "rows": 50 }
  },
  "meta": { /* meta object */ }
}`,
        errors: ['SES_001: Session not found or not running (404)', 'Validation error (422)']
      }
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'Manage shared projects for multi-agent collaboration.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/machines/{machine}/projects',
        description: 'List all projects for a machine.',
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "machine_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "My Awesome Project",
      "project_path": "/home/user/project",
      "summary": "A brief summary of the project",
      "token_usage_percent": 45.5,
      "is_token_limit_reached": false,
      "active_instances_count": 2,
      "pending_tasks_count": 5,
      "settings": { /* project settings */ },
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-02T16:00:00Z"
    }
  ],
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/projects',
        description: 'Create a new shared project.',
        body: `{
  "name": "My Awesome Project",
  "project_path": "/home/user/project",
  "summary": "A brief summary",
  "architecture": "Architecture description",
  "conventions": "Coding conventions",
  "settings": {
    "autoContext": true,
    "maxContextTokens": 100000
  }
}`,
        response: `{
  "success": true,
  "data": { /* project object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['MCH_001: Machine not found (404)', 'VAL_001: Project already exists (422)', 'Validation error (422)']
      },
      {
        method: 'GET',
        path: '/api/projects/{id}',
        description: 'Get project details.',
        response: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "machine_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "My Awesome Project",
    "project_path": "/home/user/project",
    "summary": "A brief summary",
    "architecture": "Architecture description",
    "conventions": "Coding conventions",
    "current_focus": "Current development focus",
    "recent_changes": "Recent changes summary",
    "total_tokens": 45500,
    "max_tokens": 100000,
    "token_usage_percent": 45.5,
    "is_token_limit_reached": false,
    "active_instances_count": 2,
    "pending_tasks_count": 5,
    "settings": { /* project settings */ },
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-02-02T16:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'PATCH',
        path: '/api/projects/{id}',
        description: 'Update project information.',
        body: `{
  "name": "Updated Project Name",
  "summary": "Updated summary",
  "architecture": "Updated architecture",
  "conventions": "Updated conventions",
  "current_focus": "New focus",
  "recent_changes": "New changes",
  "max_tokens": 128000,
  "settings": {
    "autoContext": false
  }
}`,
        response: `{
  "success": true,
  "data": { /* updated project object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      },
      {
        method: 'DELETE',
        path: '/api/projects/{id}',
        description: 'Delete a project.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/projects/{id}/stats',
        description: 'Get project statistics.',
        response: `{
  "success": true,
  "data": {
    "total_tasks": 25,
    "pending_tasks": 5,
    "completed_tasks": 18,
    "active_instances": 2,
    "context_chunks": 150,
    "active_locks": 3,
    "token_usage": {
      "current": 45500,
      "max": 100000,
      "percent": 45.5
    },
    "activity_last_24h": 42
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/projects/{id}/instances',
        description: 'Get active Claude instances in a project.',
        response: `{
  "success": true,
  "data": [
    {
      "id": "instance-1",
      "status": "active",
      "is_connected": true,
      "is_available": true,
      "context_tokens": 25000,
      "context_usage_percent": 25,
      "max_context_tokens": 100000,
      "tasks_completed": 15,
      "current_task": {
        "id": "task-1",
        "title": "Refactor authentication"
      },
      "uptime": 7200,
      "connected_at": "2026-02-02T15:00:00Z",
      "last_activity_at": "2026-02-02T16:55:00Z"
    }
  ],
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/projects/{id}/activity',
        description: 'Get project activity log.',
        query: [
          { name: 'limit', type: 'integer', required: false, description: 'Number of items (default: 50)' },
          { name: 'since', type: 'string', required: false, description: 'ISO 8601 timestamp' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "type": "task_completed",
      "message": "Task 'Refactor auth' completed",
      "icon": "check-circle",
      "color": "green",
      "instance_id": "instance-1",
      "details": { /* additional details */ },
      "created_at": "2026-02-02T16:30:00Z"
    }
  ],
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/projects/{id}/broadcast',
        description: 'Broadcast a message to all instances in a project.',
        body: `{
  "message": "New requirements: Add OAuth support",
  "type": "info",
  "target_instances": ["instance-1", "instance-2"]
}`,
        response: `{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "broadcasted_at": "2026-02-02T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      }
    ]
  },
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Manage tasks within shared projects.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/projects/{project}/tasks',
        description: 'List tasks for a project.',
        query: [
          { name: 'status', type: 'string', required: false, description: 'Filter by status' },
          { name: 'assigned_to', type: 'string', required: false, description: 'Filter by assignee' },
          { name: 'priority', type: 'string', required: false, description: 'Filter by priority' },
          { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 20)' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "project_id": "550e8400-e29b-41d4-a716-446655440004",
      "title": "Implement OAuth",
      "description": "Add OAuth authentication flow",
      "priority": "high",
      "status": "in_progress",
      "is_claimed": true,
      "is_completed": false,
      "is_blocked": false,
      "assigned_to": "instance-1",
      "claimed_at": "2026-02-02T16:00:00Z",
      "completed_at": null,
      "created_at": "2026-02-02T15:00:00Z",
      "updated_at": "2026-02-02T16:00:00Z"
    }
  ],
  "meta": {
    "pagination": { /* pagination info */ },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/tasks',
        description: 'Create a new task.',
        body: `{
  "title": "Implement OAuth",
  "description": "Add OAuth authentication flow",
  "priority": "high",
  "files": ["auth.ts", "oauth.ts"],
  "estimated_tokens": 5000,
  "dependencies": ["550e8400-e29b-41d4-a716-446655440007"]
}`,
        response: `{
  "success": true,
  "data": { /* task object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      },
      {
        method: 'GET',
        path: '/api/tasks/{id}',
        description: 'Get task details.',
        response: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "project_id": "550e8400-e29b-41d4-a716-446655440004",
    "title": "Implement OAuth",
    "description": "Add OAuth authentication flow",
    "priority": "high",
    "status": "in_progress",
    "is_claimed": true,
    "is_completed": false,
    "is_blocked": false,
    "assigned_to": "instance-1",
    "claimed_at": "2026-02-02T16:00:00Z",
    "completed_at": null,
    "files": ["auth.ts", "oauth.ts"],
    "estimated_tokens": 5000,
    "dependencies": ["550e8400-e29b-41d4-a716-446655440007"],
    "blocked_by": [],
    "completion_summary": null,
    "files_modified": [],
    "created_by": "user-1",
    "duration": null,
    "created_at": "2026-02-02T15:00:00Z",
    "updated_at": "2026-02-02T16:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['TSK_001: Task not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'PATCH',
        path: '/api/tasks/{id}',
        description: 'Update a task.',
        body: `{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "medium",
  "files": ["auth.ts", "oauth.ts", "user.ts"],
  "estimated_tokens": 7500
}`,
        response: `{
  "success": true,
  "data": { /* updated task object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['TSK_001: Task not found (404)', 'Validation error (422)']
      },
      {
        method: 'DELETE',
        path: '/api/tasks/{id}',
        description: 'Delete a task.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['TSK_001: Task not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/tasks/{id}/claim',
        description: 'Claim a task for an instance.',
        body: `{
  "instance_id": "instance-1"
}`,
        response: `{
  "success": true,
  "data": { /* task object with claimed status */ },
  "meta": { /* meta object */ }
}`,
        errors: ['TSK_001: Task not found (404)', 'TSK_002: Task already claimed (409)', 'TSK_003: Task dependencies not completed (400)']
      },
      {
        method: 'POST',
        path: '/api/tasks/{id}/release',
        description: 'Release a claimed task.',
        body: `{
  "reason": "Need to work on higher priority task"
}`,
        response: `{
  "success": true,
  "data": { /* task object with released status */ },
  "meta": { /* meta object */ }
}`,
        errors: ['TSK_001: Task not found (404)', 'TSK_003: Task is not claimed (400)']
      },
      {
        method: 'POST',
        path: '/api/tasks/{id}/complete',
        description: 'Mark a task as completed.',
        body: `{
  "summary": "Successfully implemented OAuth with Google and GitHub providers",
  "files_modified": ["auth.ts", "oauth.ts", "user.ts"],
  "instance_id": "instance-1"
}`,
        response: `{
  "success": true,
  "data": { /* task object with completed status */ },
  "meta": { /* meta object */ }
}`,
        errors: ['TSK_001: Task not found (404)', 'TSK_003: Task must be claimed before completion (400)']
      },
      {
        method: 'GET',
        path: '/api/projects/{project}/tasks/next-available',
        description: 'Get the next available task (unclaimed, no blocking dependencies).',
        response: `{
  "success": true,
  "data": { /* task object or null */ },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      }
    ]
  },
  {
    id: 'context',
    title: 'Context (RAG)',
    description: 'Manage project context and RAG-powered context retrieval.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/projects/{project}/context',
        description: 'Get project context information.',
        response: `{
  "success": true,
  "data": {
    "summary": "Project summary",
    "architecture": "Architecture description",
    "conventions": "Coding conventions",
    "current_focus": "Current development focus",
    "recent_changes": "Recent changes",
    "total_tokens": 45500,
    "max_tokens": 100000,
    "token_usage_percent": 45.5
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'PATCH',
        path: '/api/projects/{project}/context',
        description: 'Update project context.',
        body: `{
  "summary": "Updated summary",
  "architecture": "Updated architecture",
  "conventions": "Updated conventions",
  "current_focus": "New focus",
  "recent_changes": "New changes"
}`,
        response: `{
  "success": true,
  "data": {
    "summary": "Updated summary",
    "architecture": "Updated architecture",
    "conventions": "Updated conventions",
    "current_focus": "New focus",
    "recent_changes": "New changes"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/context/query',
        description: 'Query context chunks using RAG (Retrieval-Augmented Generation).',
        body: `{
  "query": "How is authentication implemented?",
  "limit": 10,
  "type": "task_completion",
  "min_similarity": 0.7
}`,
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "content": "Task completed: Implement OAuth...",
      "type": "task_completion",
      "instance_id": "instance-1",
      "task_id": "550e8400-e29b-41d4-a716-446655440006",
      "files": ["auth.ts", "oauth.ts"],
      "importance_score": 0.8,
      "similarity": 0.92,
      "created_at": "2026-02-02T16:00:00Z"
    }
  ],
  "meta": {
    "query": "How is authentication implemented?",
    "result_count": 1,
    "used_embeddings": true,
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      },
      {
        method: 'GET',
        path: '/api/projects/{project}/context/chunks',
        description: 'List context chunks for a project.',
        query: [
          { name: 'type', type: 'string', required: false, description: 'Filter by type' },
          { name: 'instance_id', type: 'string', required: false, description: 'Filter by instance' },
          { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 50)' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "content": "Truncated content...",
      "type": "task_completion",
      "instance_id": "instance-1",
      "task_id": "550e8400-e29b-41d4-a716-446655440006",
      "files": ["auth.ts"],
      "importance_score": 0.8,
      "expires_at": "2026-03-04T17:00:00Z",
      "created_at": "2026-02-02T16:00:00Z"
    }
  ],
  "meta": {
    "pagination": { /* pagination info */ },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/context/chunks',
        description: 'Create a new context chunk.',
        body: `{
  "content": "Important decision: We will use JWT for authentication",
  "type": "decision",
  "instance_id": "instance-1",
  "task_id": "550e8400-e29b-41d4-a716-446655440006",
  "files": ["auth.ts"],
  "importance_score": 0.9,
  "generate_embedding": true
}`,
        response: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "type": "decision",
    "has_embedding": true,
    "created_at": "2026-02-02T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      },
      {
        method: 'DELETE',
        path: '/api/projects/{project}/context/chunks/{chunkId}',
        description: 'Delete a context chunk.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project or chunk not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/context/summarize',
        description: 'Summarize context chunks using AI.',
        body: `{
  "chunk_ids": ["550e8400-e29b-41d4-a716-446655440008", "550e8400-e29b-41d4-a716-446655440009"],
  "max_length": 1000
}`,
        response: `{
  "success": true,
  "data": {
    "summary": "AI-generated summary of the context chunks...",
    "chunks_used": 2,
    "total_chars": 2500,
    "ai_generated": true
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      }
    ]
  },
  {
    id: 'file-locks',
    title: 'File Locks',
    description: 'Manage file locks for conflict prevention in multi-agent environments.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/projects/{project}/locks',
        description: 'List active file locks for a project.',
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "path": "src/auth.ts",
      "locked_by": "instance-1",
      "reason": "Refactoring authentication",
      "locked_at": "2026-02-02T16:00:00Z",
      "expires_at": "2026-02-02T16:30:00Z",
      "remaining_seconds": 1800
    }
  ],
  "meta": {
    "count": 1,
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/locks',
        description: 'Acquire a file lock.',
        body: `{
  "path": "src/auth.ts",
  "instance_id": "instance-1",
  "reason": "Refactoring authentication",
  "duration_minutes": 30
}`,
        response: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "path": "src/auth.ts",
    "locked_by": "instance-1",
    "reason": "Refactoring authentication",
    "locked_at": "2026-02-02T16:00:00Z",
    "expires_at": "2026-02-02T16:30:00Z",
    "remaining_seconds": 1800
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'LCK_001: File already locked (409)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/locks/check',
        description: 'Check if a file is locked.',
        body: `{
  "path": "src/auth.ts"
}`,
        response: `{
  "success": true,
  "data": {
    "is_locked": true,
    "locked_by": "instance-1"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/locks/extend',
        description: 'Extend a file lock duration.',
        body: `{
  "path": "src/auth.ts",
  "instance_id": "instance-1",
  "minutes": 30
}`,
        response: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "path": "src/auth.ts",
    "expires_at": "2026-02-02T17:00:00Z",
    "remaining_seconds": 3600
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'LCK_002: Lock not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/locks/release',
        description: 'Release a file lock.',
        body: `{
  "path": "src/auth.ts",
  "instance_id": "instance-1"
}`,
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'LCK_002: Lock not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/locks/force-release',
        description: 'Force release a file lock (admin only).',
        body: `{
  "path": "src/auth.ts"
}`,
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'LCK_002: Lock not found (404)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/locks/bulk',
        description: 'Lock multiple files at once.',
        body: `{
  "paths": ["src/auth.ts", "src/user.ts"],
  "instance_id": "instance-1",
  "reason": "Refactoring user module"
}`,
        response: `{
  "success": true,
  "data": {
    "locked": [
      {
        "path": "src/auth.ts",
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "expires_at": "2026-02-02T16:30:00Z"
      },
      {
        "path": "src/user.ts",
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "expires_at": "2026-02-02T16:30:00Z"
      }
    ],
    "failed": []
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/projects/{project}/locks/release-by-instance',
        description: 'Release all locks by an instance.',
        body: `{
  "instance_id": "instance-1"
}`,
        response: `{
  "success": true,
  "data": {
    "released_count": 3
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CTX_001: Project not found (404)', 'Validation error (422)']
      }
    ]
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'Manage discovered Claude Code skills on your machines.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/machines/{machine}/skills',
        description: 'List discovered skills for a machine.',
        query: [
          { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 15)' },
          { name: 'search', type: 'string', required: false, description: 'Search by name or description' },
          { name: 'category', type: 'string', required: false, description: 'Filter by category' },
          { name: 'enabled', type: 'boolean', required: false, description: 'Filter by enabled status' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440012",
      "machine_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "refactor",
      "display_name": "Code Refactoring",
      "description": "Refactor code for better structure",
      "category": "development",
      "path": "/skills/refactor",
      "version": "1.0.0",
      "enabled": true,
      "config": { /* skill config */ },
      "tags": ["code", "refactor"],
      "examples": ["Refactor auth.ts"],
      "discovered_at": "2026-02-01T10:00:00Z"
    }
  ],
  "meta": {
    "categories": {
      "development": 10,
      "testing": 5,
      "deployment": 3
    },
    "pagination": { /* pagination info */ },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['SKL_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/machines/{machine}/skills/{path}',
        description: 'Get skill details.',
        response: `{
  "success": true,
  "data": {
    "skill": { /* skill object */ },
    "related": [ /* related skills */ ]
  },
  "meta": { /* meta object */ }
}`,
        errors: ['SKL_001: Machine not found (404)', 'SKL_002: Skill not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/skills',
        description: 'Register a new skill.',
        body: `{
  "name": "refactor",
  "display_name": "Code Refactoring",
  "description": "Refactor code for better structure",
  "category": "development",
  "path": "/skills/refactor",
  "version": "1.0.0",
  "enabled": true,
  "config": {},
  "tags": ["code", "refactor"],
  "examples": ["Refactor auth.ts"]
}`,
        response: `{
  "success": true,
  "data": { /* skill object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['SKL_001: Machine not found (404)', 'Validation error (422)']
      },
      {
        method: 'PATCH',
        path: '/api/machines/{machine}/skills/{path}',
        description: 'Update skill configuration.',
        body: `{
  "enabled": false,
  "config": { "autoApply": true },
  "display_name": "Advanced Refactoring",
  "description": "Updated description"
}`,
        response: `{
  "success": true,
  "data": { /* updated skill object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['SKL_001: Machine not found (404)', 'SKL_002: Skill not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/skills/{path}/toggle',
        description: 'Toggle skill enabled status.',
        response: `{
  "success": true,
  "data": { /* skill object with toggled status */ },
  "meta": { /* meta object */ }
}`,
        errors: ['SKL_001: Machine not found (404)', 'SKL_002: Skill not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'DELETE',
        path: '/api/machines/{machine}/skills/{path}',
        description: 'Delete a skill.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['SKL_001: Machine not found (404)', 'SKL_002: Skill not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/skills/bulk',
        description: 'Bulk update skills.',
        body: `{
  "paths": ["/skills/refactor", "/skills/test"],
  "enabled": false
}`,
        response: `{
  "success": true,
  "data": {
    "updated_count": 2,
    "enabled": false
  },
  "meta": { /* meta object */ }
}`,
        errors: ['SKL_001: Machine not found (404)', 'Validation error (422)']
      }
    ]
  },
  {
    id: 'mcp',
    title: 'MCP Servers',
    description: 'Manage Model Context Protocol (MCP) servers and tools.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/machines/{machine}/mcp',
        description: 'List MCP servers for a machine.',
        query: [
          { name: 'status', type: 'string', required: false, description: 'Filter by status' },
          { name: 'transport', type: 'string', required: false, description: 'Filter by transport' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440013",
      "machine_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "filesystem",
      "display_name": "Filesystem Tools",
      "description": "File system operations",
      "transport": "stdio",
      "command": "npx -y @modelcontextprotocol/server-filesystem /path",
      "url": null,
      "env_vars": {},
      "config": {},
      "status": "running",
      "is_running": true,
      "is_stopped": false,
      "tools": [
        { "name": "read_file", "description": "Read a file" }
      ],
      "started_at": "2026-02-02T10:00:00Z",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-02T10:00:00Z"
    }
  ],
  "meta": {
    "stats": {
      "total": 5,
      "running": 3,
      "stopped": 2,
      "error": 0,
      "total_tools": 25
    },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
        errors: ['MCP_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/machines/{machine}/mcp/{name}',
        description: 'Get MCP server details.',
        response: `{
  "success": true,
  "data": { /* mcp server object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_002: MCP server not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/mcp',
        description: 'Register a new MCP server.',
        body: `{
  "name": "filesystem",
  "display_name": "Filesystem Tools",
  "description": "File system operations",
  "transport": "stdio",
  "command": "npx -y @modelcontextprotocol/server-filesystem /path",
  "url": null,
  "env_vars": {},
  "config": {}
}`,
        response: `{
  "success": true,
  "data": { /* mcp server object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_003: Server already exists (409)', 'Validation error (422)']
      },
      {
        method: 'PATCH',
        path: '/api/machines/{machine}/mcp/{name}',
        description: 'Update MCP server configuration.',
        body: `{
  "display_name": "Updated Name",
  "description": "Updated description",
  "command": "updated command",
  "env_vars": { "KEY": "value" },
  "config": { "option": true }
}`,
        response: `{
  "success": true,
  "data": { /* updated mcp server object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_002: MCP server not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/mcp/{name}/start',
        description: 'Start an MCP server.',
        response: `{
  "success": true,
  "data": {
    "message": "MCP server start initiated",
    "server": { /* mcp server object */ }
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_002: MCP server not found (404)', 'MCP_004: Already running (400)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/mcp/{name}/stop',
        description: 'Stop an MCP server.',
        response: `{
  "success": true,
  "data": {
    "message": "MCP server stopped",
    "server": { /* mcp server object */ }
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_002: MCP server not found (404)', 'MCP_005: Already stopped (400)']
      },
      {
        method: 'GET',
        path: '/api/machines/{machine}/mcp/{name}/tools',
        description: 'Get tools available from an MCP server.',
        response: `{
  "success": true,
  "data": {
    "server": { /* mcp server object */ },
    "tools": [
      {
        "name": "read_file",
        "description": "Read a file",
        "parameters": { /* JSON schema */ }
      }
    ],
    "count": 1
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_002: MCP server not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/mcp/{name}/execute',
        description: 'Execute a tool on an MCP server.',
        body: `{
  "tool": "read_file",
  "params": {
    "path": "/path/to/file.txt"
  }
}`,
        response: `{
  "success": true,
  "data": {
    "message": "Tool execution initiated",
    "tool": "read_file",
    "params": { "path": "/path/to/file.txt" },
    "status": "pending"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_002: MCP server not found (404)', 'MCP_006: Not running (400)', 'MCP_007: Tool not found (404)', 'Validation error (422)']
      },
      {
        method: 'DELETE',
        path: '/api/machines/{machine}/mcp/{name}',
        description: 'Delete an MCP server.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'MCP_002: MCP server not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/machines/{machine}/mcp/all-tools',
        description: 'Get all tools from all running MCP servers.',
        response: `{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "read_file",
        "description": "Read a file",
        "parameters": { /* JSON schema */ },
        "server": {
          "id": "550e8400-e29b-41d4-a716-446655440013",
          "name": "filesystem",
          "display_name": "Filesystem Tools"
        }
      }
    ],
    "count": 25,
    "servers_count": 3
  },
  "meta": { /* meta object */ }
}`,
        errors: ['MCP_001: Machine not found (404)', 'Unauthenticated (401)']
      }
    ]
  },
  {
    id: 'commands',
    title: 'Discovered Commands',
    description: 'Manage discovered commands from your machines.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/machines/{machine}/commands',
        description: 'List discovered commands for a machine.',
        query: [
          { name: 'per_page', type: 'integer', required: false, description: 'Items per page' },
          { name: 'search', type: 'string', required: false, description: 'Search query' },
          { name: 'category', type: 'string', required: false, description: 'Filter by category' }
        ],
        response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440014",
      "machine_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "test",
      "description": "Run tests",
      "command": "npm test",
      "working_directory": "/home/user/project",
      "env_vars": {},
      "category": "testing",
      "usage_count": 42,
      "last_used_at": "2026-02-02T16:00:00Z",
      "created_at": "2026-02-01T10:00:00Z"
    }
  ],
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'GET',
        path: '/api/machines/{machine}/commands/search',
        description: 'Search discovered commands.',
        query: [
          { name: 'q', type: 'string', required: true, description: 'Search query' }
        ],
        response: `{
  "success": true,
  "data": [ /* command objects */ ],
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'Validation error (422)']
      },
      {
        method: 'GET',
        path: '/api/machines/{machine}/commands/{id}',
        description: 'Get command details.',
        response: `{
  "success": true,
  "data": { /* command object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'CMD_002: Command not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/commands',
        description: 'Register a discovered command.',
        body: `{
  "name": "test",
  "description": "Run tests",
  "command": "npm test",
  "working_directory": "/home/user/project",
  "env_vars": { "NODE_ENV": "test" },
  "category": "testing"
}`,
        response: `{
  "success": true,
  "data": { /* command object */ },
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/commands/bulk',
        description: 'Register multiple commands at once.',
        body: `{
  "commands": [
    { /* command 1 */ },
    { /* command 2 */ }
  ]
}`,
        response: `{
  "success": true,
  "data": {
    "created": [ /* created commands */ ],
    "updated": [ /* updated commands */ ]
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'Validation error (422)']
      },
      {
        method: 'POST',
        path: '/api/machines/{machine}/commands/{id}/execute',
        description: 'Execute a discovered command.',
        body: `{
  "env_vars": { "EXTRA_VAR": "value" }
}`,
        response: `{
  "success": true,
  "data": {
    "message": "Command execution initiated",
    "status": "pending"
  },
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'CMD_002: Command not found (404)', 'CMD_003: Machine offline (400)']
      },
      {
        method: 'DELETE',
        path: '/api/machines/{machine}/commands/{id}',
        description: 'Delete a discovered command.',
        response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'CMD_002: Command not found (404)', 'Unauthenticated (401)']
      },
      {
        method: 'DELETE',
        path: '/api/machines/{machine}/commands',
        description: 'Clear all discovered commands for a machine.',
        response: `{
  "success": true,
  "data": { "deleted_count": 42 },
  "meta": { /* meta object */ }
}`,
        errors: ['CMD_001: Machine not found (404)', 'Unauthenticated (401)']
      }
    ]
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Health check and system status.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/health',
        description: 'Check API health status. Does not require authentication.',
        response: `{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "2026-02-02T17:00:00Z"
  }
}`,
        errors: []
      }
    ]
  }
];

// Export individual category lookup
export const getCategoryById = (id: string): ApiCategory | undefined => {
  return apiCategories.find(cat => cat.id === id);
};

// Export endpoint lookup
export const getEndpointByPath = (path: string, method?: string): ApiEndpoint | undefined => {
  for (const category of apiCategories) {
    const endpoint = category.endpoints.find(
      ep => ep.path === path && (!method || ep.method === method)
    );
    if (endpoint) return endpoint;
  }
  return undefined;
};

// Search endpoints
export const searchEndpoints = (query: string): Array<{ category: ApiCategory; endpoint: ApiEndpoint }> => {
  const results: Array<{ category: ApiCategory; endpoint: ApiEndpoint }> = [];
  const lowerQuery = query.toLowerCase();
  
  for (const category of apiCategories) {
    for (const endpoint of category.endpoints) {
      if (
        endpoint.path.toLowerCase().includes(lowerQuery) ||
        endpoint.description.toLowerCase().includes(lowerQuery) ||
        endpoint.method.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ category, endpoint });
      }
    }
  }
  
  return results;
};

// Error codes reference
export const errorCodes = [
  { code: 'AUTH_001', message: 'Invalid provider / Token not found', http: '400/404' },
  { code: 'AUTH_002', message: 'Invalid credentials', http: '401' },
  { code: 'AUTH_003', message: 'Unable to send reset link', http: '400' },
  { code: 'AUTH_004', message: 'Invalid or expired reset token', http: '400' },
  { code: 'MCH_001', message: 'Machine not found', http: '404' },
  { code: 'MCH_002', message: 'Machine is offline', http: '400' },
  { code: 'MCH_003', message: 'Machine does not support Wake-on-LAN', http: '400' },
  { code: 'MCH_004', message: 'Machine is already online', http: '400' },
  { code: 'SES_001', message: 'Session not found or not running', http: '404' },
  { code: 'SES_003', message: 'Session already terminated', http: '400' },
  { code: 'CTX_001', message: 'Project or context not found', http: '404' },
  { code: 'VAL_001', message: 'Project already exists / Validation error', http: '422' },
  { code: 'TSK_001', message: 'Task not found', http: '404' },
  { code: 'TSK_002', message: 'Task already claimed', http: '409' },
  { code: 'TSK_003', message: 'Task dependencies not completed / Task not claimed', http: '400' },
  { code: 'LCK_001', message: 'File already locked', http: '409' },
  { code: 'LCK_002', message: 'Lock not found or expired', http: '404' },
  { code: 'SKL_001', message: 'Machine not found', http: '404' },
  { code: 'SKL_002', message: 'Skill not found', http: '404' },
  { code: 'MCP_001', message: 'Machine not found', http: '404' },
  { code: 'MCP_002', message: 'MCP server not found', http: '404' },
  { code: 'MCP_003', message: 'MCP server already exists', http: '409' },
  { code: 'MCP_004', message: 'MCP server is already running', http: '400' },
  { code: 'MCP_005', message: 'MCP server is already stopped', http: '400' },
  { code: 'MCP_006', message: 'MCP server is not running', http: '400' },
  { code: 'MCP_007', message: 'Tool not found on this server', http: '404' },
  { code: 'CMD_001', message: 'Machine not found', http: '404' },
  { code: 'CMD_002', message: 'Command not found', http: '404' },
  { code: 'CMD_003', message: 'Machine is offline', http: '400' }
];
