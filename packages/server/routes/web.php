<?php

use App\Http\Controllers\Web\DocumentationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| These routes serve the Vue.js SPA for all non-API routes.
*/

// Landing page (public) - serves Vue SPA
Route::get('/', function () {
    return view('app');
});

// API info endpoint (for health checks)
Route::get('/api-info', function () {
    return response()->json([
        'name' => 'ClaudeNest Server',
        'version' => config('claudenest.version', '1.0.0'),
        'status' => 'running',
        'docs' => '/docs',
    ]);
});

// OpenAPI specification
Route::get('/openapi.yaml', [DocumentationController::class, 'openapi']);

// OAuth callback handling (redirects to SPA with token)
Route::get('/auth/callback', function () {
    return view('app');
});

// Documentation pages are served by the SPA catch-all below: the Vue router
// owns the real /docs/* route map (installation, quickstart, api/:category,
// webhooks/*, sdks/:sdk, resources/*). Per-route meta is resolved from
// config/seo.php inside resources/views/app.blade.php.

// llms.txt — canonical project definition for AI crawlers (GEO).
Route::get('/llms.txt', function () {
    $base = rtrim(config('app.url'), '/');
    $github = config('seo.github_url');

    $content = <<<TXT
# ClaudeNest

> ClaudeNest is a self-hosted orchestration platform for Claude Code. It runs multiple Claude Code workers in parallel on the same repository and coordinates them through three mechanisms: atomic task claiming over an MCP server (20 tools), file locks enforced at edit time by Claude Code hooks, and a shared project memory backed by PostgreSQL pgvector. The server spawns interactive worker sessions, injects compiled project context at startup, and ingests each worker's completion summary back into memory — so later sessions inherit what earlier ones learned. A real-time board (epics, sprints, burndown) tracks every task over WebSockets, and iOS/Android apps (beta) expose the same terminals remotely. ClaudeNest is free to run on your own server under the PolyForm Noncommercial license; paid plans lift concurrency caps. It requires PostgreSQL with pgvector, Redis, and a Node.js agent on each machine.

Key facts:

- 20 MCP tools: 13 core (task claiming, file locks, context) + 7 planning (epics, sprints).
- 370+ automated tests (server suite + agent suite) cover the orchestration mechanisms.
- File locks are enforced at edit time by Claude Code hooks; if the agent cannot reach the server, hooks fail open (a worker is never bricked).
- Stack: Laravel + Reverb (WebSockets), PostgreSQL + pgvector, Redis, a Node.js agent per machine, Vue 3 dashboard.
- Workers run with your own Claude credentials (API key or OAuth), stored encrypted (AES-256) and isolated per session.
- License: PolyForm Noncommercial 1.0.0 — free for personal and internal use.

## Docs

- [Installation]({$base}/docs/installation): self-host the server and install the agent in about 15 minutes.
- [Quickstart]({$base}/docs/quickstart): create a shared project and spawn your first workers.
- [API reference]({$base}/docs/api/authentication): REST endpoints for machines, sessions, projects, tasks and planning.
- [WebSocket protocol]({$base}/docs/webhooks/websocket): real-time channels and events.
- [Authentication]({$base}/docs/authentication): bearer tokens, machine tokens, OAuth and MFA.

## Optional

- [Pricing]({$base}/pricing): free self-hosted Community plan, Pro \$29/mo, Enterprise.
- [Changelog]({$base}/changelog): release history.
- [Source on GitHub]({$github}): read every line before you run it.

TXT;

    return response($content, 200, [
        'Content-Type' => 'text/plain; charset=UTF-8',
    ]);
});

// Serve agent installer scripts (must be before SPA catch-all)
Route::get('/install-agent.sh', function () {
    $path = base_path('../../scripts/install-agent.sh');
    if (! file_exists($path)) {
        abort(404);
    }

    return response()->file($path, [
        'Content-Type' => 'text/plain; charset=utf-8',
    ]);
});

Route::get('/install-agent.ps1', function () {
    $path = base_path('../../scripts/install-agent.ps1');
    if (! file_exists($path)) {
        abort(404);
    }

    return response()->file($path, [
        'Content-Type' => 'text/plain; charset=utf-8',
    ]);
});

// OAuth popup completion page (before SPA catch-all)
Route::get('/oauth-complete', function () {
    return view('oauth-complete');
});

// Serve Vue SPA for all other routes (dashboard, login, etc.)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
