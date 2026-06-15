/**
 * Machine token persistence.
 *
 * The token is stored in the OS keychain when one is available, but headless
 * environments (WSL, containers, bare SSH servers) have no Secret Service —
 * keytar throws "The name org.freedesktop.secrets was not provided by any
 * .service files". In that case we fall back to the agent config file, written
 * with 0600 permissions (owner read/write only), matching how `gh`, `docker`
 * and `aws` persist credentials on disk.
 *
 * Read priority: OS keychain → CLAUDENEST_TOKEN env var → config file fallback.
 */
import fs from 'fs/promises';
import path from 'path';
import keytar from 'keytar';
import { getConfigDir, ensureDir } from './index.js';
import { createLogger, getLogLevelFromEnv } from './logger.js';

const SERVICE_NAME = 'ClaudeNestAgent';
const KEYCHAIN_ACCOUNT = 'machine-token';
const CONFIG_KEY = 'machineToken';

const logger = createLogger(getLogLevelFromEnv());

function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

/** Persist the machine token, preferring the OS keychain, file fallback otherwise. */
export async function storeMachineToken(token: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, KEYCHAIN_ACCOUNT, token);
    logger.info({}, 'Token stored in OS keychain.');
    return;
  } catch (error) {
    logger.warn(
      { err: error },
      'OS keychain unavailable (no Secret Service); falling back to config file.',
    );
  }

  const configPath = getConfigPath();

  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  } catch {
    // File missing or invalid — start fresh.
  }

  config[CONFIG_KEY] = token;

  await ensureDir(getConfigDir());

  // The file now holds a secret — restrict it to the owner (0600).
  // `mode` applies atomically at creation (no world-readable window), but is
  // ignored when the file already exists, so chmod afterwards covers that case.
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

  // Best-effort: chmod is a no-op on Windows / unusual filesystems.
  try {
    await fs.chmod(configPath, 0o600);
  } catch {
    // ignore
  }

  logger.info({}, 'Token stored in config file (0600).');
}

/** Resolve the machine token from keychain, then env var, then config file. */
export async function readMachineToken(): Promise<string | null> {
  try {
    const fromKeychain = await keytar.getPassword(SERVICE_NAME, KEYCHAIN_ACCOUNT);
    if (fromKeychain) return fromKeychain;
  } catch {
    // Keychain not available — continue to other sources.
  }

  if (process.env.CLAUDENEST_TOKEN) return process.env.CLAUDENEST_TOKEN;

  try {
    const config = JSON.parse(await fs.readFile(getConfigPath(), 'utf-8')) as Record<string, unknown>;
    const value = config[CONFIG_KEY];
    return typeof value === 'string' && value ? value : null;
  } catch {
    return null;
  }
}
