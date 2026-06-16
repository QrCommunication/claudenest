<?php

namespace Tests\Feature\Api;

use App\Events\EpicDecompositionUpdated;
use App\Models\ClaudeInstance;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\Sprint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * `submitFromAgent` — the decomposition session submits its master plan via the
 * `submit_master_plan` MCP tool. When the submitting session was decomposing a
 * specific epic, the validated plan is auto-applied to that linked epic and the
 * epic's decomposition state flips `running` → `completed`.
 *
 * POST /api/projects/{project}/decompose/submit
 */
class SubmitFromAgentEpicTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create(['status' => 'online']);

        // A populated context makes ContextSessionService::launch() (fired by
        // applyMasterPlan) a no-op, so the test never touches the agent gateway.
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create([
            'summary' => 'A test project.',
            'architecture' => 'Laravel + Vue.',
            'conventions' => 'PSR-12.',
        ]);
    }

    /** A minimal valid master plan: two waves, with a dependency between tasks. */
    private function masterPlan(): array
    {
        return [
            'version' => 1,
            'prd_summary' => 'Realtime notifications',
            'waves' => [
                [
                    'name' => 'Foundation',
                    'description' => 'DB + models',
                    'tasks' => [
                        ['title' => 'Create notifications table', 'priority' => 'high'],
                    ],
                ],
                [
                    'name' => 'Backend',
                    'tasks' => [
                        ['title' => 'Notification API', 'depends_on' => ['Create notifications table']],
                    ],
                ],
            ],
        ];
    }

    /**
     * Create an epic in `running` decomposition state, the session it is linked
     * to, and the MCP instance that fronts that session (so the X-Instance-ID
     * header resolves the submitting session).
     *
     * @return array{epic: Epic, instance: ClaudeInstance}
     */
    private function linkedEpic(string $status = Epic::DECOMPOSITION_RUNNING): array
    {
        $session = Session::factory()->for($this->user)->for($this->machine)->create([
            'shared_project_id' => $this->project->id,
        ]);

        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Realtime notifications',
            'status' => 'open',
            'priority' => 'medium',
            'decomposition_status' => $status,
            'decomposition_session_id' => $session->id,
        ]);

        $instance = ClaudeInstance::create([
            'id' => (string) Str::uuid(),
            'project_id' => $this->project->id,
            'session_id' => $session->id,
            'machine_id' => $this->machine->id,
            'status' => 'active',
        ]);

        return ['epic' => $epic, 'instance' => $instance];
    }

    private function submit(ClaudeInstance $instance): TestResponse
    {
        return $this->actingAs($this->user)
            ->withHeaders(['X-Instance-ID' => $instance->id])
            ->postJson("/api/projects/{$this->project->id}/decompose/submit", [
                'master_plan' => $this->masterPlan(),
            ]);
    }

    #[Test]
    public function it_applies_the_plan_to_the_linked_epic_and_marks_it_completed(): void
    {
        Event::fake([EpicDecompositionUpdated::class]);

        ['epic' => $epic, 'instance' => $instance] = $this->linkedEpic();

        $this->submit($instance)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.created', 2)
            ->assertJsonPath('data.epic_applied', true);

        // Epic flipped to the canonical terminal `completed` state + stamped.
        $epic->refresh();
        $this->assertSame('completed', $epic->decomposition_status);
        $this->assertNull($epic->decomposition_error);
        $this->assertNotNull($epic->decomposed_at);

        // Tasks/sprints were generated and linked to the epic.
        $this->assertSame(2, $epic->tasks()->count());
        $this->assertSame(2, Sprint::where('project_id', $this->project->id)->count());

        // The plan is also stored on the project (wizard fallback path).
        $this->assertNotEmpty($this->project->fresh()->master_plan);

        Event::assertDispatched(EpicDecompositionUpdated::class, fn (EpicDecompositionUpdated $e) => $e->epic->id === $epic->id
            && $e->action === 'completed');
    }

    #[Test]
    public function it_succeeds_without_an_epic_for_a_plain_project_decomposition(): void
    {
        // A session + instance with NO linked epic (plain decompose flow).
        $session = Session::factory()->for($this->user)->for($this->machine)->create([
            'shared_project_id' => $this->project->id,
        ]);
        $instance = ClaudeInstance::create([
            'id' => (string) Str::uuid(),
            'project_id' => $this->project->id,
            'session_id' => $session->id,
            'machine_id' => $this->machine->id,
            'status' => 'active',
        ]);

        $this->submit($instance)
            ->assertOk()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.epic_applied', false);

        // No epic was created/applied; the plan is stored for the wizard.
        $this->assertSame(0, Epic::where('project_id', $this->project->id)->count());
        $this->assertNotEmpty($this->project->fresh()->master_plan);
    }

    #[Test]
    public function it_does_not_clobber_an_epic_that_already_completed(): void
    {
        // An epic already `completed` (a session lingering after a successful
        // submit) must not be re-applied — the in-flight guard makes it idempotent.
        ['epic' => $epic, 'instance' => $instance] = $this->linkedEpic(status: 'completed');
        $epic->forceFill(['decomposed_at' => now()->subMinute()])->save();

        $this->submit($instance)
            ->assertOk()
            ->assertJsonPath('data.epic_applied', false);

        $epic->refresh();
        $this->assertSame('completed', $epic->decomposition_status);
        // No tasks were generated a second time.
        $this->assertSame(0, $epic->tasks()->count());
    }
}
