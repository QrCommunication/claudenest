import type { ApiCategory } from './types';

export const locksCategory: ApiCategory = {
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
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
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
      errors: [
        'CTX_001: Project not found (404)',
        'LCK_001: File already locked (409)',
        'Validation error (422)',
      ],
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
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
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
      errors: [
        'CTX_001: Project not found (404)',
        'LCK_002: Lock not found (404)',
        'Validation error (422)',
      ],
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
      errors: [
        'CTX_001: Project not found (404)',
        'LCK_002: Lock not found (404)',
        'Validation error (422)',
      ],
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
      errors: ['CTX_001: Project not found (404)', 'LCK_002: Lock not found (404)'],
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
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
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
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
    },
  ],
};
