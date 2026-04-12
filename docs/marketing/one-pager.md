# ClaudeNest — Remote Claude Code Orchestration

## The Problem

Developers using Claude Code are limited to local terminals. No remote access, no
multi-agent coordination, no shared project visibility. Every session lives and
dies on one machine. Scaling means opening more tabs, not running smarter.

## The Solution

ClaudeNest is a remote orchestration platform that turns Claude Code into a
team-ready, multi-agent system you control from anywhere.

- Control Claude Code instances from a web dashboard or native mobile app
- Run multiple AI agents on the same project with a shared knowledge base
- Plan and track work with built-in Epics, Sprints, and Kanban boards
- Prevent file conflicts with atomic, heartbeat-extended file locking
- Query project knowledge instantly with RAG-powered semantic search

## Key Numbers

| Metric | Value |
|--------|-------|
| WebSocket latency | < 100 ms |
| Concurrent Claude instances per machine | 10+ |
| Context vector dimensions (bge-small-en-v1.5) | 384 |
| Lock heartbeat auto-extend | yes — tied to active tasks |
| Supported platforms | Web, iOS, Android |
| Auth methods | Magic link, Google OAuth, GitHub OAuth |

## How It Works

1. **Install the agent** on any machine — one command, no config required.
2. **Pair the machine** with a six-character code (`XXX-XXX`) in the dashboard.
3. **Create sessions** and open terminals from the web or your phone.
4. **Add agents** to a shared project. They coordinate tasks, lock files, and
   share context automatically — no manual handoff.
5. **Track progress** with the Planning Agent (decomposes tasks through
   conversation) and the Runner Agent (monitors sprints, flags blockers, posts
   health summaries).

## Tech Foundation

Laravel 12 backend, Vue 3 web dashboard, React Native mobile apps, PostgreSQL
with pgvector, Redis, and Laravel Reverb for real-time WebSocket communication.
Self-hostable. Open architecture.

## Get Started

```bash
# Install the agent on your machine
curl -fsSL https://claudenest.io/install-agent.sh | bash

# Or clone and run locally
git clone https://github.com/QrCommunication/claudenest.git
cd claudenest && cp packages/server/.env.example packages/server/.env
docker compose up -d
docker compose exec server php artisan migrate
```

Full documentation: [docs/](../) — Docker guide, bare-metal setup, API reference.
