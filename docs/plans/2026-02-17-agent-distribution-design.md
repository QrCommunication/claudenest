# Agent Distribution Design

> Date: 2026-02-17
> Status: Approved

## Context

The `@claudenest/agent` package exists but has no public distribution mechanism. Users need a simple way to install the agent on their machines (Linux, macOS, Windows) to connect to a ClaudeNest server for remote orchestration.

## Decisions

- **Package name**: `@claudenest/agent` (npm org `claudenest`)
- **OS targets**: Linux, macOS, Windows (PowerShell separate)
- **Auto-update**: Check at startup, propose update, non-blocking

## Deliverables

### 1. `scripts/install-agent.sh` (Linux + macOS)

Curl-installable script that:
1. Detects OS (Linux/macOS/WSL)
2. Checks/installs Node.js 20+ via package manager or nvm
3. Installs build tools for node-pty (build-essential/Xcode CLI)
4. Runs `npm install -g @claudenest/agent`
5. Launches interactive `claudenest-agent pair`
6. Offers systemd/launchd service setup for auto-start

### 2. `scripts/install-agent.ps1` (Windows)

PowerShell script with equivalent flow using winget/nvm-windows.

### 3. `packages/agent/src/utils/update-checker.ts`

- On `claudenest-agent start`, compare local version vs `npm view`
- If newer version: display message, offer auto-update
- 5s timeout (non-blocking if offline)
- Cache check result for 24h (`~/.config/claudenest/update-check.json`)

### 4. `.github/workflows/agent-ci.yml` fixes

- Fix package name: `@claude-remote/agent` → `@claudenest/agent`

### 5. Landing page update

- Update install command on `Landing.vue` to reference `install-agent.sh`

## First npm publish (manual steps)

1. Create `claudenest` org on npmjs.com
2. Generate Automation npm token
3. Add `NPM_TOKEN` secret to GitHub repo settings
4. Push to main with version change → workflow auto-publishes
