<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * GET /api/tasks — cross-project listing for the all-projects task panel:
 * tasks across every ACTIVE project the user owns, excluding other users'
 * projects and archived projects.
 */
class CrossProjectTaskListingTest extends TestCase
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

    private function project(array $overrides = []): SharedProject
    {
        return SharedProject::factory()->for($this->user)->for($this->machine)->create($overrides);
    }

    private function task(SharedProject $project, array $overrides = []): SharedTask
    {
        return SharedTask::factory()->create(array_merge([
            'project_id' => $project->id,
            'status' => 'pending',
            'priority' => 'medium',
        ], $overrides));
    }

    #[Test]
    public function it_lists_tasks_across_the_users_active_projects(): void
    {
        $projectA = $this->project();
        $projectB = $this->project();
        $taskA = $this->task($projectA, ['title' => 'Task A']);
        $taskB = $this->task($projectB, ['title' => 'Task B']);

        $response = $this->actingAs($this->user)->getJson('/api/tasks')->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($taskA->id, $ids);
        $this->assertContains($taskB->id, $ids);
        // Each task carries its project_id so the client can group by project.
        $this->assertNotNull($response->json('data.0.project_id'));
    }

    #[Test]
    public function it_excludes_other_users_and_archived_project_tasks(): void
    {
        $mine = $this->task($this->project(), ['title' => 'Mine']);

        // Another user's task.
        $stranger = User::factory()->create();
        $strangerMachine = Machine::factory()->for($stranger)->create();
        $strangerProject = SharedProject::factory()->for($stranger)->for($strangerMachine)->create();
        $strangerTask = SharedTask::factory()->create([
            'project_id' => $strangerProject->id,
            'status' => 'pending',
        ]);

        // My archived project's task.
        $archived = $this->project(['archived_at' => now()]);
        $archivedTask = $this->task($archived, ['title' => 'Archived']);

        $ids = collect(
            $this->actingAs($this->user)->getJson('/api/tasks')->assertOk()->json('data')
        )->pluck('id')->all();

        $this->assertContains($mine->id, $ids);
        $this->assertNotContains($strangerTask->id, $ids);
        $this->assertNotContains($archivedTask->id, $ids);
    }

    #[Test]
    public function it_narrows_to_a_single_owned_project_with_the_project_id_filter(): void
    {
        $projectA = $this->project();
        $projectB = $this->project();
        $taskA = $this->task($projectA);
        $taskB = $this->task($projectB);

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson("/api/tasks?project_id={$projectA->id}")
                ->assertOk()->json('data')
        )->pluck('id')->all();

        $this->assertContains($taskA->id, $ids);
        $this->assertNotContains($taskB->id, $ids);
    }

    #[Test]
    public function the_status_filter_returns_done_tasks_across_projects(): void
    {
        $project = $this->project();
        // A task completed before today is hidden by default visibility but
        // surfaced by an explicit status filter.
        $oldDone = $this->task($project, ['status' => 'done', 'completed_at' => now()->subWeek()]);

        $idsDefault = collect(
            $this->actingAs($this->user)->getJson('/api/tasks')->assertOk()->json('data')
        )->pluck('id')->all();
        $this->assertNotContains($oldDone->id, $idsDefault);

        $idsDone = collect(
            $this->actingAs($this->user)->getJson('/api/tasks?status=done')->assertOk()->json('data')
        )->pluck('id')->all();
        $this->assertContains($oldDone->id, $idsDone);
    }

    #[Test]
    public function the_project_id_filter_for_a_foreign_project_returns_no_tasks(): void
    {
        // IDOR guard (TaskController::allForUser): the project_id filter is
        // honoured only when the id is one of the caller's active projects.
        // Pointing it at a stranger's project must NOT leak that project's
        // tasks — the controller resolves the filter to an empty id set.
        $mine = $this->task($this->project(), ['title' => 'Mine']);

        $stranger = User::factory()->create();
        $strangerMachine = Machine::factory()->for($stranger)->create();
        $strangerProject = SharedProject::factory()->for($stranger)->for($strangerMachine)->create();
        $strangerTask = SharedTask::factory()->create([
            'project_id' => $strangerProject->id,
            'status' => 'pending',
            'title' => 'Not yours',
        ]);

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson("/api/tasks?project_id={$strangerProject->id}")
                ->assertOk()->json('data')
        )->pluck('id')->all();

        $this->assertEmpty($ids);
        $this->assertNotContains($strangerTask->id, $ids);
        $this->assertNotContains($mine->id, $ids);
    }

    #[Test]
    public function the_priority_filter_narrows_tasks_across_projects(): void
    {
        // priority spans two projects so we prove the filter applies after the
        // cross-project scoping, not within a single project.
        $critA = $this->task($this->project(), ['priority' => 'critical', 'title' => 'Crit A']);
        $critB = $this->task($this->project(), ['priority' => 'critical', 'title' => 'Crit B']);
        $low = $this->task($this->project(), ['priority' => 'low', 'title' => 'Low']);

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson('/api/tasks?priority=critical')
                ->assertOk()->json('data')
        )->pluck('id')->all();

        $this->assertContains($critA->id, $ids);
        $this->assertContains($critB->id, $ids);
        $this->assertNotContains($low->id, $ids);
    }

    #[Test]
    public function the_assigned_to_filter_narrows_to_a_single_instance(): void
    {
        $project = $this->project();
        $mine = $this->task($project, [
            'status' => 'in_progress',
            'assigned_to' => 'instance-worker-1',
            'title' => 'Worker 1',
        ]);
        $other = $this->task($project, [
            'status' => 'in_progress',
            'assigned_to' => 'instance-worker-2',
            'title' => 'Worker 2',
        ]);

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson('/api/tasks?assigned_to=instance-worker-1')
                ->assertOk()->json('data')
        )->pluck('id')->all();

        $this->assertContains($mine->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    #[Test]
    public function it_requires_authentication(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
    }
}
