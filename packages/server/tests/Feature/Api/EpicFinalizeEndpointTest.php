<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Events\EpicUpdated;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * POST /api/epics/{id}/finalize dispatches the epic's pull request once it is
 * 100% complete, stamps the finalize intent (pr_branch + finalized_at),
 * broadcasts EpicUpdated('finalizing'), and is guarded by the project's update
 * policy + a completeness gate (422 when not every task is done).
 */
class EpicFinalizeEndpointTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create([
            'project_path' => '/home/dev/app',
        ]);
    }

    /**
     * @param  array<int, string>  $taskStatuses
     */
    private function epicWithTasks(array $taskStatuses): Epic
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Realtime Notifications',
            'color' => Epic::DEFAULT_COLOR,
            'status' => 'in_progress',
            'priority' => 'medium',
        ]);

        foreach ($taskStatuses as $i => $status) {
            SharedTask::factory()->create([
                'project_id' => $this->project->id,
                'epic_id' => $epic->id,
                'status' => $status,
                'title' => "Task {$i}",
            ]);
        }

        return $epic;
    }

    #[Test]
    public function it_finalizes_a_complete_epic_and_dispatches_the_pr(): void
    {
        Event::fake([EpicUpdated::class]);
        $this->spy(AgentGateway::class);
        $epic = $this->epicWithTasks(['done', 'done']);

        $this->actingAs($this->user)
            ->postJson("/api/epics/{$epic->id}/finalize")
            ->assertOk()
            ->assertJsonPath('data.dispatched', true)
            ->assertJsonPath('data.epic.id', $epic->id)
            // The endpoint only stamps the dispatch intent — the epic is not
            // shipped yet, so pr_done stays false until the agent reports a merge.
            ->assertJsonPath('data.epic.pr_done', false);

        $epic->refresh();
        $this->assertStringStartsWith('claudenest/epic-realtime-notifications-', (string) $epic->pr_branch);
        $this->assertNotNull($epic->finalized_at);
        $this->assertFalse($epic->pr_done);

        Event::assertDispatched(
            EpicUpdated::class,
            fn (EpicUpdated $e) => $e->epic->id === $epic->id && $e->action === 'finalizing',
        );
    }

    #[Test]
    public function it_backfills_previous_done_unshipped_siblings_on_finalize(): void
    {
        $this->spy(AgentGateway::class);

        // Earlier (board-order) epic: done but never shipped (pr_done = false).
        $previous = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Auth Hardening',
            'color' => Epic::DEFAULT_COLOR,
            'status' => 'done',
            'priority' => 'medium',
            'sort_order' => 0,
            'pr_done' => false,
        ]);

        // Later epic, 100% complete, finalized now (higher sort_order).
        $epic = $this->epicWithTasks(['done', 'done']);
        $epic->update(['sort_order' => 1]);

        $this->actingAs($this->user)
            ->postJson("/api/epics/{$epic->id}/finalize")
            ->assertOk()
            ->assertJsonPath('data.dispatched', true)
            ->assertJsonPath('data.backfilled', 1);

        // The previous sibling got its finalize intent stamped too.
        $this->assertNotNull($previous->refresh()->finalized_at);
    }

    #[Test]
    public function it_succeeds_but_does_not_dispatch_when_the_machine_is_offline(): void
    {
        $this->project->machine->update(['status' => 'offline']);
        $gateway = $this->spy(AgentGateway::class);
        $epic = $this->epicWithTasks(['done']);

        $this->actingAs($this->user)
            ->postJson("/api/epics/{$epic->id}/finalize")
            ->assertOk()
            ->assertJsonPath('data.dispatched', false);

        $gateway->shouldNotHaveReceived('sendMessage');
        $this->assertNull($epic->refresh()->pr_branch);
    }

    #[Test]
    public function it_rejects_finalizing_an_incomplete_epic(): void
    {
        $epic = $this->epicWithTasks(['done', 'in_progress']);

        $this->actingAs($this->user)
            ->postJson("/api/epics/{$epic->id}/finalize")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'EPIC_NOT_COMPLETE');

        $this->assertNull($epic->refresh()->finalized_at);
    }

    #[Test]
    public function it_rejects_finalizing_an_epic_with_no_tasks(): void
    {
        $epic = $this->epicWithTasks([]);

        $this->actingAs($this->user)
            ->postJson("/api/epics/{$epic->id}/finalize")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'EPIC_NOT_COMPLETE');
    }

    #[Test]
    public function it_forbids_finalizing_an_epic_of_another_users_project(): void
    {
        $epic = $this->epicWithTasks(['done']);
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->postJson("/api/epics/{$epic->id}/finalize")
            ->assertForbidden();

        $this->assertNull($epic->refresh()->finalized_at);
    }

    #[Test]
    public function it_returns_404_when_finalizing_an_unknown_epic(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/epics/'.Str::uuid().'/finalize')
            ->assertNotFound();
    }
}
