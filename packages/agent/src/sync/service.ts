/**
 * SyncService — Synchronizes local agent data (skills, MCP, commands) with the server.
 * Full sync on connect, then watches for changes.
 */

import type { Logger, Skill, MCPServer } from '../types/index.js';
import type { RestApiClient, SkillSyncPayload, MCPSyncPayload, CommandSyncPayload } from '../api/client.js';
import type { SkillsDiscovery } from '../discovery/skills.js';
import type { MCPManager } from '../discovery/mcp.js';

interface SyncServiceConfig {
  apiClient: RestApiClient;
  machineId: string;
  skillsDiscovery: SkillsDiscovery;
  mcpManager: MCPManager;
  logger: Logger;
}

export class SyncService {
  private apiClient: RestApiClient;
  private machineId: string;
  private skillsDiscovery: SkillsDiscovery;
  private mcpManager: MCPManager;
  private logger: Logger;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: SyncServiceConfig) {
    this.apiClient = config.apiClient;
    this.machineId = config.machineId;
    this.skillsDiscovery = config.skillsDiscovery;
    this.mcpManager = config.mcpManager;
    this.logger = config.logger.child({ component: 'SyncService' });
  }

  /**
   * Full sync on agent connect — idempotent bulk upsert.
   */
  async fullSync(): Promise<void> {
    this.logger.info('Starting full sync...');

    const results = await Promise.allSettled([
      this.syncSkills(),
      this.syncMCP(),
      this.syncCommands(),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error({ err: result.reason }, 'Sync failed for a category');
      }
    }

    this.logger.info('Full sync completed');
  }

  /**
   * Start periodic resync (every 5 minutes).
   */
  startPeriodicSync(intervalMs = 300_000): void {
    this.stopPeriodicSync();
    this.syncInterval = setInterval(() => {
      this.fullSync().catch(err => {
        this.logger.error({ err }, 'Periodic sync failed');
      });
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncSkills(): Promise<void> {
    const skills = this.skillsDiscovery.getAllSkills();
    if (skills.length === 0) {
      this.logger.debug('No skills to sync');
      return;
    }

    const payload: SkillSyncPayload[] = skills.map((s: Skill) => ({
      name: s.name,
      description: s.description,
      path: s.path,
      version: s.version,
      category: s.category,
      config: s.metadata as Record<string, unknown> ?? {},
      tags: [],
    }));

    const response = await this.apiClient.syncSkills(this.machineId, payload);
    if (response.success) {
      this.logger.info({ count: skills.length }, 'Skills synced');
    } else {
      this.logger.warn({ error: response.error }, 'Skills sync failed');
    }
  }

  private async syncMCP(): Promise<void> {
    const servers = this.mcpManager.getAllServers();
    if (servers.length === 0) {
      this.logger.debug('No MCP servers to sync');
      return;
    }

    const payload: MCPSyncPayload[] = servers.map((s: MCPServer) => ({
      name: s.name,
      description: s.description,
      command: s.command,
      args: s.args,
      env: s.env,
      enabled: s.enabled,
      auto_start: s.autoStart,
      status: s.status,
      tools: s.tools?.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    }));

    const response = await this.apiClient.syncMCPServers(this.machineId, payload);
    if (response.success) {
      this.logger.info({ count: servers.length }, 'MCP servers synced');
    } else {
      this.logger.warn({ error: response.error }, 'MCP sync failed');
    }
  }

  private async syncCommands(): Promise<void> {
    const commands = this.skillsDiscovery.getAllCommands();
    if (commands.length === 0) {
      this.logger.debug('No commands to sync');
      return;
    }

    const payload: CommandSyncPayload[] = commands.map(c => ({
      name: c.name,
      description: c.description,
      category: c.category,
      source: c.source,
    }));

    const response = await this.apiClient.syncCommands(this.machineId, payload);
    if (response.success) {
      this.logger.info({ count: commands.length }, 'Commands synced');
    } else {
      this.logger.warn({ error: response.error }, 'Commands sync failed');
    }
  }

  async stop(): Promise<void> {
    this.stopPeriodicSync();
  }
}
