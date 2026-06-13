<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use App\Services\AgentGateway;
use App\Services\SprintFinalizeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SprintFinalizeServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeSprint(string $machineStatus): Sprint
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create(['status' => $machineStatus]);
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/dev/app',
        ]);

        $sprint = Sprint::create([
            'project_id' => $project->id,
            'name' => 'Auth & Billing',
            'goal' => 'Ship login',
            'status' => 'completed',
            'velocity' => 8,
        ]);
        SharedTask::factory()->create([
            'project_id' => $project->id,
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'title' => 'Implement login',
        ]);

        return $sprint;
    }

    #[Test]
    public function it_dispatches_sprint_finalize_to_the_agent_when_machine_online(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $sprint = $this->makeSprint('online');

        app(SprintFinalizeService::class)->dispatchPullRequest($sprint);

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($sprint) {
                return $type === 'sprint:finalize'
                    && $payload['sprintId'] === $sprint->id
                    && $payload['projectPath'] === '/home/dev/app'
                    && str_starts_with($payload['branch'], 'claudenest/sprint-auth-billing-')
                    && str_contains($payload['body'], 'Implement login');
            })
            ->once();
    }

    #[Test]
    public function it_skips_dispatch_when_machine_is_offline(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $sprint = $this->makeSprint('offline');

        app(SprintFinalizeService::class)->dispatchPullRequest($sprint);

        $gateway->shouldNotHaveReceived('sendMessage');
    }
}
