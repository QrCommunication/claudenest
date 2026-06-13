/**
 * ClaudeNest Agent - Main Agent Class
 */

import { EventEmitter } from 'events';
import { WebSocketClient } from './websocket/client.js';
import { SessionManager } from './sessions/manager.js';
import { ClaudeSessionDiscovery } from './sessions/discovery.js';
import { ensureBwrap } from './sessions/sandbox.js';
import { shouldSignalAuthError, forgetAuthError } from './sessions/auth-error.js';
import { SkillsDiscovery } from './discovery/skills.js';
import { MCPManager } from './discovery/mcp.js';
import { ContextClient } from './context/client.js';
import { RestApiClient } from './api/client.js';
import { SyncService } from './sync/service.js';
import { createLogger } from './utils/logger.js';
import {
  createSessionHandlers,
  createConfigHandlers,
  createContextHandlers,
  createFileHandlers,
  createScanHandlers,
  createDecomposeHandlers,
  createOAuthHandlers,
  createDiscoveryHandlers,
  createSprintHandlers,
  createGitHandlers,
} from './handlers/index.js';
import type {
  AgentConfig,
  Logger,
  MachineInfo,
  SessionOutput,
  DiscoveredSession,
  TranscriptBatch,
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
  private claudeSessionDiscovery!: ClaudeSessionDiscovery;
  private skillsDiscovery!: SkillsDiscovery;
  private mcpManager!: MCPManager;
  private contextClient!: ContextClient;
  private apiClient!: RestApiClient;
  private syncService!: SyncService;
  
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

    // Initialize Claude session discovery (scans the user's own sessions)
    this.claudeSessionDiscovery = new ClaudeSessionDiscovery({
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

      // Best-effort: ensure bubblewrap is present so orchestrated workers are
      // sandboxed (write-confined to their project). Runs once; fail-open.
      if (process.env['CLAUDENEST_SANDBOX'] !== '0') {
        try {
          ensureBwrap(this.logger);
        } catch (err) {
          this.logger.warn({ err }, 'Sandbox (bubblewrap) setup skipped');
        }
      }

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

      // Start scanning the user's own Claude sessions and push them online.
      // 60s cadence keeps the dashboard fresh without flooding I/O; the meta
      // cache means unchanged transcripts are not re-read each cycle.
      this.claudeSessionDiscovery.startAutoDiscovery(60_000, true);

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
      // Stop Claude session discovery (transcript tailers + rescans)
      this.claudeSessionDiscovery.stop();

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
      // EventEmitter throws synchronously on 'error' when no listener is
      // attached — a transient network error (e.g. DNS EAI_AGAIN) must never
      // crash the agent; reconnection is already handled on the 'close' event.
      if (this.listenerCount('error') > 0) {
        this.emit('error', error);
      }
    });

    // Session events
    this.sessionManager.on('output', (data: SessionOutput) => {
      this.wsClient.send('session:output', data);

      // Detect a Claude credential 401 ("Please run /login") in the output and
      // signal the server (debounced) so it renews the token + relaunches.
      if (shouldSignalAuthError(data.sessionId, data.data ?? '', Date.now())) {
        this.logger.warn({ sessionId: data.sessionId }, 'Claude auth 401 detected — signalling server');
        this.wsClient.send('session:auth_error', { sessionId: data.sessionId });
      }
    });

    this.sessionManager.on('status', (data: { sessionId: string; status: string }) => {
      this.wsClient.send('session:status', data);
    });

    this.sessionManager.on('sessionEnded', (data: { sessionId: string; exitCode: number }) => {
      forgetAuthError(data.sessionId);
      this.wsClient.send('session:exited', data);
    });

    this.sessionManager.on('sessionCreated', (session) => {
      this.emit('sessionCreated', session);
    });

    this.sessionManager.on('sessionRecovered', (data: { sessionId: string }) => {
      this.wsClient.send('session:recovered', data);
    });

    // Claude session discovery events (scanned, not agent-spawned)
    this.claudeSessionDiscovery.on('discovered', (sessions: DiscoveredSession[]) => {
      this.wsClient.send('claude_sessions:discovered', { sessions });
    });

    this.claudeSessionDiscovery.on('transcript', (batch: TranscriptBatch) => {
      this.wsClient.send('claude_sessions:transcript', batch);
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
      // Exit non-zero so the service supervisor (systemd Restart=on-failure)
      // restarts the agent — a crash must never look like a clean shutdown.
      this.handleShutdown(1);
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

    // OAuth handlers
    const oauthHandlers = createOAuthHandlers({
      wsClient: this.wsClient,
      logger: this.logger,
    });

    // Claude session discovery handlers
    const discoveryHandlers = createDiscoveryHandlers({
      discovery: this.claudeSessionDiscovery,
      sessionManager: this.sessionManager,
      wsClient: this.wsClient,
      logger: this.logger,
    });

    // Sprint handlers (auto-PR on sprint completion)
    const sprintHandlers = createSprintHandlers({
      wsClient: this.wsClient,
      logger: this.logger,
    });

    const gitHandlers = createGitHandlers({
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
    for (const [type, handler] of Object.entries(scanHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(decomposeHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(oauthHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(discoveryHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(sprintHandlers)) {
      this.handlers.set(type, handler as (payload: unknown) => Promise<void> | void);
    }
    for (const [type, handler] of Object.entries(gitHandlers)) {
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

  private async handleShutdown(exitCode = 0): Promise<void> {
    this.logger.info('Shutdown signal received');

    try {
      await this.stop();
      process.exit(exitCode);
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

}

export { generateId as generateMachineId };
