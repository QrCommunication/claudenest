<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Git worktree + PR endpoints: each dispatches to the agent via
 * AgentGateway::sendAndWait (mocked here) and shapes the response. Ownership +
 * machine-online guards are enforced before any dispatch.
 */
class GitControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create([
            'status' => 'online',
        ]);
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create([
            'project_path' => '/home/dev/app',
        ]);
    }

    #[Test]
    public function status_returns_the_agent_worktree_snapshot(): void
    {
        $this->mock(AgentGateway::class)
            ->shouldReceive('sendMessageAndWait')
            ->once()
            ->andReturn([
                'branch' => 'main',
                'ahead' => 1,
                'behind' => 0,
                'clean' => false,
                'files' => [['code' => ' M', 'path' => 'src/a.ts']],
                'remoteUrl' => 'git@github.com:org/repo.git',
                'lastCommit' => 'abc123 work',
                'sandboxed' => true,
            ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/git/status");

        $response->assertOk()
            ->assertJsonPath('data.branch', 'main')
            ->assertJsonPath('data.ahead', 1)
            ->assertJsonPath('data.clean', false)
            ->assertJsonPath('data.remote_url', 'git@github.com:org/repo.git')
            ->assertJsonPath('data.sandboxed', true);
    }

    #[Test]
    public function pulls_returns_the_open_pull_requests(): void
    {
        $this->mock(AgentGateway::class)
            ->shouldReceive('sendMessageAndWait')
            ->once()
            ->andReturn(['prs' => [['number' => 40, 'title' => 'Sprint X']], 'sandboxed' => true]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/pulls");

        $response->assertOk()
            ->assertJsonPath('data.pulls.0.number', 40)
            ->assertJsonPath('data.pulls.0.title', 'Sprint X');
    }

    #[Test]
    public function merge_passes_method_to_the_agent_and_confirms(): void
    {
        $this->mock(AgentGateway::class)
            ->shouldReceive('sendMessageAndWait')
            ->once()
            ->withArgs(function (string $machineId, string $type, array $payload): bool {
                return $type === 'pr:merge'
                    && $payload['number'] === 40
                    && $payload['method'] === 'rebase'
                    && $payload['deleteBranch'] === false;
            })
            ->andReturn(['merged' => true, 'number' => 40, 'sandboxed' => true]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/pulls/40/merge", [
                'method' => 'rebase',
                'delete_branch' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.merged', true)
            ->assertJsonPath('data.number', 40);
    }

    #[Test]
    public function merge_failure_is_surfaced_as_422(): void
    {
        $this->mock(AgentGateway::class)
            ->shouldReceive('sendMessageAndWait')
            ->once()
            ->andReturn(['merged' => false, 'error' => 'Pull request is not mergeable']);

        $response = $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/pulls/9/merge");

        $response->assertStatus(422)->assertJsonPath('error.code', 'PR_MERGE_ERROR');
    }

    #[Test]
    public function agent_timeout_returns_504(): void
    {
        $this->mock(AgentGateway::class)
            ->shouldReceive('sendMessageAndWait')
            ->once()
            ->andReturn(null);

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/git/status");

        $response->assertStatus(504)->assertJsonPath('error.code', 'AGENT_TIMEOUT');
    }

    #[Test]
    public function another_users_project_is_forbidden(): void
    {
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger)
            ->getJson("/api/projects/{$this->project->id}/git/status");

        $response->assertStatus(403)->assertJsonPath('error.code', 'FORBIDDEN');
    }

    #[Test]
    public function offline_machine_returns_422(): void
    {
        $this->project->machine->update(['status' => 'offline']);

        $response = $this->actingAs($this->user)
            ->getJson("/api/projects/{$this->project->id}/pulls");

        $response->assertStatus(422)->assertJsonPath('error.code', 'MACHINE_OFFLINE');
    }
}
