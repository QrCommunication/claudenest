import type { ApiCategory } from './types';

export const mcpCategory: ApiCategory = {
  id: 'mcp',
  title: 'MCP Servers',
  description: 'Manage Model Context Protocol (MCP) servers and tools.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/machines/{machine}/mcp',
      description: 'List MCP servers for a machine.',
      query: [
        { name: 'status', type: 'string', required: false, description: 'Filter by status' },
        { name: 'transport', type: 'string', required: false, description: 'Filter by transport' },
      ],
      response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440013",
      "machine_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "filesystem",
      "display_name": "Filesystem Tools",
      "description": "File system operations",
      "transport": "stdio",
      "command": "npx -y @modelcontextprotocol/server-filesystem /path",
      "url": null,
      "env_vars": {},
      "config": {},
      "status": "running",
      "is_running": true,
      "is_stopped": false,
      "tools": [
        { "name": "read_file", "description": "Read a file" }
      ],
      "started_at": "2026-02-02T10:00:00Z",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-02T10:00:00Z"
    }
  ],
  "meta": {
    "stats": {
      "total": 5,
      "running": 3,
      "stopped": 2,
      "error": 0,
      "total_tools": 25
    },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
      errors: ['MCP_001: Machine not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'GET',
      path: '/api/machines/{machine}/mcp/{name}',
      description: 'Get MCP server details.',
      response: `{
  "success": true,
  "data": { /* mcp server object */ },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_002: MCP server not found (404)',
        'Unauthenticated (401)',
      ],
    },
    {
      method: 'POST',
      path: '/api/machines/{machine}/mcp',
      description: 'Register a new MCP server.',
      body: `{
  "name": "filesystem",
  "display_name": "Filesystem Tools",
  "description": "File system operations",
  "transport": "stdio",
  "command": "npx -y @modelcontextprotocol/server-filesystem /path",
  "url": null,
  "env_vars": {},
  "config": {}
}`,
      response: `{
  "success": true,
  "data": { /* mcp server object */ },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_003: Server already exists (409)',
        'Validation error (422)',
      ],
    },
    {
      method: 'PATCH',
      path: '/api/machines/{machine}/mcp/{name}',
      description: 'Update MCP server configuration.',
      body: `{
  "display_name": "Updated Name",
  "description": "Updated description",
  "command": "updated command",
  "env_vars": { "KEY": "value" },
  "config": { "option": true }
}`,
      response: `{
  "success": true,
  "data": { /* updated mcp server object */ },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_002: MCP server not found (404)',
        'Validation error (422)',
      ],
    },
    {
      method: 'POST',
      path: '/api/machines/{machine}/mcp/{name}/start',
      description: 'Start an MCP server.',
      response: `{
  "success": true,
  "data": {
    "message": "MCP server start initiated",
    "server": { /* mcp server object */ }
  },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_002: MCP server not found (404)',
        'MCP_004: Already running (400)',
      ],
    },
    {
      method: 'POST',
      path: '/api/machines/{machine}/mcp/{name}/stop',
      description: 'Stop an MCP server.',
      response: `{
  "success": true,
  "data": {
    "message": "MCP server stopped",
    "server": { /* mcp server object */ }
  },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_002: MCP server not found (404)',
        'MCP_005: Already stopped (400)',
      ],
    },
    {
      method: 'GET',
      path: '/api/machines/{machine}/mcp/{name}/tools',
      description: 'Get tools available from an MCP server.',
      response: `{
  "success": true,
  "data": {
    "server": { /* mcp server object */ },
    "tools": [
      {
        "name": "read_file",
        "description": "Read a file",
        "parameters": { /* JSON schema */ }
      }
    ],
    "count": 1
  },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_002: MCP server not found (404)',
        'Unauthenticated (401)',
      ],
    },
    {
      method: 'POST',
      path: '/api/machines/{machine}/mcp/{name}/execute',
      description: 'Execute a tool on an MCP server.',
      body: `{
  "tool": "read_file",
  "params": {
    "path": "/path/to/file.txt"
  }
}`,
      response: `{
  "success": true,
  "data": {
    "message": "Tool execution initiated",
    "tool": "read_file",
    "params": { "path": "/path/to/file.txt" },
    "status": "pending"
  },
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_002: MCP server not found (404)',
        'MCP_006: Not running (400)',
        'MCP_007: Tool not found (404)',
        'Validation error (422)',
      ],
    },
    {
      method: 'DELETE',
      path: '/api/machines/{machine}/mcp/{name}',
      description: 'Delete an MCP server.',
      response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
      errors: [
        'MCP_001: Machine not found (404)',
        'MCP_002: MCP server not found (404)',
        'Unauthenticated (401)',
      ],
    },
    {
      method: 'GET',
      path: '/api/machines/{machine}/mcp/all-tools',
      description: 'Get all tools from all running MCP servers.',
      response: `{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "read_file",
        "description": "Read a file",
        "parameters": { /* JSON schema */ },
        "server": {
          "id": "550e8400-e29b-41d4-a716-446655440013",
          "name": "filesystem",
          "display_name": "Filesystem Tools"
        }
      }
    ],
    "count": 25,
    "servers_count": 3
  },
  "meta": { /* meta object */ }
}`,
      errors: ['MCP_001: Machine not found (404)', 'Unauthenticated (401)'],
    },
  ],
};
