<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tasks under an archived epic must drop out of the task panel — both the
 * per-project index (GET /api/projects/{project}/tasks) and the cross-project
 * listing (GET /api/tasks) — mirroring how the epic itself disappears from the
 * board (EpicController::index) and its sprints (Sprint::scopeExcludingArchivedEpics).
 *
 * Exceptions: a task with no epic (NULL epic_id) is always retained (backlog),
 * and an explicit epic_id filter bypasses the hiding so an archived epic's tasks
 * can still be inspected when targeted directly.
 *
 * Tests use include_all=1 to bypass the default "today" visibility window so the
 * archived-epic filter is exercised in isolation (pending tasks would otherwise
 * be hidden by defaultVisible).
 */
class TaskHideArchivedEpicTest extends TestCase
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

    private function epic(bool $archived): Epic
    {
        return Epic::create([
            'project_id' => $this->project->id,
            'title' => $archived ? 'Archived epic' : 'Active epic',
            'status' => 'open',
            'priority' => 'medium',
            'archived_at' => $archived ? now() : null,
        ]);
    }

    private function task(?Epic $epic, string $title): SharedTask
    {
        return SharedTask::create([
            'project_id' => $this->project->id,
            'epic_id' => $epic?->id,
            'title' => $title,
            'status' => 'pending',
            'priority' => 'medium',
        ]);
    }

    #[Test]
    public function the_per_project_index_hides_tasks_under_an_archived_epic(): void
    {
        $archived = $this->epic(archived: true);
        $active = $this->epic(archived: false);

        $hidden = $this->task($archived, 'Archived-epic task');
        $visibleEpic = $this->task($active, 'Active-epic task');
        $backlog = $this->task(null, 'Backlog task');

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson("/api/projects/{$this->project->id}/tasks?include_all=1")
                ->assertOk()
                ->json('data')
        )->pluck('id')->all();

        $this->assertNotContains($hidden->id, $ids);
        $this->assertContains($visibleEpic->id, $ids);
        $this->assertContains($backlog->id, $ids);
    }

    #[Test]
    public function an_explicit_epic_id_filter_returns_an_archived_epics_tasks(): void
    {
        $archived = $this->epic(archived: true);
        $task = $this->task($archived, 'Archived-epic task');

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson("/api/projects/{$this->project->id}/tasks?include_all=1&epic_id={$archived->id}")
                ->assertOk()
                ->json('data')
        )->pluck('id')->all();

        // Targeting the archived epic directly bypasses the hygiene filter.
        $this->assertContains($task->id, $ids);
    }

    #[Test]
    public function unarchiving_the_epic_brings_its_tasks_back(): void
    {
        $epic = $this->epic(archived: true);
        $task = $this->task($epic, 'Epic task');

        $idsWhileArchived = collect(
            $this->actingAs($this->user)
                ->getJson("/api/projects/{$this->project->id}/tasks?include_all=1")
                ->json('data')
        )->pluck('id')->all();
        $this->assertNotContains($task->id, $idsWhileArchived);

        $epic->unarchive();

        $idsAfterRestore = collect(
            $this->actingAs($this->user)
                ->getJson("/api/projects/{$this->project->id}/tasks?include_all=1")
                ->json('data')
        )->pluck('id')->all();
        $this->assertContains($task->id, $idsAfterRestore);
    }

    #[Test]
    public function the_cross_project_listing_hides_tasks_under_an_archived_epic(): void
    {
        $archived = $this->epic(archived: true);
        $active = $this->epic(archived: false);

        $hidden = $this->task($archived, 'Archived-epic task');
        $visibleEpic = $this->task($active, 'Active-epic task');
        $backlog = $this->task(null, 'Backlog task');

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson('/api/tasks?include_all=1')
                ->assertOk()
                ->json('data')
        )->pluck('id')->all();

        $this->assertNotContains($hidden->id, $ids);
        $this->assertContains($visibleEpic->id, $ids);
        $this->assertContains($backlog->id, $ids);
    }

    #[Test]
    public function the_per_project_index_archived_flag_includes_archived_epic_tasks(): void
    {
        $archived = $this->epic(archived: true);
        $task = $this->task($archived, 'Archived-epic task');

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/tasks?include_all=1&archived=true")
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();

        // ?archived=true opts back in to archived-epic tasks; the paginated
        // total follows the same query so it stays consistent with the list.
        $this->assertContains($task->id, $ids);
        $this->assertSame(1, $response->json('meta.pagination.total'));
    }

    #[Test]
    public function the_cross_project_listing_archived_flag_includes_archived_epic_tasks(): void
    {
        $archived = $this->epic(archived: true);
        $task = $this->task($archived, 'Archived-epic task');

        $ids = collect(
            $this->actingAs($this->user)
                ->getJson('/api/tasks?include_all=1&archived=true')
                ->assertOk()
                ->json('data')
        )->pluck('id')->all();

        $this->assertContains($task->id, $ids);
    }

    #[Test]
    public function claiming_the_next_available_task_skips_archived_epic_tasks(): void
    {
        $archived = $this->epic(archived: true);
        // The only ready-to-start task lives under an archived epic.
        $this->task($archived, 'Archived-epic task');

        // The availability counter that drives workers must not hand out a task
        // from an archived epic — consistent with the hidden listing.
        $this->assertNull(SharedTask::getNextAvailable($this->project->id));
        $this->assertNull(SharedTask::claimNextAvailable($this->project->id, 'worker-1'));

        // A backlog task (no epic) is still claimable, proving the exclusion is
        // null-safe and not a blanket block.
        $backlog = $this->task(null, 'Backlog task');
        $claimed = SharedTask::claimNextAvailable($this->project->id, 'worker-1');
        $this->assertNotNull($claimed);
        $this->assertSame($backlog->id, $claimed->id);
    }
}
