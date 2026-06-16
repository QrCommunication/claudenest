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
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Sprints under an archived epic must drop out of the sprint board listing
 * (GET /api/projects/{project}/sprints). The epic↔sprint link is indirect (via
 * tasks.epic_id), so only sprints whose tasks ALL sit under archived epics are
 * hidden — empty sprints, backlog sprints and mixed sprints stay visible.
 */
class SprintHideArchivedEpicTest extends TestCase
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

    private function sprint(string $name): Sprint
    {
        return Sprint::create([
            'project_id' => $this->project->id,
            'name' => $name,
            'status' => 'planning',
            'sort_order' => 0,
        ]);
    }

    private function task(Sprint $sprint, ?Epic $epic): SharedTask
    {
        return SharedTask::create([
            'project_id' => $this->project->id,
            'sprint_id' => $sprint->id,
            'epic_id' => $epic?->id,
            'title' => 'Task',
            'status' => 'pending',
            'priority' => 'medium',
        ]);
    }

    #[Test]
    public function it_hides_only_sprints_whose_tasks_all_belong_to_archived_epics(): void
    {
        $archived = $this->epic(archived: true);
        $active = $this->epic(archived: false);

        // Hidden: all tasks under the archived epic.
        $hidden = $this->sprint('Archived-epic sprint');
        $this->task($hidden, $archived);

        // Visible: tasks under an active epic.
        $activeSprint = $this->sprint('Active-epic sprint');
        $this->task($activeSprint, $active);

        // Visible: backlog sprint (epic-less tasks).
        $backlog = $this->sprint('Backlog sprint');
        $this->task($backlog, null);

        // Visible: empty sprint (no tasks).
        $empty = $this->sprint('Empty sprint');

        // Visible: mixed sprint (one archived-epic task + one backlog task).
        $mixed = $this->sprint('Mixed sprint');
        $this->task($mixed, $archived);
        $this->task($mixed, null);

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/sprints")
            ->assertOk();

        $returnedIds = collect($response->json('data'))->pluck('id')->all();

        $this->assertNotContains($hidden->id, $returnedIds);
        $this->assertContains($activeSprint->id, $returnedIds);
        $this->assertContains($backlog->id, $returnedIds);
        $this->assertContains($empty->id, $returnedIds);
        $this->assertContains($mixed->id, $returnedIds);
    }

    #[Test]
    public function unarchiving_the_epic_brings_its_sprint_back(): void
    {
        $epic = $this->epic(archived: true);
        $sprint = $this->sprint('Epic sprint');
        $this->task($sprint, $epic);

        $idsWhileArchived = collect(
            $this->actingAs($this->user)
                ->getJson("/api/projects/{$this->project->id}/sprints")
                ->json('data')
        )->pluck('id')->all();
        $this->assertNotContains($sprint->id, $idsWhileArchived);

        $epic->unarchive();

        $idsAfterRestore = collect(
            $this->actingAs($this->user)
                ->getJson("/api/projects/{$this->project->id}/sprints")
                ->json('data')
        )->pluck('id')->all();
        $this->assertContains($sprint->id, $idsAfterRestore);
    }
}
