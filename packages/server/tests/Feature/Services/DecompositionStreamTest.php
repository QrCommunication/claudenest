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
 * Decomposition stream routing: ephemeral `decompose-{projectId}-{ts}`
 * sessions have no Session row — their output is accumulated and parsed
 * server-side on exit, converging with the agent's own decompose:result
 * path on an idempotent completion.
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

    private function sessionId(): string
    {
        return 'decompose-' . $this->project->id . '-' . now()->getTimestampMs();
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

    /** The ```json schema example embedded in the decomposition prompt (echoed by the PTY). */
    private function echoedPromptExample(): string
    {
        return "## Output Format\n```json\n" . json_encode([
            'version' => 1,
            'prd_summary' => 'One-paragraph summary of the PRD',
            'waves' => [
                [
                    'id' => 0,
                    'name' => 'Wave name (e.g. Foundation, Backend, Frontend)',
                    'tasks' => [['title' => 'Short task title', 'priority' => 'critical|high|medium|low']],
                ],
            ],
        ]) . "\n```\n";
    }

    #[Test]
    public function output_stream_is_parsed_on_exit_and_broadcasts_the_result(): void
    {
        Event::fake([ProjectBroadcast::class]);
        $sessionId = $this->sessionId();

        // PTY stream: ANSI noise + echoed prompt (with its example block),
        // then Claude's actual plan split across chunks.
        $this->stream->handleOutput($sessionId, "\x1b[1mLaunching\x1b[0m\n" . $this->echoedPromptExample());
        $plan = $this->planJson();
        $half = (int) (strlen($plan) / 2);
        $this->stream->handleOutput($sessionId, "Here is the plan:\n```json\n" . substr($plan, 0, $half));
        $this->stream->handleOutput($sessionId, substr($plan, $half) . "\n```\nDone.\n");

        $this->stream->handleExited($sessionId);

        $this->assertSame('Real summary', $this->project->fresh()->master_plan['prd_summary']);

        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->project->id === $this->project->id
                && $event->message['type'] === 'decompose:result'
                && $event->message['success'] === true
                && $event->message['plan']['prd_summary'] === 'Real summary'
                && $event->message['plan']['waves'][0]['tasks'][0]['title'] === 'Create users migration';
        });
    }

    #[Test]
    public function result_is_emitted_once_when_agent_result_arrives_after_the_exit_parse(): void
    {
        Event::fake([ProjectBroadcast::class]);
        $sessionId = $this->sessionId();

        $this->stream->handleOutput($sessionId, "```json\n" . $this->planJson() . "\n```\n");
        $this->stream->handleExited($sessionId);

        // The agent's own decompose:result lands right after — suppressed.
        $this->stream->completeFromAgentResult($this->project->fresh(), [
            'success' => true,
            'plan' => json_decode($this->planJson('Agent summary'), true),
        ]);

        Event::assertDispatchedTimes(ProjectBroadcast::class, 1);
        // First completion won: the server-side parse, not the agent payload.
        $this->assertSame('Real summary', $this->project->fresh()->master_plan['prd_summary']);
    }

    #[Test]
    public function agent_result_path_still_completes_on_its_own(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->stream->completeFromAgentResult($this->project, [
            'success' => true,
            'plan' => json_decode($this->planJson('Agent summary'), true),
        ]);

        $this->assertSame('Agent summary', $this->project->fresh()->master_plan['prd_summary']);

        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->message['type'] === 'decompose:result'
                && $event->message['success'] === true
                && $event->message['errors'] === [];
        });
    }

    #[Test]
    public function reset_allows_a_new_decomposition_run_to_emit_again(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->stream->completeFromAgentResult($this->project, [
            'success' => false,
            'error' => 'first run failed',
        ]);

        // decompose:start (or regenerate) resets the one-result-per-run lock.
        $this->stream->reset($this->project->id);

        $this->stream->completeFromAgentResult($this->project->fresh(), [
            'success' => true,
            'plan' => json_decode($this->planJson(), true),
        ]);

        Event::assertDispatchedTimes(ProjectBroadcast::class, 2);
        $this->assertSame('Real summary', $this->project->fresh()->master_plan['prd_summary']);
    }

    #[Test]
    public function unparseable_output_broadcasts_a_failure_result(): void
    {
        Event::fake([ProjectBroadcast::class]);
        $sessionId = $this->sessionId();

        $this->stream->handleOutput($sessionId, "claude: command not found\n");
        $this->stream->handleExited($sessionId);

        $this->assertNull($this->project->fresh()->master_plan);

        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->message['type'] === 'decompose:result'
                && $event->message['success'] === false
                && is_string($event->message['error'])
                && $event->message['error'] !== '';
        });
    }

    #[Test]
    public function echoed_prompt_example_is_never_mistaken_for_the_plan(): void
    {
        Event::fake([ProjectBroadcast::class]);
        $sessionId = $this->sessionId();

        // Claude produced nothing: the only JSON block in the buffer is the
        // schema example echoed from the prompt. Must FAIL, not "succeed"
        // with a bogus 1-task plan.
        $this->stream->handleOutput($sessionId, $this->echoedPromptExample());
        $this->stream->handleExited($sessionId);

        $this->assertNull($this->project->fresh()->master_plan);

        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->message['type'] === 'decompose:result'
                && $event->message['success'] === false;
        });
    }

    #[Test]
    public function exited_without_any_buffered_output_still_unblocks_the_frontend(): void
    {
        Event::fake([ProjectBroadcast::class]);

        // No handleOutput at all (output frames lost) — the exit must still
        // emit a failure result instead of leaving the UI decomposing forever.
        $this->stream->handleExited($this->sessionId());

        Event::assertDispatched(ProjectBroadcast::class, function (ProjectBroadcast $event) {
            return $event->message['type'] === 'decompose:result'
                && $event->message['success'] === false;
        });
    }

    #[Test]
    public function malformed_or_foreign_session_ids_are_ignored_safely(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->assertTrue($this->stream->isDecomposeSessionId('decompose-x-1'));
        $this->assertFalse($this->stream->isDecomposeSessionId('worker-abc'));

        $this->assertSame(
            $this->project->id,
            $this->stream->extractProjectId('decompose-' . $this->project->id . '-1749600000000'),
        );
        $this->assertNull($this->stream->extractProjectId('decompose-not-a-uuid-123'));
        $this->assertNull($this->stream->extractProjectId('decompose-' . $this->project->id));

        // Malformed id: no uuid query, no broadcast, no exception.
        $this->stream->handleExited('decompose-not-a-uuid-123');
        // Unknown (but well-formed) project id: ignored.
        $this->stream->handleExited('decompose-' . \Illuminate\Support\Str::uuid() . '-123');

        Event::assertNotDispatched(ProjectBroadcast::class);
    }
}
