import type { ApiCategory } from './types';

export const dashboardCategory: ApiCategory = {
  id: 'dashboard',
  title: 'Dashboard',
  description: 'Aggregated metrics and statistics for the dashboard.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/dashboard',
      description: 'Get aggregated dashboard metrics (machines, sessions, projects, tasks).',
      response: `{
  "success": true,
  "data": {
    "machines": { "total": 5, "online": 3 },
    "sessions": { "active": 2, "total_today": 8 },
    "projects": { "total": 4, "active_instances": 6 },
    "tasks": { "pending": 12, "in_progress": 4, "completed_today": 7 }
  }
}`,
    },
  ],
};

export const healthCategory: ApiCategory = {
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
    "version": "1.2.0",
    "timestamp": "2026-04-12T17:00:00Z"
  }
}`,
      errors: [],
    },
  ],
};
