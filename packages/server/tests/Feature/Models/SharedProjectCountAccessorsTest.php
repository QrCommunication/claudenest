<?php

declare(strict_types=1);

namespace Tests\Feature\Models;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * SharedProject::$epics_count / $sprints_count must mirror the default-visible
 * sets: archived epics, and sprints belonging exclusively to an archived epic,
 * are excluded so the sidebar badges drop the moment a project is archived.
 */
class SharedProjectCountAccessorsTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        // Self-sufficient: the `archived_at` column ships in a sibling task's
        // migration; create it here if it isn't present yet so this accessor
        // test validates regardless of migration ordering.
        if (! Schema::hasColumn('epics', 'archived_at')) {
            Schema::table('epics', function ($table) {
                $table->timestamp('archived_at')->nullable();
            });
        }

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $this->project = SharedProject::factory()->for($user)->for($machine)->create();
    }

    private function epic(?string $archivedAt): Epic
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Epic',
            'color' => '#a855f7',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        if ($archivedAt !== null) {
            DB::table('epics')->where('id', $epic->id)->update(['archived_at' => $archivedAt]);
        }

        return $epic;
    }

    private function sprint(): Sprint
    {
        return Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint',
            'status' => 'planning',
        ]);
    }

    private function task(?string $epicId, ?string $sprintId): SharedTask
    {
        return SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epicId,
            'sprint_id' => $sprintId,
            'title' => 'Task',
            'status' => 'pending',
        ]);
    }

    #[Test]
    public function epics_count_excludes_archived_epics(): void
    {
        $this->epic(null);
        $this->epic(null);
        $this->epic((string) now());

        $this->assertSame(2, $this->project->fresh()->epics_count);
    }

    #[Test]
    public function sprints_count_excludes_sprints_belonging_only_to_archived_epics(): void
    {
        $activeEpic = $this->epic(null);
        $archivedEpic = $this->epic((string) now());

        // Sprint kept: its task sits under an active epic.
        $activeSprint = $this->sprint();
        $this->task($activeEpic->id, $activeSprint->id);

        // Sprint dropped: every task sits under an archived epic.
        $archivedSprint = $this->sprint();
        $this->task($archivedEpic->id, $archivedSprint->id);

        // Sprint kept: empty (no tasks tie it to any epic).
        $this->sprint();

        // Sprint kept: a backlog (epic-less) task keeps it visible.
        $backlogSprint = $this->sprint();
        $this->task(null, $backlogSprint->id);

        $this->assertSame(3, $this->project->fresh()->sprints_count);
    }
}
