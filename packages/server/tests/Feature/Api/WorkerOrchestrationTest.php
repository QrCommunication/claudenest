<?php

namespace Tests\Feature\Api;

use App\Models\ClaudeInstance;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Server-driven worker pool: orchestrator start/stop/status + per-plan
 * concurrent agent caps (PLAN_001) on both session store and orchestrator start.
 */
class WorkerOrchestrationTest extends TestCase
{
    use RefreshDatabase;

    private function makeProject(User $user, Machine $machine): SharedProject
    {
        return SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/user/projects/orchestrated',
        ]);
    }

    #[Test]
    public function start_spawns_orchestrated_worker_sessions_with_instances_and_settings(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        SharedTask::factory()->count(2)->create(['project_id' => $project->id, 'status' => 'pending']);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/orchestrator/start", [
                'max_workers' => 3,
            ]);

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.status', 'running')
            ->assertJsonPath('data.active', true);

        // min(maxWorkers=3, cap remaining=3, max(1, pending=2)) = 2 workers
        $workers = Session::where('shared_project_id', $project->id)
            ->where('orchestrated', true)
            ->get();
        $this->assertCount(2, $workers);

        foreach ($workers as $worker) {
            $this->assertSame('interactive', $worker->mode);
            $this->assertSame('/home/user/projects/orchestrated', $worker->project_path);
            // Bootstrap prompt kicks the first turn so the Stop-hook idle
            // heartbeat can ever fire (without it the worker sits inert).
            $this->assertNotEmpty($worker->initial_prompt);
            $this->assertStringContainsString('task_claim_next', $worker->initial_prompt);
            $this->assertDatabaseHas('claude_instances', [
                'id' => "inst-{$worker->id}",
                'project_id' => $project->id,
                'session_id' => $worker->id,
            ]);
        }

        // Orchestration state persisted in project settings
        $project->refresh();
        $orchestration = $project->getSetting('orchestration');
        $this->assertTrue($orchestration['active']);
        $this->assertSame(3, $orchestration['max_workers']);
        $this->assertSame('acceptEdits', $orchestration['permission_mode']);
        $this->assertNotEmpty($orchestration['started_at']);

        // Same camelCase session:create contract as SessionController::store
        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($machine, $project) {
                return $machineId === $machine->id
                    && $type === 'session:create'
                    && ($payload['sharedProjectId'] ?? null) === $project->id
                    && ($payload['permissionMode'] ?? null) === 'acceptEdits'
                    && isset($payload['sessionId'], $payload['mode'], $payload['projectPath'], $payload['instanceId'], $payload['mcpEnv'], $payload['appendSystemPrompt']);
            })
            ->twice();
    }

    #[Test]
    public function start_caps_workers_to_remaining_plan_slots(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create(); // community plan → cap 3
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        // 2 active sessions already → 1 slot remaining
        Session::factory()->count(2)->for($machine)->for($user)->create(['status' => 'running']);
        SharedTask::factory()->count(5)->create(['project_id' => $project->id, 'status' => 'pending']);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/orchestrator/start", [
                'max_workers' => 5,
            ]);

        $response->assertOk();

        $this->assertSame(
            1,
            Session::where('shared_project_id', $project->id)->where('orchestrated', true)->count(),
        );
    }

    #[Test]
    public function start_returns_403_plan_001_when_cap_exhausted(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create(); // community plan → cap 3
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        Session::factory()->count(3)->for($machine)->for($user)->create(['status' => 'running']);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/orchestrator/start", [
                'max_workers' => 2,
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'PLAN_001');

        $this->assertSame(0, Session::where('orchestrated', true)->count());
        $this->assertNull($project->fresh()->getSetting('orchestration'));
    }

    #[Test]
    public function start_returns_422_when_machine_is_offline(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->offline()->create();
        $project = $this->makeProject($user, $machine);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/orchestrator/start", [
                'max_workers' => 2,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'MACHINE_OFFLINE');
    }

    #[Test]
    public function session_store_returns_403_plan_001_when_cap_exhausted(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create(); // community plan → cap 3
        $machine = Machine::factory()->for($user)->create();

        Session::factory()->count(3)->for($machine)->for($user)->create(['status' => 'running']);

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'PLAN_001');

        $this->assertSame(3, Session::forUser($user->id)->count());
    }

    #[Test]
    public function session_store_respects_higher_plan_caps(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create(['plan' => 'pro']); // cap 20
        $machine = Machine::factory()->for($user)->create();

        Session::factory()->count(3)->for($machine)->for($user)->create(['status' => 'running']);

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
            ]);

        $response->assertStatus(201);
    }

    #[Test]
    public function completed_sessions_do_not_count_toward_the_cap(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create(); // community plan → cap 3
        $machine = Machine::factory()->for($user)->create();

        Session::factory()->count(3)->for($machine)->for($user)->completed()->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
            ]);

        $response->assertStatus(201);
    }

    #[Test]
    public function stop_terminates_orchestrated_sessions_and_marks_settings_inactive(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);
        $project->setSetting('orchestration', [
            'active' => true,
            'max_workers' => 2,
            'permission_mode' => 'acceptEdits',
            'started_at' => now()->toIso8601String(),
        ]);

        $workers = Session::factory()->count(2)->for($machine)->for($user)->create([
            'shared_project_id' => $project->id,
            'orchestrated' => true,
            'status' => 'running',
        ]);

        foreach ($workers as $worker) {
            ClaudeInstance::create([
                'id' => "inst-{$worker->id}",
                'project_id' => $project->id,
                'machine_id' => $machine->id,
                'session_id' => $worker->id,
                'status' => 'idle',
                'context_tokens' => 0,
                'max_context_tokens' => 200_000,
                'tasks_completed' => 0,
                'connected_at' => now(),
                'last_activity_at' => now(),
            ]);
        }

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/orchestrator/stop");

        $response->assertOk()->assertJson(['success' => true]);

        foreach ($workers as $worker) {
            $this->assertSame('terminated', $worker->fresh()->status);
            $this->assertSame('disconnected', ClaudeInstance::find("inst-{$worker->id}")->status);

            $gateway->shouldHaveReceived('sendMessage')
                ->with($machine->id, 'session:terminate', ['sessionId' => $worker->id]);
        }

        $orchestration = $project->fresh()->getSetting('orchestration');
        $this->assertFalse($orchestration['active']);
        $this->assertNotEmpty($orchestration['stopped_at']);
    }

    #[Test]
    public function status_reports_workers_and_task_counters(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);
        $project->setSetting('orchestration', [
            'active' => true,
            'max_workers' => 2,
            'permission_mode' => 'acceptEdits',
            'started_at' => now()->toIso8601String(),
        ]);

        $worker = Session::factory()->for($machine)->for($user)->create([
            'shared_project_id' => $project->id,
            'orchestrated' => true,
            'status' => 'running',
        ]);
        ClaudeInstance::create([
            'id' => "inst-{$worker->id}",
            'project_id' => $project->id,
            'machine_id' => $machine->id,
            'session_id' => $worker->id,
            'status' => 'busy',
            'context_tokens' => 0,
            'max_context_tokens' => 200_000,
            'tasks_completed' => 4,
            'connected_at' => now(),
            'last_activity_at' => now(),
        ]);

        SharedTask::factory()->create(['project_id' => $project->id, 'status' => 'pending']);
        SharedTask::factory()->create(['project_id' => $project->id, 'status' => 'in_progress']);
        SharedTask::factory()->completed()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/orchestrator/status");

        $response->assertOk()
            ->assertJsonPath('data.status', 'running')
            ->assertJsonPath('data.active', true)
            ->assertJsonPath('data.workers.0.id', "inst-{$worker->id}")
            ->assertJsonPath('data.workers.0.sessionId', $worker->id)
            ->assertJsonPath('data.workers.0.tasksCompleted', 4)
            ->assertJsonPath('data.tasks.pending', 1)
            ->assertJsonPath('data.tasks.in_progress', 1)
            ->assertJsonPath('data.tasks.done', 1)
            ->assertJsonPath('data.pendingTasks', 1)
            ->assertJsonPath('data.completedTasks', 1);
    }
}
