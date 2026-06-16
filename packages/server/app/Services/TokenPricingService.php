<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Turns token usage into a USD cost estimate using the per-model rate table in
 * config/pricing.php.
 *
 * Pricing rates are USD per 1,000,000 tokens. A model id is resolved to a rate
 * entry by exact match → family alias → substring/prefix → configured default,
 * so versioned/dated ids ("claude-haiku-4-5-20251001") and bare family names
 * ("opus") both price correctly.
 */
class TokenPricingService
{
    private const TOKENS_PER_UNIT = 1_000_000;

    /** @var array<string, mixed> */
    private array $config;

    /**
     * @param  array<string, mixed>|null  $config  Defaults to config('pricing');
     *                                             inject explicitly in tests.
     */
    public function __construct(?array $config = null)
    {
        $this->config = $config ?? (array) config('pricing', []);
    }

    /**
     * Resolve a (possibly bare/aliased/versioned) model id to a canonical model
     * key present in the rate table, falling back to the configured default.
     */
    public function resolveModel(?string $model): string
    {
        $models = $this->models();
        $default = (string) ($this->config['default_model'] ?? array_key_first($models) ?? '');

        $needle = strtolower(trim((string) $model));
        if ($needle === '') {
            return $default;
        }

        // 1. Exact canonical match.
        foreach (array_keys($models) as $key) {
            if (strtolower($key) === $needle) {
                return $key;
            }
        }

        // 2. Exact alias match.
        foreach ($this->aliases() as $alias => $target) {
            if (strtolower((string) $alias) === $needle && isset($models[$target])) {
                return $target;
            }
        }

        // 3. Prefix match on a canonical key (dated/versioned ids).
        foreach (array_keys($models) as $key) {
            if (str_starts_with($needle, strtolower($key))) {
                return $key;
            }
        }

        // 4. Substring match on an alias family ("...opus...", "...sonnet...").
        foreach ($this->aliases() as $alias => $target) {
            if (isset($models[$target]) && str_contains($needle, strtolower((string) $alias))) {
                return $target;
            }
        }

        return $default;
    }

    /**
     * The rate map (input/output/cache_write/cache_read, USD per 1M tokens) for a
     * model, resolved via {@see resolveModel}. Missing rate keys default to 0.0.
     *
     * @return array{input: float, output: float, cache_write: float, cache_read: float}
     */
    public function ratesFor(?string $model): array
    {
        $resolved = $this->resolveModel($model);
        $rates = $this->models()[$resolved] ?? [];

        return [
            'input' => (float) ($rates['input'] ?? 0.0),
            'output' => (float) ($rates['output'] ?? 0.0),
            'cache_write' => (float) ($rates['cache_write'] ?? 0.0),
            'cache_read' => (float) ($rates['cache_read'] ?? 0.0),
        ];
    }

    /**
     * USD cost for an explicit token breakdown. Token counts are clamped to ≥ 0
     * so a stray negative usage value never produces a credit. Rounded to 6
     * decimals (fits the `claude_sessions.total_cost` decimal:4 column with
     * headroom for summation).
     */
    public function costFor(
        ?string $model,
        int $inputTokens,
        int $outputTokens,
        int $cacheWriteTokens = 0,
        int $cacheReadTokens = 0,
    ): float {
        $rates = $this->ratesFor($model);

        $cost = (max(0, $inputTokens) * $rates['input']
            + max(0, $outputTokens) * $rates['output']
            + max(0, $cacheWriteTokens) * $rates['cache_write']
            + max(0, $cacheReadTokens) * $rates['cache_read'])
            / self::TOKENS_PER_UNIT;

        return round($cost, 6);
    }

    /**
     * Estimate cost from a single undifferentiated token total (the only figure
     * a session currently tracks). Splits the total into output/input by
     * `default_output_ratio` (config) unless an explicit ratio is given.
     */
    public function estimateFromTotalTokens(?string $model, int $totalTokens, ?float $outputRatio = null): float
    {
        $total = max(0, $totalTokens);
        $ratio = $outputRatio ?? (float) ($this->config['default_output_ratio'] ?? 0.3);
        $ratio = min(1.0, max(0.0, $ratio));

        $output = (int) round($total * $ratio);
        $input = $total - $output;

        return $this->costFor($model, $input, $output);
    }

    /** @return array<string, array<string, mixed>> */
    private function models(): array
    {
        return (array) ($this->config['models'] ?? []);
    }

    /** @return array<string, string> */
    private function aliases(): array
    {
        return (array) ($this->config['aliases'] ?? []);
    }
}
