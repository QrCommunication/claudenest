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
import keytar from 'keytar';
import os from 'os';

const SERVICE_NAME = 'ClaudeNestAgent';
const DEFAULT_SERVER_URL = 'https://api.claudenest.io';

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
  logger.info({}, 'Starting ClaudeNest Agent...');

  try {
    // Load configuration
    const config = await loadConfig(options);
    
    // Validate configuration
    if (!config.machineToken) {
      logger.error({}, 'No machine token provided. Run "claudenest-agent pair" first.');
      process.exit(1);
    }

    if (!config.claudePath) {
      // Try to find Claude Code
      const foundPath = await findExecutable('claude');
      if (foundPath) {
        config.claudePath = foundPath;
        logger.info({ path: foundPath }, `Found Claude Code at: ${foundPath}`);
      } else {
        logger.error({}, 'Claude Code executable not found. Please specify with --claude-path');
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

    // Write PID file
    await writePidFile();

    logger.info({}, 'Agent started successfully');
    logger.info({ server: config.serverUrl }, `Server: ${config.serverUrl}`);
    logger.info({ machineId }, `Machine ID: ${machineId}`);

    // Keep process alive
    if (options.daemon) {
      // TODO: Implement proper daemonization
      logger.info({}, 'Running in daemon mode');
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info({}, 'Received SIGINT, shutting down...');
      await agent.stop();
      await removePidFile();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info({}, 'Received SIGTERM, shutting down...');
      await agent.stop();
      await removePidFile();
      process.exit(0);
    });

  } catch (error) {
    logger.error({ err: error }, 'Failed to start agent');
    await removePidFile();
    process.exit(1);
  }
}

async function handleStop(): Promise<void> {
  const pid = await readPidFile();

  if (!pid) {
    logger.info({}, 'No running agent found');
    return;
  }

  logger.info({ pid }, `Stopping agent (PID: ${pid})...`);

  try {
    process.kill(pid, 'SIGTERM');

    // Wait for process to exit (max 10 seconds)
    const maxWait = 10000;
    const interval = 500;
    let waited = 0;

    while (waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, interval));
      waited += interval;

      try {
        process.kill(pid, 0);
        // Still running
      } catch {
        // Process exited
        logger.info({}, 'Agent stopped successfully');
        await removePidFile();
        return;
      }
    }

    // Force kill if still running
    logger.warn({ pid }, 'Agent did not stop gracefully, force killing...');
    process.kill(pid, 'SIGKILL');
    await removePidFile();
    logger.info({}, 'Agent force stopped');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
      logger.info({}, 'Agent was not running (stale PID file)');
      await removePidFile();
    } else {
      logger.error({ err: error }, 'Failed to stop agent');
    }
  }
}

async function handleStatus(): Promise<void> {
  const pid = await readPidFile();

  if (!pid) {
    console.log('Agent status: stopped');
    console.log('No running agent instance found.');
    return;
  }

  console.log(`Agent status: running`);
  console.log(`PID: ${pid}`);

  // Show machine ID if available
  const machineId = await getMachineId();
  if (machineId) {
    console.log(`Machine ID: ${machineId}`);
  }

  // Show config
  const configDir = getConfigDir();
  const configPath = path.join(configDir, 'config.json');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    if (config.serverUrl) {
      console.log(`Server: ${config.serverUrl}`);
    }
  } catch {
    // No config file
  }

  // Show uptime from PID file modification time
  try {
    const stat = await fs.stat(getPidFilePath());
    const uptime = Date.now() - stat.mtimeMs;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    console.log(`Uptime: ${hours}h ${minutes}m`);
  } catch {
    // Can't read stat
  }
}

