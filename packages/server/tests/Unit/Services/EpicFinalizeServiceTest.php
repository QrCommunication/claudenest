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
                    && str_contains($payload['body'], 'Implement websocket channel');
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
}
