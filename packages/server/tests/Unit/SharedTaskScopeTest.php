<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Behavioural contract for the two SharedTask query scopes that drive the
 * "remaining" counters and the default task view:
 *
 *  - scopeRemaining()      : work still to do (single source of truth shared by
 *                            project/sprint stats and the TaskPanel badge).
 *  - scopeDefaultVisible() : the un-filtered task list (in-progress work + the
 *                            tasks finished today, so a just-completed task does
 *                            not vanish from the board mid-session).
 */
class SharedTaskScopeTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $this->project = SharedProject::factory()->for($user)->for($machine)->create();
    }

    private function sprint(string $status): Sprint
    {
        return Sprint::create([
            'project_id' => $this->project->id,
            'name' => ucfirst($status) . ' sprint',
            'status' => $status,
            'sort_order' => 0,
        ]);
    }

    private function task(array $attributes): SharedTask
    {
        return SharedTask::factory()->for($this->project, 'project')->create($attributes);
    }

    /** @return list<string> */
    private function remainingIds(): array
    {
        return SharedTask::query()
            ->where('project_id', $this->project->id)
            ->remaining()
            ->pluck('id')
            ->all();
    }

    /** @return list<string> */
    private function defaultVisibleIds(): array
    {
        return SharedTask::query()
            ->where('project_id', $this->project->id)
            ->defaultVisible()
            ->pluck('id')
            ->all();
    }

    // ==================== scopeRemaining ====================

    #[Test]
    public function remaining_excludes_done_tasks(): void
    {
        $this->task(['status' => 'done', 'completed_at' => now()]);
        $inProgress = $this->task(['status' => 'in_progress']);
        $pending = $this->task(['status' => 'pending']);

        $ids = $this->remainingIds();

        $this->assertContains($inProgress->id, $ids);
        $this->assertContains($pending->id, $ids);
        $this->assertCount(2, $ids, 'The done task must be excluded from remaining.');
    }

    #[Test]
    public function remaining_excludes_tasks_of_completed_or_cancelled_sprints(): void
    {
        $completedSprint = $this->sprint('completed');
        $cancelledSprint = $this->sprint('cancelled');
        $activeSprint = $this->sprint('active');

        // Stranded in closed sprints — excluded even though not done.
        $this->task(['status' => 'in_progress', 'sprint_id' => $completedSprint->id]);
        $this->task(['status' => 'pending', 'sprint_id' => $cancelledSprint->id]);

        // Still remaining: an open-sprint task and a backlog (no sprint) task.
        $inActiveSprint = $this->task(['status' => 'in_progress', 'sprint_id' => $activeSprint->id]);
        $backlog = $this->task(['status' => 'pending', 'sprint_id' => null]);

        $ids = $this->remainingIds();

        $this->assertContains($inActiveSprint->id, $ids);
        $this->assertContains($backlog->id, $ids);
        $this->assertCount(2, $ids, 'Tasks of completed/cancelled sprints must be excluded.');
    }

    // ==================== scopeDefaultVisible ====================

    #[Test]
    public function default_visible_includes_in_progress_and_done_today_but_not_done_yesterday(): void
    {
        $inProgress = $this->task(['status' => 'in_progress']);
        $pending = $this->task(['status' => 'pending']);
        $doneToday = $this->task(['status' => 'done', 'completed_at' => now()]);
        $doneYesterday = $this->task(['status' => 'done', 'completed_at' => now()->subDay()]);

        $ids = $this->defaultVisibleIds();

        $this->assertContains($inProgress->id, $ids);
        $this->assertContains($pending->id, $ids);
        $this->assertContains($doneToday->id, $ids, 'A task completed today must stay visible.');
        $this->assertNotContains($doneYesterday->id, $ids, 'A task completed yesterday must drop out.');
        $this->assertCount(3, $ids);
    }

    #[Test]
    public function default_visible_treats_start_of_day_as_inclusive_today(): void
    {
        // A task completed at exactly today's midnight is "today" (>= startOfDay).
        $doneAtMidnight = $this->task(['status' => 'done', 'completed_at' => now()->startOfDay()]);
        // One second before midnight belongs to yesterday → excluded.
        $doneJustBefore = $this->task(['status' => 'done', 'completed_at' => now()->startOfDay()->subSecond()]);

        $ids = $this->defaultVisibleIds();

        $this->assertContains($doneAtMidnight->id, $ids);
        $this->assertNotContains($doneJustBefore->id, $ids);
    }
}