async function handlePair(options: { server: string }): Promise<void> {
  logger.info({}, 'Pairing with ClaudeNest server...');
  logger.info({ server: options.server }, `Server: ${options.server}`);

  // Get agent version
  const agentVersion = await getPackageVersion();

  // Try to register pairing code with server (max 3 attempts for 409 conflicts)
  let pairingCode: string | null = null;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate a pairing code
    pairingCode = generatePairingCode();

    try {
      const initiateResponse = await fetch(`${options.server}/api/pairing/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: pairingCode,
          agent_info: {
            platform: os.platform(),
            hostname: os.hostname(),
            arch: os.arch(),
            node_version: process.version,
            agent_version: agentVersion,
          },
        }),
      });

      if (initiateResponse.status === 409) {
        // Code already exists, retry with new code
        logger.warn({}, `Pairing code conflict (attempt ${attempt + 1}/${maxRetries}), generating new code...`);
        continue;
      }

      if (!initiateResponse.ok) {
        throw new Error(`Failed to initiate pairing: ${initiateResponse.status} ${initiateResponse.statusText}`);
      }

      // Successfully registered the code
      break;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        logger.error({ err: error }, 'Failed to register pairing code after max retries');
        process.exit(1);
      }
    }
  }

  if (!pairingCode) {
    logger.error({}, 'Failed to generate valid pairing code');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('PAIRING CODE:');
  console.log(pairingCode);
  console.log('========================================\n');

  console.log('Enter this code in your ClaudeNest dashboard to complete pairing.\n');

  // Poll for pairing completion
  logger.info({}, 'Waiting for pairing completion...');

  try {
    const { token, machineId } = await pollForPairing(options.server, pairingCode);

    // Store the token securely
    await keytar.setPassword(SERVICE_NAME, 'machine-token', token);

    // Save machine ID
    if (machineId) {
      await saveMachineId(machineId);
    }

    logger.info({}, 'Pairing successful! Token stored securely.');

    // Save server URL to config
    await saveConfigValue('serverUrl', options.server);

  } catch (error) {
    logger.error({ err: error }, 'Pairing failed');
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
    logger.info({}, 'Configuration updated');
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
      const { watch } = await import('fs');
      let lastSize = (await fs.stat(logPath)).size;

      console.log('\n--- Following log output (Ctrl+C to stop) ---\n');

      const watcher = watch(logPath, async () => {
        try {
          const newStat = await fs.stat(logPath);
          if (newStat.size > lastSize) {
            const fd = await fs.open(logPath, 'r');
            const buffer = Buffer.alloc(newStat.size - lastSize);
            await fd.read(buffer, 0, buffer.length, lastSize);
            await fd.close();
            process.stdout.write(buffer.toString());
            lastSize = newStat.size;
          } else if (newStat.size < lastSize) {
            // Log rotated
            lastSize = 0;
          }
        } catch {
          // File may have been rotated
        }
      });

      process.on('SIGINT', () => {
        watcher.close();
        process.exit(0);
      });

      // Keep process alive
      await new Promise(() => {});
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.info({}, 'No log file found');
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

function getPidFilePath(): string {
  return path.join(getCacheDir(), 'agent.pid');
}

async function writePidFile(): Promise<void> {
  const pidPath = getPidFilePath();
  await ensureDir(path.dirname(pidPath));
  await fs.writeFile(pidPath, String(process.pid));
}

async function readPidFile(): Promise<number | null> {
  try {
    const content = await fs.readFile(getPidFilePath(), 'utf-8');
    const pid = parseInt(content.trim(), 10);
    if (isNaN(pid)) return null;
    // Check if process is actually running
    try {
      process.kill(pid, 0);
      return pid;
    } catch {
      // Process not running, clean up stale PID file
      await removePidFile();
      return null;
    }
  } catch {
    return null;
  }
}

async function removePidFile(): Promise<void> {
  try {
    await fs.unlink(getPidFilePath());
  } catch {
    // Ignore if file doesn't exist
  }
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

async function pollForPairing(serverUrl: string, pairingCode: string): Promise<{ token: string; machineId: string }> {
  // Poll the server for pairing completion
  const maxAttempts = 60; // 5 minutes
  const interval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${serverUrl}/api/pairing/${pairingCode}`);

      if (response.status === 200) {
        const data = await response.json() as {
          success: boolean;
          data: {
            status: string;
            token: string;
            machine_id: string;
          };
        };
        return {
          token: data.data.token,
          machineId: data.data.machine_id,
        };
      }

      if (response.status === 202) {
        // Still pending, extract seconds_remaining
        const data = await response.json() as {
          success: boolean;
          data: {
            status: string;
            seconds_remaining: number;
          };
        };
        const remaining = data.data.seconds_remaining;
        console.log(`Waiting for pairing... (${remaining}s remaining)`);
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
      }

      if (response.status === 410) {
        // Code expired
        throw new Error('Pairing code has expired. Please run the pairing command again.');
      }

      throw new Error(`Pairing failed: ${response.status} ${response.statusText}`);
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
  logger.fatal({ err: error }, 'Unhandled error');
  process.exit(1);
});

export { main };
