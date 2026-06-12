<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\PersonalAccessToken;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * POST /api/projects/{project}/planning/session — spawn an interactive
 * planning agent session: scoped token with the 'planning' ability,
 * planner role system prompt (velocity guardrail + backlog snapshot),
 * brief as initial prompt, instance registered, orchestrated=false.
 */
class PlanningSessionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create(); // online by default
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create([
            'name' => 'Phoenix',
            'project_path' => '/home/user/projects/phoenix',
        ]);
    }

    #[Test]
    public function creates_planning_session_with_planning_token_planner_prompt_and_instance(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        // 3 completed sprints → average velocity (10 + 20 + 30) / 3 = 20
        foreach ([10, 20, 30] as $velocity) {
            $this->project->sprints()->create([
                'name' => "Sprint v{$velocity}",
                'status' => 'completed',
                'velocity' => $velocity,
            ]);
        }

        $response = $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/planning/session", [
                'brief' => 'Plan the authentication epic',
            ]);

        $response->assertCreated()->assertJson(['success' => true]);

        $session = Session::findOrFail($response->json('data.id'));

        $this->assertFalse($session->orchestrated);
        $this->assertSame('interactive', $session->mode);
        $this->assertSame($this->project->id, $session->shared_project_id);
        $this->assertSame('Plan the authentication epic', $session->initial_prompt);
        $this->assertSame('/home/user/projects/phoenix', $session->project_path);

        // Multi-agent instance registered for the session
        $this->assertDatabaseHas('claude_instances', [
            'id' => "inst-{$session->id}",
            'project_id' => $this->project->id,
            'session_id' => $session->id,
        ]);

        // Scoped token carries the planning ability on top of the worker ones
        $token = PersonalAccessToken::where('name', "mcp:{$session->id}")->firstOrFail();
        $this->assertContains('multiagent', $token->abilities);
        $this->assertContains('planning', $token->abilities);
        $this->assertContains("project:{$this->project->id}", $token->abilities);

        // session:create payload: planner role prompt with the velocity
        // guardrail, abilities env contract, brief as initial prompt.
        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($session) {
                return $machineId === $this->machine->id
                    && $type === 'session:create'
                    && $payload['sessionId'] === $session->id
                    && $payload['initialPrompt'] === 'Plan the authentication epic'
                    && $payload['permissionMode'] === 'default'
                    && $payload['mcpEnv']['CLAUDENEST_ABILITIES'] === 'multiagent,planning'
                    && str_contains($payload['appendSystemPrompt'], 'planning agent for project "Phoenix"')
                    && str_contains($payload['appendSystemPrompt'], 'Average velocity (last 3 sprints): 20 points')
                    && str_contains($payload['appendSystemPrompt'], 'Do NOT edit files');
            });
    }

    #[Test]
    public function planner_prompt_degrades_gracefully_without_completed_sprints(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/planning/session", [
                'brief' => 'Plan the first sprint',
            ])
            ->assertCreated();

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(fn (string $machineId, string $type, array $payload) => $type === 'session:create'
                && str_contains($payload['appendSystemPrompt'], 'no completed sprints yet'));
    }

    #[Test]
    public function brief_is_required_and_capped_at_4000_chars(): void
    {
        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/planning/session", [])
            ->assertStatus(422);

        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/planning/session", [
                'brief' => str_repeat('a', 4001),
            ])
            ->assertStatus(422);

        $this->assertSame(0, Session::count());
    }

    #[Test]
    public function fails_when_machine_is_offline(): void
    {
        $this->machine->update(['status' => 'offline']);

        $response = $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/planning/session", [
                'brief' => 'Plan something',
            ]);

        $response->assertStatus(400)->assertJsonPath('error.code', 'MCH_002');
        $this->assertSame(0, Session::count());
    }

    #[Test]
    public function rejects_unknown_credential(): void
    {
        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/planning/session", [
                'brief' => 'Plan something',
                'credential_id' => (string) Str::uuid(),
            ])
            ->assertStatus(422);
    }

    #[Test]
    public function forbids_projects_of_other_users(): void
    {
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->postJson("/api/projects/{$this->project->id}/planning/session", [
                'brief' => 'Plan something',
            ])
            ->assertStatus(403);
    }
}
