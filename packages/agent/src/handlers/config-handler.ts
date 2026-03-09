/**
 * Configuration and discovery message handlers
 */

import type { SkillsDiscovery } from '../discovery/skills.js';
import type { MCPManager } from '../discovery/mcp.js';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import type { MachineInfo } from '../types/index.js';
import { getMachineInfo, getPackageVersion } from '../utils/index.js';

interface HandlerContext {
  skillsDiscovery: SkillsDiscovery;
  mcpManager: MCPManager;
  wsClient: WebSocketClient;
  logger: Logger;
  machineId: string;
  claudePath: string;
}

export function createConfigHandlers(context: HandlerContext) {
  const { skillsDiscovery, mcpManager, wsClient, logger, machineId, claudePath } = context;

  /**
   * Handle skills:list
   */
  async function handleListSkills(): Promise<void> {
    logger.debug({}, 'Handling skills:list');

    try {
      const skills = skillsDiscovery.getAllSkills();
      
      wsClient.send('skills:discovered', {
        count: skills.length,
        skills: skills.map(s => ({
          name: s.name,
          description: s.description,
          version: s.version,
          category: s.category,
          commands: s.commands?.length || 0,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to list skills');
      wsClient.send('error', {
        originalType: 'skills:list',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle skills:refresh
   */
  async function handleRefreshSkills(): Promise<void> {
    logger.debug({}, 'Handling skills:refresh');

    try {
      const skills = await skillsDiscovery.refresh();
      
      wsClient.send('skills:discovered', {
        count: skills.length,
        refreshed: true,
        skills: skills.map(s => ({
          name: s.name,
          description: s.description,
          version: s.version,
          category: s.category,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to refresh skills');
      wsClient.send('error', {
        originalType: 'skills:refresh',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle skills:get
   */
  async function handleGetSkill(payload: { path: string }): Promise<void> {
    logger.debug({ path: payload.path }, 'Handling skills:get');

    try {
      const skill = skillsDiscovery.getSkill(payload.path);
      
      if (!skill) {
        wsClient.send('error', {
          originalType: 'skills:get',
          code: 'SKILL_NOT_FOUND',
          message: `Skill not found: ${payload.path}`,
        });
        return;
      }

      const content = await skillsDiscovery.getSkillContent(payload.path);
      
      wsClient.send('skill:content', {
        skill: {
          name: skill.name,
          description: skill.description,
          version: skill.version,
          category: skill.category,
          commands: skill.commands,
          permissions: skill.permissions,
        },
        content,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get skill');
      wsClient.send('error', {
        originalType: 'skills:get',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle mcp:list
   */
  function handleListMCP(): void {
    logger.debug({}, 'Handling mcp:list');

    try {
      const servers = mcpManager.getAllServers();
      
      wsClient.send('mcp:list', {
        count: servers.length,
        servers: servers.map(s => ({
          name: s.name,
          description: s.description,
          status: s.status,
          enabled: s.enabled,
          autoStart: s.autoStart,
          tools: s.tools?.length || 0,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to list MCP servers');
      wsClient.send('error', {
        originalType: 'mcp:list',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle mcp:start
   */
  async function handleStartMCP(payload: { name: string }): Promise<void> {
    logger.debug({ name: payload.name }, 'Handling mcp:start');

    try {
      const server = await mcpManager.startServer(payload.name);
      
      wsClient.send('mcp:status', {
        name: server.name,
        status: server.status,
        tools: server.tools?.map(t => t.name),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to start MCP server');
      wsClient.send('error', {
        originalType: 'mcp:start',
        name: payload.name,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle mcp:stop
   */
  async function handleStopMCP(payload: { name: string }): Promise<void> {
    logger.debug({ name: payload.name }, 'Handling mcp:stop');

    try {
      await mcpManager.stopServer(payload.name);
      
      wsClient.send('mcp:status', {
        name: payload.name,
        status: 'stopped',
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to stop MCP server');
      wsClient.send('error', {
        originalType: 'mcp:stop',
        name: payload.name,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle mcp:restart
   */
  async function handleRestartMCP(payload: { name: string }): Promise<void> {
    logger.debug({ name: payload.name }, 'Handling mcp:restart');

    try {
      const server = await mcpManager.restartServer(payload.name);
      
      wsClient.send('mcp:status', {
        name: server.name,
        status: server.status,
        tools: server.tools?.map(t => t.name),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to restart MCP server');
      wsClient.send('error', {
        originalType: 'mcp:restart',
        name: payload.name,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle mcp:call_tool
   */
  async function handleCallMCPTool(payload: {
    server: string;
    tool: string;
    args: Record<string, unknown>;
  }): Promise<void> {
    logger.debug({
      server: payload.server,
      tool: payload.tool
    }, 'Handling mcp:call_tool');

    try {
      const result = await mcpManager.callTool(
        payload.server,
        payload.tool,
        payload.args
      );
      
      wsClient.send('mcp:tool_result', {
        server: payload.server,
        tool: payload.tool,
        result,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to call MCP tool');
      wsClient.send('error', {
        originalType: 'mcp:call_tool',
        server: payload.server,
        tool: payload.tool,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle commands:list
   */
  function handleListCommands(): void {
    logger.debug({}, 'Handling commands:list');

    try {
      const commands = skillsDiscovery.getAllCommands();
      
      wsClient.send('commands:list', {
        count: commands.length,
        commands,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to list commands');
      wsClient.send('error', {
        originalType: 'commands:list',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle machine:info
   */
  async function handleGetMachineInfo(): Promise<void> {
    logger.debug({}, 'Handling machine:info');

    try {
      const version = await getPackageVersion();
      const machineInfo = getMachineInfo();
      const skills = skillsDiscovery.getAllSkills();
      const mcps = mcpManager.getAllServers();

      const info: MachineInfo = {
        id: machineId,
        name: machineInfo.hostname,
        platform: machineInfo.platform,
        hostname: machineInfo.hostname,
        arch: machineInfo.arch,
        nodeVersion: machineInfo.nodeVersion,
        agentVersion: version,
        claudeVersion: 'unknown', // Would need to detect from claude --version
        claudePath,
        capabilities: {
          supportsPTY: true,
          supportsTmux: true,
          supportsMCP: mcps.length > 0,
          supportsSkills: skills.length > 0,
          availableSkills: skills.map(s => s.name),
          availableMCPs: mcps.map(m => m.name),
        },
        maxSessions: 10,
      };

      wsClient.send('machine:info', info);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get machine info');
      wsClient.send('error', {
        originalType: 'machine:info',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    'skills:list': handleListSkills,
    'skills:refresh': handleRefreshSkills,
    'skills:get': handleGetSkill,
    'mcp:list': handleListMCP,
    'mcp:start': handleStartMCP,
    'mcp:stop': handleStopMCP,
    'mcp:restart': handleRestartMCP,
    'mcp:call_tool': handleCallMCPTool,
    'commands:list': handleListCommands,
    'machine:info': handleGetMachineInfo,
  };
}
