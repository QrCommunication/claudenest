<?php

/*
|--------------------------------------------------------------------------
| SEO / GEO metadata for public routes
|--------------------------------------------------------------------------
|
| Consumed by resources/views/app.blade.php, which resolves the entry whose
| path is the LONGEST prefix match for the current request path. The '/'
| entry only matches the landing page exactly. Paths absent from this map
| are private app routes: they fall back to `defaults` and are emitted
| with a `noindex, nofollow` robots meta (they are also disallowed in
| public/robots.txt).
|
| Conventions:
| - `title`        <= 60 characters
| - `description`  <= 155 characters
| - `og_type`      'website' or 'article'
| - `updated`      YYYY-MM-DD — feeds TechArticle dateModified on /docs/*.
|                  Bump it whenever the page content materially changes.
|
| This file contains plain arrays only (config:cache safe).
*/

return [

    'site_name' => 'ClaudeNest',
    'version' => '1.5.0',
    'github_url' => 'https://github.com/QrCommunication/claudenest',
    'license_url' => 'https://polyformproject.org/licenses/noncommercial/1.0.0/',
    'og_image' => '/og-image.png',

    'defaults' => [
        'title' => 'ClaudeNest — Orchestrate Parallel Claude Code Workers',
        'description' => 'Self-hosted orchestration for Claude Code: parallel workers, MCP task claiming, edit-time file locks, shared project memory. Free on your own server.',
        'og_type' => 'website',
        'updated' => '2026-06-12',
    ],

    'routes' => [

        '/' => [
            'title' => 'ClaudeNest — Orchestrate Parallel Claude Code Workers',
            'description' => 'Self-hosted orchestration for Claude Code: parallel workers, MCP task claiming, edit-time file locks, shared project memory. Free on your own server.',
            'og_type' => 'website',
            'updated' => '2026-06-12',
        ],

        '/pricing' => [
            'title' => 'ClaudeNest Pricing — Free Self-Hosted, Pro $29/mo',
            'description' => 'ClaudeNest is free to self-host with 3 concurrent workers. Pro lifts caps to 20 workers and unlimited projects. Enterprise for custom scale.',
            'og_type' => 'website',
            'updated' => '2026-06-12',
        ],

        '/changelog' => [
            'title' => 'ClaudeNest Changelog — Releases & Updates',
            'description' => 'Every ClaudeNest release: orchestration, MCP tools, file locking, planning sessions and mobile apps. Latest: v1.5.0, June 2026.',
            'og_type' => 'website',
            'updated' => '2026-06-12',
        ],

        '/docs' => [
            'title' => 'ClaudeNest Documentation — Install, API & MCP Tools',
            'description' => 'Install ClaudeNest, pair machines, spawn Claude Code workers, and integrate the REST API, WebSocket events and 20 MCP tools.',
            'og_type' => 'article',
            'updated' => '2026-06-12',
        ],

        '/docs/installation' => [
            'title' => 'Install ClaudeNest — Self-Host in 15 Minutes',
            'description' => 'Step-by-step install guide: server requirements (PostgreSQL + pgvector, Redis), the one-command agent install, and pairing your first machine.',
            'og_type' => 'article',
            'updated' => '2026-06-12',
        ],

        '/docs/quickstart' => [
            'title' => 'ClaudeNest Quickstart — First Project & Workers',
            'description' => 'From a paired machine to a running project: create a shared project, add tasks, spawn Claude Code workers and watch the live board move.',
            'og_type' => 'article',
            'updated' => '2026-04-12',
        ],

        '/docs/authentication' => [
            'title' => 'Authentication — ClaudeNest API Documentation',
            'description' => 'Authenticate against the ClaudeNest API: bearer tokens, machine tokens, OAuth login and MFA — with curl and SDK examples.',
            'og_type' => 'article',
            'updated' => '2026-04-12',
        ],

        '/docs/api' => [
            'title' => 'API Reference — ClaudeNest Documentation',
            'description' => 'REST API reference: machines, sessions, projects, tasks, epics, sprints, context, file locks, MCP, planning and runner endpoints.',
            'og_type' => 'article',
            'updated' => '2026-04-12',
        ],

        '/docs/webhooks' => [
            'title' => 'WebSocket Events — ClaudeNest Documentation',
            'description' => 'Real-time protocol reference: Reverb WebSocket channels, session output streaming, and task, lock and worker events.',
            'og_type' => 'article',
            'updated' => '2026-04-12',
        ],

        '/docs/sdks' => [
            'title' => 'SDKs & Libraries — ClaudeNest Documentation',
            'description' => 'Official ClaudeNest clients: JavaScript SDK, PHP, Python and the CLI. Install, configure and call the API from your own stack.',
            'og_type' => 'article',
            'updated' => '2026-04-12',
        ],

        '/docs/resources' => [
            'title' => 'API Resources — ClaudeNest Documentation',
            'description' => 'Error code reference, rate limits and the API changelog for the ClaudeNest REST API.',
            'og_type' => 'article',
            'updated' => '2026-04-12',
        ],

        '/legal' => [
            'title' => 'Legal — ClaudeNest',
            'description' => 'Legal notices, terms of service, privacy policy and cookie policy for ClaudeNest.',
            'og_type' => 'website',
            'updated' => '2026-04-12',
        ],

    ],

];
