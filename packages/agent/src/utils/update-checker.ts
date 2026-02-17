/**
 * Update Checker - checks for newer versions of @claudenest/agent on npm
 * at startup. Non-blocking with 5s timeout and 24h cache.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { getConfigDir, ensureDir } from './index.js';

const execFileAsync = promisify(execFile);

const PACKAGE_NAME = '@claudenest/agent';
const CHECK_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UpdateCheckCache {
  lastCheck: number;
  latestVersion: string;
}

function getCachePath(): string {
  return path.join(getConfigDir(), 'update-check.json');
}

async function readCache(): Promise<UpdateCheckCache | null> {
  try {
    const content = await fs.readFile(getCachePath(), 'utf-8');
    const cache = JSON.parse(content) as UpdateCheckCache;

    if (Date.now() - cache.lastCheck < CACHE_TTL_MS) {
      return cache;
    }
    return null; // expired
  } catch {
    return null;
  }
}

async function writeCache(latestVersion: string): Promise<void> {
  try {
    await ensureDir(path.dirname(getCachePath()));
    await fs.writeFile(getCachePath(), JSON.stringify({
      lastCheck: Date.now(),
      latestVersion,
    }));
  } catch {
    // Non-critical, ignore
  }
}

function compareVersions(current: string, latest: string): number {
  const a = current.split('.').map(Number);
  const b = latest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) < (b[i] || 0)) return -1;
    if ((a[i] || 0) > (b[i] || 0)) return 1;
  }
  return 0;
}

async function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), CHECK_TIMEOUT_MS);

    execFileAsync('npm', ['view', PACKAGE_NAME, 'version'])
      .then(({ stdout }) => {
        clearTimeout(timeout);
        resolve(stdout.trim());
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
}

export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
}

/**
 * Check if a newer version is available.
 * Returns quickly from cache if checked within 24h.
 * Times out after 5s if npm is unreachable.
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo> {
  const result: UpdateInfo = {
    updateAvailable: false,
    currentVersion,
    latestVersion: currentVersion,
  };

  try {
    // Try cache first
    const cached = await readCache();

    if (cached) {
      result.latestVersion = cached.latestVersion;
      result.updateAvailable = compareVersions(currentVersion, cached.latestVersion) < 0;
      return result;
    }

    // Fetch from npm
    const latest = await fetchLatestVersion();
    if (!latest) return result;

    await writeCache(latest);

    result.latestVersion = latest;
    result.updateAvailable = compareVersions(currentVersion, latest) < 0;
  } catch {
    // Non-critical, return no update
  }

  return result;
}

/**
 * Print update notification to stdout.
 */
export function printUpdateNotification(info: UpdateInfo): void {
  if (!info.updateAvailable) return;

  const line = '─'.repeat(50);
  console.log('');
  console.log(`  ${line}`);
  console.log(`  Update available: v${info.currentVersion} → v${info.latestVersion}`);
  console.log(`  Run: npm update -g ${PACKAGE_NAME}`);
  console.log(`  ${line}`);
  console.log('');
}

/**
 * Perform auto-update if user confirms.
 * Returns true if update was applied (caller should restart).
 */
export async function promptAutoUpdate(info: UpdateInfo): Promise<boolean> {
  if (!info.updateAvailable) return false;

  // Only prompt if stdin is a TTY (interactive)
  if (!process.stdin.isTTY) {
    printUpdateNotification(info);
    return false;
  }

  printUpdateNotification(info);

  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('  Update now? [Y/n]: ', async (answer: string) => {
      rl.close();

      if (answer === '' || answer.match(/^[Yy]/)) {
        console.log(`\n  Updating ${PACKAGE_NAME}...`);
        try {
          await execFileAsync('npm', ['install', '-g', `${PACKAGE_NAME}@latest`]);
          console.log('  Update successful! Restarting...\n');
          resolve(true);
        } catch (error) {
          console.error('  Update failed. Please update manually.');
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  });
}
