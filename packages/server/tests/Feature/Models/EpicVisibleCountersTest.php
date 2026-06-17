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
 * Epic task counters (tasks_count / completed_tasks_count / remaining_tasks_count
 * / progress_percentage) must be computed on the *visible* set: tasks under an
 * archived epic are excluded via {@see SharedTask::scopeExcludingArchivedEpics()}.
 * For an active epic this is a no-op; an archived epic reports 0 visible tasks.
 * `remaining_tasks_count` additionally honors {@see SharedTask::scopeRemaining()}
 * (not done AND not stranded in a closed sprint).
 */
class EpicVisibleCountersTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        // Self-sufficient: the `archived_at` column ships in a sibling task's
        // migration; create it here if absent so this counter test validates
        // regardless of migration ordering.
        if (! Schema::hasColumn('epics', 'archived_at')) {
            Schema::table('epics', function ($table) {
                $table->timestamp('archived_at')->nullable();
            });
        }

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $this->project = SharedProject::factory()->for($user)->for($machine)->create();
    }

    private function epic(?string $archivedAt = null): Epic
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Epic',
            'color' => '#a855f7',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        if ($archivedAt !== null) {
            // Direct DB write avoids any dependency on the model fillable/casts.
            DB::table('epics')->where('id', $epic->id)->update(['archived_at' => $archivedAt]);
        }

        return $epic;
    }

    private function task(Epic $epic, string $status, ?string $sprintId = null): SharedTask
    {
        return SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id,
            'sprint_id' => $sprintId,
            'title' => 'Task',
            'status' => $status,
        ]);
    }

    private function sprint(string $status): Sprint
    {
        return Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint',
            'status' => $status,
        ]);
    }

    #[Test]
    public function active_epic_counts_all_its_tasks(): void
    {
        $epic = $this->epic();
        $this->task($epic, 'done');
        $this->task($epic, 'done');
        $this->task($epic, 'pending');

        $epic->refresh();

        $this->assertSame(3, $epic->tasks_count);
        $this->assertSame(2, $epic->completed_tasks_count);
        // Remaining = not done (the single pending task); the two done tasks drop.
        $this->assertSame(1, $epic->remaining_tasks_count);
        $this->assertSame(66.7, $epic->progress_percentage);
    }

    #[Test]
    public function archived_epic_reports_zero_visible_tasks(): void
    {
        $epic = $this->epic((string) now());
        $this->task($epic, 'done');
        $this->task($epic, 'pending');

        $epic->refresh();

        // Archived content contributes nothing to visible metrics.
        $this->assertSame(0, $epic->tasks_count);
        $this->assertSame(0, $epic->completed_tasks_count);
        $this->assertSame(0, $epic->remaining_tasks_count);
        $this->assertSame(0.0, $epic->progress_percentage);
    }

    #[Test]
    public function remaining_count_excludes_tasks_stranded_in_a_closed_sprint(): void
    {
        $epic = $this->epic();
        $closed = $this->sprint('completed');
        $active = $this->sprint('active');

        // Not-done in an active sprint → remaining.
        $this->task($epic, 'pending', $active->id);
        // Not-done but stranded in a CLOSED sprint → NOT remaining (scopeRemaining).
        $this->task($epic, 'in_progress', $closed->id);
        // Backlog task with no sprint → remaining.
        $this->task($epic, 'pending');

        $epic->refresh();

        $this->assertSame(3, $epic->tasks_count);
        $this->assertSame(0, $epic->completed_tasks_count);
        // Only the active-sprint task and the sprintless backlog task remain;
        // the one stranded in the completed sprint is dropped.
        $this->assertSame(2, $epic->remaining_tasks_count);
    }
}
