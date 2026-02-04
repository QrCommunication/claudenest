#!/usr/bin/env node
/**
 * ClaudeNest Agent CLI
 * 
 * Entry point for the ClaudeNest Agent - a local daemon for remote orchestration
 * of Claude Code instances.
 */

import { Command } from 'commander';
import { ClaudeNestAgent, generateMachineId } from './agent.js';
import { createLogger, getLogLevelFromEnv } from './utils/logger.js';
import { 
  getConfigDir, 
  getCacheDir, 
  ensureDir,
  safeJsonParse,
  findExecutable,
} from './utils/index.js';
import type { AgentConfig } from './types/index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import keytar from 'keytar';

const SERVICE_NAME = 'ClaudeNestAgent';
const DEFAULT_SERVER_URL = 'https://api.claudenest.dev';

interface CLIOptions {
  server?: string;
  token?: string;
  claudePath?: string;
  logLevel?: string;
  projectPath?: string[];
  daemon?: boolean;
  config?: string;
}

const logger = createLogger(getLogLevelFromEnv());

async function main(): Promise<void> {
  const pkgVersion = await getPackageVersion();
  
  const program = new Command()
    .name('claudenest-agent')
    .description('ClaudeNest Agent - Remote orchestration daemon for Claude Code')
    .version(pkgVersion, '-v, --version', 'Display version number');

  program
    .command('start')
    .description('Start the agent daemon')
    .option('-s, --server <url>', 'ClaudeNest server URL', DEFAULT_SERVER_URL)
    .option('-t, --token <token>', 'Machine authentication token')
    .option('-c, --claude-path <path>', 'Path to Claude Code executable')
    .option('-l, --log-level <level>', 'Log level (trace|debug|info|warn|error)', 'info')
    .option('-p, --project-path <path>', 'Project paths to scan for skills', collect, [])
    .option('-d, --daemon', 'Run as daemon (detach from terminal)', false)
    .option('--config <path>', 'Path to configuration file')
    .action(handleStart);

  program
    .command('stop')
    .description('Stop the running agent')
    .action(handleStop);

  program
    .command('status')
    .description('Check agent status')
    .action(handleStatus);

  program
    .command('pair')
    .description('Pair this machine with a ClaudeNest account')
    .option('-s, --server <url>', 'ClaudeNest server URL', DEFAULT_SERVER_URL)
    .action(handlePair);

  program
    .command('config')
    .description('Manage agent configuration')
    .option('--set <key=value>', 'Set a configuration value', collect, [])
    .option('--get <key>', 'Get a configuration value')
    .option('--list', 'List all configuration values')
    .action(handleConfig);

  program
    .command('logs')
    .description('View agent logs')
    .option('-f, --follow', 'Follow log output', false)
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .action(handleLogs);

  await program.parseAsync(process.argv);
}

async function handleStart(options: CLIOptions): Promise<void> {
  logger.info('Starting ClaudeNest Agent...');

  try {
    // Load configuration
    const config = await loadConfig(options);
    
    // Validate configuration
    if (!config.machineToken) {
      logger.error('No machine token provided. Run "claudenest-agent pair" first.');
      process.exit(1);
    }

    if (!config.claudePath) {
      // Try to find Claude Code
      const foundPath = await findExecutable('claude');
      if (foundPath) {
        config.claudePath = foundPath;
        logger.info(`Found Claude Code at: ${foundPath}`);
      } else {
        logger.error('Claude Code executable not found. Please specify with --claude-path');
        process.exit(1);
      }
    }

    // Get or generate machine ID
    let machineId = await getMachineId();
    if (!machineId) {
      machineId = generateMachineId();
      await saveMachineId(machineId);
    }

    // Create and start agent
    const agent = new ClaudeNestAgent({
      config,
      machineId,
    });

    await agent.initialize();
    await agent.start();

    logger.info('Agent started successfully');
    logger.info(`Server: ${config.serverUrl}`);
    logger.info(`Machine ID: ${machineId}`);

    // Keep process alive
    if (options.daemon) {
      // TODO: Implement proper daemonization
      logger.info('Running in daemon mode');
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      await agent.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      await agent.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start agent', { error });
    process.exit(1);
  }
}

async function handleStop(): Promise<void> {
  logger.info('Stopping agent...');
  
  // TODO: Implement proper daemon management with PID file
  // For now, just log that the user should use Ctrl+C
  logger.info('If running in foreground, press Ctrl+C to stop');
  logger.info('Daemon mode stop not yet implemented');
}

async function handleStatus(): Promise<void> {
  // TODO: Implement status check via IPC or API
  logger.info('Agent status check not yet implemented');
}

async function handlePair(options: { server: string }): Promise<void> {
  logger.info('Pairing with ClaudeNest server...');
  logger.info(`Server: ${options.server}`);

  // Generate a pairing code
  const pairingCode = generatePairingCode();
  
  console.log('\n========================================');
  console.log('PAIRING CODE:');
  console.log(pairingCode);
  console.log('========================================\n');
  
  console.log('Enter this code in your ClaudeNest dashboard to complete pairing.\n');
  
  // Poll for pairing completion
  logger.info('Waiting for pairing completion...');
  
  try {
    const token = await pollForPairing(options.server, pairingCode);
    
    // Store the token securely
    await keytar.setPassword(SERVICE_NAME, 'machine-token', token);
    
    logger.info('Pairing successful! Token stored securely.');
    
    // Save server URL to config
    await saveConfigValue('serverUrl', options.server);
    
  } catch (error) {
    logger.error('Pairing failed', { error });
    process.exit(1);
  }
}

async function handleConfig(options: { 
  set?: string[]; 
  get?: string; 
  list?: boolean;
}): Promise<void> {
  const configPath = path.join(getConfigDir(), 'config.json');

  if (options.list) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('{}');
      } else {
        throw error;
      }
    }
    return;
  }

  if (options.get) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      console.log(config[options.get] ?? '');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('');
      } else {
        throw error;
      }
    }
    return;
  }

  if (options.set && options.set.length > 0) {
    let config: Record<string, unknown> = {};
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    for (const pair of options.set) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        // Try to parse as JSON, otherwise use as string
        config[key] = safeJsonParse(value, value);
      }
    }

    await ensureDir(path.dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    logger.info('Configuration updated');
  }
}

