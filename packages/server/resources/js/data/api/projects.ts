import type { ApiCategory } from './types';

export const projectsCategory: ApiCategory = {
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
      errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)'],
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
      errors: [
        'MCH_001: Machine not found (404)',
        'VAL_001: Project already exists (422)',
        'Validation error (422)',
      ],
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
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
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'GET',
      path: '/api/projects/{id}/activity',
      description: 'Get project activity log.',
      query: [
        { name: 'limit', type: 'integer', required: false, description: 'Number of items (default: 50)' },
        { name: 'since', type: 'string', required: false, description: 'ISO 8601 timestamp' },
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
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
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
    },
  ],
};
