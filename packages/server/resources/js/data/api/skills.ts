import type { ApiCategory } from './types';

export const skillsCategory: ApiCategory = {
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
        { name: 'enabled', type: 'boolean', required: false, description: 'Filter by enabled status' },
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
      errors: ['SKL_001: Machine not found (404)', 'Unauthenticated (401)'],
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
      errors: [
        'SKL_001: Machine not found (404)',
        'SKL_002: Skill not found (404)',
        'Unauthenticated (401)',
      ],
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
      errors: ['SKL_001: Machine not found (404)', 'Validation error (422)'],
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
      errors: [
        'SKL_001: Machine not found (404)',
        'SKL_002: Skill not found (404)',
        'Validation error (422)',
      ],
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
      errors: [
        'SKL_001: Machine not found (404)',
        'SKL_002: Skill not found (404)',
        'Unauthenticated (401)',
      ],
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
      errors: [
        'SKL_001: Machine not found (404)',
        'SKL_002: Skill not found (404)',
        'Unauthenticated (401)',
      ],
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
      errors: ['SKL_001: Machine not found (404)', 'Validation error (422)'],
    },
  ],
};
