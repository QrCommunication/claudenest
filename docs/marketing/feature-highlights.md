# Feature Highlights

## Remote Access

Control Claude Code from anywhere — browser or phone. The web dashboard delivers
a full xterm.js terminal with WebGL rendering, resize support, and search. The
native iOS and Android apps give you the same reach when you are away from a
desk. No SSH tunnels, no screen sessions, no workarounds.

## Machine Pairing

Pair a new machine in seconds. The agent generates a six-character code
(`XXX-XXX`). Enter it in the dashboard or mobile app and the machine is online.
Tokens are stored hashed and can be regenerated at any time.

## Multi-Agent Orchestration

Run multiple Claude instances on the same project simultaneously. Each agent
claims tasks atomically, locks the files it needs, and contributes to a shared
context store. No two agents can pick up the same task or write to the same file
at the same time. Coordination is built in, not bolted on.

## Smart File Locking

Lock acquisition is atomic. Locks auto-extend via heartbeat while a task is
active, and release automatically on task completion. Force-release is available
for stale locks. The system prevents race conditions without requiring agents to
poll or negotiate manually.

## Context RAG

Every shared project maintains a vector knowledge base powered by pgvector.
Context chunks are embedded at 384 dimensions using `bge-small-en-v1.5`. Agents
query it by semantic similarity — so the right context surfaces for each task,
regardless of how the project has grown. Summarization runs on Mistral 7B via
Ollama.

## Task Coordination

Tasks have priority levels, dependency chains, status tracking, and completion
summaries. Claiming is atomic: at most one agent can hold a task at a time.
Completed tasks record the files modified and a summary of the work done —
giving every subsequent agent a clear picture of what has already happened.

## Project Management

Built-in Epics, Sprints, and Kanban boards designed for multi-agent projects.
Each sprint has a start date, end date, velocity target, and a live burndown
chart. Epics group related tasks into named features with progress visible across
the board. Story points, velocity tracking, and completion events feed the
burndown automatically.

## Planning Agent

Describe what needs to be done in plain language. The Planning Agent reads the
full project context — summary, architecture, active tasks, current sprint — then
decomposes your request into structured tasks, assigns them to epics and sprints,
and executes every change inside an atomic database transaction. The project state
stays consistent even when multiple agents are running at the same time.

## Runner Agent

The Runner Agent works on a schedule without user interaction. It scans open
tasks for stale statuses, detects blocked items whose blockers have resolved,
recalculates sprint burndown, and posts structured health summaries to the
project activity log. Nothing falls through the cracks.

## Skills and MCP Servers

Discover, register, and toggle Claude Code skills per machine. Manage MCP (Model
Context Protocol) servers — start, stop, list tools, and execute them remotely
from the dashboard. Each machine maintains its own skill and MCP registry,
visible and editable from anywhere.

## Credential Management

Store Claude API keys and OAuth tokens encrypted at rest (AES-256-CBC). Mark one
credential as the default, or bind a specific credential to an individual
session. Token status tracking (active, expired, revoked) and one-click
validation keep credentials healthy without manual checks.

## Mobile Apps

Native iOS and Android apps built with React Native 0.83. Monitor machines,
open and manage sessions, view project boards, coordinate agent tasks, and
receive real-time updates — all from your phone. The same WebSocket connection
that powers the web dashboard powers the mobile app.

## Authentication

Magic link login for frictionless onboarding. OAuth via Google and GitHub for
teams that prefer it. Token-based API access for agents and integrations.
Laravel Sanctum handles token lifecycle; Socialite handles OAuth flows.
