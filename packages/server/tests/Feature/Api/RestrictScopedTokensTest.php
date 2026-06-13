<?php

namespace Tests\Feature\Api;

use PHPUnit\Framework\Attributes\Test;

use App\Models\ClaudeInstance;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\PersonalAccessToken;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestrictScopedTokensTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    private Session $session;

    private string $scopedToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create();
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create();
        $this->session = Session::factory()->for($this->machine)->for($this->user)->create([
            'shared_project_id' => $this->project->id,
            'status' => 'running',
        ]);

        $token = PersonalAccessToken::createForUser(
            $this->user->id,
            "mcp:{$this->session->id}",
            ['multiagent', "project:{$this->project->id}"],
        );
        $this->scopedToken = $token['plainTextToken'];
    }

    private function withScopedToken(): static
    {
        return $this->withHeader('Authorization', 'Bearer ' . $this->scopedToken);
    }

    /**
     * Token of a planning agent session: same project scoping, plus the
     * 'planning' ability (epics/sprints CRUD + task edition).
     */
    private function withPlanningToken(): static
    {
        $token = PersonalAccessToken::createForUser(
            $this->user->id,
            "mcp:{$this->session->id}",
            ['multiagent', 'planning', "project:{$this->project->id}"],
        );

        return $this->withHeader('Authorization', 'Bearer ' . $token['plainTextToken']);
    }

    #[Test]
    public function scoped_token_can_list_tasks_of_its_project(): void
    {
        SharedTask::factory()->count(2)->create(['project_id' => $this->project->id]);

        $response = $this->withScopedToken()
            ->getJson("/api/projects/{$this->project->id}/tasks");

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function scoped_token_can_claim_a_task_of_its_project(): void
    {
        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'pending',
            'assigned_to' => null,
            'dependencies' => [],
        ]);

        $response = $this->withScopedToken()
            ->postJson("/api/tasks/{$task->id}/claim", [
                'instance_id' => "inst-{$this->session->id}",
            ]);

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function scoped_token_cannot_access_credentials(): void
    {
        $response = $this->withScopedToken()->getJson('/api/credentials');

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function scoped_token_cannot_list_machines(): void
    {
        $response = $this->withScopedToken()->getJson('/api/machines');

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function scoped_token_cannot_access_tasks_of_another_project(): void
    {
        $otherProject = SharedProject::factory()->for($this->user)->for($this->machine)->create();

        $response = $this->withScopedToken()
            ->getJson("/api/projects/{$otherProject->id}/tasks");

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function scoped_token_cannot_claim_a_task_of_another_project(): void
    {
        $otherProject = SharedProject::factory()->for($this->user)->for($this->machine)->create();
        $foreignTask = SharedTask::factory()->create([
            'project_id' => $otherProject->id,
            'status' => 'pending',
        ]);

        $response = $this->withScopedToken()
            ->postJson("/api/tasks/{$foreignTask->id}/claim", [
                'instance_id' => "inst-{$this->session->id}",
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function scoped_token_can_heartbeat_its_own_instance(): void
    {
        ClaudeInstance::create([
            'id' => "inst-{$this->session->id}",
            'project_id' => $this->project->id,
            'machine_id' => $this->machine->id,
            'session_id' => $this->session->id,
            'status' => 'idle',
            'connected_at' => now(),
            'last_activity_at' => now(),
        ]);

        $response = $this->withScopedToken()
            ->postJson('/api/instances/inst-' . $this->session->id . '/heartbeat', [
                'status' => 'busy',
            ]);

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function scoped_token_cannot_heartbeat_an_instance_of_another_project(): void
    {
        $otherProject = SharedProject::factory()->for($this->user)->for($this->machine)->create();
        ClaudeInstance::create([
            'id' => 'inst-foreign',
            'project_id' => $otherProject->id,
            'machine_id' => $this->machine->id,
            'status' => 'idle',
            'connected_at' => now(),
            'last_activity_at' => now(),
        ]);

        $response = $this->withScopedToken()
            ->postJson('/api/instances/inst-foreign/heartbeat', [
                'status' => 'busy',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function scoped_token_can_send_a_notification_for_its_session(): void
    {
        $response = $this->withScopedToken()
            ->postJson("/api/sessions/{$this->session->id}/notification", [
                'message' => 'Task API-42 completed',
                'notification_type' => 'task_update',
            ]);

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function scoped_token_cannot_terminate_its_session(): void
    {
        $response = $this->withScopedToken()
            ->deleteJson("/api/sessions/{$this->session->id}");

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function full_access_token_is_not_affected(): void
    {
        $token = PersonalAccessToken::createForUser($this->user->id, 'full-access', ['*']);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token['plainTextToken'])
            ->getJson('/api/credentials');

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function cookie_session_auth_is_not_affected(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/credentials');

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function scoped_token_can_read_its_project_but_not_modify_it(): void
    {
        $read = $this->withScopedToken()->getJson("/api/projects/{$this->project->id}");
        $read->assertOk();

        $write = $this->withScopedToken()->patchJson("/api/projects/{$this->project->id}", [
            'name' => 'hijacked',
        ]);
        $write->assertStatus(403)
            ->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function scoped_token_can_use_context_and_locks_and_broadcast(): void
    {
        $context = $this->withScopedToken()
            ->getJson("/api/projects/{$this->project->id}/context");
        $context->assertOk();

        $lock = $this->withScopedToken()
            ->postJson("/api/projects/{$this->project->id}/locks", [
                'path' => 'src/feature.ts',
                'instance_id' => "inst-{$this->session->id}",
                'reason' => 'editing',
            ]);
        $this->assertContains($lock->getStatusCode(), [200, 201]);

        $broadcast = $this->withScopedToken()
            ->postJson("/api/projects/{$this->project->id}/broadcast", [
                'message' => 'Starting work on auth module',
            ]);
        $broadcast->assertOk();
    }

    // ==================== PLANNING ABILITY ====================

    #[Test]
    public function planning_token_can_create_an_epic(): void
    {
        $response = $this->withPlanningToken()
            ->postJson("/api/projects/{$this->project->id}/epics", [
                'title' => 'Authentication epic',
            ]);

        $response->assertStatus(201)->assertJson(['success' => true]);
        $this->assertDatabaseHas('epics', [
            'project_id' => $this->project->id,
            'title' => 'Authentication epic',
        ]);
    }

    #[Test]
    public function worker_token_cannot_create_an_epic(): void
    {
        $response = $this->withScopedToken()
            ->postJson("/api/projects/{$this->project->id}/epics", [
                'title' => 'Authentication epic',
            ]);

        $response->assertStatus(403)->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function planning_token_can_update_a_task(): void
    {
        $task = SharedTask::factory()->create(['project_id' => $this->project->id]);

        $response = $this->withPlanningToken()
            ->patchJson("/api/tasks/{$task->id}", ['story_points' => 5]);

        $response->assertOk()->assertJsonPath('data.story_points', 5);
    }

    #[Test]
    public function worker_token_cannot_update_a_task(): void
    {
        $task = SharedTask::factory()->create(['project_id' => $this->project->id]);

        $response = $this->withScopedToken()
            ->patchJson("/api/tasks/{$task->id}", ['story_points' => 5]);

        $response->assertStatus(403)->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function planning_token_can_start_a_sprint_of_its_project(): void
    {
        $sprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 1',
            'status' => 'planning',
        ]);

        $response = $this->withPlanningToken()
            ->postJson("/api/sprints/{$sprint->id}/start");

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function planning_token_can_launch_execution_of_its_project(): void
    {
        // The planner launches the worker pool — agent side effects spied out.
        $this->spy(\App\Services\AgentGateway::class);
        $this->machine->update(['status' => 'online']);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending']);

        $response = $this->withPlanningToken()
            ->postJson("/api/projects/{$this->project->id}/orchestrator/start", [
                'max_workers' => 2,
            ]);

        $response->assertOk()->assertJson(['success' => true]);
    }

    #[Test]
    public function worker_token_cannot_launch_execution(): void
    {
        $response = $this->withScopedToken()
            ->postJson("/api/projects/{$this->project->id}/orchestrator/start", [
                'max_workers' => 2,
            ]);

        $response->assertStatus(403)->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function planning_token_cannot_touch_epics_of_another_project(): void
    {
        // Same OWNER — the policy would allow it; only the middleware's
        // project scoping must block cross-project access.
        $otherProject = SharedProject::factory()->for($this->user)->for($this->machine)->create();
        $epic = Epic::create([
            'project_id' => $otherProject->id,
            'title' => 'Foreign epic',
            'status' => 'open',
            'priority' => 'medium',
            'sort_order' => 1,
        ]);

        $response = $this->withPlanningToken()
            ->patchJson("/api/epics/{$epic->id}", ['title' => 'hijacked']);

        $response->assertStatus(403)->assertJsonPath('error.code', 'AUTH_003');
    }

    #[Test]
    public function worker_token_cannot_touch_sprints(): void
    {
        $sprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 1',
            'status' => 'planning',
        ]);

        $response = $this->withScopedToken()
            ->postJson("/api/sprints/{$sprint->id}/start");

        $response->assertStatus(403)->assertJsonPath('error.code', 'AUTH_003');
    }
}
