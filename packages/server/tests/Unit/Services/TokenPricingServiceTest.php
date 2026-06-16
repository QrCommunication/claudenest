<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\TokenPricingService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * TokenPricingService turns token usage into a USD cost via the per-model rate
 * table (config/pricing.php). The specs inject a fixed config so they assert on
 * deterministic rates regardless of the live pricing.
 */
class TokenPricingServiceTest extends TestCase
{
    private function service(): TokenPricingService
    {
        return new TokenPricingService([
            'default_model' => 'sonnet-test',
            'default_output_ratio' => 0.25,
            'models' => [
                'opus-test' => ['input' => 15.0, 'output' => 75.0, 'cache_write' => 18.75, 'cache_read' => 1.5],
                'sonnet-test' => ['input' => 3.0, 'output' => 15.0, 'cache_write' => 3.75, 'cache_read' => 0.3],
            ],
            'aliases' => [
                'opus' => 'opus-test',
                'sonnet' => 'sonnet-test',
            ],
        ]);
    }

    #[Test]
    public function it_resolves_models_by_exact_alias_prefix_and_falls_back_to_default(): void
    {
        $s = $this->service();

        $this->assertSame('opus-test', $s->resolveModel('opus-test'));        // exact
        $this->assertSame('opus-test', $s->resolveModel('OPUS-TEST'));        // case-insensitive
        $this->assertSame('opus-test', $s->resolveModel('opus'));             // alias
        $this->assertSame('opus-test', $s->resolveModel('opus-test-20251201')); // dated/versioned prefix
        $this->assertSame('opus-test', $s->resolveModel('claude-opus-flavour')); // substring family
        $this->assertSame('sonnet-test', $s->resolveModel(null));             // null → default
        $this->assertSame('sonnet-test', $s->resolveModel('mystery-model'));  // unknown → default
    }

    #[Test]
    public function it_computes_cost_from_an_explicit_token_breakdown(): void
    {
        $s = $this->service();

        // opus: 1M input @15 + 1M output @75 = 90.00
        $this->assertSame(90.0, $s->costFor('opus-test', 1_000_000, 1_000_000));

        // sonnet with cache: 500k input @3 (1.5) + 200k output @15 (3.0)
        //   + 100k cache_write @3.75 (0.375) + 1M cache_read @0.30 (0.30) = 5.175
        $this->assertSame(5.175, $s->costFor('sonnet-test', 500_000, 200_000, 100_000, 1_000_000));
    }

    #[Test]
    public function it_clamps_negative_token_counts_to_zero(): void
    {
        $this->assertSame(0.0, $this->service()->costFor('opus-test', -100, -100, -100, -100));
    }

    #[Test]
    public function it_estimates_cost_from_a_single_token_total_using_the_output_ratio(): void
    {
        $s = $this->service();

        // 1M total, ratio 0.4 → 400k output @75 (30.0) + 600k input @15 (9.0) = 39.0
        $this->assertSame(39.0, $s->estimateFromTotalTokens('opus-test', 1_000_000, 0.4));

        // default ratio (0.25): 1M → 250k output @75 (18.75) + 750k input @15 (11.25) = 30.0
        $this->assertSame(30.0, $s->estimateFromTotalTokens('opus-test', 1_000_000));
    }

    #[Test]
    public function rates_for_returns_zeroed_keys_for_a_model_without_a_rate_entry(): void
    {
        // Empty config → no models → default resolves to '' → all-zero rates,
        // and any cost is 0 (service degrades safely rather than throwing).
        $s = new TokenPricingService([]);

        $this->assertSame(
            ['input' => 0.0, 'output' => 0.0, 'cache_write' => 0.0, 'cache_read' => 0.0],
            $s->ratesFor('anything'),
        );
        $this->assertSame(0.0, $s->costFor('anything', 1_000_000, 1_000_000));
    }
}
