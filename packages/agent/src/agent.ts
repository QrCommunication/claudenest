/**
 * ClaudeNest Agent - Main Agent Class
 */

import { EventEmitter } from 'events';
import { WebSocketClient } from './websocket/client.js';
import { SessionManager } from './sessions/manager.js';
import { SkillsDiscovery } from './discovery/skills.js';
import { MCPManager } from './discovery/mcp.js';
import { ContextClient } from './context/client.js';
import { createLogger } from './utils/logger.js';
import {
  createSessionHandlers,
  createConfigHandlers,
  createContextHandlers,
} from './handlers/index.js';
import type { 
  AgentConfig, 
  AgentEvents, 
  Logger, 
  MachineInfo,
  SessionOutput 
} from './types/index.js';
import { 
  generateId, 
  getPackageVersion, 
  getMachineInfo, 
  getCacheDir,
  ensureDir,
} from './utils/index.js';
import path from 'path';

interface AgentOptions {
  config: AgentConfig;
  machineId: string;
}

export class ClaudeNestAgent extends EventEmitter {
  private config: AgentConfig;
  private machineId: string;
  private logger: Logger;
  
  private wsClient!: WebSocketClient;
  private sessionManager!: SessionManager;
  private skillsDiscovery!: SkillsDiscovery;
  private mcpManager!: MCPManager;
  private contextClient!: ContextClient;
  
  private isRunning = false;
  private handlers = new Map<string, (payload: unknown) => Promise<void> | void>();

  constructor(options: AgentOptions) {
    super();
    this.config = options.config;
    this.machineId = options.machineId;
    this.logger = createLogger(options.config.logLevel).child({ 
      component: 'Agent',
      machineId: options.machineId,
    });
  }

  /**
   * Initialize all agent components
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing ClaudeNest Agent...');

    // Initialize WebSocket client
    this.wsClient = new WebSocketClient({
      serverUrl: this.config.serverUrl,
      token: this.config.machineToken,
      machineId: this.machineId,
      config: this.config.websocket,
      logger: this.logger,
    });

    // Initialize session manager
    this.sessionManager = new SessionManager({
      claudePath: this.config.claudePath,
      maxSessions: this.config.sessions?.maxSessions,
      logger: this.logger,
    });

    // Initialize discovery services
    this.skillsDiscovery = new SkillsDiscovery({
      projectPaths: this.config.projectPaths,
      logger: this.logger,
    });

    this.mcpManager = new MCPManager({
      logger: this.logger,
    });

    // Initialize context client
    const cachePath = this.config.cachePath || path.join(getCacheDir(), 'context-cache.json');
    await ensureDir(path.dirname(cachePath));
    
    this.contextClient = new ContextClient({
      serverUrl: this.config.serverUrl,
      token: this.config.machineToken,
      machineId: this.machineId,
      cachePath,
      logger: this.logger,
    });

    // Setup event handlers
    this.setupEventHandlers();
    this.setupMessageHandlers();

    this.logger.info('Agent initialized');
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.logger.info('Starting ClaudeNest Agent...');

    try {
      // Initialize components
      await this.skillsDiscovery.initialize();
      await this.mcpManager.initialize();
      await this.contextClient.initialize();

      // Connect to WebSocket
      await this.wsClient.connect();

      // Send initial machine info
      await this.sendMachineInfo();

      this.isRunning = true;
      this.emit('started');

      this.logger.info('Agent started successfully');
    } catch (error) {
      this.logger.error('Failed to start agent', { error });
      throw error;
    }
  }

  /**
   * Stop the agent gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping agent...');

    try {
      // Terminate all sessions
      await this.sessionManager.terminateAll();

      // Stop MCP servers
      await this.mcpManager.stopAll();

      // Stop context client
      await this.contextClient.stop();

      // Disconnect WebSocket
      await this.wsClient.disconnect();

      this.isRunning = false;
      this.emit('stopped');

      this.logger.info('Agent stopped');
    } catch (error) {
      this.logger.error('Error during agent shutdown', { error });
      throw error;
    }
  }

  /**
   * Check if agent is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get agent status
   */
  getStatus(): {
    isRunning: boolean;
    wsStatus: 'connected' | 'connecting' | 'disconnected';
    sessionCount: number;
    pendingSync: number;
  } {
    const syncStatus = this.contextClient.getSyncStatus();
    
    return {
      isRunning: this.isRunning,
      wsStatus: this.wsClient.getStatus(),
      sessionCount: this.sessionManager.getSessionCount(),
      pendingSync: syncStatus.pendingUpdates,
    };
  }

  /**
   * Get machine info
   */
  async getMachineInfo(): Promise<MachineInfo> {
    const version = await getPackageVersion();
    const machineInfo = getMachineInfo();
    const skills = this.skillsDiscovery.getAllSkills();
    const mcps = this.mcpManager.getAllServers();

    return {
      id: this.machineId,
      name: machineInfo.hostname,
      platform: machineInfo.platform,
      hostname: machineInfo.hostname,
      arch: machineInfo.arch,
      nodeVersion: machineInfo.nodeVersion,
      agentVersion: version,
      claudeVersion: await this.detectClaudeVersion(),
      claudePath: this.config.claudePath,
      capabilities: {
        supportsPTY: true,
        supportsMCP: mcps.length > 0,
        supportsSkills: skills.length > 0,
        availableSkills: skills.map(s => s.name),
        availableMCPs: mcps.map(m => m.name),
      },
      maxSessions: this.config.sessions?.maxSessions || 10,
    };
  }

