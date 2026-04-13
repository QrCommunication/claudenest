import type { ApiCategory } from './types';

export const runnerCategory: ApiCategory = {
  id: 'runner-agent',
  title: 'Runner Agent',
  description: 'Automated monitoring agent that tracks sprint progress and auto-updates task statuses.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/projects/{id}/runner/health',
      description: 'Check the health and status of the Runner Agent for a project.',
      response: `{
  "success": true,
  "data": {
    "status": "active",
    "last_sweep_at": "2026-04-12T14:30:00Z",
    "tasks_auto_updated": 12,
    "alerts_triggered": 2
  }
}`,
    },
    {
      method: 'POST',
      path: '/api/projects/{id}/runner/auto-update',
      description: 'Force a status sweep. The Runner checks all in-progress tasks and updates statuses based on instance activity.',
      response: `{
  "success": true,
  "data": {
    "tasks_updated": 3,
    "details": [
      { "task_id": "...", "old_status": "in_progress", "new_status": "done", "reason": "Instance reported completion" }
    ]
  }
}`,
    },
    {
      method: 'GET',
      path: '/api/projects/{id}/runner/progress',
      description: 'Get live sprint progress including burndown, velocity, and alerts.',
      response: `{
  "success": true,
  "data": {
    "sprint": { "id": "...", "name": "Sprint 15", "days_remaining": 4 },
    "progress_percent": 62,
    "on_track": true,
    "velocity_current": 20,
    "alerts": [
      { "type": "blocked_task", "task_id": "...", "message": "Task blocked for 2 days" }
    ]
  }
}`,
    },
    {
      method: 'GET',
      path: '/api/projects/{id}/runner/alerts',
      description: 'List all active alerts from the Runner Agent.',
      response: `{
  "success": true,
  "data": [
    {
      "id": "alert-001",
      "type": "stale_task",
      "severity": "warning",
      "message": "Task 'Implement webhooks' has not been updated in 48 hours",
      "task_id": "...",
      "created_at": "2026-04-12T10:00:00Z"
    }
  ]
}`,
    },
  ],
};
