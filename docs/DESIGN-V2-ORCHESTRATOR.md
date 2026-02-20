# ClaudeNest v2 — Design Document: Orchestrator Infrastructure

> **Status**: Approved
> **Date**: 2026-02-19
> **Scope**: Fix credentials, agent sync, orchestrator multi-agent

---

## Understanding Summary

- **What**: Fix credentials (400 errors, OAuth capture, edit modal), auto-sync agent data (skills/MCP/commands), full orchestrator infrastructure with RAG real-time and auto-scaling workers
- **Why**: Agent is a passive terminal relay — needs to become orchestrator-aware participant in multi-agent system
- **Who**: Developers orchestrating multiple Claude Code instances on a project
- **Constraints**: Ollama local, pgvector, tmux sessions, Node 20 agent, Laravel 11 server
- **Non-goals**: Multi-orchestrator cross-projects, external embedding API, full UI redesign

## Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Orchestrator model | Hybrid Laravel + Agent | Laravel = coordination brain, Agent = execution arm |
| RAG update trigger | File watcher (chokidar) | Real-time, debounced, cross-platform |
| Parallelism | Auto-scaling workers | Dynamic based on pending task count |
| Embedding generation | Async queue jobs (Laravel) | Non-blocking, retry with backoff |
| Task claiming | Atomic SQL (lockForUpdate) | Prevents race conditions |
| Agent sync method | REST bulk upsert on connect | HTTP acknowledgment, idempotent |
| OAuth capture | Agent-side via WebSocket | Secure, no server path traversal |

## Phase A: Fix Foundation

### A1. Atomic Task Claiming
- Replace `SharedTask::claim()` with single UPDATE + `lockForUpdate()`
- Add `claimNextAvailable()` static method with priority ordering
- New endpoint: `POST /projects/{id}/tasks/claim-next`

### A2. Fix dependencies Column
- Migration: uuid -> jsonb with default '[]'
- Fix `scopeReadyToStart()` to use `whereJsonLength`

### A3. Unify Embedding Model
- Centralize config in `config/claudenest.php`
- Inject `EmbeddingService` + `ContextRAGService` into `ContextController`
- Remove inline Ollama calls from controller

### A4. Transactional bulkLock
- Wrap in `DB::transaction()`, full rollback on any failure

### A5. Fix Router
- Move `/sessions/new` before `/sessions/:id` in Vue Router

### A6. Fix Skill Path Uniqueness
- Migration: drop global unique, add composite `(machine_id, path)`

## Phase B: Agent Sync + Credentials

### B1-B4. Agent Auto-Sync
- New `RestApiClient` (Node 20 native fetch)
- New `SyncService`: full sync on connect, chokidar watch for changes
- New endpoints: `/skills/sync`, `/mcp/sync`, `/mcp/{name}/status`
- Fix MCP message type alignment

### B5-B8. Credentials Fix
- OAuth capture via agent WebSocket (not server filesystem)
- New `EditCredentialModal.vue`
- Real OAuth token validation via Anthropic API
- Theme CSS variable overrides for light mode

## Phase C: Orchestrator Integration

### C1-C3. Instance Lifecycle
- New `InstanceController` (register/heartbeat/disconnect)
- Scheduled `instances:cleanup` every minute
- Agent heartbeat every 30s

### C4. Context Injection
- `compileContext()` called on session start if project-linked
- Migration: add `initial_context` + `project_id` to sessions

### C5-C7. File Watcher + RAG
- `FileWatcher` with chokidar (debounce 500ms, batch 2s)
- `ProcessFileChange` job: upsert context chunk with embedding
- `GenerateEmbedding` job: async on `embeddings` queue

## Phase D: Multi-Agent Orchestrator

### D1-D3. Orchestrator Core
- `Orchestrator.ts`: assess workload, spawn tmux workers, assign tasks
- Auto-scaling formula: 1-3 tasks=1 worker, 4-8=2, 9+=ceil(n/3)
- Worker lifecycle: spawn -> claim-next -> execute -> complete/exit

### D4-D5. Control & Communication
- WS handlers: `orchestrator:start/stop/status`
- Atomic `claimNext()` endpoint for workers

## New Files (14)

| File | Purpose |
|------|---------|
| `server/database/migrations/..._fix_shared_tasks_dependencies.php` | Fix column type |
| `server/database/migrations/..._add_initial_context_to_sessions.php` | Context injection |
| `server/database/migrations/..._fix_skills_path_uniqueness.php` | Composite unique |
| `server/app/Http/Controllers/Api/InstanceController.php` | Instance lifecycle |
| `server/app/Console/Commands/CleanupStaleInstances.php` | Stale cleanup |
| `server/app/Jobs/ProcessFileChange.php` | File change processing |
| `server/app/Jobs/GenerateEmbedding.php` | Async embedding |
| `server/resources/js/pages/credentials/EditCredentialModal.vue` | Edit credential UI |
| `agent/src/api/client.ts` | REST API client |
| `agent/src/sync/service.ts` | Auto-sync service |
| `agent/src/watcher/FileWatcher.ts` | File watcher |
| `agent/src/handlers/credential-handler.ts` | OAuth capture handler |
| `agent/src/orchestrator/Orchestrator.ts` | Multi-worker orchestrator |
| Barrel exports (4 index.ts files) | Module exports |

## Modified Files (~25)

Key modifications across SharedTask, TaskController, ContextController, FileLockController, SessionController, SkillsController, MCPController, CredentialController, EmbeddingService, ContextRAGService, agent.ts, session-handler.ts, config-handler.ts, types/index.ts, router/index.ts, credentials store, CredentialCard, Settings.vue, api.php, package.json.
