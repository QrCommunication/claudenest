<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * EpicResource (GET /api/epics/{epic}) must expose the archive state, the
 * epic-level pull request fields, AND the visible task counters
 * (tasks_count / completed_tasks_count / remaining_tasks_count /
 * progress_percentage) so the board can render the archive toggle, the
 * finalize/PR flow, and progress. The counters are computed on the visible set
 * (archived-epic tasks excluded) — an archived epic reports 0 through the API.
 */
class EpicResourceFieldsTest extends TestCase
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

    private function show(Epic $epic): TestResponse
    {
        return $this->actingAs($this->user)->getJson("/api/epics/{$epic->id}");
    }

    #[Test]
    public function it_exposes_archive_and_pr_fields_for_a_finalized_archived_epic(): void
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Realtime notifications',
            'status' => 'done',
            'priority' => 'medium',
            'archived_at' => now(),
            'pr_url' => 'https://github.com/acme/app/pull/42',
            'pr_number' => 42,
            'pr_state' => Epic::PR_STATE_OPEN,
            'pr_branch' => 'claudenest/epic-realtime-1234',
            'finalized_at' => now(),
        ]);

        $this->show($epic)
            ->assertOk()
            ->assertJsonPath('data.is_archived', true)
            ->assertJsonPath('data.pr_url', 'https://github.com/acme/app/pull/42')
            ->assertJsonPath('data.pr_number', 42)
            ->assertJsonPath('data.pr_state', 'open')
            ->assertJsonPath('data.pr_branch', 'claudenest/epic-realtime-1234')
            ->assertJsonPath('data.has_pull_request', true)
            ->assertJsonStructure(['data' => ['archived_at', 'finalized_at']]);
    }

    #[Test]
    public function it_exposes_nulls_and_false_flags_for_a_fresh_epic(): void
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Fresh epic',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        $this->show($epic)
            ->assertOk()
            ->assertJsonPath('data.is_archived', false)
            ->assertJsonPath('data.archived_at', null)
            ->assertJsonPath('data.pr_url', null)
            ->assertJsonPath('data.pr_number', null)
            ->assertJsonPath('data.pr_state', null)
            ->assertJsonPath('data.pr_branch', null)
            ->assertJsonPath('data.has_pull_request', false)
            ->assertJsonPath('data.finalized_at', null);
    }

    #[Test]
    public function it_exposes_visible_task_counters_for_an_active_epic(): void
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Active epic',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        // 2 done + 1 pending → 3 total, 2 completed, 1 remaining (not done), 66.7%.
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id, 'title' => 'A', 'status' => 'done',
        ]);
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id, 'title' => 'B', 'status' => 'done',
        ]);
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id, 'title' => 'C', 'status' => 'pending',
        ]);

        $this->show($epic)
            ->assertOk()
            ->assertJsonPath('data.tasks_count', 3)
            ->assertJsonPath('data.completed_tasks_count', 2)
            ->assertJsonPath('data.remaining_tasks_count', 1)
            ->assertJsonPath('data.progress_percentage', 66.7);
    }

    #[Test]
    public function an_archived_epic_reports_zero_counters_through_the_resource(): void
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Archived epic',
            'status' => 'done',
            'priority' => 'medium',
        ]);

        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id, 'title' => 'A', 'status' => 'done',
        ]);
        SharedTask::factory()->for($this->project, 'project')->create([
            'epic_id' => $epic->id, 'title' => 'B', 'status' => 'pending',
        ]);

        // Archive after the tasks exist (direct DB write — no fillable dependency).
        DB::table('epics')->where('id', $epic->id)->update(['archived_at' => now()]);

        // The archive-aware counters drop every task under the archived epic.
        $this->show($epic)
            ->assertOk()
            ->assertJsonPath('data.is_archived', true)
            ->assertJsonPath('data.tasks_count', 0)
            ->assertJsonPath('data.completed_tasks_count', 0)
            ->assertJsonPath('data.remaining_tasks_count', 0)
            // 0.0 serializes to JSON `0` (int) — assertJsonPath compares strictly.
            ->assertJsonPath('data.progress_percentage', 0);
    }
}