  private setupEventHandlers(): void {
    // WebSocket events
    this.wsClient.on('connected', () => {
      this.logger.info('Connected to ClaudeNest server');
      this.emit('connected');
    });

    this.wsClient.on('disconnected', () => {
      this.logger.warn('Disconnected from server');
      this.emit('disconnected');
    });

    this.wsClient.on('message', (type: string, payload: unknown) => {
      this.handleMessage(type, payload);
    });

    this.wsClient.on('error', (error: Error) => {
      this.logger.error('WebSocket error', { error });
      this.emit('error', error);
    });

    // Session events
    this.sessionManager.on('output', (data: SessionOutput) => {
      this.wsClient.send('session:output', data);
    });

    this.sessionManager.on('status', (data: { sessionId: string; status: string }) => {
      this.wsClient.send('session:status', data);
    });

    this.sessionManager.on('sessionEnded', (data: { sessionId: string; exitCode: number }) => {
      this.wsClient.send('session:exited', data);
    });

    this.sessionManager.on('sessionCreated', (session) => {
      this.emit('sessionCreated', session);
    });

    // Context client events
    this.contextClient.on('synced', (count: number) => {
      this.logger.debug(`Context synced: ${count} updates`);
    });

    this.contextClient.on('taskClaimed', (task) => {
      this.emit('taskClaimed', task);
    });

    this.contextClient.on('taskCompleted', (task) => {
      this.emit('taskCompleted', task);
    });

    // Handle process signals
    process.on('SIGINT', () => this.handleShutdown());
    process.on('SIGTERM', () => this.handleShutdown());
    process.on('uncaughtException', (error) => {
      this.logger.fatal('Uncaught exception', { error });
      this.handleShutdown();
    });
    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled rejection', { reason });
    });
  }

  private setupMessageHandlers(): void {
    // Session handlers
    const sessionHandlers = createSessionHandlers({
      sessionManager: this.sessionManager,
      wsClient: this.wsClient,
      logger: this.logger,
    });

    // Config handlers
    const configHandlers = createConfigHandlers({
      skillsDiscovery: this.skillsDiscovery,
      mcpManager: this.mcpManager,
      wsClient: this.wsClient,
      logger: this.logger,
      machineId: this.machineId,
      claudePath: this.config.claudePath,
    });

    // Context handlers
    const contextHandlers = createContextHandlers({
      contextClient: this.contextClient,
      wsClient: this.wsClient,
      logger: this.logger,
      instanceId: this.machineId,
    });

    // Register all handlers
    for (const [type, handler] of Object.entries(sessionHandlers)) {
      this.handlers.set(type, handler);
    }
    for (const [type, handler] of Object.entries(configHandlers)) {
      this.handlers.set(type, handler);
    }
    for (const [type, handler] of Object.entries(contextHandlers)) {
      this.handlers.set(type, handler);
    }

    // Add ping handler
    this.handlers.set('ping', () => {
      this.wsClient.send('pong', { timestamp: Date.now() });
    });
  }

  private async handleMessage(type: string, payload: unknown): Promise<void> {
    this.logger.debug('Received message', { type });

    const handler = this.handlers.get(type);
    if (!handler) {
      this.logger.warn(`No handler for message type: ${type}`);
      return;
    }

    try {
      await handler(payload);
    } catch (error) {
      this.logger.error(`Handler error for ${type}`, { error });
      this.wsClient.send('error', {
        originalType: type,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async sendMachineInfo(): Promise<void> {
    const info = await this.getMachineInfo();
    this.wsClient.send('machine:info', info);
  }

  private async detectClaudeVersion(): Promise<string> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(`${this.config.claudePath} --version`);
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  private async handleShutdown(): Promise<void> {
    this.logger.info('Shutdown signal received');
    
    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }

  // Public API for programmatic use

  /**
   * Get session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get skills discovery
   */
  getSkillsDiscovery(): SkillsDiscovery {
    return this.skillsDiscovery;
  }

  /**
   * Get MCP manager
   */
  getMCPManager(): MCPManager {
    return this.mcpManager;
  }

  /**
   * Get context client
   */
  getContextClient(): ContextClient {
    return this.contextClient;
  }

  /**
   * Get WebSocket client
   */
  getWebSocketClient(): WebSocketClient {
    return this.wsClient;
  }
}

// Type augmentation for EventEmitter
declare module 'events' {
  interface EventEmitter {
    on<T extends keyof AgentEvents>(event: T, listener: AgentEvents[T]): this;
    emit<T extends keyof AgentEvents>(event: T, ...args: Parameters<AgentEvents[T]>): boolean;
  }
}

export { generateId as generateMachineId };
