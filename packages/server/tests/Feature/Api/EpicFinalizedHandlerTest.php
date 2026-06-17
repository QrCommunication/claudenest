<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Console\Commands\AgentServe;
use App\Events\EpicUpdated;
use App\Events\ProjectBroadcast;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use ReflectionMethod;
use Tests\TestCase;

/**
 * AgentServe::onEpicFinalized — the "close on PR" half of the epic finalize
 * flow. When the agent reports back a successful `epic:finalize` dispatch, the
 * handler persists the PR coordinates, closes the epic (status → done), and
 * broadcasts the outcome. A failed report leaves the epic open; an unknown
 * epic id is a silent no-op that never breaks the agent loop.
 */
class EpicFinalizedHandlerTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($user)->for($machine)->create();
    }

    private function epic(array $attributes = []): Epic
    {
        return Epic::create(array_merge([
            'project_id' => $this->project->id,
            'title' => 'Realtime Notifications',
            'color' => Epic::DEFAULT_COLOR,
            'status' => 'in_progress',
            'priority' => 'medium',
            'pr_branch' => 'claudenest/epic-realtime-notifications-abc12345',
            'finalized_at' => now(),
        ], $attributes));
    }

    /** Invoke the private handler the same way the agent message loop does. */
    private function dispatch(array $data): void
    {
        $command = $this->app->make(AgentServe::class);
        $method = new ReflectionMethod($command, 'onEpicFinalized');
        $method->setAccessible(true);
        $method->invoke($command, $data);
    }

    #[Test]
    public function it_closes_the_epic_and_records_the_pr_on_success(): void
    {
        Event::fake([ProjectBroadcast::class]);
        $epic = $this->epic();

        $this->dispatch([
            'epicId' => $epic->id,
            'projectId' => $this->project->id,
            'success' => true,
            'prUrl' => 'https://github.com/acme/app/pull/42',
            'prNumber' => 42,
            'branch' => 'claudenest/epic-realtime-notifications-abc12345',
        ]);

        $epic->refresh();
        $this->assertSame('done', $epic->status);
        $this->assertNotNull($epic->completed_at);
        $this->assertSame('https://github.com/acme/app/pull/42', $epic->pr_url);
        $this->assertSame(42, $epic->pr_number);
        $this->assertSame(Epic::PR_STATE_OPEN, $epic->pr_state);
        // No merge reported → the terminal shipped flag stays false.
        $this->assertFalse($epic->pr_done);

        Event::assertDispatched(
            ProjectBroadcast::class,
            fn (ProjectBroadcast $e) => $e->message['type'] === 'epic:pr'
                && $e->message['success'] === true
                && $e->message['epic_id'] === $epic->id,
        );
    }

    #[Test]
    public function it_honours_an_explicit_pr_state_from_the_agent(): void
    {
        $epic = $this->epic();

        $this->dispatch([
            'epicId' => $epic->id,
            'success' => true,
            'prUrl' => 'https://github.com/acme/app/pull/7',
            'prNumber' => 7,
            'prState' => Epic::PR_STATE_MERGED,
        ]);

        $this->assertSame(Epic::PR_STATE_MERGED, $epic->refresh()->pr_state);
    }

    #[Test]
    public function it_sets_merged_state_and_pr_done_when_the_agent_reports_a_merge(): void
    {
        Event::fake([EpicUpdated::class]);
        $epic = $this->epic();

        $this->dispatch([
            'epicId' => $epic->id,
            'success' => true,
            'prUrl' => 'https://github.com/acme/app/pull/9',
            'prNumber' => 9,
            'merged' => true,
            // The agent may echo a stale "open" state — merged wins.
            'prState' => Epic::PR_STATE_OPEN,
        ]);

        $epic->refresh();
        $this->assertSame(Epic::PR_STATE_MERGED, $epic->pr_state);
        $this->assertTrue($epic->pr_done);
        $this->assertSame('done', $epic->status);

        // The board gets the merged markers in real time via EpicUpdated, whose
        // payload now carries pr_done/pr_state (see EpicUpdated::broadcastWith).
        Event::assertDispatched(
            EpicUpdated::class,
            fn (EpicUpdated $e) => $e->epic->id === $epic->id
                && $e->action === 'finalized'
                && $e->epic->pr_done === true
                && $e->epic->pr_state === Epic::PR_STATE_MERGED,
        );
    }

    #[Test]
    public function it_leaves_the_epic_open_when_the_pr_failed(): void
    {
        Event::fake([ProjectBroadcast::class]);
        $epic = $this->epic();

        $this->dispatch([
            'epicId' => $epic->id,
            'success' => false,
            'error' => 'git push rejected',
        ]);

        $epic->refresh();
        $this->assertSame('in_progress', $epic->status);
        $this->assertNull($epic->pr_url);
        $this->assertNull($epic->completed_at);

        Event::assertDispatched(
            ProjectBroadcast::class,
            fn (ProjectBroadcast $e) => $e->message['type'] === 'epic:pr'
                && $e->message['success'] === false,
        );
    }

    #[Test]
    public function it_is_a_silent_noop_for_an_unknown_epic(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->dispatch([
            'epicId' => '00000000-0000-0000-0000-000000000000',
            'success' => true,
            'prUrl' => 'https://github.com/acme/app/pull/1',
        ]);

        Event::assertNotDispatched(ProjectBroadcast::class);
    }

    #[Test]
    public function it_ignores_a_report_without_an_epic_id(): void
    {
        Event::fake([ProjectBroadcast::class]);

        $this->dispatch(['success' => true]);

        Event::assertNotDispatched(ProjectBroadcast::class);
    }
}
