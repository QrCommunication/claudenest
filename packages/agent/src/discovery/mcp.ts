/**
 * MCP (Model Context Protocol) server management
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import type { Logger } from '../utils/logger.js';
import type { MCPServer, MCPStatus, MCPTool } from '../types/index.js';

interface MCPManagerOptions {
  configPath?: string;
  logger: Logger;
}

interface MCPConfig {
  mcpServers: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    description?: string;
    autoStart?: boolean;
    enabled?: boolean;
  }>;
}

interface MCPProcess {
  server: MCPServer;
  process: ChildProcess;
  tools: MCPTool[];
  startTime: Date;
}

export class MCPManager extends EventEmitter {
  private options: MCPManagerOptions;
  private logger: Logger;
  private servers = new Map<string, MCPServer>();
  private processes = new Map<string, MCPProcess>();
  private configPath: string;

  constructor(options: MCPManagerOptions) {
    super();
    this.options = options;
    this.logger = options.logger.child({ component: 'MCPManager' });
    
    const { getConfigDir } = require('../utils/index.js');
    this.configPath = options.configPath || path.join(getConfigDir(), 'mcp.json');
  }

  /**
   * Initialize MCP manager
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing MCP manager');
    await this.loadConfig();
  }

  /**
   * Load MCP configuration
   */
  async loadConfig(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config: MCPConfig = JSON.parse(content);
      
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        const server: MCPServer = {
          name,
          description: serverConfig.description || '',
          command: serverConfig.command,
          args: serverConfig.args || [],
          env: serverConfig.env,
          enabled: serverConfig.enabled ?? true,
          autoStart: serverConfig.autoStart ?? false,
          status: 'stopped',
        };
        
        this.servers.set(name, server);
        
        // Auto-start if configured
        if (server.autoStart && server.enabled) {
          await this.startServer(name).catch(error => {
            this.logger.error(`Failed to auto-start MCP server ${name}`, { error });
          });
        }
      }
      
      this.logger.info(`Loaded ${this.servers.size} MCP servers`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.info('No MCP config found, starting empty');
      } else {
        throw error;
      }
    }
  }

  /**
   * Save MCP configuration
   */
  async saveConfig(): Promise<void> {
    const config: MCPConfig = { mcpServers: {} };
    
    for (const [name, server] of this.servers) {
      config.mcpServers[name] = {
        command: server.command,
        args: server.args,
        env: server.env,
        description: server.description,
        autoStart: server.autoStart,
        enabled: server.enabled,
      };
    }
    
    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    
    this.logger.debug('Saved MCP configuration');
  }

  /**
   * Start an MCP server
   */
  async startServer(name: string): Promise<MCPServer> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server not found: ${name}`);
    }

    if (this.processes.has(name)) {
      this.logger.debug(`MCP server ${name} is already running`);
      return server;
    }

    this.logger.info(`Starting MCP server: ${name}`);
    server.status = 'starting';
    this.emit('statusChange', name, server.status);

    try {
      const process = spawn(server.command, server.args, {
        env: {
          ...process.env,
          ...server.env,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const mcpProcess: MCPProcess = {
        server,
        process,
        tools: [],
        startTime: new Date(),
      };

      // Handle process events
      process.on('exit', (code) => {
        this.logger.warn(`MCP server ${name} exited with code ${code}`);
        this.processes.delete(name);
        server.status = code === 0 ? 'stopped' : 'error';
        this.emit('statusChange', name, server.status);
        this.emit('stopped', name, code);
      });

      process.on('error', (error) => {
        this.logger.error(`MCP server ${name} error:`, error);
        server.status = 'error';
        this.emit('statusChange', name, server.status);
        this.emit('error', name, error);
      });

      // Handle stdout for JSON-RPC communication
      let buffer = '';
      process.stdout?.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            this.handleServerMessage(name, line);
          }
        }
      });

      // Handle stderr for logging
      process.stderr?.on('data', (data: Buffer) => {
        this.logger.debug(`[${name}] ${data.toString().trim()}`);
      });

      // Wait for server to be ready
      await this.waitForServerReady(name, 10000);

      this.processes.set(name, mcpProcess);
      server.status = 'running';
      
      this.emit('statusChange', name, server.status);
      this.emit('started', name);

      // Discover tools
      await this.discoverTools(name);

      return server;
    } catch (error) {
      server.status = 'error';
      this.emit('statusChange', name, server.status);
      throw error;
    }
  }

  /**
   * Stop an MCP server
   */
  async stopServer(name: string): Promise<void> {
    const mcpProcess = this.processes.get(name);
    if (!mcpProcess) {
      this.logger.debug(`MCP server ${name} is not running`);
      return;
    }

    this.logger.info(`Stopping MCP server: ${name}`);

    const { process, server } = mcpProcess;
    server.status = 'stopped';

    // Send graceful shutdown request
    try {
      this.sendToServer(name, { method: 'shutdown', jsonrpc: '2.0', id: 'shutdown' });
    } catch {
      // Ignore errors during shutdown
    }

    // Kill process if it doesn't exit gracefully
    const timeout = setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGTERM');
      }
    }, 5000);

    // Force kill after longer timeout
    const forceTimeout = setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }, 10000);

    process.on('exit', () => {
      clearTimeout(timeout);
      clearTimeout(forceTimeout);
    });

    this.processes.delete(name);
    this.emit('stopped', name, 0);
  }

  /**
   * Restart an MCP server
   */
  async restartServer(name: string): Promise<MCPServer> {
    await this.stopServer(name);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.startServer(name);
  }

  /**
   * Get server status
   */
  getServer(name: string): MCPServer | undefined {
    const server = this.servers.get(name);
    if (!server) return undefined;

    // Get current process info
    const process = this.processes.get(name);
    if (process) {
      return {
        ...server,
        tools: process.tools,
      };
    }

    return server;
  }

  /**
   * Get all servers
   */
  getAllServers(): MCPServer[] {
    return Array.from(this.servers.keys()).map(name => this.getServer(name)!);
  }

  /**
   * Get running servers
   */
  getRunningServers(): MCPServer[] {
    return this.getAllServers().filter(s => s.status === 'running');
  }

  /**
   * Add a new MCP server
   */
  async addServer(name: string, config: Omit<MCPServer, 'name' | 'status'>): Promise<MCPServer> {
    if (this.servers.has(name)) {
      throw new Error(`MCP server ${name} already exists`);
    }

    const server: MCPServer = {
      ...config,
      name,
      status: 'stopped',
    };

    this.servers.set(name, server);
    await this.saveConfig();

    this.emit('added', name, server);
    return server;
  }

  /**
   * Remove an MCP server
   */
  async removeServer(name: string): Promise<void> {
    await this.stopServer(name);
    this.servers.delete(name);
    await this.saveConfig();
    this.emit('removed', name);
  }

  /**
   * Update server configuration
   */
  async updateServer(name: string, updates: Partial<Omit<MCPServer, 'name' | 'status'>>): Promise<MCPServer> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server not found: ${name}`);
    }

    const wasRunning = server.status === 'running';
    
    if (wasRunning) {
      await this.stopServer(name);
    }

    Object.assign(server, updates);
    await this.saveConfig();

    if (wasRunning && server.enabled) {
      await this.startServer(name);
    }

    this.emit('updated', name, server);
    return server;
  }

  /**
   * Enable/disable a server
   */
  async setEnabled(name: string, enabled: boolean): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server not found: ${name}`);
    }

    server.enabled = enabled;
    
    if (!enabled && server.status === 'running') {
      await this.stopServer(name);
    }
    
    await this.saveConfig();
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const mcpProcess = this.processes.get(serverName);
    if (!mcpProcess) {
      throw new Error(`MCP server ${serverName} is not running`);
    }

    const tool = mcpProcess.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverName}`);
    }

    return new Promise((resolve, reject) => {
      const id = `tool-${Date.now()}`;
      
      const timeout = setTimeout(() => {
        reject(new Error(`Tool call timeout: ${toolName}`));
      }, 30000);

      const onMessage = (response: unknown) => {
        const resp = response as { id?: string; result?: unknown; error?: unknown };
        if (resp.id === id) {
          clearTimeout(timeout);
          this.off('message', onMessage);
          
          if (resp.error) {
            reject(new Error(String(resp.error)));
          } else {
            resolve(resp.result);
          }
        }
      };

      this.on('message', onMessage);

      this.sendToServer(serverName, {
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      });
    });
  }

  /**
   * Get all available tools from all running servers
   */
  getAllTools(): Array<{ server: string; tool: MCPTool }> {
    const tools: Array<{ server: string; tool: MCPTool }> = [];
    
    for (const [name, mcpProcess] of this.processes) {
      for (const tool of mcpProcess.tools) {
        tools.push({ server: name, tool });
      }
    }
    
    return tools;
  }

  /**
   * Stop all running servers
   */
  async stopAll(): Promise<void> {
    this.logger.info(`Stopping all ${this.processes.size} MCP servers`);
    
    const stops = Array.from(this.processes.keys()).map(name => 
      this.stopServer(name).catch(error => {
        this.logger.error(`Failed to stop MCP server ${name}:`, error);
      })
    );

    await Promise.all(stops);
  }

  private async waitForServerReady(name: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for MCP server ${name} to be ready`));
      }, timeout);

      const checkReady = (serverName: string, status: MCPStatus) => {
        if (serverName === name && status === 'running') {
          clearTimeout(timer);
          this.off('statusChange', checkReady);
          resolve();
        }
      };

      this.on('statusChange', checkReady);
    });
  }

  private handleServerMessage(serverName: string, message: string): void {
    try {
      const data = JSON.parse(message);
      this.emit('message', serverName, data);

      // Handle initialize response
      if (data.id === 'init') {
        if (data.result?.tools) {
          const mcpProcess = this.processes.get(serverName);
          if (mcpProcess) {
            mcpProcess.tools = data.result.tools;
            this.emit('toolsDiscovered', serverName, mcpProcess.tools);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to parse MCP message from ${serverName}:`, message);
    }
  }

  private sendToServer(name: string, message: unknown): void {
    const mcpProcess = this.processes.get(name);
    if (!mcpProcess) {
      throw new Error(`MCP server ${name} is not running`);
    }

    const data = JSON.stringify(message) + '\n';
    mcpProcess.process.stdin?.write(data);
  }

  private async discoverTools(name: string): Promise<void> {
    this.sendToServer(name, {
      jsonrpc: '2.0',
      id: 'init',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'claudenest-agent',
          version: '1.0.0',
        },
      },
    });
  }
}
