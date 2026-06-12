<?php

namespace Tests\Feature\Api;

use PHPUnit\Framework\Attributes\Test;

use App\Events\SessionNotification;
use App\Models\ClaudeInstance;
use App\Models\FileLock;
use App\Models\Machine;
use App\Models\PersonalAccessToken;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class MultiAgentSessionTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function creating_a_session_with_a_shared_project_attaches_instance_and_scoped_token(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/user/projects/multiagent',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
                'shared_project_id' => $project->id,
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.shared_project_id', $project->id)
            // project_path is resolved from the project when bound to one
            ->assertJsonPath('data.project_path', '/home/user/projects/multiagent');

        $sessionId = $response->json('data.id');

        $this->assertDatabaseHas('claude_sessions', [
            'id' => $sessionId,
            'shared_project_id' => $project->id,
            'project_path' => '/home/user/projects/multiagent',
        ]);

        // ClaudeInstance registered for the session
        $this->assertDatabaseHas('claude_instances', [
            'id' => "inst-{$sessionId}",
            'project_id' => $project->id,
            'machine_id' => $machine->id,
            'session_id' => $sessionId,
        ]);

        // Scoped Sanctum token minted (multiagent + project scope)
        $token = PersonalAccessToken::forUser($user->id)
            ->where('name', "mcp:{$sessionId}")
            ->first();

        $this->assertNotNull($token);
        $this->assertEqualsCanonicalizing(
            ['multiagent', "project:{$project->id}"],
            $token->abilities,
        );
    }

    #[Test]
    public function scoped_token_is_never_exposed_in_the_session_response(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'shared_project_id' => $project->id,
            ]);

        $response->assertStatus(201);

        $raw = $response->getContent();
        $this->assertStringNotContainsString('mcpEnv', $raw);
        $this->assertStringNotContainsString('CLAUDENEST_TOKEN', $raw);
        $this->assertStringNotContainsString('appendSystemPrompt', $raw);
        $this->assertStringNotContainsString('cn_', $raw);
    }

    #[Test]
    public function session_creation_rejects_shared_project_of_another_user(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $foreignProject = SharedProject::factory()->create(); // other user + machine

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'shared_project_id' => $foreignProject->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'SES_004');

        $this->assertDatabaseMissing('claude_sessions', [
            'shared_project_id' => $foreignProject->id,
        ]);
    }

    #[Test]
    public function session_creation_rejects_shared_project_of_another_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $otherMachine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($otherMachine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'shared_project_id' => $project->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'SES_004');
    }

    #[Test]
    public function session_creation_without_project_is_unchanged(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
                'project_path' => '/home/user/projects/classic',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.shared_project_id', null);

        $sessionId = $response->json('data.id');

        $this->assertDatabaseMissing('claude_instances', ['id' => "inst-{$sessionId}"]);
        $this->assertEquals(
            0,
            PersonalAccessToken::forUser($user->id)->where('name', "mcp:{$sessionId}")->count(),
        );
    }

    #[Test]
    public function destroying_a_multiagent_session_tears_down_instance_locks_and_token(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $create = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'shared_project_id' => $project->id,
            ]);
        $create->assertStatus(201);
        $sessionId = $create->json('data.id');
        $instanceId = "inst-{$sessionId}";

        // Simulate work in progress: a lock held by the instance
        FileLock::factory()->create([
            'project_id' => $project->id,
            'path' => 'src/app.ts',
            'locked_by' => $instanceId,
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/sessions/{$sessionId}");
        $response->assertOk()->assertJson(['success' => true]);

        // Instance disconnected
        $instance = ClaudeInstance::find($instanceId);
        $this->assertNotNull($instance);
        $this->assertEquals('disconnected', $instance->status);
        $this->assertNotNull($instance->disconnected_at);

        // Locks released
        $this->assertDatabaseMissing('file_locks', [
            'project_id' => $project->id,
            'locked_by' => $instanceId,
        ]);

        // Scoped token revoked
        $this->assertEquals(
            0,
            PersonalAccessToken::forUser($user->id)->where('name', "mcp:{$sessionId}")->count(),
        );
    }

    #[Test]
    public function session_owner_can_send_a_notification(): void
    {
        Event::fake([SessionNotification::class]);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $session = Session::factory()->for($machine)->for($user)->create([
            'shared_project_id' => $project->id,
            'status' => 'running',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/sessions/{$session->id}/notification", [
                'title' => 'Permission needed',
                'message' => 'Claude wants to run a bash command',
                'notification_type' => 'permission_request',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.session_id', $session->id);

        Event::assertDispatched(SessionNotification::class, function (SessionNotification $event) use ($session, $project) {
            return $event->session->id === $session->id
                && $event->message === 'Claude wants to run a bash command'
                && $event->title === 'Permission needed'
                && $event->notificationType === 'permission_request'
                && collect($event->broadcastOn())
                    ->map(fn ($channel) => (string) $channel->name)
                    ->contains('private-projects.' . $project->id);
        });
    }

    #[Test]
    public function notification_requires_a_message(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/sessions/{$session->id}/notification", [
                'title' => 'No message here',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001');
    }

    #[Test]
    public function another_user_cannot_send_a_notification_for_a_foreign_session(): void
    {
        $user = User::factory()->create();
        $foreignSession = Session::factory()->create();

        $response = $this->actingAs($user)
            ->postJson("/api/sessions/{$foreignSession->id}/notification", [
                'message' => 'should not pass',
            ]);

        $response->assertStatus(403);
    }
}
