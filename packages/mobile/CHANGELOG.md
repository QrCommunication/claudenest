# Changelog — ClaudeNest Mobile

All notable changes to the `@claude-remote/mobile` package will be documented in
this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Note: `android.versionCode` / `ios.buildNumber` are managed remotely by EAS
> (`appVersionSource: "remote"`, `autoIncrement: true` on the production profile),
> so only the user-facing `version` is bumped manually here.

## [Unreleased]

## [0.9.0] - 2026-06-16

### Added

- Server-driven worker orchestration on the `OrchestrationScreen`: start modal
  with `max_workers` (1-5), `permission_mode`, and coordinator toggle, plus
  individual worker spawn/terminate controls.
- `orchestratorStore` `spawnWorker` / `terminateWorker` actions backed by
  `orchestratorApi.spawnWorker` / `terminateWorker`.
- Epic decomposition flow on `DecomposeEpicScreen` (title + PRD + credential),
  with `epicsStore.decomposeEpic` action and `epicsApi.decompose`.
- Real-time epic decomposition listener (`websocket` subscription →
  `epicsStore` patch/refetch on `.epic.decomposition`).
- Token budget feature: `TokenBudgetPanel` component, `projectsStore`
  `fetchTokenBudget` action, `projectsApi.tokenBudget`, and a Tokens tab wired
  into the project navigation.
- `TokenBudget`, `DecomposeEpicForm` / `DecomposeEpicResponse`, and orchestrator
  request types in `types/index.ts`; `OrchestratorStartRequest` gains an optional
  `credential_id`.
- Epic archive fields (`archived_at`, `is_archived`, `pr_*`, `finalized_at`) on
  the `Epic` type for parity with the web contract.
- Unit tests for the persisted token-budget and epic-decompose stores
  (`stores/token-budget-epic-decompose.test.ts`).

### Changed

- `version` in `package.json` synced to `0.9.0` (was `0.8.0`, desynced from
  `app.json` which was `0.8.1`).

### Security

- Bumped `form-data` to `>=4.0.6` (HIGH) and `js-yaml` to `>=4.2.0` (MODERATE)
  via package overrides.

## [0.8.1] - 2026-06-14

### Added

- Runner Agent screen (project health, alerts, recommendations, auto-update sweep).
- Project Scan preview (name, tech stack, git) at project creation.
- Browse button (`FolderPickerModal`) in the project creation flow.
- Master-detail tablet layout for projects (list + inline detail on large screens).

### Changed

- Full accessibility pass: screen-reader labels/roles on all icon-only buttons
  (FAB, close, send, view toggle), multi-agent cards (Epic, Sprint, Task, Lock,
  Kanban), burndown chart, instance cards, project list, and OS design-system
  primitives (Dock, SegmentedControl, WindowFrame).

## [0.8.0]

### Added

- Initial multi-agent mobile surface: epics, sprints, tasks, file locks,
  credentials, MCP, and terminal screens with the OS-style design system.
