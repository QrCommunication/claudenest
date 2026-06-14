<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Auto-PR wiring: completing a sprint through the HTTP endpoint must trigger
 * SprintFinalizeService::dispatchPullRequest, which asks the project's agent to
 * open a pull request (sprint:finalize → git branch/commit/push + gh pr create).
 *
 * SprintFinalizeServiceTest already covers the service in isolation (online
 * dispatch vs offline skip). This test pins the controller→service wiring: that
 * the best-effort try/catch in SprintController::complete actually fires the
 * dispatch — a silently dropped call would otherwise pass the service unit test.
 */
class SprintCompletionTriggersPrTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create([
            'project_path' => '/home/dev/app',
        ]);
    }

    private function activeSprint(): Sprint
    {
        $sprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Auth & Billing',
            'goal' => 'Ship login',
            'status' => 'active',
            'sort_order' => 0,
        ]);

        SharedTask::factory()->for($this->project, 'project')->create([
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'title' => 'Implement login',
            'completed_at' => now(),
        ]);

        return $sprint;
    }

    #[Test]
    public function completing_a_sprint_dispatches_the_pull_request_to_the_agent(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $sprint = $this->activeSprint();

        $this->actingAs($this->user)
            ->postJson("/api/sprints/{$sprint->id}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        // The completion endpoint must have asked the agent to open the PR, with
        // the sprint's metadata and completed-task list in the payload.
        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($sprint) {
                return $machineId === $this->project->machine_id
                    && $type === 'sprint:finalize'
                    && $payload['sprintId'] === $sprint->id
                    && $payload['projectPath'] === '/home/dev/app'
                    && str_starts_with($payload['branch'], 'claudenest/sprint-auth-billing-')
                    && str_contains($payload['body'], 'Implement login');
            })
            ->once();
    }

    #[Test]
    public function re_completing_an_already_completed_sprint_does_not_dispatch_a_pull_request(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        $sprint = $this->activeSprint();
        $sprint->complete(); // already completed before the request

        $this->actingAs($this->user)
            ->postJson("/api/sprints/{$sprint->id}/complete")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'SPRINT_ALREADY_COMPLETED');

        // No duplicate PR for a sprint that was already finalised.
        $gateway->shouldNotHaveReceived('sendMessage');
    }
}
