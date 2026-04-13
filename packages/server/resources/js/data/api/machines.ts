import type { ApiCategory } from './types';

export const machinesCategory: ApiCategory = {
  id: 'machines',
  title: 'Machines',
  description: 'Manage registered machines (agents) and their configuration.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/machines',
      description: 'List all machines for the authenticated user.',
      query: [
        { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 15)' },
        { name: 'search', type: 'string', required: false, description: 'Search by name or hostname' },
        { name: 'status', type: 'string', required: false, description: 'Filter by status: online, offline, connecting, error' },
      ],
      response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "MacBook-Pro-Work",
      "platform": "darwin",
      "hostname": "macbook-pro.local",
      "arch": "arm64",
      "status": "online",
      "is_online": true,
      "capabilities": ["claude_code", "git", "docker", "wake_on_lan"],
      "max_sessions": 10,
      "active_sessions_count": 3,
      "last_seen_at": "2026-02-02T16:55:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123",
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}`,
      errors: ['Unauthenticated (401)'],
    },
    {
      method: 'POST',
      path: '/api/machines',
      description: 'Register a new machine or update existing one.',
      body: `{
  "name": "MacBook-Pro-Work",
  "platform": "darwin",
  "hostname": "macbook-pro.local",
  "arch": "arm64",
  "node_version": "20.11.0",
  "agent_version": "1.0.0",
  "claude_version": "0.2.29",
  "claude_path": "/usr/local/bin/claude",
  "capabilities": ["claude_code", "git", "docker"],
  "max_sessions": 10
}`,
      response: `{
  "success": true,
  "data": {
    "machine": { /* machine object */ },
    "token": "machine_token_here"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['Unauthenticated (401)'],
    },
    {
      method: 'GET',
      path: '/api/machines/{id}',
      description: 'Get detailed information about a specific machine.',
      response: `{
  "success": true,
  "data": { /* full machine object */ },
  "meta": { /* meta object */ }
}`,
      errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'PATCH',
      path: '/api/machines/{id}',
      description: 'Update machine configuration.',
      body: `{
  "name": "MacBook-Pro-Updated",
  "max_sessions": 15,
  "capabilities": ["claude_code", "git", "docker", "wake_on_lan"]
}`,
      response: `{
  "success": true,
  "data": { /* updated machine object */ },
  "meta": { /* meta object */ }
}`,
      errors: ['MCH_001: Machine not found (404)', 'Validation error (422)'],
    },
    {
      method: 'DELETE',
      path: '/api/machines/{id}',
      description: 'Delete a machine and terminate all active sessions.',
      response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
      errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'POST',
      path: '/api/machines/{id}/regenerate-token',
      description: 'Generate a new authentication token for the machine.',
      response: `{
  "success": true,
  "data": {
    "token": "new_machine_token_here"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['MCH_001: Machine not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'GET',
      path: '/api/machines/{id}/environment',
      description: 'Get machine environment information.',
      response: `{
  "success": true,
  "data": {
    "platform": "darwin",
    "hostname": "macbook-pro.local",
    "arch": "arm64",
    "node_version": "20.11.0",
    "agent_version": "1.0.0",
    "claude_version": "0.2.29",
    "claude_path": "/usr/local/bin/claude",
    "capabilities": ["claude_code", "git", "docker", "wake_on_lan"],
    "max_sessions": 10
  },
  "meta": { /* meta object */ }
}`,
      errors: ['MCH_001: Machine not found (404)', 'MCH_002: Machine is offline (400)'],
    },
    {
      method: 'POST',
      path: '/api/machines/{id}/wake',
      description: 'Send Wake-on-LAN signal to a machine.',
      response: `{
  "success": true,
  "data": {
    "message": "Wake-on-LAN signal sent",
    "machine": { /* machine object */ }
  },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCH_001: Machine not found (404)',
        'MCH_003: Machine does not support Wake-on-LAN (400)',
        'MCH_004: Machine is already online (400)',
      ],
    },
  ],
};
