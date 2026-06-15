/**
 * Tests for machine token persistence (token-store).
 *
 * Regression: pairing on a headless host (WSL, container, bare SSH) failed with
 * "The name org.freedesktop.secrets was not provided by any .service files"
 * because keytar.setPassword threw and had no fallback. The token must instead
 * land in the config file (0600) when the OS keychain is unavailable.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

// JSON logs (no pino-pretty worker thread).
process.env.NODE_ENV = 'production';

const tmpRoot = path.join(os.tmpdir(), 'claudenest-token-store-test');

// getConfigDir() varies by OS — pin it to a tmp dir so the test is portable.
vi.mock('./index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./index.js')>();
  return { ...actual, getConfigDir: () => tmpRoot };
});

const keytarMock = vi.hoisted(() => ({
  setPassword: vi.fn(),
  getPassword: vi.fn(),
}));
vi.mock('keytar', () => ({ default: keytarMock }));

import { storeMachineToken, readMachineToken } from './token-store.js';

const configPath = path.join(tmpRoot, 'config.json');

async function readConfigFile(): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

describe('token-store', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.CLAUDENEST_TOKEN;
    await fs.rm(tmpRoot, { recursive: true, force: true });
    keytarMock.setPassword.mockResolvedValue(undefined);
    keytarMock.getPassword.mockResolvedValue(null);
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  describe('storeMachineToken', () => {
    it('stores in the OS keychain when available, leaving no file', async () => {
      await storeMachineToken('mn_secret');

      expect(keytarMock.setPassword).toHaveBeenCalledWith(
        'ClaudeNestAgent',
        'machine-token',
        'mn_secret',
      );
      expect(await readConfigFile()).toBeNull();
    });

    it('falls back to the config file when the keychain is unavailable', async () => {
      keytarMock.setPassword.mockRejectedValue(
        new Error('The name org.freedesktop.secrets was not provided by any .service files'),
      );

      await storeMachineToken('mn_secret');

      expect(await readConfigFile()).toEqual({ machineToken: 'mn_secret' });
    });

    it('writes the fallback file with 0600 permissions', async () => {
      keytarMock.setPassword.mockRejectedValue(new Error('no secret service'));

      await storeMachineToken('mn_secret');

      // chmod is a no-op on Windows (NTFS ACLs) — only assert on POSIX.
      if (process.platform !== 'win32') {
        const stat = await fs.stat(configPath);
        expect(stat.mode & 0o777).toBe(0o600);
      }
    });

    it('preserves other config keys when falling back to the file', async () => {
      await fs.mkdir(tmpRoot, { recursive: true });
      await fs.writeFile(
        configPath,
        JSON.stringify({ serverUrl: 'https://api.claudenest.io' }),
      );
      keytarMock.setPassword.mockRejectedValue(new Error('no secret service'));

      await storeMachineToken('mn_secret');

      expect(await readConfigFile()).toEqual({
        serverUrl: 'https://api.claudenest.io',
        machineToken: 'mn_secret',
      });
    });
  });

  describe('readMachineToken', () => {
    it('returns the keychain token first', async () => {
      keytarMock.getPassword.mockResolvedValue('mn_from_keychain');
      process.env.CLAUDENEST_TOKEN = 'mn_from_env';

      expect(await readMachineToken()).toBe('mn_from_keychain');
    });

    it('falls back to CLAUDENEST_TOKEN when the keychain is unavailable', async () => {
      keytarMock.getPassword.mockRejectedValue(new Error('no secret service'));
      process.env.CLAUDENEST_TOKEN = 'mn_from_env';

      expect(await readMachineToken()).toBe('mn_from_env');
    });

    it('falls back to the config file when keychain and env are absent', async () => {
      keytarMock.getPassword.mockRejectedValue(new Error('no secret service'));
      await fs.mkdir(tmpRoot, { recursive: true });
      await fs.writeFile(configPath, JSON.stringify({ machineToken: 'mn_from_file' }));

      expect(await readMachineToken()).toBe('mn_from_file');
    });

    it('returns null when no token exists anywhere', async () => {
      keytarMock.getPassword.mockRejectedValue(new Error('no secret service'));

      expect(await readMachineToken()).toBeNull();
    });
  });

  it('round-trips through the file fallback when the keychain is unavailable', async () => {
    keytarMock.setPassword.mockRejectedValue(new Error('no secret service'));
    keytarMock.getPassword.mockRejectedValue(new Error('no secret service'));

    await storeMachineToken('mn_roundtrip');

    expect(await readMachineToken()).toBe('mn_roundtrip');
  });
});
