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
    | WebSocket Configuration
    |--------------------------------------------------------------------------
    */

    'websocket' => [
        'port' => env('CLAUDENEST_WS_PORT', 8080),
        'heartbeat_interval' => 30,
        'reconnect_attempts' => 5,
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
