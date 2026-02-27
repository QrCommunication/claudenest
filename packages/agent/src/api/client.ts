/**
 * REST API Client for ClaudeNest Server
 * Uses Node 20 native fetch — no external dependencies.
 */

import type { Logger } from '../types/index.js';

interface ApiClientConfig {
  baseUrl: string;
  machineToken: string;
  machineId: string;
  logger: Logger;
  timeout?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
}

export class RestApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  private logger: Logger;

  constructor(config: ApiClientConfig) {
    // Convert ws:// to http:// for REST calls
    this.baseUrl = config.baseUrl
      .replace(/^ws:\/\//, 'http://')
      .replace(/^wss:\/\//, 'https://')
      .replace(/:\d+$/, ''); // Remove WS port, use default HTTP port

    // Check URL *path* (not hostname) for /api — avoids false positive
    // from subdomains like api.example.com where "://api." matches "/api"
    const urlPath = this.baseUrl.replace(/^https?:\/\/[^/]+/, '');
    if (!urlPath.includes('/api')) {
      this.baseUrl = this.baseUrl.replace(/\/$/, '') + '/api';
    }

    this.headers = {
      'Authorization': `Bearer ${config.machineToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Machine-ID': config.machineId,
    };
    this.timeout = config.timeout ?? 15_000;
    this.logger = config.logger.child({ component: 'RestApiClient' });
  }

  async get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const json = await response.json() as ApiResponse<T>;

      if (!response.ok) {
        this.logger.warn({ status: response.status, path, error: json.error }, 'API request failed');
      }

      return json;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error({ path, timeout: this.timeout }, 'API request timed out');
      } else {
        this.logger.error({ err: error, path }, 'API request error');
      }
      return {
        success: false,
        data: null as T,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // ==================== Skills ====================

  async syncSkills(machineId: string, skills: SkillSyncPayload[]): Promise<ApiResponse> {
    return this.post(`/machines/${machineId}/skills/sync`, { skills });
  }

  // ==================== MCP ====================

  async syncMCPServers(machineId: string, servers: MCPSyncPayload[]): Promise<ApiResponse> {
    return this.post(`/machines/${machineId}/mcp/sync`, { servers });
  }

  // ==================== Commands ====================

  async syncCommands(machineId: string, commands: CommandSyncPayload[]): Promise<ApiResponse> {
    return this.post(`/machines/${machineId}/commands/bulk`, { commands });
  }

  // ==================== Instances ====================

  async registerInstance(data: InstanceRegisterPayload): Promise<ApiResponse> {
    return this.post('/instances/register', data);
  }

  async heartbeat(instanceId: string): Promise<ApiResponse> {
    return this.post(`/instances/${instanceId}/heartbeat`);
  }

  async disconnectInstance(instanceId: string): Promise<ApiResponse> {
    return this.post(`/instances/${instanceId}/disconnect`);
  }

  // ==================== Tasks ====================

  async claimNextTask(projectId: string, instanceId: string): Promise<ApiResponse> {
    return this.post(`/projects/${projectId}/tasks/claim-next`, { instance_id: instanceId });
  }

  // ==================== Credentials ====================

  async captureCredential(credentialId: string, data: CredentialCapturePayload): Promise<ApiResponse> {
    return this.post(`/credentials/${credentialId}/capture`, data);
  }
}

// ==================== Sync Payload Types ====================

export interface SkillSyncPayload {
  name: string;
  display_name?: string;
  description?: string;
  category: string;
  path: string;
  version?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  tags?: string[];
}

export interface MCPSyncPayload {
  name: string;
  description?: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  auto_start: boolean;
  status: string;
  tools?: Array<{ name: string; description: string; parameters: unknown }>;
}

export interface CommandSyncPayload {
  name: string;
  description: string;
  category: string;
  source: string;
  usage?: string;
  examples?: string[];
}

export interface InstanceRegisterPayload {
  instance_id: string;
  machine_id: string;
  project_id?: string;
  session_id?: string;
}

export interface CredentialCapturePayload {
  machine_id: string;
  oauth_token?: string;
  oauth_refresh_token?: string;
  oauth_expires_at?: string;
  api_key?: string;
}
