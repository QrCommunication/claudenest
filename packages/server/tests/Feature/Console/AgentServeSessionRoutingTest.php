<?php

namespace Tests\Feature\Console;

use App\Console\Commands\AgentServe;
use App\Events\ClaudeSessionsDiscovered;
use App\Events\ProjectBroadcast;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Anti-regression for the prod incident "SQLSTATE[22P02] invalid input
 * syntax for type uuid": agent messages whose session id is NOT a UUID
 * must never reach `Session::find()` — they are skipped with a log.
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
