/**
 * Cross-platform service installation for the ClaudeNest Agent.
 *
 * Lets the agent auto-start and survive reboots without a terminal:
 *   - Linux  → systemd user unit (no root; `loginctl enable-linger` for headless)
 *   - macOS  → launchd LaunchAgent
 *   - Windows→ Scheduled Task (ONLOGON)
 *
 * The agent's `start` command runs in the foreground (its open WebSocket and
 * timers keep the event loop alive), which is exactly what a service manager
 * expects for ExecStart — no daemonization needed.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

export const SERVICE_LABEL = 'claudenest-agent';
const LAUNCHD_LABEL = 'io.claudenest.agent';

export interface ServiceOptions {
  /** Server URL baked into the unit (defaults to config/`DEFAULT`). */
  serverUrl: string;
  /** Machine token to expose to the headless service (Linux/macOS). */
  token?: string | null;
  /** Linux only: install a system-wide unit (requires root) instead of --user. */
  system?: boolean;
  /** Optional explicit log level for the service. */
  logLevel?: string;
}

interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

function run(cmd: string, args: string[]): RunResult {
  const res = spawnSync(cmd, args, { encoding: 'utf-8' });
  return {
    ok: res.status === 0,
    stdout: (res.stdout ?? '').trim(),
    stderr: (res.stderr ?? res.error?.message ?? '').trim(),
  };
}

/** Absolute path to the agent's CLI entry (dist/index.js), resolved at runtime. */
function resolveEntryScript(): string {
  // installer.js lives at dist/service/installer.js → entry is dist/index.js
  return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.js');
}

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  return xdg ? path.join(xdg, 'claudenest') : path.join(os.homedir(), '.config', 'claudenest');
}

function logDir(): string {
  const xdg = process.env.XDG_CACHE_HOME;
  return xdg ? path.join(xdg, 'claudenest') : path.join(os.homedir(), '.cache', 'claudenest');
}

// ── Public API ──────────────────────────────────────

export function installService(opts: ServiceOptions): void {
  switch (process.platform) {
    case 'linux':
      return installSystemd(opts);
    case 'darwin':
      return installLaunchd(opts);
    case 'win32':
      return installWindows(opts);
    default:
      throw new Error(`Service install unsupported on platform: ${process.platform}`);
  }
}

