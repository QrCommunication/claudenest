import type { ApiCategory } from './types';

export const authCategory: ApiCategory = {
  id: 'authentication',
  title: 'Authentication',
  description: 'Manage user authentication, tokens, and OAuth flows.',
  endpoints: [
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Authenticate user with email and password.',
      body: `{
  "email": "user@example.com",
  "password": "your-password",
  "remember": true
}`,
      response: `{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "email_verified_at": "2026-01-15T10:30:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    },
    "token": "1|laravel_sanctum_token_string_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
      errors: ['AUTH_002: Invalid credentials (401)'],
    },
    {
      method: 'POST',
      path: '/api/auth/register',
      description: 'Register a new user account.',
      body: `{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "secure-password",
  "password_confirmation": "secure-password"
}`,
      response: `{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "1|laravel_sanctum_token_string_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['Validation error (422)'],
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      description: 'Get current authenticated user information.',
      response: `{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "email_verified_at": "2026-01-15T10:30:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  },
  "meta": { /* meta object */ }
}`,
      errors: ['Unauthenticated (401)'],
    },
    {
      method: 'POST',
      path: '/api/auth/logout',
      description: 'Logout user and revoke current token.',
      response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
      errors: ['Unauthenticated (401)'],
    },
    {
      method: 'POST',
      path: '/api/auth/refresh',
      description: 'Refresh the authentication token.',
      response: `{
  "success": true,
  "data": {
    "token": "2|new_laravel_sanctum_token_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['Unauthenticated (401)'],
    },
    {
      method: 'GET',
      path: '/api/auth/tokens',
      description: 'List all personal access tokens for the user.',
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "API Access Token",
      "abilities": ["*"],
      "last_used_at": "2026-02-02T16:00:00Z",
      "expires_at": "2026-03-04T17:00:00Z",
      "is_active": true,
      "created_at": "2026-02-01T10:00:00Z"
    }
  ],
  "meta": { /* meta object */ }
}`,
      errors: ['Unauthenticated (401)'],
    },
    {
      method: 'POST',
      path: '/api/auth/tokens',
      description: 'Create a new personal access token.',
      body: `{
  "name": "Mobile App Token",
  "abilities": ["machines:read", "sessions:write"],
  "expires_in_days": 90
}`,
      response: `{
  "success": true,
  "data": {
    "token": "3|new_token_plain_text_here",
    "name": "Mobile App Token",
    "abilities": ["machines:read", "sessions:write"],
    "expires_at": "2026-05-03T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['Validation error (422)', 'Unauthenticated (401)'],
    },
    {
      method: 'DELETE',
      path: '/api/auth/tokens/{id}',
      description: 'Revoke a personal access token.',
      response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
      errors: ['AUTH_001: Token not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'GET',
      path: '/api/auth/{provider}/redirect',
      description: 'Get OAuth redirect URL for Google or GitHub.',
      query: [
        { name: 'provider', type: 'string', required: true, description: 'OAuth provider: google or github' },
      ],
      response: `{
  "success": true,
  "data": {
    "redirect_url": "https://accounts.google.com/o/oauth2/auth?..."
  },
  "meta": { /* meta object */ }
}`,
      errors: ['AUTH_001: Invalid provider (400)'],
    },
    {
      method: 'GET',
      path: '/api/auth/{provider}/callback',
      description: 'Handle OAuth callback and authenticate user.',
      query: [
        { name: 'provider', type: 'string', required: true, description: 'OAuth provider: google or github' },
      ],
      response: `{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "1|oauth_token_here",
    "expires_at": "2026-03-04T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['AUTH_001: Authentication failed (401)'],
    },
  ],
};
