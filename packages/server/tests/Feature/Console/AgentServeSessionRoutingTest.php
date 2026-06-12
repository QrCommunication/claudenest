<?php

namespace Tests\Feature\Console;

use App\Console\Commands\AgentServe;
use App\Events\ClaudeSessionsDiscovered;
use App\Events\ProjectBroadcast;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\DecompositionStreamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Anti-regression for the prod incident "SQLSTATE[22P02] invalid input
 * syntax for type uuid": agent messages whose session id is NOT a UUID
 * (ephemeral `decompose-{projectId}-{ts}` sessions) must never reach
 * `Session::find()` — they are routed to the decomposition flow or skipped.
 *
 * Runs against real PostgreSQL: before the guard, every one of these
 * handler calls threw a QueryException (22P02) and the message was lost.
 */
class AgentServeSessionRoutingTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create();
        $this->project = SharedProject::factory()
            ->for($this->user)
            ->for($this->machine)
            ->create(['master_plan' => null]);

        app(DecompositionStreamService::class)->reset($this->project->id);
    }

    /** Invoke a private AgentServe agent-message handler directly. */
    private function invokeHandler(string $method, array $args): void
    {
        $command = $this->app->make(AgentServe::class);
        // Some handlers write console output (e.g. onAgentError) — give the
        // command a buffered output so they don't hit an uninitialized one.
        $command->setOutput(new \Illuminate\Console\OutputStyle(
            new \Symfony\Component\Console\Input\ArrayInput([]),
            new \Symfony\Component\Console\Output\BufferedOutput(),
        ));
        (new ReflectionMethod($command, $method))->invoke($command, ...$args);
    }

    private function decomposeSessionId(): string
    {
        return 'decompose-' . $this->project->id . '-' . now()->getTimestampMs();
    }

    #[Test]
    public function decompose_session_messages_are_routed_to_the_decomposition_flow(): void
    {
        Event::fake([ProjectBroadcast::class]);
        $sessionId = $this->decomposeSessionId();

        $plan = json_encode([
            'version' => 1,
            'prd_summary' => 'Routed through AgentServe',
            'waves' => [
                ['id' => 0, 'name' => 'Foundation', 'tasks' => [['title' => 'Create schema']]],
            ],
        ]);

        // Full ephemeral lifecycle exactly as the agent forwards it.
        // Pre-guard: each call threw SQLSTATE[22P02] on Session::find().
        $this->invokeHandler('onSessionStatus', [$this->machine->id, [
            'sessionId' => $sessionId, 'status' => 'running', 'pid' => 4242,
        ]]);
        $this->invokeHandler('onSessionOutput', [$this->machine->id, [
            'sessionId' => $sessionId, 'data' => "```json\n" . $plan,
        ]]);
        $this->invokeHandler('onSessionOutput', [$this->machine->id, [
            'sessionId' => $sessionId, 'data' => "\n```\n",
        ]]);
        $this->invokeHandler('onSessionExited', [$this->machine->id, [
            'sessionId' => $sessionId, 'exitCode' => 0,
        ]]);

        // The decomposition completed: plan stored + result broadcast on the
        // channel/event the frontend listens to (useDecomposition.ts).
        $this->assertSame(
            'Routed through AgentServe',
            $this->project->fresh()->master_plan['prd_summary'],
        );

        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->project->id === $this->project->id
                && $event->message['type'] === 'decompose:result'
                && $event->message['success'] === true;
        });
    }

    #[Test]
    public function decompose_result_message_from_agent_completes_via_the_same_flow(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->invokeHandler('onDecomposeResult', [[
            'projectId' => $this->project->id,
            'success' => true,
            'plan' => [
                'version' => 1,
                'prd_summary' => 'From agent result',
                'waves' => [
                    ['id' => 0, 'name' => 'Backend', 'tasks' => [['title' => 'Build API']]],
                ],
            ],
        ]]);

        $this->assertSame('From agent result', $this->project->fresh()->master_plan['prd_summary']);
        Event::assertDispatched(ProjectBroadcast::class, fn (ProjectBroadcast $e) => $e->message['success'] === true);

        // Malformed projectId never reaches the uuid-typed query.
        $this->invokeHandler('onDecomposeResult', [['projectId' => 'not-a-uuid', 'success' => true]]);
        $this->invokeHandler('onDecomposeProgress', [['projectId' => 'not-a-uuid', 'output' => 'x']]);
    }

    #[Test]
    public function non_uuid_session_ids_are_skipped_without_any_uuid_query_error(): void
    {
        Event::fake([ProjectBroadcast::class, ClaudeSessionsDiscovered::class]);

        foreach (['not-a-uuid', 'worker-loop-7', 'decompose-broken'] as $sessionId) {
            $this->invokeHandler('onSessionStatus', [$this->machine->id, [
                'sessionId' => $sessionId, 'status' => 'running',
            ]]);
            $this->invokeHandler('onSessionOutput', [$this->machine->id, [
                'sessionId' => $sessionId, 'data' => 'hello',
            ]]);
            $this->invokeHandler('onSessionExited', [$this->machine->id, [
                'sessionId' => $sessionId, 'exitCode' => 1,
            ]]);
            $this->invokeHandler('onAgentError', [$this->machine->id, [
                'originalType' => 'session:create',
                'sessionId' => $sessionId,
                'code' => 'SPAWN_FAILED',
                'message' => 'boom',
            ]]);
        }

        // Skipped cleanly: nothing broadcast, nothing persisted.
        Event::assertNotDispatched(ProjectBroadcast::class);
        $this->assertDatabaseCount('sessions', 0);
    }

    #[Test]
    public function uuid_session_ids_still_resolve_their_session_row(): void
    {
        $session = Session::factory()
            ->for($this->machine)
            ->for($this->user)
            ->create(['status' => 'starting', 'pid' => null]);

        $this->invokeHandler('onSessionStatus', [$this->machine->id, [
            'sessionId' => $session->id, 'status' => 'running', 'pid' => 1234,
        ]]);

        $session->refresh();
        $this->assertSame('running', $session->status);
        $this->assertSame(1234, $session->pid);
    }

    #[Test]
    public function discovered_sessions_broadcast_is_a_slim_signal_even_with_fifty_sessions(): void
    {
        Event::fake([ClaudeSessionsDiscovered::class]);

        $sessions = [];
        for ($i = 0; $i < 50; $i++) {
            $sessions[] = [
                'sessionId' => "session-{$i}-" . str_repeat('a', 24),
                'projectSlug' => "-home-user-projects-very-long-project-name-{$i}",
                'cwd' => "/home/user/projects/very-long-project-name-{$i}",
                'projectName' => "very-long-project-name-{$i}",
                'transcriptPath' => "/home/user/.claude/projects/slug-{$i}/transcript.jsonl",
                'isLive' => $i % 2 === 0,
                'pid' => 1000 + $i,
                'tty' => "/dev/pts/{$i}",
                'startedAt' => now()->subHour()->toIso8601String(),
                'lastActivityAt' => now()->toIso8601String(),
                'sizeBytes' => 123456,
                'lastPreview' => str_repeat('long preview text ', 20),
            ];
        }

        $this->invokeHandler('onClaudeSessionsDiscovered', [$this->machine->id, ['sessions' => $sessions]]);

        $this->assertDatabaseCount('discovered_sessions', 50);

        Event::assertDispatched(ClaudeSessionsDiscovered::class, function (ClaudeSessionsDiscovered $event) {
            $payload = json_encode($event->broadcastWith());

            return $event->machineId === $this->machine->id
                && $event->count === 50
                && strlen($payload) <= 2048;
        });
    }
}
