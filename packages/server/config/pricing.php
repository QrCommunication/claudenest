<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Token Pricing
    |--------------------------------------------------------------------------
    | Per-model token rates consumed by App\Services\TokenPricingService to turn
    | a session's token usage into a USD cost estimate.
    |
    | Rates are expressed in **USD per 1,000,000 tokens** (the unit Anthropic
    | publishes). Update these when Anthropic revises its pricing.
    |
    |   - input       : prompt / context tokens
    |   - output      : completion tokens
    |   - cache_write : tokens written to the prompt cache (≈ 1.25× input)
    |   - cache_read  : tokens read from the prompt cache (≈ 0.10× input)
    */

    // Model used to price a session whose model is unknown / unresolvable.
    'default_model' => env('CLAUDENEST_PRICING_DEFAULT_MODEL', 'claude-sonnet-4-6'),

    // When a session only exposes a single `total_tokens` count (no input/output
    // split), TokenPricingService::estimateFromTotalTokens() assumes this share
    // of those tokens are output (the rest input). Tunable per deployment.
    'default_output_ratio' => (float) env('CLAUDENEST_PRICING_OUTPUT_RATIO', 0.3),

    // Canonical rate table — keyed by canonical model id. USD per 1M tokens.
    'models' => [
        'claude-opus-4-8' => [
            'input' => 15.00,
            'output' => 75.00,
            'cache_write' => 18.75,
            'cache_read' => 1.50,
        ],
        'claude-sonnet-4-6' => [
            'input' => 3.00,
            'output' => 15.00,
            'cache_write' => 3.75,
            'cache_read' => 0.30,
        ],
        'claude-haiku-4-5' => [
            'input' => 1.00,
            'output' => 5.00,
            'cache_write' => 1.25,
            'cache_read' => 0.10,
        ],
    ],

    // Family aliases → canonical model id. Lets bare names ("opus") and dated /
    // versioned ids ("claude-haiku-4-5-20251001") resolve to a rate entry.
    // Order matters only for substring fallback; exact keys win first.
    'aliases' => [
        'opus' => 'claude-opus-4-8',
        'sonnet' => 'claude-sonnet-4-6',
        'haiku' => 'claude-haiku-4-5',
    ],
];
