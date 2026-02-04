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
