<?php

declare(strict_types=1);

namespace Tests\Feature\Models;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * SharedTask::excludingArchivedEpics() must drop tasks whose epic is archived
 * while keeping active-epic tasks AND epic-less (backlog) tasks.
 */
class SharedTaskArchivedEpicScopeTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        // Self-sufficient: the `archived_at` column ships in a sibling task's
        // migration; create it here if it isn't present yet so this scope test
        // validates regardless of migration ordering.
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
            // Direct DB write avoids any dependency on the model's fillable/casts
            // (added by a sibling task).
            DB::table('epics')->where('id', $epic->id)->update(['archived_at' => $archivedAt]);
        }

        return $epic;
    }

    private function task(?string $epicId): SharedTask
    {
        return SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epicId,
            'title' => 'Task',
            'status' => 'pending',
        ]);
    }

    #[Test]
    public function it_excludes_archived_epic_tasks_but_keeps_active_and_backlog(): void
    {
        $activeEpic = $this->epic(null);
        $archivedEpic = $this->epic((string) now());

        $activeTask = $this->task($activeEpic->id);
        $archivedTask = $this->task($archivedEpic->id);
        $backlogTask = $this->task(null);

        $ids = SharedTask::forProject($this->project->id)
            ->excludingArchivedEpics()
            ->pluck('id')
            ->all();

        $this->assertContains($activeTask->id, $ids);
        $this->assertContains($backlogTask->id, $ids);
        $this->assertNotContains($archivedTask->id, $ids);
    }
}
