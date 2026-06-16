<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * GET /api/projects/{project}/token-budget — aggregates the project's session
 * token usage (input/output split), prices it through TokenPricingService and
 * reports it alongside the project's budget counters.
 */
class ProjectTokenBudgetTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create(['status' => 'online']);

        // Deterministic pricing: a single test model at clean per-1M rates so the
        // cost assertion does not couple to the live config/pricing.php values.
        config([
            'pricing.default_model' => 'test-model',
            'pricing.default_output_ratio' => 0.3,
            'pricing.models' => [
                'test-model' => ['input' => 10.0, 'output' => 50.0, 'cache_write' => 0.0, 'cache_read' => 0.0],
            ],
            'pricing.aliases' => [],
        ]);
    }

    private function project(array $overrides = []): SharedProject
    {
        return SharedProject::factory()->for($this->user)->for($this->machine)->create(array_merge([
            'total_tokens' => 0,
            'max_tokens' => 1_000_000,
        ], $overrides));
    }

    #[Test]
    public function it_aggregates_session_tokens_and_prices_them(): void
    {
        $project = $this->project(['total_tokens' => 750_000, 'max_tokens' => 1_000_000]);

        Session::factory()->for($this->user)->for($this->machine)->create([
            'shared_project_id' => $project->id,
            'input_tokens' => 400_000,
            'output_tokens' => 100_000,
            'total_tokens' => 500_000,
        ]);
        Session::factory()->for($this->user)->for($this->machine)->create([
            'shared_project_id' => $project->id,
            'input_tokens' => 600_000,
            'output_tokens' => 100_000,
            'total_tokens' => 700_000,
        ]);

        // input 1,000,000 @ $10/M = 10.0 ; output 200,000 @ $50/M = 10.0 → 20.0
        $this->actingAs($this->user)
            ->getJson("/api/projects/{$project->id}/token-budget")
            ->assertOk()
            ->assertJsonPath('data.tokens.used', 750000)
            ->assertJsonPath('data.tokens.max', 1000000)
            ->assertJsonPath('data.tokens.percent', 75)
            ->assertJsonPath('data.tokens.limit_reached', false)
            ->assertJsonPath('data.tokens.input', 1000000)
            ->assertJsonPath('data.tokens.output', 200000)
            ->assertJsonPath('data.tokens.session_total', 1200000)
            ->assertJsonPath('data.cost.estimated_usd', 20)
            ->assertJsonPath('data.cost.currency', 'USD')
            ->assertJsonPath('data.cost.pricing_model', 'test-model')
            ->assertJsonPath('data.sessions_count', 2);
    }

    #[Test]
    public function it_returns_zeroes_for_a_project_without_sessions(): void
    {
        $project = $this->project();

        $this->actingAs($this->user)
            ->getJson("/api/projects/{$project->id}/token-budget")
            ->assertOk()
            ->assertJsonPath('data.tokens.input', 0)
            ->assertJsonPath('data.tokens.output', 0)
            ->assertJsonPath('data.cost.estimated_usd', 0)
            ->assertJsonPath('data.sessions_count', 0);
    }

    #[Test]
    public function it_reports_limit_reached_when_usage_meets_the_max(): void
    {
        // total_tokens >= max_tokens → the project budget is exhausted.
        $project = $this->project(['total_tokens' => 1_000_000, 'max_tokens' => 1_000_000]);

        $this->actingAs($this->user)
            ->getJson("/api/projects/{$project->id}/token-budget")
            ->assertOk()
            ->assertJsonPath('data.tokens.used', 1000000)
            ->assertJsonPath('data.tokens.percent', 100)
            ->assertJsonPath('data.tokens.limit_reached', true);
    }

    #[Test]
    public function it_only_aggregates_sessions_of_the_target_project(): void
    {
        $project = $this->project();
        $other = $this->project();

        // Target project: the only usage that must be counted.
        Session::factory()->for($this->user)->for($this->machine)->create([
            'shared_project_id' => $project->id,
            'input_tokens' => 100_000,
            'output_tokens' => 0,
            'total_tokens' => 100_000,
        ]);

        // Another owned project's session must NOT leak into the aggregate.
        Session::factory()->for($this->user)->for($this->machine)->create([
            'shared_project_id' => $other->id,
            'input_tokens' => 999_000,
            'output_tokens' => 999_000,
            'total_tokens' => 1_998_000,
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/projects/{$project->id}/token-budget")
            ->assertOk()
            ->assertJsonPath('data.tokens.input', 100000)
            ->assertJsonPath('data.tokens.output', 0)
            ->assertJsonPath('data.tokens.session_total', 100000)
            ->assertJsonPath('data.sessions_count', 1);
    }

    #[Test]
    public function it_403s_for_a_project_the_user_does_not_own(): void
    {
        $project = $this->project();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->getJson("/api/projects/{$project->id}/token-budget")
            ->assertForbidden();
    }

    #[Test]
    public function it_requires_authentication(): void
    {
        $project = $this->project();

        $this->getJson("/api/projects/{$project->id}/token-budget")
            ->assertUnauthorized();
    }
}
