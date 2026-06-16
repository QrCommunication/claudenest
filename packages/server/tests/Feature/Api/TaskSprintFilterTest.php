<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Reliability contract of the `sprint_id` query filter on
 * GET /api/projects/{id}/tasks (TaskController::index):
 *
 *  - a sprint UUID narrows the list to that sprint's tasks;
 *  - the literal "none" narrows to the backlog (tasks without a sprint);
 *  - any other value is rejected with 422 *before* reaching the database,
 *    guarding PostgreSQL's strict `uuid` column against the 22P02
 *    "invalid input syntax for type uuid" error;
 *  - an explicit sprint filter bypasses the default visibility window so a
 *    caller inspecting a sprint always sees every task in it, including tasks
 *    completed before today.
 */
class TaskSprintFilterTest extends TestCase
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
    }

    private function sprint(string $name = 'Sprint 1', string $status = 'active'): Sprint
    {
        return Sprint::create([
            'project_id' => $this->project->id,
            'name' => $name,
            'status' => $status,
            'sort_order' => 0,
        ]);
    }

    #[Test]
    public function filtering_by_sprint_id_returns_only_that_sprints_tasks(): void
    {
        $sprintA = $this->sprint('Sprint A');
        $sprintB = $this->sprint('Sprint B');

        SharedTask::factory()->count(2)->for($this->project, 'project')
            ->create(['sprint_id' => $sprintA->id]);
        SharedTask::factory()->count(3)->for($this->project, 'project')
            ->create(['sprint_id' => $sprintB->id]);
        // Backlog task — must not leak into a specific-sprint filter.
        SharedTask::factory()->for($this->project, 'project')->create(['sprint_id' => null]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?sprint_id={$sprintA->id}");

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    #[Test]
    public function sprint_id_none_returns_only_backlog_tasks(): void
    {
        $sprint = $this->sprint();

        SharedTask::factory()->count(2)->for($this->project, 'project')
            ->create(['sprint_id' => $sprint->id]);
        $backlog = SharedTask::factory()->count(3)->for($this->project, 'project')
            ->create(['sprint_id' => null]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?sprint_id=none");

        $response->assertOk()->assertJsonCount(3, 'data');

        $returnedIds = collect($response->json('data'))->pluck('id')->sort()->values();
        $this->assertEquals(
            $backlog->pluck('id')->sort()->values(),
            $returnedIds,
            'sprint_id=none must return exactly the backlog (sprint_id IS NULL) tasks.'
        );
    }

    #[Test]
    public function a_non_uuid_sprint_id_is_rejected_with_422(): void
    {
        // A free-text value would reach a `where('sprint_id', 'not-a-uuid')`
        // and blow up PostgreSQL with SQLSTATE 22P02. The hand-rolled rule must
        // reject it at validation time instead.
        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?sprint_id=not-a-uuid");

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure(['error' => ['details' => ['sprint_id']]]);
    }

    #[Test]
    public function a_well_formed_but_unknown_sprint_uuid_is_rejected_with_422(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?sprint_id=".Str::uuid());

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure(['error' => ['details' => ['sprint_id']]]);
    }

    #[Test]
    public function sprint_filter_bypasses_the_default_visibility_window(): void
    {
        $sprint = $this->sprint();

        // A task finished two days ago: hidden by the default visibility window
        // (which only keeps tasks done *today*) but always shown when the caller
        // explicitly narrows to this sprint.
        SharedTask::factory()->for($this->project, 'project')->create([
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'completed_at' => now()->subDays(2),
        ]);

        // Baseline: the unfiltered list hides the stale-done task.
        $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // With the sprint filter the same task surfaces.
        $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?sprint_id={$sprint->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    #[Test]
    public function epic_filter_returns_only_that_epics_tasks_and_bypasses_default_visibility(): void
    {
        $epicA = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Epic A',
            'color' => Epic::DEFAULT_COLOR,
            'status' => 'done',
            'priority' => 'medium',
        ]);
        $epicB = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Epic B',
            'color' => Epic::DEFAULT_COLOR,
            'status' => 'in_progress',
            'priority' => 'medium',
        ]);

        // Epic A's tasks are all done before today — hidden by the default
        // visibility window but must surface when filtering by that epic.
        SharedTask::factory()->count(2)->for($this->project, 'project')->create([
            'epic_id' => $epicA->id,
            'status' => 'done',
            'completed_at' => now()->subDays(3),
        ]);
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epicB->id,
            'status' => 'in_progress',
        ]);

        // Filtering by epic A returns its 2 stale-done tasks (default visibility
        // bypassed), and never epic B's task.
        $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?epic_id={$epicA->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    #[Test]
    public function a_non_uuid_epic_id_is_rejected_with_422(): void
    {
        // Guards the strict PostgreSQL `uuid` column against 22P02 — a free-text
        // epic_id must fail validation (uuid rule) rather than reach the query.
        $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?epic_id=not-a-uuid")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure(['error' => ['details' => ['epic_id']]]);
    }

    #[Test]
    public function a_well_formed_but_unknown_epic_uuid_is_rejected_with_422(): void
    {
        $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?epic_id=".Str::uuid())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure(['error' => ['details' => ['epic_id']]]);
    }
}
