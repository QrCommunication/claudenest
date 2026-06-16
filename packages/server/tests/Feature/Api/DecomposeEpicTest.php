<?php

namespace Tests\Feature\Api;

use App\Models\ClaudeCredential;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * `decomposeEpic` — the "decompose with AI" entry point: create the epic
 * up-front in `pending`, persist the PRD on the project, spawn an interactive
 * decompose session, then flip the epic to `running` linked to that session.
 *
 * POST /api/projects/{project}/epics/decompose
 */
class DecomposeEpicTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create();
    }

    private function makeCredential(): ClaudeCredential
    {
        return ClaudeCredential::create([
            'user_id' => $this->user->id,
            'name' => 'api-cred',
            'auth_type' => 'api_key',
            'is_default' => true,
            'token_status' => 'active',
        ]);
    }

    /** A credential whose session env resolves cleanly + a silenced agent gateway. */
    private function mockUsableCredentialAndGateway(): void
    {
        $this->mock(CredentialService::class, function ($mock) {
            $mock->shouldReceive('getSessionEnv')->andReturn(['CLAUDE_CODE_OAUTH_TOKEN' => 'x']);
        });
        $this->mock(AgentGateway::class, function ($mock) {
            $mock->shouldReceive('sendMessage');
        });
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Realtime notifications',
            'prd' => str_repeat('Build a realtime notification system. ', 3),
            'credential_id' => $this->makeCredential()->id,
        ], $overrides);
    }

    #[Test]
    public function it_creates_an_epic_in_running_state_and_launches_a_decompose_session(): void
    {
        $this->mockUsableCredentialAndGateway();

        $response = $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/epics/decompose", $this->payload([
                'title' => 'Realtime notifications',
                'prd' => str_repeat('Build a realtime notification system. ', 3),
            ]));

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'decomposing')
            ->assertJsonPath('data.epic.title', 'Realtime notifications')
            ->assertJsonPath('data.epic.decomposition_status', Epic::DECOMPOSITION_RUNNING);

        $epic = Epic::where('project_id', $this->project->id)->firstOrFail();
        $sessionId = $response->json('data.session_id');

        // Epic linked to the spawned session, in `running`.
        $this->assertSame(Epic::DECOMPOSITION_RUNNING, $epic->decomposition_status);
        $this->assertSame($sessionId, $epic->decomposition_session_id);
        $this->assertNull($epic->decomposition_error);

        // The session reads the PRD off the project — it must be persisted.
        $this->assertStringContainsString('realtime notification', strtolower((string) $this->project->fresh()->prd));

        // A session row was actually created for this project (Session maps to
        // the `claude_sessions` table, not the framework `sessions` store).
        $this->assertTrue(
            Session::whereKey($sessionId)->where('shared_project_id', $this->project->id)->exists(),
        );
    }

    #[Test]
    public function it_403s_when_the_project_is_not_owned(): void
    {
        $this->mockUsableCredentialAndGateway();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->postJson("/api/projects/{$this->project->id}/epics/decompose", $this->payload())
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'FORBIDDEN');

        $this->assertSame(0, Epic::where('project_id', $this->project->id)->count());
    }

    #[Test]
    public function it_422s_when_the_machine_is_offline(): void
    {
        $this->machine->update(['status' => 'offline']);

        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/epics/decompose", $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'MACHINE_OFFLINE');

        $this->assertSame(0, Epic::where('project_id', $this->project->id)->count());
    }

    #[Test]
    public function it_validates_title_and_prd(): void
    {
        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/epics/decompose", [
                'credential_id' => $this->makeCredential()->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['error' => ['details' => ['title', 'prd']]]);
    }

    #[Test]
    public function it_deletes_the_epic_and_422s_when_the_credential_is_unusable(): void
    {
        // launch() validates the credential env first; an unusable one throws
        // a RuntimeException → the controller must drop the dangling epic.
        $this->mock(CredentialService::class, function ($mock) {
            $mock->shouldReceive('getSessionEnv')
                ->andThrow(new \RuntimeException('Credential has no usable token'));
        });
        $this->mock(AgentGateway::class, function ($mock) {
            $mock->shouldReceive('sendMessage')->never();
        });

        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/epics/decompose", $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'CREDENTIAL_ERROR');

        // No dangling `pending` epic and no session left behind.
        $this->assertSame(0, Epic::where('project_id', $this->project->id)->count());
        $this->assertSame(0, Session::where('shared_project_id', $this->project->id)->count());
    }
}
