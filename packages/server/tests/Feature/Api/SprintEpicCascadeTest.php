<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Events\EpicUpdated;
use App\Events\SprintUpdated;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Epic completion cascade:
 *  - Completing the last open sprint of an epic whose tasks are all done flips
 *    the epic to `done` and broadcasts EpicUpdated (the epic↔sprint link is
 *    indirect, resolved through the sprint's tasks).
 *  - The `epics:reconcile-status` command replays the same recompute and is
 *    idempotent (a second run corrects nothing).
 */
class SprintEpicCascadeTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create();
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create();

        // Neutralise the agent side-effects of sprint completion (auto-PR /
        // coordinator dispatch) so the cascade is tested in isolation.
        $this->spy(AgentGateway::class);
    }

    private function epic(string $status): Epic
    {
        return Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Auth epic',
            'color' => '#a855f7',
            'status' => $status,
            'priority' => 'medium',
        ]);
    }

    private function sprint(string $status): Sprint
    {
        return Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 1',
            'status' => $status,
            'sort_order' => 0,
        ]);
    }

    #[Test]
    public function completing_the_last_sprint_of_an_epic_marks_it_done_and_broadcasts(): void
    {
        $epic = $this->epic('in_progress');
        $sprint = $this->sprint('active');

        // All of the epic's work lives in this single sprint and is finished.
        SharedTask::factory()->count(2)->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        // Sanity: while the sprint is still open the epic cannot be done yet.
        $this->assertNotSame('done', $epic->fresh()->status);

        Event::fake([EpicUpdated::class, SprintUpdated::class]);

        $this->actingAs($this->user)
            ->postJson("/api/sprints/{$sprint->id}/complete")
            ->assertOk();

        $this->assertSame('done', $epic->fresh()->status, 'The epic must cascade to done.');
        $this->assertNotNull($epic->fresh()->completed_at);

        Event::assertDispatched(
            SprintUpdated::class,
            fn (SprintUpdated $event) => $event->sprint->id === $sprint->id && $event->action === 'completed',
        );
        Event::assertDispatched(
            EpicUpdated::class,
            fn (EpicUpdated $event) => $event->epic->id === $epic->id && $event->action === 'updated',
        );
    }

    #[Test]
    public function epic_with_an_open_sprint_remaining_is_not_marked_done(): void
    {
        // Already-consistent in_progress epic (timestamps set) so a recompute
        // that keeps it in_progress is a genuine no-op — isolating the "an open
        // sprint blocks done" rule from the timestamp backfill in applyStatus().
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Auth epic',
            'color' => '#a855f7',
            'status' => 'in_progress',
            'priority' => 'medium',
            'started_at' => now(),
            'completed_at' => null,
        ]);
        $closingSprint = $this->sprint('active');
        $otherSprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 2',
            'status' => 'active',
            'sort_order' => 1,
        ]);

        // Done work in the sprint being closed...
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $closingSprint->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);
        // ...but the epic still has unfinished work in another open sprint.
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $otherSprint->id,
            'status' => 'in_progress',
        ]);

        Event::fake([EpicUpdated::class, SprintUpdated::class]);

        $this->actingAs($this->user)
            ->postJson("/api/sprints/{$closingSprint->id}/complete")
            ->assertOk();

        $this->assertNotSame('done', $epic->fresh()->status, 'An epic with an open sprint must stay underway.');
        Event::assertNotDispatched(EpicUpdated::class);
    }

    #[Test]
    public function reconcile_status_command_corrects_drifted_epics_then_is_idempotent(): void
    {
        // Drifted epic: persisted as in_progress, but all its tasks are done and
        // its only sprint is already completed (no cascade ran historically).
        $epic = $this->epic('in_progress');
        $completedSprint = $this->sprint('completed');

        SharedTask::factory()->count(2)->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $completedSprint->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        Event::fake([EpicUpdated::class]);

        // First run corrects the single drifted epic.
        $this->artisan('epics:reconcile-status', ['--project' => $this->project->id])
            ->expectsOutputToContain('1/1 epic(s) corrected')
            ->assertExitCode(0);

        $this->assertSame('done', $epic->fresh()->status);
        Event::assertDispatchedTimes(EpicUpdated::class, 1);

        // Second run is a no-op: nothing drifted, nothing broadcast.
        $this->artisan('epics:reconcile-status', ['--project' => $this->project->id])
            ->expectsOutputToContain('0/1 epic(s) corrected')
            ->assertExitCode(0);

        $this->assertSame('done', $epic->fresh()->status);
        Event::assertDispatchedTimes(EpicUpdated::class, 1);
    }

    #[Test]
    public function manually_completing_the_last_task_via_update_cascades_sprint_and_epic(): void
    {
        // The exact production scenario: an epic whose sprint was never started
        // (still `planning`), with a single unfinished task. Ticking that task
        // `done` by hand via PATCH /tasks/{id} must heal the whole chain.
        $epic = $this->epic('in_progress');
        $sprint = $this->sprint('planning');

        $task = SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sprint->id,
            'status' => 'pending',
        ]);

        Event::fake([EpicUpdated::class, SprintUpdated::class]);

        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", ['status' => 'done'])
            ->assertOk();

        $this->assertSame('completed', $sprint->fresh()->status, 'The sprint must auto-complete.');
        $this->assertSame('done', $epic->fresh()->status, 'The epic must cascade to done.');
        $this->assertNotNull($epic->fresh()->completed_at);

        Event::assertDispatched(
            SprintUpdated::class,
            fn (SprintUpdated $event) => $event->sprint->id === $sprint->id,
        );
        Event::assertDispatched(
            EpicUpdated::class,
            fn (EpicUpdated $event) => $event->epic->id === $epic->id,
        );
    }

    #[Test]
    public function manually_moving_the_last_task_to_done_cascades_sprint_and_epic(): void
    {
        $epic = $this->epic('in_progress');
        $sprint = $this->sprint('active');

        $task = SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sprint->id,
            'status' => 'in_progress',
        ]);

        Event::fake([EpicUpdated::class, SprintUpdated::class]);

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/move", ['status' => 'done'])
            ->assertOk();

        $this->assertSame('completed', $sprint->fresh()->status);
        $this->assertSame('done', $epic->fresh()->status);
    }

    #[Test]
    public function editing_a_task_without_touching_its_status_leaves_the_hierarchy_alone(): void
    {
        $epic = $this->epic('in_progress');
        $sprint = $this->sprint('active');
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);
        // A second, unfinished task keeps the sprint legitimately open.
        $task = SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sprint->id,
            'status' => 'in_progress',
        ]);

        Event::fake([EpicUpdated::class, SprintUpdated::class]);

        // Title-only edit: must not trigger any reconciliation.
        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", ['title' => 'Renamed'])
            ->assertOk();

        Event::assertNotDispatched(SprintUpdated::class);
        Event::assertNotDispatched(EpicUpdated::class);
        $this->assertSame('active', $sprint->fresh()->status);
    }

    #[Test]
    public function reconcile_completes_a_planning_sprint_then_the_epic_and_is_idempotent(): void
    {
        // Historical drift, exactly as seen in production: every task is done but
        // the sprint was never closed (stuck `planning`), so the epic is stuck
        // `in_progress`. A single reconcile must fix the sprint THEN the epic.
        $epic = $this->epic('in_progress');
        $sprint = $this->sprint('planning');

        SharedTask::factory()->count(3)->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        Event::fake([EpicUpdated::class, SprintUpdated::class]);

        $this->artisan('epics:reconcile-status', ['--project' => $this->project->id])
            ->expectsOutputToContain('1/1 sprint(s) and 1/1 epic(s) corrected')
            ->assertExitCode(0);

        $this->assertSame('completed', $sprint->fresh()->status);
        $this->assertSame('done', $epic->fresh()->status);
        Event::assertDispatchedTimes(SprintUpdated::class, 1);
        Event::assertDispatchedTimes(EpicUpdated::class, 1);

        // Second run is a pure no-op.
        $this->artisan('epics:reconcile-status', ['--project' => $this->project->id])
            ->expectsOutputToContain('0/1 sprint(s) and 0/1 epic(s) corrected')
            ->assertExitCode(0);

        Event::assertDispatchedTimes(SprintUpdated::class, 1);
        Event::assertDispatchedTimes(EpicUpdated::class, 1);
    }

    #[Test]
    public function reconcile_never_revives_a_cancelled_sprint(): void
    {
        $sprint = $this->sprint('cancelled');
        SharedTask::factory()->count(2)->for($this->project, 'project')->create([
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        $this->artisan('epics:reconcile-status', ['--project' => $this->project->id])
            ->assertExitCode(0);

        $this->assertSame('cancelled', $sprint->fresh()->status, 'A cancelled sprint is terminal.');
    }

    #[Test]
    public function reconcile_status_dry_run_reports_without_persisting(): void
    {
        $epic = $this->epic('in_progress');
        $completedSprint = $this->sprint('completed');
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $completedSprint->id,
            'status' => 'done',
            'completed_at' => now(),
        ]);

        Event::fake([EpicUpdated::class]);

        $this->artisan('epics:reconcile-status', ['--project' => $this->project->id, '--dry-run' => true])
            ->expectsOutputToContain('1/1 epic(s) would be corrected')
            ->assertExitCode(0);

        // Dry-run rolls back: the epic is untouched and nothing is broadcast.
        $this->assertSame('in_progress', $epic->fresh()->status);
        Event::assertNotDispatched(EpicUpdated::class);
    }
}
