<?php

return [

    /*
    |--------------------------------------------------------------------------
    | ClaudeNest Configuration
    |--------------------------------------------------------------------------
    */

    'version' => env('CLAUDENEST_VERSION', '1.0.0'),

    /*
    |--------------------------------------------------------------------------
    | Orchestration — Worker Pool Knobs
    |--------------------------------------------------------------------------
    | ClaudeNest is free & unlimited: there is NO per-plan cap on the number of
    | concurrent Claude sessions or orchestrated workers. The values below are
    | purely operational defaults — the effective worker count is always bounded
    | by the operator-chosen `max_workers` and the pending-task backlog, never by
    | a billing plan.
    */

    'orchestration' => [
        // Default suggested worker count when the operator does not specify one.
        // Operational knob only — it never caps anything the operator asks for.
        'max_workers_default' => (int) env('CLAUDENEST_MAX_WORKERS_DEFAULT', 3),

        // Default permission mode handed to spawned workers (see WorkerPoolService).
        'permission_mode_default' => env('CLAUDENEST_PERMISSION_MODE_DEFAULT', 'bypassPermissions'),

        // Whether the incident coordinator may spawn ephemeral planning sessions.
        'coordinator_default' => (bool) env('CLAUDENEST_COORDINATOR_DEFAULT', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | WebSocket Configuration
    |--------------------------------------------------------------------------
    */

    'websocket' => [
        'port' => env('CLAUDENEST_WS_PORT', 8080),
        'heartbeat_interval' => 30,
        'reconnect_attempts' => 5,

        // agent:serve subscribes to the AgentGateway wake channel (Redis
        // pub/sub) for instant server→agent forwarding. Disable to fall back
        // to adaptive polling only (50ms active / 250ms idle).
        'wake_subscribe' => env('AGENT_WAKE_SUBSCRIBE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reverb Client Configuration (for frontend WebSocket connection)
    |--------------------------------------------------------------------------
    | These override the server-side REVERB_* values for the browser client.
    | Useful when Reverb runs behind a reverse proxy (Caddy/Nginx).
    */

    'reverb_client' => [
        'key' => env('REVERB_APP_KEY', ''),
        'host' => env('REVERB_CLIENT_HOST', env('REVERB_HOST', 'localhost')),
        'port' => (int) env('REVERB_CLIENT_PORT', env('REVERB_PORT', 8080)),
        'scheme' => env('REVERB_CLIENT_SCHEME', env('REVERB_SCHEME', 'https')),
    ],

    /*
    |--------------------------------------------------------------------------
    | Session Configuration
    |--------------------------------------------------------------------------
    */

    'session' => [
        'default_pty_cols' => 120,
        'default_pty_rows' => 40,
        'scrollback_lines' => 10000,
        'max_sessions_per_machine' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Context / RAG Configuration
    |--------------------------------------------------------------------------
    */

    'context' => [
        'vector_dimension' => env('VECTOR_DIMENSION', 384),
        'vector_index_lists' => env('VECTOR_INDEX_LISTS', 100),
        'default_similarity_threshold' => 0.7,
        'max_context_tokens' => 8000,
        'summarize_threshold' => 0.8,
        'context_retention_days' => 30,
        'embedding_model' => env('OLLAMA_EMBEDDING_MODEL', 'bge-small-en-v1.5'),
        'summarization_model' => env('OLLAMA_SUMMARIZATION_MODEL', 'mistral:7b'),
        'ollama_host' => env('OLLAMA_HOST', 'http://localhost:11434'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Multi-Agent Configuration
    |--------------------------------------------------------------------------
    */

    'multi_agent' => [
        'task_timeout_minutes' => 60,
        'lock_timeout_minutes' => 30,
        'broadcast_level' => 'all', // all, errors_only, none
        'max_instances_per_project' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Brand Colors
    |--------------------------------------------------------------------------
    |
    | Primary: #a855f7 (Purple)
    | Indigo: #6366f1
    | Cyan: #22d3ee
    | Background: #1a1b26
    |
    */

    'colors' => [
        'primary' => '#a855f7',
        'indigo' => '#6366f1',
        'cyan' => '#22d3ee',
        'background' => '#1a1b26',
        'background_dark' => '#0f0f1a',
        'surface' => '#24283b',
        'border' => '#3b4261',
        'text_primary' => '#ffffff',
        'text_secondary' => '#a9b1d6',
        'success' => '#22c55e',
        'error' => '#ef4444',
        'warning' => '#fbbf24',
    ],

];