export function startService(): void {
  switch (process.platform) {
    case 'linux':
      report(run('systemctl', ['--user', 'start', `${SERVICE_LABEL}.service`]), 'started');
      return;
    case 'darwin':
      report(run('launchctl', ['start', LAUNCHD_LABEL]), 'started');
      return;
    case 'win32':
      report(run('schtasks', ['/Run', '/TN', SERVICE_LABEL]), 'started');
      return;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function stopService(): void {
  switch (process.platform) {
    case 'linux':
      report(run('systemctl', ['--user', 'stop', `${SERVICE_LABEL}.service`]), 'stopped');
      return;
    case 'darwin':
      report(run('launchctl', ['stop', LAUNCHD_LABEL]), 'stopped');
      return;
    case 'win32':
      report(run('schtasks', ['/End', '/TN', SERVICE_LABEL]), 'stopped');
      return;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function uninstallService(): void {
  switch (process.platform) {
    case 'linux': {
      run('systemctl', ['--user', 'disable', '--now', `${SERVICE_LABEL}.service`]);
      safeUnlink(systemdUnitPath(false));
      run('systemctl', ['--user', 'daemon-reload']);
      console.log('✓ Service uninstalled');
      return;
    }
    case 'darwin': {
      const plist = launchdPlistPath();
      run('launchctl', ['unload', '-w', plist]);
      safeUnlink(plist);
      console.log('✓ Service uninstalled');
      return;
    }
    case 'win32':
      report(run('schtasks', ['/Delete', '/TN', SERVICE_LABEL, '/F']), 'uninstalled');
      return;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function serviceStatus(): void {
  switch (process.platform) {
    case 'linux': {
      const r = run('systemctl', ['--user', 'is-active', `${SERVICE_LABEL}.service`]);
      console.log(`Service: ${r.stdout || 'unknown'}`);
      run('systemctl', ['--user', '--no-pager', 'status', `${SERVICE_LABEL}.service`]);
      return;
    }
    case 'darwin':
      console.log(run('launchctl', ['list', LAUNCHD_LABEL]).stdout || 'not loaded');
      return;
    case 'win32':
      console.log(run('schtasks', ['/Query', '/TN', SERVICE_LABEL, '/V', '/FO', 'LIST']).stdout || 'not found');
      return;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

// ── Linux (systemd) ─────────────────────────────────

function systemdUnitPath(system: boolean): string {
  if (system) return path.join('/etc/systemd/system', `${SERVICE_LABEL}.service`);
  const unitDir = path.join(os.homedir(), '.config', 'systemd', 'user');
  return path.join(unitDir, `${SERVICE_LABEL}.service`);
}

function installSystemd(opts: ServiceOptions): void {
  const node = process.execPath;
  const script = resolveEntryScript();
  const envFile = writeEnvFile(opts);
  const unitPath = systemdUnitPath(Boolean(opts.system));
  fs.mkdirSync(path.dirname(unitPath), { recursive: true });

  const userLine = opts.system ? `User=${os.userInfo().username}\n` : '';
  const wantedBy = opts.system ? 'multi-user.target' : 'default.target';

  const unit = `[Unit]
Description=ClaudeNest Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
${userLine}ExecStart=${node} ${script} start --server ${opts.serverUrl}
EnvironmentFile=${envFile}
WorkingDirectory=${os.homedir()}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=${wantedBy}
`;

  fs.writeFileSync(unitPath, unit, { mode: 0o644 });
  console.log(`✓ Wrote ${unitPath}`);

  const scope = opts.system ? [] : ['--user'];
  run('systemctl', [...scope, 'daemon-reload']);
  const enable = run('systemctl', [...scope, 'enable', '--now', `${SERVICE_LABEL}.service`]);
  report(enable, 'installed & started');

  if (!opts.system) {
    const linger = run('loginctl', ['enable-linger', os.userInfo().username]);
    if (!linger.ok) {
      console.log(
        '⚠ Could not enable linger (service stops at logout). Run manually:\n' +
          `    sudo loginctl enable-linger ${os.userInfo().username}`,
      );
    }
  }
}

// ── macOS (launchd) ─────────────────────────────────

function launchdPlistPath(): string {
  return path.join(os.homedir(), 'Library', 'LaunchAgents', `${LAUNCHD_LABEL}.plist`);
}

function installLaunchd(opts: ServiceOptions): void {
  const node = process.execPath;
  const script = resolveEntryScript();
  const plistPath = launchdPlistPath();
  fs.mkdirSync(path.dirname(plistPath), { recursive: true });

  const outLog = path.join(logDir(), 'agent.out.log');
  const errLog = path.join(logDir(), 'agent.err.log');
  fs.mkdirSync(logDir(), { recursive: true });

  const tokenEnv = opts.token
    ? `    <key>CLAUDENEST_TOKEN</key>\n    <string>${escapeXml(opts.token)}</string>\n`
    : '';

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${node}</string>
    <string>${script}</string>
    <string>start</string>
    <string>--server</string>
    <string>${escapeXml(opts.serverUrl)}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${outLog}</string>
  <key>StandardErrorPath</key>
  <string>${errLog}</string>
  <key>EnvironmentVariables</key>
  <dict>
${tokenEnv}  </dict>
</dict>
</plist>
`;

  fs.writeFileSync(plistPath, plist, { mode: 0o644 });
  console.log(`✓ Wrote ${plistPath}`);

  run('launchctl', ['unload', plistPath]); // idempotent: clear any prior load
  report(run('launchctl', ['load', '-w', plistPath]), 'installed & started');
}

// ── Windows (Scheduled Task) ────────────────────────

function installWindows(opts: ServiceOptions): void {
  const node = process.execPath;
  const script = resolveEntryScript();
  const tr = `"${node}" "${script}" start --server ${opts.serverUrl}`;

  const create = run('schtasks', [
    '/Create',
    '/TN', SERVICE_LABEL,
    '/SC', 'ONLOGON',
    '/RL', 'HIGHEST',
    '/TR', tr,
    '/F',
  ]);
  report(create, 'installed');
  if (create.ok) {
    run('schtasks', ['/Run', '/TN', SERVICE_LABEL]);
    console.log('✓ Service started (will auto-start on logon)');
  }
}

// ── Helpers ─────────────────────────────────────────

/** Write a 0600 EnvironmentFile so the headless service gets the token. */
function writeEnvFile(opts: ServiceOptions): string {
  const dir = configDir();
  fs.mkdirSync(dir, { recursive: true });
  const envPath = path.join(dir, 'agent.env');
  const lines = [`CLAUDENEST_SERVER_URL=${opts.serverUrl}`];
  if (opts.token) lines.push(`CLAUDENEST_TOKEN=${opts.token}`);
  if (opts.logLevel) lines.push(`CLAUDENEST_LOG_LEVEL=${opts.logLevel}`);
  fs.writeFileSync(envPath, lines.join('\n') + '\n', { mode: 0o600 });
  return envPath;
}

function safeUnlink(file: string): void {
  try {
    fs.unlinkSync(file);
  } catch {
    // already gone
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function report(r: RunResult, verb: string): void {
  if (r.ok) {
    console.log(`✓ Service ${verb}`);
  } else {
    console.error(`✗ Failed to ${verb}: ${r.stderr || 'unknown error'}`);
    process.exitCode = 1;
  }
}
