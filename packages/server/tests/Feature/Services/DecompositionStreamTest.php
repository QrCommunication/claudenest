<?php

namespace Tests\Feature\Services;

use App\Events\ProjectBroadcast;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\DecompositionStreamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Decomposition completion: an interactive decomposition session submits its
 * plan via the `submit_master_plan` MCP tool, which routes here through
 * completeFromAgentResult(). The plan is stored and a slim `decompose:result`
 * is broadcast, idempotently (one completion per run, reset on a new run).
 */
class DecompositionStreamTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    private DecompositionStreamService $stream;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $this->project = SharedProject::factory()
            ->for($user)
            ->for($machine)
            ->create(['master_plan' => null]);

        $this->stream = app(DecompositionStreamService::class);
        $this->stream->reset($this->project->id);
    }

    private function planJson(string $summary = 'Real summary'): string
    {
        return json_encode([
            'version' => 1,
            'prd_summary' => $summary,
            'waves' => [
                [
                    'id' => 0,
                    'name' => 'Foundation',
                    'description' => 'DB and models',
                    'tasks' => [
                        [
                            'title' => 'Create users migration',
                            'description' => 'uuid PK, timestamps',
                            'priority' => 'high',
                            'files' => ['database/migrations/create_users.php'],
                            'estimated_tokens' => 5000,
                            'depends_on' => [],
                        ],
                    ],
                ],
            ],
        ]);
    }

    #[Test]
    public function submitted_plan_is_stored_and_broadcast_slim(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->stream->completeFromAgentResult($this->project, [
            'success' => true,
            'plan' => json_decode($this->planJson('Agent summary'), true),
        ]);

        $fresh = $this->project->fresh();
        $this->assertSame('Agent summary', $fresh->master_plan['prd_summary']);
        $this->assertSame('Create users migration', $fresh->master_plan['waves'][0]['tasks'][0]['title']);

        // Slim signal: the plan must NOT travel in the broadcast (a real plan
        // exceeds Reverb's max message size — "Pusher error: Payload too
        // large"). Clients refetch GET master-plan when has_plan is true.
        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->project->id === $this->project->id
                && $event->message['type'] === 'decompose:result'
                && $event->message['success'] === true
                && $event->message['has_plan'] === true
                && $event->message['errors'] === []
                && !array_key_exists('plan', $event->message);
        });
    }

    #[Test]
    public function a_duplicate_submit_in_the_same_run_is_suppressed(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->stream->completeFromAgentResult($this->project, [
            'success' => true,
            'plan' => json_decode($this->planJson(), true),
        ]);
        // A retried submit (same run) must not double-broadcast.
        $this->stream->completeFromAgentResult($this->project->fresh(), [
            'success' => true,
            'plan' => json_decode($this->planJson('Second attempt'), true),
        ]);

        Event::assertDispatchedTimes(ProjectBroadcast::class, 1);
        // First completion won.
        $this->assertSame('Real summary', $this->project->fresh()->master_plan['prd_summary']);
    }

    #[Test]
    public function reset_allows_a_new_decomposition_run_to_emit_again(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->stream->completeFromAgentResult($this->project, [
            'success' => false,
            'error' => 'first run failed',
        ]);

        // Starting a new decomposition resets the one-result-per-run lock.
        $this->stream->reset($this->project->id);

        $this->stream->completeFromAgentResult($this->project->fresh(), [
            'success' => true,
            'plan' => json_decode($this->planJson(), true),
        ]);

        Event::assertDispatchedTimes(ProjectBroadcast::class, 2);
        $this->assertSame('Real summary', $this->project->fresh()->master_plan['prd_summary']);
    }

    #[Test]
    public function a_failed_submit_broadcasts_a_failure_and_stores_no_plan(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->stream->completeFromAgentResult($this->project, [
            'success' => false,
            'error' => 'model produced no plan',
        ]);

        $this->assertNull($this->project->fresh()->master_plan);

        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->message['type'] === 'decompose:result'
                && $event->message['success'] === false
                && is_string($event->message['error'])
                && $event->message['error'] !== '';
        });
    }
}