async function handleLogs(options: { follow: boolean; lines: string }): Promise<void> {
  const logPath = path.join(getCacheDir(), 'agent.log');
  
  try {
    const content = await fs.readFile(logPath, 'utf-8');
    const lines = content.split('\n');
    const numLines = parseInt(options.lines, 10);
    
    console.log(lines.slice(-numLines).join('\n'));
    
    if (options.follow) {
      // TODO: Implement log following with fs.watch
      logger.info('Log following not yet implemented');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.info('No log file found');
    } else {
      throw error;
    }
  }
}

// Helper functions

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

async function loadConfig(options: CLIOptions): Promise<AgentConfig> {
  const configDir = getConfigDir();
  const configPath = options.config || path.join(configDir, 'config.json');

  let fileConfig: Partial<AgentConfig> = {};
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    fileConfig = JSON.parse(content);
  } catch {
    // File doesn't exist or is invalid
  }

  // Get token from keychain
  let token: string | null = null;
  try {
    token = await keytar.getPassword(SERVICE_NAME, 'machine-token');
  } catch {
    // Keytar not available, try env var
    token = process.env.CLAUDENEST_TOKEN || null;
  }

  // CLI options take precedence
  return {
    serverUrl: options.server || fileConfig.serverUrl || DEFAULT_SERVER_URL,
    machineToken: options.token || token || fileConfig.machineToken || '',
    claudePath: options.claudePath || fileConfig.claudePath || '',
    projectPaths: options.projectPath?.length 
      ? options.projectPath 
      : (fileConfig.projectPaths || [process.cwd()]),
    cachePath: fileConfig.cachePath || path.join(getCacheDir(), 'context-cache.json'),
    logLevel: (options.logLevel as AgentConfig['logLevel']) || fileConfig.logLevel || 'info',
    websocket: fileConfig.websocket,
    sessions: fileConfig.sessions,
  };
}

async function saveConfigValue(key: string, value: unknown): Promise<void> {
  const configDir = getConfigDir();
  const configPath = path.join(configDir, 'config.json');

  let config: Record<string, unknown> = {};
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // File doesn't exist
  }

  config[key] = value;

  await ensureDir(configDir);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

async function getMachineId(): Promise<string | null> {
  const configDir = getConfigDir();
  const machineIdPath = path.join(configDir, 'machine-id');

  try {
    const id = await fs.readFile(machineIdPath, 'utf-8');
    return id.trim();
  } catch {
    return null;
  }
}

async function saveMachineId(id: string): Promise<void> {
  const configDir = getConfigDir();
  const machineIdPath = path.join(configDir, 'machine-id');

  await ensureDir(configDir);
  await fs.writeFile(machineIdPath, id);
}

function generatePairingCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.match(/.{1,3}/g)!.join('-');
}

async function pollForPairing(serverUrl: string, pairingCode: string): Promise<string> {
  // Poll the server for pairing completion
  const maxAttempts = 60; // 5 minutes
  const interval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${serverUrl}/api/pairing/${pairingCode}`);
      
      if (response.ok) {
        const data = await response.json() as { token: string };
        return data.token;
      }
      
      if (response.status === 404) {
        // Still waiting
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
      }
      
      throw new Error(`Pairing failed: ${response.statusText}`);
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  throw new Error('Pairing timeout');
}

async function getPackageVersion(): Promise<string> {
  try {
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const packagePath = path.join(path.dirname(__filename), '..', 'package.json');
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version;
  } catch {
    return '1.0.0';
  }
}

// Run main
main().catch(error => {
  logger.fatal('Unhandled error', { error });
  process.exit(1);
});

export { main };
