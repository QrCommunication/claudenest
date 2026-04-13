import type { ApiCategory } from './types';

export const contextCategory: ApiCategory = {
  id: 'context',
  title: 'Context (RAG)',
  description: 'Manage project context and RAG-powered context retrieval.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/projects/{project}/context',
      description: 'Get project context information.',
      response: `{
  "success": true,
  "data": {
    "summary": "Project summary",
    "architecture": "Architecture description",
    "conventions": "Coding conventions",
    "current_focus": "Current development focus",
    "recent_changes": "Recent changes",
    "total_tokens": 45500,
    "max_tokens": 100000,
    "token_usage_percent": 45.5
  },
  "meta": { /* meta object */ }
}`,
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'PATCH',
      path: '/api/projects/{project}/context',
      description: 'Update project context.',
      body: `{
  "summary": "Updated summary",
  "architecture": "Updated architecture",
  "conventions": "Updated conventions",
  "current_focus": "New focus",
  "recent_changes": "New changes"
}`,
      response: `{
  "success": true,
  "data": {
    "summary": "Updated summary",
    "architecture": "Updated architecture",
    "conventions": "Updated conventions",
    "current_focus": "New focus",
    "recent_changes": "New changes"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
    },
    {
      method: 'POST',
      path: '/api/projects/{project}/context/query',
      description: 'Query context chunks using RAG (Retrieval-Augmented Generation).',
      body: `{
  "query": "How is authentication implemented?",
  "limit": 10,
  "type": "task_completion",
  "min_similarity": 0.7
}`,
      response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "content": "Task completed: Implement OAuth...",
      "type": "task_completion",
      "instance_id": "instance-1",
      "task_id": "550e8400-e29b-41d4-a716-446655440006",
      "files": ["auth.ts", "oauth.ts"],
      "importance_score": 0.8,
      "similarity": 0.92,
      "created_at": "2026-02-02T16:00:00Z"
    }
  ],
  "meta": {
    "query": "How is authentication implemented?",
    "result_count": 1,
    "used_embeddings": true,
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
    },
    {
      method: 'GET',
      path: '/api/projects/{project}/context/chunks',
      description: 'List context chunks for a project.',
      query: [
        { name: 'type', type: 'string', required: false, description: 'Filter by type' },
        { name: 'instance_id', type: 'string', required: false, description: 'Filter by instance' },
        { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 50)' },
      ],
      response: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "content": "Truncated content...",
      "type": "task_completion",
      "instance_id": "instance-1",
      "task_id": "550e8400-e29b-41d4-a716-446655440006",
      "files": ["auth.ts"],
      "importance_score": 0.8,
      "expires_at": "2026-03-04T17:00:00Z",
      "created_at": "2026-02-02T16:00:00Z"
    }
  ],
  "meta": {
    "pagination": { /* pagination info */ },
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`,
      errors: ['CTX_001: Project not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'POST',
      path: '/api/projects/{project}/context/chunks',
      description: 'Create a new context chunk.',
      body: `{
  "content": "Important decision: We will use JWT for authentication",
  "type": "decision",
  "instance_id": "instance-1",
  "task_id": "550e8400-e29b-41d4-a716-446655440006",
  "files": ["auth.ts"],
  "importance_score": 0.9,
  "generate_embedding": true
}`,
      response: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "type": "decision",
    "has_embedding": true,
    "created_at": "2026-02-02T17:00:00Z"
  },
  "meta": { /* meta object */ }
}`,
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
    },
    {
      method: 'DELETE',
      path: '/api/projects/{project}/context/chunks/{chunkId}',
      description: 'Delete a context chunk.',
      response: `{
  "success": true,
  "data": null,
  "meta": { /* meta object */ }
}`,
      errors: ['CTX_001: Project or chunk not found (404)', 'Unauthenticated (401)'],
    },
    {
      method: 'POST',
      path: '/api/projects/{project}/context/summarize',
      description: 'Summarize context chunks using AI.',
      body: `{
  "chunk_ids": ["550e8400-e29b-41d4-a716-446655440008", "550e8400-e29b-41d4-a716-446655440009"],
  "max_length": 1000
}`,
      response: `{
  "success": true,
  "data": {
    "summary": "AI-generated summary of the context chunks...",
    "chunks_used": 2,
    "total_chars": 2500,
    "ai_generated": true
  },
  "meta": { /* meta object */ }
}`,
      errors: ['CTX_001: Project not found (404)', 'Validation error (422)'],
    },
  ],
};
