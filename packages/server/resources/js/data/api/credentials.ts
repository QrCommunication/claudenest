import type { ApiCategory } from './types';

export const credentialsCategory: ApiCategory = {
  id: 'credentials',
  title: 'Credentials',
  description: 'Manage Claude API keys and OAuth tokens with AES-256-CBC encryption.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/credentials',
      description: 'List all credentials for the authenticated user.',
      response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "name": "Production API Key",
      "auth_type": "api_key",
      "is_default": true,
      "token_status": "active",
      "last_used_at": "2026-04-10T12:00:00Z",
      "created_at": "2026-03-01T09:00:00Z"
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/credentials',
      description: 'Create a new credential (API key or OAuth token).',
      body: `{
  "name": "My API Key",
  "auth_type": "api_key",
  "api_key": "sk-ant-...",
  "is_default": false
}`,
      response: `{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "name": "My API Key",
    "auth_type": "api_key",
    "is_default": false,
    "token_status": "active"
  }
}`,
    },
    {
      method: 'GET',
      path: '/api/credentials/{id}',
      description: 'Get a specific credential (key is masked).',
      response: `{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "name": "My API Key",
    "auth_type": "api_key",
    "api_key_masked": "sk-ant-...****",
    "is_default": false,
    "token_status": "active"
  }
}`,
    },
    {
      method: 'PUT',
      path: '/api/credentials/{id}',
      description: 'Update an existing credential.',
      body: `{
  "name": "Updated Name",
  "api_key": "sk-ant-new-key..."
}`,
      response: `{
  "success": true,
  "data": { /* updated credential */ }
}`,
    },
    {
      method: 'DELETE',
      path: '/api/credentials/{id}',
      description: 'Delete a credential.',
      response: `{
  "success": true,
  "data": { "message": "Credential deleted" }
}`,
    },
    {
      method: 'POST',
      path: '/api/credentials/{id}/set-default',
      description: 'Set a credential as the default for this user.',
      response: `{
  "success": true,
  "data": { "id": "...", "is_default": true }
}`,
    },
    {
      method: 'POST',
      path: '/api/credentials/{id}/validate',
      description: 'Validate an API key against the Claude API.',
      response: `{
  "success": true,
  "data": { "valid": true, "token_status": "active" }
}`,
    },
    {
      method: 'POST',
      path: '/api/credentials/{id}/refresh',
      description: 'Refresh an OAuth token using the stored refresh token.',
      response: `{
  "success": true,
  "data": { "token_status": "active", "oauth_expires_at": "2026-05-10T00:00:00Z" }
}`,
    },
  ],
};
