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
 * Deleting an epic cascades to its tasks and the sprints that become empty,
 * while preserving sprints that still hold other tasks.
 */
class EpicDeletionTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function deleting_an_epic_removes_its_tasks_and_emptied_sprints(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $epic = Epic::create([
            'project_id' => $project->id,
            'title' => 'Doomed epic',
            'color' => '#a855f7',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        // Exclusive sprint: only the epic's tasks → deleted with the epic.
        $exclusiveSprint = Sprint::create([
            'project_id' => $project->id,
            'name' => 'Exclusive',
            'status' => 'planning',
            'sort_order' => 0,
        ]);
        SharedTask::factory()->count(2)->for($project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $exclusiveSprint->id,
        ]);

        // Shared sprint: also holds a task from NO epic → must survive.
        $sharedSprint = Sprint::create([
            'project_id' => $project->id,
            'name' => 'Shared',
            'status' => 'active',
            'sort_order' => 1,
        ]);
        SharedTask::factory()->for($project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sharedSprint->id,
        ]);
        $keepTask = SharedTask::factory()->for($project, 'project')->create([
            'epic_id' => null,
            'sprint_id' => $sharedSprint->id,
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/epics/{$epic->id}");

        $response->assertOk()
            ->assertJsonPath('data.tasks_deleted', 3)
            ->assertJsonPath('data.sprints_deleted', 1);

        $this->assertDatabaseMissing('epics', ['id' => $epic->id]);
        $this->assertSame(0, SharedTask::where('epic_id', $epic->id)->count());
        // Exclusive sprint gone, shared sprint + its non-epic task preserved.
        $this->assertDatabaseMissing('sprints', ['id' => $exclusiveSprint->id]);
        $this->assertDatabaseHas('sprints', ['id' => $sharedSprint->id]);
        $this->assertDatabaseHas('shared_tasks', ['id' => $keepTask->id]);
    }
}
