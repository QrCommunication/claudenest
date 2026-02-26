/**
 * ClaudeNest Agent - Main Agent Class
 */

import { EventEmitter } from 'events';
import { WebSocketClient } from './websocket/client.js';
import { SessionManager } from './sessions/manager.js';
import { SkillsDiscovery } from './discovery/skills.js';
import { MCPManager } from './discovery/mcp.js';
import { ContextClient } from './context/client.js';
import { RestApiClient } from './api/client.js';
import { SyncService } from './sync/service.js';
import { Orchestrator } from './orchestrator/orchestrator.js';
import { createLogger } from './utils/logger.js';
import {
  createSessionHandlers,
  createConfigHandlers,
  createContextHandlers,
  createFileHandlers,
  createOrchestratorHandlers,
  createScanHandlers,
  createDecomposeHandlers,
} from './handlers/index.js';
import type {
  AgentConfig,
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
  private apiClient!: RestApiClient;
  private syncService!: SyncService;
  private orchestrator!: Orchestrator;
  
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

    // Initialize REST API client
    this.apiClient = new RestApiClient({
      baseUrl: this.config.serverUrl,
      machineToken: this.config.machineToken,
      machineId: this.machineId,
      logger: this.logger,
    });

    // Initialize sync service
    this.syncService = new SyncService({
      apiClient: this.apiClient,
      machineId: this.machineId,
      skillsDiscovery: this.skillsDiscovery,
      mcpManager: this.mcpManager,
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

    // Initialize orchestrator
    this.orchestrator = new Orchestrator({
      sessionManager: this.sessionManager,
      contextClient: this.contextClient,
      wsClient: this.wsClient,
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

      // Recover orphaned tmux sessions from previous agent runs
      const recovered = await this.sessionManager.recoverSessions();
      if (recovered.length > 0) {
        this.logger.info({ count: recovered.length, ids: recovered }, 'Recovered tmux sessions');
      }

      // Send initial machine info
      await this.sendMachineInfo();

      // Sync skills/MCP to server (bulk upsert)
      await this.syncService.fullSync();
      this.syncService.startPeriodicSync();

      this.isRunning = true;
      this.emit('started');

      this.logger.info('Agent started successfully');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to start agent');
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
      // Stop orchestrator first (terminates worker sessions)
      if (this.orchestrator.isRunning()) {
        await this.orchestrator.stop();
      }

      // Terminate remaining sessions
      await this.sessionManager.terminateAll();

      // Stop sync service
      await this.syncService.stop();

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
      this.logger.error({ err: error }, 'Error during agent shutdown');
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
        supportsTmux: true,
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

    this.wsClient.on('message', ({ type, payload }: { type: string; payload: unknown }) => {
      this.handleMessage(type, payload);
    });

    this.wsClient.on('error', (error: Error) => {
      this.logger.error({ err: error }, 'WebSocket error');
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

    this.sessionManager.on('sessionRecovered', (data: { sessionId: string }) => {
      this.wsClient.send('session:recovered', data);
    });

    // Context client events
    this.contextClient.on('synced', () => {
      this.logger.debug('Context synced');
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
      this.logger.fatal({ err: error }, 'Uncaught exception');
      this.handleShutdown();
    });
    process.on('unhandledRejection', (reason) => {
      this.logger.error({ reason }, 'Unhandled rejection');
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

    // File handlers
    const fileHandlers = createFileHandlers({
      wsClient: this.wsClient,
      logger: this.logger,
    });

    // Orchestrator handlers
    const orchestratorHandlers = createOrchestratorHandlers({
      orchestrator: this.orchestrator,
      wsClient: this.wsClient,
      logger: this.logger,
    });

    // Scan handlers
    const scanHandlers = createScanHandlers({
      wsClient: this.wsClient,
      logger: this.logger,
    });

    // Decompose handlers
    const decomposeHandlers = createDecomposeHandlers({
      sessionManager: this.sessionManager,
      wsClient: this.wsClient,
      logger: this.logger,
    });

    // Register all handlers
    for (const [type, handler] of Object.entries(sessionHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(configHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(contextHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(fileHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(orchestratorHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(scanHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(decomposeHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }

    // Add ping/pong handlers
    this.handlers.set('ping', () => {
      this.wsClient.send('pong', { timestamp: Date.now() });
    });
    this.handlers.set('pong', () => {
      // Expected response to heartbeat, no action needed
    });
  }

  private async handleMessage(type: string, payload: unknown): Promise<void> {
    this.logger.debug({ type }, 'Received message');

    const handler = this.handlers.get(type);
    if (!handler) {
      this.logger.warn(`No handler for message type: ${type}`);
      return;
    }

    try {
      await handler(payload);
    } catch (error) {
      this.logger.error({ err: error }, `Handler error for ${type}`);
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
      this.logger.error({ err: error }, 'Error during shutdown');
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

  /**
   * Get orchestrator
   */
  getOrchestrator(): Orchestrator {
    return this.orchestrator;
  }
}

export { generateId as generateMachineId };
