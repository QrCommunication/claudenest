/**
 * Shared types for the ClaudeNest API reference.
 */

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  params?: ApiParam[];
  query?: ApiParam[];
  body?: string;
  response: string;
  errors?: string[];
}

export interface ApiCategory {
  id: string;
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export interface ErrorCode {
  code: string;
  message: string;
  http: string;
}
