import type { ApiCategory } from './types';

export const epicsCategory: ApiCategory = {
  id: 'epics',
  title: 'Epics',
  description: 'Group related tasks into epics for feature-level tracking.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/projects/{id}/epics',
      description: 'List all epics for a project with aggregate progress.',
      response: `{
  "success": true,
  "data": [
    {
      "id": "epic-001",
      "project_id": "...",
      "name": "Payment System",
      "description": "End-to-end payment integration",
      "status": "in_progress",
      "total_tasks": 8,
      "completed_tasks": 3,
      "percent_done": 37.5,
      "total_story_points": 34,
      "completed_story_points": 13,
      "created_at": "2026-03-15T09:00:00Z"
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/projects/{id}/epics',
      description: 'Create a new epic.',
      body: `{
  "name": "User Authentication",
  "description": "Complete auth system with OAuth and MFA"
}`,
      response: `{
  "success": true,
  "data": { "id": "epic-002", "name": "User Authentication", "status": "pending" }
}`,
    },
    {
      method: 'PATCH',
      path: '/api/epics/{id}',
      description: 'Update an epic.',
      body: `{
  "name": "Updated Epic Name",
  "status": "done"
}`,
      response: `{
  "success": true,
  "data": { /* updated epic */ }
}`,
    },
    {
      method: 'DELETE',
      path: '/api/epics/{id}',
      description: 'Delete an epic (tasks are unlinked, not deleted).',
      response: `{
  "success": true,
  "data": { "message": "Epic deleted" }
}`,
    },
  ],
};
