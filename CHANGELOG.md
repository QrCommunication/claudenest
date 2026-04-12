# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-12

### Added

- Project management system with Epics, Sprints, and subtasks hierarchy
- Planning Agent for conversational project planning with 8 action types
- Runner Agent for automated project health monitoring and status updates
- BurndownChart component (SVG pure, no external dependencies)
- PlanningChat sidebar for real-time agent interaction
- Sprint board with velocity tracking and progress ring
- Epic board with color-coded progress tracking
- Batch file lock conflict detection endpoint (`POST /locks/conflicts`)
- Heartbeat auto-extend for file locks
- Task-lock integration (auto-lock on claim, auto-release on complete)
- `useAsyncAction` composable for store error-handling deduplication
- API Resources: `TaskResource`, `SessionResource`, `ProjectResource`, `InstanceResource`

### Changed

- `FileLock::acquire()` now uses `DB::transaction` + `lockForUpdate` for atomic acquisition
- `SharedTask` enriched with `parent_id`, `epic_id`, `sprint_id`, `story_points`, `labels`
- KanbanBoard enhanced with epic and sprint filters
- Project `Show.vue` page now has 8 tabs including Epics, Sprints, and Planning Chat
- Agent install script includes `DBUS_SESSION_BUS_ADDRESS` for systemd/keytar compatibility

### Fixed

- Race condition in file lock acquisition (two instances could lock the same file simultaneously)
- `AuthorizesRequests` trait missing from base `Controller` class (Laravel 11)
- `projects.new` route missing from `router/index.ts`
- Invalid Tailwind class `placeholder-skin-secondary` replaced with `placeholder:` modifier (9 occurrences)
- `Sprint::getTotalStoryPointsAttribute` calculating from wrong column
- `SprintController::store` returning non-standard response format
- Extra closing `</div>` breaking Vue template parsing in `Show.vue`

### Removed

- Orphan `router.ts` file (354 lines, duplicate of `router/index.ts`)
- Dead pages `Sessions.vue` and `Tasks.vue` (615 lines total)
- Duplicate `errorResponse()` helper removed from 7 controllers (centralized)
- Duplicate scope `scopeCurrent` (identical to `scopeActive`)

## [1.1.0] - 2026-04-11

### Added

- Public landing page with hero section, feature highlights, and social proof
- Pricing page with plan comparison
- Documentation layout with sidebar navigation and component library
- Changelog public page
- Full FR/EN internationalization for auth pages (login, register)

### Changed

- Application layout refactored to IDE-style with collapsible sidebar, tab bar, and status bar
- Public pages isolated from authenticated app layout

## [1.0.0] - 2026-03-09

### Added

**Authorization & Security**

- 7 authorization policies with complete model coverage: `MachinePolicy`, `SessionPolicy`, `SkillPolicy`, `MCPServerPolicy`, `CommandPolicy`, `FileLockPolicy`, `SharedTaskPolicy`
- `CommandPolicy` registered for `DiscoveredCommand` with `execute` ability
- `LogApiRequests` middleware — logs method, URL, IP, user agent, response status, duration, user ID, and request ID
- Global error handler with standardized API responses (error codes, HTTP status, request IDs, production-safe messages)

**Testing Infrastructure**

- 98 PHPUnit test cases across 11 test files (6 Feature suites, 3 Unit suites)
- `TestCase` base class with shared helper methods
- 6 model factories: `UserFactory`, `MachineFactory`, `SessionFactory`, `SharedProjectFactory`, `SharedTaskFactory`, `FileLockFactory`
- 28 Vitest test cases across 3 test files (Modal component, `useApi` composable, auth store)
- Vitest configuration with jsdom, Vue Test Utils, and global mocks (localStorage, matchMedia, fetch)

**Database & Demo Data**

- `DemoSeeder` with production-quality demo data: demo user, 2 machines, 1 e-commerce project, 7 context chunks, 5 tasks, 2 Claude instances, 2 sessions, 3 skills, 2 MCP servers, 5 discovered commands
- `EmbeddingService::generateBatch()` method with `normalize` parameter

**Frontend Resilience**

- WebSocket reconnection with exponential backoff (1s → 2s → 4s → 8s → 16s → 30s max, 5 attempts)
- API retry logic with exponential backoff (max 3 retries, on HTTP 408/429/500/502/503/504)

### Changed

- Error response format standardized across all API endpoints (`success`, `error.code`, `error.message`, `meta.timestamp`, `meta.request_id`)
- 8 controllers updated with policy authorization replacing manual ownership checks: `MachineController`, `SessionController`, `ProjectController`, `TaskController`, `FileLockController`, `SkillsController`, `MCPController`, `CommandsController`
- `.env.example` updated: DB driver switched to PostgreSQL (`pgsql`, port `5432`), Ollama models updated to `mistral` and `nomic-embed-text`, embedding dimensions set to 768
- WebSocket service refactored with named constants replacing magic numbers
- `useTheme` composable refactored to singleton pattern with reference counting to prevent duplicate media query listeners

### Fixed

- `Modal` component: escape key listener leak fixed with proper `onUnmounted` cleanup
- `useTheme` composable: media query listener leak fixed
- `useToast` composable: timeout leak fixed with `Map`-based tracking and `clearAll()` method
- All `any` types removed from frontend — replaced with `unknown` and `instanceof Error` checks
- 403 error message changed from "Forbidden" to a human-readable message
- Axios response interceptor guarded against undefined `error.config`
- `Modal.spec.ts` mounting actual `Modal.vue` instead of inline mock
- `useTheme.ts` singleton `mediaQuery` with ref counting
- WebSocket `terminalReconnectAttempts` and `terminalReconnectTimer` fields restored after cleanup
- `SharedTaskPolicy` renamed from `TaskPolicy` with `claim`, `release`, and `complete` abilities

### Removed

- 398 lines of redundant manual ownership checks replaced by policy authorization

## [0.3.0] - 2026-02-16

### Added

- User roles system
- Complete RAG pipeline with reranker (pgvector + `bge-small-en-v1.5`)
- Internationalization for auth pages via vue-i18n

### Changed

- Authentication flow and navigation refactored for clarity
- Dashboard view improved with deployment status indicators

## [0.2.0] - 2026-02-04

### Added

- Complete ClaudeNest platform initial implementation
- Laravel 11 backend with PostgreSQL + pgvector
- Vue.js 3 web dashboard with xterm.js terminal
- React Native mobile app (iOS & Android)
- Node.js agent with node-pty for PTY management
- Real-time WebSocket communication via Laravel Reverb
- Multi-agent system: shared projects, context chunks, task coordination, file locking
- Context RAG with 384-dimensional vector embeddings
- MCP (Model Context Protocol) server management
- Credential management with AES-256-CBC encryption
- Dark/light theme system with CSS variables
- Full FR/EN internationalization

### Fixed

- Laravel 11 compatibility issues
- TypeScript duplicate type errors

## [0.1.0] - 2026-01-01

### Added

- Initial project structure and monorepo setup (`packages/server`, `packages/agent`, `packages/mobile`)
- LICENSE file and README with project documentation
- Domain infrastructure documentation
- `.gitignore` and `deploy.sh` baseline

[Unreleased]: https://github.com/QrCommunication/claudenest/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/QrCommunication/claudenest/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/QrCommunication/claudenest/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/QrCommunication/claudenest/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/QrCommunication/claudenest/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/QrCommunication/claudenest/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/QrCommunication/claudenest/releases/tag/v0.1.0
