import type { ApiCategory } from './types';

export const sessionsCategory: ApiCategory = {
  id: 'sessions',
  title: 'Sessions',
  description: 'Manage Claude Code sessions on your machines.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/machines/{machine}/sessions',
      description: 'List all sessions for a machine.',
      query: [
        { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 20)' },
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
      errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)'],
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
      errors: [
        'MCH_001: Machine not found (404)',
        'MCH_002: Machine is offline (400)',
        'Validation error (422)',
      ],
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
      errors: ['SES_001: Session not found (404)', 'Unauthenticated (401)'],
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
      errors: ['SES_001: Session not found (404)', 'SES_003: Session already terminated (400)'],
    },
    {
      method: 'GET',
      path: '/api/sessions/{id}/logs',
      description: 'Get session logs/history.',
      query: [
        { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 100)' },
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
      errors: ['SES_001: Session not found (404)', 'Unauthenticated (401)'],
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
      errors: ['SES_001: Session not found or not running (404)', 'Unauthenticated (401)'],
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
      errors: ['SES_001: Session not found or not running (404)', 'Validation error (422)'],
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
      errors: ['SES_001: Session not found or not running (404)', 'Validation error (422)'],
    },
  ],
};
