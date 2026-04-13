import type { ApiCategory } from './types';

export const commandsCategory: ApiCategory = {
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
        { name: 'category', type: 'string', required: false, description: 'Filter by category' },
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
      errors: ['CMD_001: Machine not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'GET',
      path: '/api/machines/{machine}/commands/search',
      description: 'Search discovered commands.',
      query: [
        { name: 'q', type: 'string', required: true, description: 'Search query' },
      ],
      response: `{
  "success": true,
  "data": [ /* command objects */ ],
  "meta": { /* meta object */ }
}`,
      errors: ['CMD_001: Machine not found (404)', 'Validation error (422)'],
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
      errors: [
        'CMD_001: Machine not found (404)',
        'CMD_002: Command not found (404)',
        'Unauthenticated (401)',
      ],
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
      errors: ['CMD_001: Machine not found (404)', 'Validation error (422)'],
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
      errors: ['CMD_001: Machine not found (404)', 'Validation error (422)'],
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
      errors: [
        'CMD_001: Machine not found (404)',
        'CMD_002: Command not found (404)',
        'CMD_003: Machine offline (400)',
      ],
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
      errors: [
        'CMD_001: Machine not found (404)',
        'CMD_002: Command not found (404)',
        'Unauthenticated (401)',
      ],
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
      errors: ['CMD_001: Machine not found (404)', 'Unauthenticated (401)'],
    },
  ],
};
