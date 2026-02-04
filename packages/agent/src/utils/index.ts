/**
 * Utility functions
 */

import crypto from 'crypto';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a short ID (8 characters)
 */
export function generateShortId(): string {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Get package version from package.json
 */
export async function getPackageVersion(): Promise<string> {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packagePath = path.join(__dirname, '..', '..', 'package.json');
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version;
  } catch {
    return '1.0.0';
  }
}

/**
 * Get machine information
 */
export function getMachineInfo() {
  return {
    platform: process.platform,
    hostname: os.hostname(),
    arch: process.arch,
    nodeVersion: process.version,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
  };
}

/**
 * Delay/promise wrapper for setTimeout
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    maxDelay?: number;
    backoff?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay: initialDelay = 1000,
    maxDelay = 30000,
    backoff = 2,
    onError,
  } = options;

  let lastError: Error;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      onError?.(lastError, attempt);
      
      await delay(currentDelay);
      currentDelay = Math.min(currentDelay * backoff, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj: unknown, space?: number): string {
  try {
    return JSON.stringify(obj, null, space);
  } catch {
    return String(obj);
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Get user home directory
 */
export function getHomeDir(): string {
  return os.homedir();
}

/**
 * Get default config directory
 */
export function getConfigDir(): string {
  const home = getHomeDir();
  
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'ClaudeNest');
  }
  
  if (process.platform === 'win32') {
    return path.join(home, 'AppData', 'Roaming', 'ClaudeNest');
  }
  
  // Linux and others
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    return path.join(xdgConfig, 'claudenest');
  }
  
  return path.join(home, '.config', 'claudenest');
}

/**
 * Get default cache directory
 */
export function getCacheDir(): string {
  const home = getHomeDir();
  
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Caches', 'ClaudeNest');
  }
  
  if (process.platform === 'win32') {
    return path.join(home, 'AppData', 'Local', 'ClaudeNest', 'Cache');
  }
  
  // Linux and others
  const xdgCache = process.env.XDG_CACHE_HOME;
  if (xdgCache) {
    return path.join(xdgCache, 'claudenest');
  }
  
  return path.join(home, '.cache', 'claudenest');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }
  
  return result;
}

/**
 * Check if a command exists in PATH
 */
export async function commandExists(command: string): Promise<boolean> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    if (process.platform === 'win32') {
      await execAsync(`where ${command}`);
    } else {
      await execAsync(`which ${command}`);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Find executable in PATH
 */
export async function findExecutable(name: string): Promise<string | null> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`where ${name}`);
      return stdout.trim().split('\n')[0];
    } else {
      const { stdout } = await execAsync(`which ${name}`);
      return stdout.trim();
    }
  } catch {
    return null;
  }
}
