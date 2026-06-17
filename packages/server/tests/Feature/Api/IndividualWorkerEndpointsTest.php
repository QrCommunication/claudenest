<?php

namespace Tests\Feature\Api;

use App\Models\ClaudeCredential;
use App\Models\ClaudeInstance;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Individual worker control endpoints (independent of orchestrator start/stop):
 *  - POST   /api/projects/{project}/workers              → spawn one worker
 *  - DELETE /api/projects/{project}/workers/{session}    → terminate one worker
 *
 * Both are scoped to the owning user (getUserProject filters by user_id) and,
 * for terminate, to orchestrated sessions of that project — a plain interactive
 * session is managed through SessionController::destroy, not here.
 */
class IndividualWorkerEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function makeProject(User $user, Machine $machine, string $path = '/home/user/projects/worker-control'): SharedProject
    {
        // project_path is unique per machine, so callers that create two
        // projects on the same machine must pass distinct paths.
        return SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => $path,
        ]);
    }

    // ==================== spawnWorker ====================

    #[Test]
    public function spawn_worker_creates_an_orchestrated_session_and_notifies_the_agent(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/workers");

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.orchestrated', true)
            ->assertJsonPath('data.mode', 'interactive')
            ->assertJsonPath('data.shared_project_id', $project->id);

        $worker = Session::where('shared_project_id', $project->id)
            ->where('orchestrated', true)
            ->first();
        $this->assertNotNull($worker);
        $this->assertSame($machine->id, $worker->machine_id);
        // Bootstrap prompt is required so the Stop-hook idle heartbeat can fire.
        $this->assertNotEmpty($worker->initial_prompt);

        // Same camelCase session:create contract as the orchestrator/start path.
        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($machine, $project) {
                return $machineId === $machine->id
                    && $type === 'session:create'
                    && ($payload['sharedProjectId'] ?? null) === $project->id;
            })
            ->once();
    }

    #[Test]
    public function spawn_worker_returns_422_when_the_machine_is_offline(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->offline()->create();
        $project = $this->makeProject($user, $machine);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/workers")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'MACHINE_OFFLINE');

        $this->assertSame(0, Session::where('shared_project_id', $project->id)->count());
    }

    #[Test]
    public function spawn_worker_returns_404_for_a_project_owned_by_another_user(): void
    {
        $this->spy(AgentGateway::class);

        $owner = User::factory()->create();
        $machine = Machine::factory()->for($owner)->create();
        $project = $this->makeProject($owner, $machine);

        $intruder = User::factory()->create();

        $this->actingAs($intruder)
            ->postJson("/api/projects/{$project->id}/workers")
            ->assertStatus(404)
            ->assertJsonPath('error.code', 'CTX_001');

        $this->assertSame(0, Session::where('shared_project_id', $project->id)->count());
    }

    #[Test]
    public function spawn_worker_rejects_a_credential_belonging_to_another_user(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        // A credential owned by a DIFFERENT user — the SpawnWorkerRequest
        // Rule::exists is scoped to the requesting user (IDOR guard).
        $otherUser = User::factory()->create();
        $foreignCredential = ClaudeCredential::create([
            'user_id' => $otherUser->id,
            'name' => 'foreign',
            'auth_type' => 'oauth',
            'is_default' => true,
            'access_token_enc' => Crypt::encryptString('tok-foreign'),
            'expires_at' => now()->addHours(8),
        ]);

        // Validation errors are reformatted into the app's {success,error}
        // envelope (code VAL_001, field errors under error.details).
        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/workers", [
                'credential_id' => $foreignCredential->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure(['error' => ['details' => ['credential_id']]]);

        $this->assertSame(0, Session::where('shared_project_id', $project->id)->count());
    }

    #[Test]
    public function spawn_worker_runs_under_the_selected_credential(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        $default = ClaudeCredential::create([
            'user_id' => $user->id, 'name' => 'default', 'auth_type' => 'oauth', 'is_default' => true,
            'access_token_enc' => Crypt::encryptString('tok-default'),
            'expires_at' => now()->addHours(8),
        ]);
        $selected = ClaudeCredential::create([
            'user_id' => $user->id, 'name' => 'selected', 'auth_type' => 'oauth', 'is_default' => false,
            'access_token_enc' => Crypt::encryptString('tok-selected'),
            'expires_at' => now()->addHours(8),
        ]);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/workers", [
                'permission_mode' => 'acceptEdits',
                'credential_id' => $selected->id,
            ])
            ->assertStatus(201);

        $worker = Session::where('shared_project_id', $project->id)->where('orchestrated', true)->first();
        $this->assertNotNull($worker);
        $this->assertSame($selected->id, $worker->credential_id);
        $this->assertNotSame($default->id, $worker->credential_id);
    }

    // ==================== terminateWorker ====================

    #[Test]
    public function terminate_worker_marks_the_session_terminated_and_notifies_the_agent(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

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
            'tasks_completed' => 0,
            'connected_at' => now(),
            'last_activity_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}/workers/{$worker->id}");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.status', 'terminated')
            ->assertJsonPath('data.session_id', $worker->id);

        $this->assertSame('terminated', $worker->fresh()->status);
        // Multi-agent teardown disconnects the instance.
        $this->assertSame('disconnected', ClaudeInstance::find("inst-{$worker->id}")->status);

        $gateway->shouldHaveReceived('sendMessage')
            ->with($machine->id, 'session:terminate', ['sessionId' => $worker->id])
            ->once();
    }

    #[Test]
    public function terminate_worker_returns_404_for_a_non_orchestrated_session(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        // A plain interactive session (orchestrated = false) is NOT reachable
        // through the worker control surface.
        $session = Session::factory()->for($machine)->for($user)->create([
            'shared_project_id' => $project->id,
            'orchestrated' => false,
            'status' => 'running',
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}/workers/{$session->id}")
            ->assertStatus(404)
            ->assertJsonPath('error.code', 'SES_005');

        $this->assertSame('running', $session->fresh()->status);
        $gateway->shouldNotHaveReceived('sendMessage');
    }

    #[Test]
    public function terminate_worker_returns_404_for_a_session_in_another_project(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine, '/home/user/projects/wc-a');
        $otherProject = $this->makeProject($user, $machine, '/home/user/projects/wc-b');

        $worker = Session::factory()->for($machine)->for($user)->create([
            'shared_project_id' => $otherProject->id,
            'orchestrated' => true,
            'status' => 'running',
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}/workers/{$worker->id}")
            ->assertStatus(404)
            ->assertJsonPath('error.code', 'SES_005');

        $this->assertSame('running', $worker->fresh()->status);
    }

    #[Test]
    public function terminate_worker_returns_400_when_the_session_is_already_finished(): void
    {
        $this->spy(AgentGateway::class);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = $this->makeProject($user, $machine);

        $worker = Session::factory()->for($machine)->for($user)->create([
            'shared_project_id' => $project->id,
            'orchestrated' => true,
            'status' => 'terminated',
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}/workers/{$worker->id}")
            ->assertStatus(400)
            ->assertJsonPath('error.code', 'SES_003');
    }

    #[Test]
    public function terminate_worker_returns_404_for_a_project_owned_by_another_user(): void
    {
        $this->spy(AgentGateway::class);

        $owner = User::factory()->create();
        $machine = Machine::factory()->for($owner)->create();
        $project = $this->makeProject($owner, $machine);

        $worker = Session::factory()->for($machine)->for($owner)->create([
            'shared_project_id' => $project->id,
            'orchestrated' => true,
            'status' => 'running',
        ]);

        $intruder = User::factory()->create();

        $this->actingAs($intruder)
            ->deleteJson("/api/projects/{$project->id}/workers/{$worker->id}")
            ->assertStatus(404)
            ->assertJsonPath('error.code', 'CTX_001');

        $this->assertSame('running', $worker->fresh()->status);
    }
}
