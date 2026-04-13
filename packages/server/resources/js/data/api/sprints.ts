import type { ApiCategory } from './types';

export const sprintsCategory: ApiCategory = {
  id: 'sprints',
  title: 'Sprints',
  description: 'Time-boxed iterations with burndown tracking and velocity metrics.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/projects/{id}/sprints',
      description: 'List all sprints for a project with burndown data.',
      response: `{
  "success": true,
  "data": [
    {
      "id": "sprint-2026-w15",
      "project_id": "...",
      "name": "Sprint 15",
      "goal": "Complete checkout flow",
      "starts_at": "2026-04-07T00:00:00Z",
      "ends_at": "2026-04-18T18:00:00Z",
      "status": "active",
      "total_story_points": 21,
      "completed_story_points": 8,
      "total_tasks": 7,
      "completed_tasks": 3
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/projects/{id}/sprints',
      description: 'Create a new sprint.',
      body: `{
  "name": "Sprint 16",
  "goal": "Mobile app integration",
  "starts_at": "2026-04-21T00:00:00Z",
  "ends_at": "2026-05-02T18:00:00Z"
}`,
      response: `{
  "success": true,
  "data": { "id": "sprint-2026-w17", "name": "Sprint 16", "status": "planned" }
}`,
    },
    {
      method: 'PATCH',
      path: '/api/sprints/{id}',
      description: 'Update a sprint (name, goal, dates, status).',
      body: `{ "status": "completed" }`,
      response: `{
  "success": true,
  "data": { /* updated sprint */ }
}`,
    },
    {
      method: 'GET',
      path: '/api/sprints/{id}/burndown',
      description: 'Get daily burndown data for a sprint.',
      response: `{
  "success": true,
  "data": {
    "sprint_id": "sprint-2026-w15",
    "ideal": [21, 18, 15, 12, 9, 6, 3, 0],
    "actual": [21, 19, 16, 13, 13, 8, null, null],
    "dates": ["2026-04-07", "2026-04-08", "..."]
  }
}`,
    },
  ],
};
