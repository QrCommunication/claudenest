# Agent Distribution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable one-command installation of the ClaudeNest agent on client machines with auto-update and CI/CD publishing.

**Architecture:** Shell script installer (Linux/macOS) + PowerShell (Windows) + npm publish workflow + startup update-checker.

**Tech Stack:** Bash, PowerShell, Node.js, GitHub Actions, npm registry

---

### Task 1: Create install-agent.sh (Linux + macOS)

**Files:**
- Create: `scripts/install-agent.sh`

### Task 2: Create install-agent.ps1 (Windows)

**Files:**
- Create: `scripts/install-agent.ps1`

### Task 3: Create update-checker module

**Files:**
- Create: `packages/agent/src/utils/update-checker.ts`
- Modify: `packages/agent/src/index.ts` (add update check to handleStart)

### Task 4: Fix agent-ci.yml package name

**Files:**
- Modify: `.github/workflows/agent-ci.yml:184` (change @claude-remote/agent to @claudenest/agent)

### Task 5: Update Landing.vue install command

**Files:**
- Modify: `packages/server/resources/js/pages/Landing.vue:283,444`

### Task 6: Commit all changes
