import type { ApiCategory } from './types';

export const tasksCategory: ApiCategory = {
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
        { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 20)' },
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
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
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
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
      errors: ['TSK_001: Task not found (404)', 'Unauthenticated (401)'],
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
      errors: ['TSK_001: Task not found (404)', 'Validation error (422)'],
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
      errors: ['TSK_001: Task not found (404)', 'Unauthenticated (401)'],
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
      errors: [
        'TSK_001: Task not found (404)',
        'TSK_002: Task already claimed (409)',
        'TSK_003: Task dependencies not completed (400)',
      ],
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
      errors: ['TSK_001: Task not found (404)', 'TSK_003: Task is not claimed (400)'],
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
      errors: [
        'TSK_001: Task not found (404)',
        'TSK_003: Task must be claimed before completion (400)',
      ],
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
    },
  ],
};
