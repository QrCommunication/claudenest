<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | OAuth Providers
    |--------------------------------------------------------------------------
    */

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => env('GITHUB_REDIRECT_URI'),
    ],

    /*
    |--------------------------------------------------------------------------
    | ClaudeNest Services
    |--------------------------------------------------------------------------
    */

    'ollama' => [
        // OLLAMA_HOST is preferred; OLLAMA_URL is maintained for backward compatibility with older configs
        'url' => env('OLLAMA_HOST', env('OLLAMA_URL', 'http://localhost:11434')),
        'model' => env('OLLAMA_MODEL', 'mistral'),
        'embedding_model' => env('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text'),
        'reranker_model' => env('OLLAMA_RERANKER_MODEL', 'bge-reranker-base'),
        'embedding_dimensions' => env('EMBEDDING_DIMENSIONS', 768),
    ],

];
