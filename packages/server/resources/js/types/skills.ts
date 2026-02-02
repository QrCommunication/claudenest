// ==================== SKILL TYPES ====================

export type SkillCategory = 
  | 'auth' 
  | 'browser' 
  | 'command' 
  | 'mcp' 
  | 'search' 
  | 'file' 
  | 'git' 
  | 'general' 
  | 'api' 
  | 'database';

export interface Skill {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: SkillCategory;
  category_color: string;
  path: string;
  version: string;
  enabled: boolean;
  config: Record<string, unknown>;
  tags: string[];
  examples: SkillExample[];
  has_config: boolean;
  machine_id: string;
  discovered_at: string | null;
  created_at: string;
  updated_at: string;
  discovered_at_human: string | null;
  created_at_human: string;
}

export interface SkillExample {
  title: string;
  description?: string;
  code?: string;
}

export interface CreateSkillPayload {
  name: string;
  display_name?: string;
  description?: string;
  category: SkillCategory;
  path: string;
  version?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  tags?: string[];
  examples?: SkillExample[];
}

export interface UpdateSkillPayload {
  display_name?: string;
  description?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface SkillsMeta {
  categories: Record<string, number>;
}

export interface SkillsFilter {
  search: string;
  category: SkillCategory | 'all';
  enabled: boolean | null;
}

// ==================== MCP SERVER TYPES ====================

export type MCPTransport = 'stdio' | 'sse' | 'http' | 'websocket';
export type MCPStatus = 'running' | 'stopped' | 'error' | 'starting' | 'stopping';

export interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  status: MCPStatus;
  status_color: string;
  is_running: boolean;
  is_stopped: boolean;
  has_errors: boolean;
  transport: MCPTransport;
  command: string | null;
  url: string | null;
  env_vars: Record<string, string>;
  tools: MCPTool[];
  tools_count: number;
  config: Record<string, unknown>;
  machine_id: string;
  uptime: string | null;
  error_message: string | null;
  started_at: string | null;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
  started_at_human: string | null;
  created_at_human: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, MCPToolParameter>;
    required: string[];
  };
}

export interface MCPToolParameter {
  type: string;
  description: string;
  enum?: unknown[];
  default?: unknown;
}

export interface MCPToolWithServer extends MCPTool {
  server: {
    id: string;
    name: string;
    display_name: string;
  };
}

export interface CreateMCPServerPayload {
  name: string;
  display_name?: string;
  description?: string;
  transport: MCPTransport;
  command?: string;
  url?: string;
  env_vars?: Record<string, string>;
  config?: Record<string, unknown>;
}

export interface UpdateMCPServerPayload {
  display_name?: string;
  description?: string;
  command?: string;
  url?: string;
  env_vars?: Record<string, string>;
  config?: Record<string, unknown>;
}

export interface MCPStats {
  total: number;
  running: number;
  stopped: number;
  error: number;
  total_tools: number;
}

export interface MCPMeta {
  stats: MCPStats;
}

export interface ExecuteToolPayload {
  tool: string;
  params?: Record<string, unknown>;
}

// ==================== DISCOVERED COMMAND TYPES ====================

export type CommandCategory = 
  | 'general' 
  | 'git' 
  | 'file' 
  | 'search' 
  | 'build' 
  | 'test' 
  | 'deploy' 
  | 'docker' 
  | 'npm' 
  | 'composer';

export interface DiscoveredCommand {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: CommandCategory;
  category_color: string;
  signature: string;
  parameters: CommandParameter[];
  parameters_count: number;
  aliases: string[];
  has_aliases: boolean;
  examples: CommandExample[];
  skill_path: string | null;
  machine_id: string;
  discovered_at: string | null;
  created_at: string;
  updated_at: string;
  discovered_at_human: string | null;
  created_at_human: string;
}

export interface CommandParameter {
  name: string;
  type: string;
  required: boolean;
  description: string | null;
  default?: unknown;
}

export interface CommandExample {
  title: string;
  command: string;
  description?: string;
}

export interface CreateCommandPayload {
  name: string;
  description?: string;
  category: CommandCategory;
  parameters?: CommandParameter[];
  aliases?: string[];
  examples?: CommandExample[];
  skill_path?: string;
}

export interface BulkCreateCommandsPayload {
  commands: CreateCommandPayload[];
}

export interface ExecuteCommandPayload {
  args?: string[];
  options?: Record<string, unknown>;
}

export interface CommandsMeta {
  categories: Record<string, number>;
  skills: Record<string, number>;
}

export interface CommandsFilter {
  search: string;
  category: CommandCategory | 'all';
  skill_path: string | 'all';
}
