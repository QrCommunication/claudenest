<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * EpicResource (GET /api/epics/{epic}) must expose the archive state and the
 * epic-level pull request fields so the board can render the archive toggle and
 * the finalize/PR flow.
 */
class EpicResourceFieldsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create();
    }

    private function show(Epic $epic): TestResponse
    {
        return $this->actingAs($this->user)->getJson("/api/epics/{$epic->id}");
    }

    #[Test]
    public function it_exposes_archive_and_pr_fields_for_a_finalized_archived_epic(): void
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Realtime notifications',
            'status' => 'done',
            'priority' => 'medium',
            'archived_at' => now(),
            'pr_url' => 'https://github.com/acme/app/pull/42',
            'pr_number' => 42,
            'pr_state' => Epic::PR_STATE_OPEN,
            'pr_branch' => 'claudenest/epic-realtime-1234',
            'finalized_at' => now(),
        ]);

        $this->show($epic)
            ->assertOk()
            ->assertJsonPath('data.is_archived', true)
            ->assertJsonPath('data.pr_url', 'https://github.com/acme/app/pull/42')
            ->assertJsonPath('data.pr_number', 42)
            ->assertJsonPath('data.pr_state', 'open')
            ->assertJsonPath('data.pr_branch', 'claudenest/epic-realtime-1234')
            ->assertJsonPath('data.has_pull_request', true)
            ->assertJsonStructure(['data' => ['archived_at', 'finalized_at']]);
    }

    #[Test]
    public function it_exposes_nulls_and_false_flags_for_a_fresh_epic(): void
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Fresh epic',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        $this->show($epic)
            ->assertOk()
            ->assertJsonPath('data.is_archived', false)
            ->assertJsonPath('data.archived_at', null)
            ->assertJsonPath('data.pr_url', null)
            ->assertJsonPath('data.pr_number', null)
            ->assertJsonPath('data.pr_state', null)
            ->assertJsonPath('data.pr_branch', null)
            ->assertJsonPath('data.has_pull_request', false)
            ->assertJsonPath('data.finalized_at', null);
    }
}
