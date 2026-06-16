<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\TokenPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The detailed ProjectResource (GET /api/projects/{id}) must expose a USD cost
 * estimate derived from the project-level token counter so the project screen can
 * render token spend without calling the dedicated token-budget endpoint.
 */
class ProjectResourceCostTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
    }

    #[Test]
    public function it_exposes_estimated_cost_matching_the_pricing_service(): void
    {
        $project = SharedProject::factory()
            ->for($this->user)
            ->for($this->machine)
            ->create(['total_tokens' => 1_000_000]);

        $expected = round(
            app(TokenPricingService::class)->estimateFromTotalTokens(null, 1_000_000),
            4,
        );

        $this->actingAs($this->user)
            ->getJson("/api/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.estimated_cost_usd', $expected)
            ->assertJsonPath('data.cost_currency', 'USD')
            ->assertJsonPath('data.pricing_model', app(TokenPricingService::class)->resolveModel(null));
    }

    #[Test]
    public function it_reports_zero_cost_for_a_project_with_no_token_usage(): void
    {
        $project = SharedProject::factory()
            ->for($this->user)
            ->for($this->machine)
            ->create(['total_tokens' => 0]);

        $this->actingAs($this->user)
            ->getJson("/api/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.estimated_cost_usd', 0)
            ->assertJsonPath('data.cost_currency', 'USD');
    }

    #[Test]
    public function it_omits_the_cost_fields_from_the_lean_list_resource(): void
    {
        SharedProject::factory()
            ->for($this->user)
            ->for($this->machine)
            ->create(['total_tokens' => 1_000_000]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/machines/{$this->machine->id}/projects")
            ->assertOk();

        $first = $response->json('data.0');
        $this->assertArrayNotHasKey('estimated_cost_usd', $first);
    }
}
