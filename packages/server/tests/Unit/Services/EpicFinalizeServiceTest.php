<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\AgentGateway;
use App\Services\EpicFinalizeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EpicFinalizeServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeEpic(string $machineStatus): Epic
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create(['status' => $machineStatus]);
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/dev/app',
        ]);

        $epic = Epic::create([
            'project_id' => $project->id,
            'title' => 'Realtime Notifications',
            'description' => 'Push + in-app alerts',
            'status' => 'done',
            'priority' => 'medium',
        ]);
        SharedTask::factory()->create([
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'status' => 'done',
            'title' => 'Implement websocket channel',
        ]);

        return $epic;
    }

    #[Test]
    public function it_dispatches_epic_finalize_and_stamps_the_intent_when_online(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $epic = $this->makeEpic('online');

        $result = app(EpicFinalizeService::class)->dispatchPullRequest($epic);

        $this->assertTrue($result);

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($epic) {
                return $type === 'epic:finalize'
                    && $payload['epicId'] === $epic->id
                    && $payload['projectPath'] === '/home/dev/app'
                    && str_starts_with($payload['branch'], 'claudenest/epic-realtime-notifications-')
                    && str_contains($payload['body'], 'Implement websocket channel')
                    && $payload['merge'] === true;
            })
            ->once();

        $epic->refresh();
        $this->assertStringStartsWith('claudenest/epic-realtime-notifications-', (string) $epic->pr_branch);
        $this->assertNotNull($epic->finalized_at);
        // The PR itself is opened by the agent later — no url/state stamped yet.
        $this->assertNull($epic->pr_url);
        $this->assertNull($epic->pr_state);
    }

    #[Test]
    public function it_skips_dispatch_when_machine_is_offline(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $epic = $this->makeEpic('offline');

        $result = app(EpicFinalizeService::class)->dispatchPullRequest($epic);

        $this->assertFalse($result);
        $gateway->shouldNotHaveReceived('sendMessage');

        $epic->refresh();
        $this->assertNull($epic->pr_branch);
        $this->assertNull($epic->finalized_at);
    }

    private function makeProject(string $machineStatus = 'online'): SharedProject
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create(['status' => $machineStatus]);

        return SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/dev/app',
        ]);
    }

    private function makeEpicIn(SharedProject $project, array $attributes): Epic
    {
        return Epic::create(array_merge([
            'project_id' => $project->id,
            'title' => 'Epic',
            'priority' => 'medium',
        ], $attributes));
    }

    #[Test]
    public function it_backfills_only_unshipped_done_active_previous_siblings(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $project = $this->makeProject('online');

        // Earlier, completed, never shipped → SHOULD be backfilled.
        $unshipped = $this->makeEpicIn($project, [
            'title' => 'Foundations',
            'status' => 'done',
            'sort_order' => 0,
            'pr_done' => false,
        ]);
        // Earlier but already shipped → skipped (pr_done).
        $this->makeEpicIn($project, [
            'title' => 'Already merged',
            'status' => 'done',
            'sort_order' => 1,
            'pr_done' => true,
        ]);
        // Earlier but still open → skipped (not done).
        $this->makeEpicIn($project, [
            'title' => 'Still open',
            'status' => 'open',
            'sort_order' => 2,
            'pr_done' => false,
        ]);
        // Earlier, done, unshipped BUT archived → skipped (not active).
        $this->makeEpicIn($project, [
            'title' => 'Archived done',
            'status' => 'done',
            'sort_order' => 3,
            'pr_done' => false,
            'archived_at' => now(),
        ]);
        // The epic being finalized (reference) — excluded from its own siblings.
        $current = $this->makeEpicIn($project, [
            'title' => 'Latest',
            'status' => 'done',
            'sort_order' => 4,
            'pr_done' => false,
        ]);

        $count = app(EpicFinalizeService::class)->backfillPreviousEpics($current);

        $this->assertSame(1, $count);

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($unshipped) {
                return $type === 'epic:finalize'
                    && $payload['epicId'] === $unshipped->id
                    && $payload['merge'] === true;
            })
            ->once();

        // Only the single unshipped sibling was dispatched.
        $gateway->shouldHaveReceived('sendMessage')->once();

        $unshipped->refresh();
        $this->assertNotNull($unshipped->finalized_at);
        $this->assertStringStartsWith('claudenest/epic-foundations-', (string) $unshipped->pr_branch);
    }

    #[Test]
    public function it_backfills_nothing_for_the_first_epic(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $project = $this->makeProject('online');

        $first = $this->makeEpicIn($project, [
            'title' => 'First',
            'status' => 'done',
            'sort_order' => 0,
            'pr_done' => false,
        ]);

        $count = app(EpicFinalizeService::class)->backfillPreviousEpics($first);

        $this->assertSame(0, $count);
        $gateway->shouldNotHaveReceived('sendMessage');
    }

    #[Test]
    public function backfill_converges_once_the_sibling_pr_is_marked_done(): void
    {
        $this->spy(AgentGateway::class);
        $project = $this->makeProject('online');

        // Earlier done/unshipped sibling + the epic being finalized.
        $sibling = $this->makeEpicIn($project, [
            'title' => 'Foundations',
            'status' => 'done',
            'sort_order' => 0,
            'pr_done' => false,
        ]);
        $current = $this->makeEpicIn($project, [
            'title' => 'Latest',
            'status' => 'done',
            'sort_order' => 1,
            'pr_done' => false,
        ]);

        $service = app(EpicFinalizeService::class);

        // First pass dispatches the unshipped sibling's PR.
        $this->assertSame(1, $service->backfillPreviousEpics($current));

        // The agent merges it and reports back → onEpicFinalized stamps pr_done.
        $sibling->update(['pr_done' => true]);

        // Second pass converges: the now-shipped sibling is skipped, so a repeat
        // finalize never re-spams already-merged work.
        $this->assertSame(0, $service->backfillPreviousEpics($current));
    }
}
