<?php

namespace Tests\Feature\Api;

use PHPUnit\Framework\Attributes\Test;

use App\Models\Machine;
use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionApiTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function user_can_list_sessions_for_their_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $sessions = Session::factory()->count(3)->for($machine)->for($user)->create();

        // Other user's sessions
        Session::factory()->count(2)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}/sessions");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id', 'mode', 'status', 'project_path',
                        'started_at', 'total_tokens',
                    ],
                ],
                'meta',
            ]);
    }

    #[Test]
    public function user_can_create_session(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
                'project_path' => '/home/user/projects/test',
                'initial_prompt' => 'Help me build a feature',
                'pty_size' => ['cols' => 120, 'rows' => 40],
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'mode', 'status'],
                'meta',
            ]);

        // The Session model maps to `claude_sessions`; `sessions` is Laravel's
        // built-in HTTP session table (id, user_id, ip_address, ...).
        $this->assertDatabaseHas('claude_sessions', [
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'mode' => 'interactive',
            'status' => 'created',
        ]);
    }

    #[Test]
    public function session_creation_validates_mode(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'invalid-mode',
                'project_path' => '/home/user/projects/test',
            ]);

        // This API returns a custom error envelope for validation failures
        // (error.code = VAL_001, error.details keyed by field), not Laravel's
        // default { errors: {...} } shape.
        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure([
                'error' => ['details' => ['mode']],
            ]);
    }

    #[Test]
    public function user_can_view_their_session(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/sessions/{$session->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $session->id,
                    'mode' => $session->mode,
                ],
            ]);
    }

    /**
     * Non-regression: Carbon 3 diffInSeconds() returns float, and the
     * Session::$duration accessor is typed ?int under strict_types. Before the
     * fix this threw a TypeError ("Return value must be of type ?int, float
     * returned") on every running session, producing a 500 on GET /sessions/{id}.
     *
     */
    #[Test]
    public function viewing_a_running_session_returns_integer_duration(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create([
            'status' => 'running',
            'started_at' => now()->subMinutes(3)->subSeconds(7),
            'completed_at' => null,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/sessions/{$session->id}");

        $response->assertOk();

        $duration = $response->json('data.duration');
        $this->assertIsInt($duration);
        $this->assertGreaterThanOrEqual(180, $duration);
        $this->assertIsString($response->json('data.formatted_duration'));
    }

    #[Test]
    public function user_cannot_view_other_users_session(): void
    {
        $user = User::factory()->create();
        $otherSession = Session::factory()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/sessions/{$otherSession->id}");

        $response->assertStatus(403);
    }

    #[Test]
    public function user_can_terminate_their_session(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create(['status' => 'running']);

        $response = $this->actingAs($user)
            ->deleteJson("/api/sessions/{$session->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $session->refresh();
        $this->assertEquals('terminated', $session->status);
    }

    #[Test]
    public function user_cannot_terminate_other_users_session(): void
    {
        $user = User::factory()->create();
        $otherSession = Session::factory()->create(['status' => 'running']);

        $response = $this->actingAs($user)
            ->deleteJson("/api/sessions/{$otherSession->id}");

        $response->assertStatus(403);

        $otherSession->refresh();
        $this->assertEquals('running', $otherSession->status);
    }

    #[Test]
    public function user_can_send_input_to_session(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create(['status' => 'running']);

        $response = $this->actingAs($user)
            ->postJson("/api/sessions/{$session->id}/input", [
                'data' => 'ls -la',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);
    }

    #[Test]
    public function cannot_send_input_to_terminated_session(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create(['status' => 'terminated']);

        $response = $this->actingAs($user)
            ->postJson("/api/sessions/{$session->id}/input", [
                'data' => 'ls -la',
            ]);

        // input() scopes to active statuses (running/waiting_input) before
        // findOrFail, so a terminated session is not found -> 404.
        $response->assertStatus(404);
    }

    #[Test]
    public function user_can_resize_session_pty(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create(['status' => 'running']);

        $response = $this->actingAs($user)
            ->postJson("/api/sessions/{$session->id}/resize", [
                'cols' => 150,
                'rows' => 50,
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);
    }

    #[Test]
    public function user_can_get_session_logs(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/sessions/{$session->id}/logs");

        // logs() returns the paginated log collection directly under `data`
        // (an array of log entries), with pagination under meta.
        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data',
                'meta' => ['pagination' => ['current_page', 'per_page', 'total', 'last_page']],
            ]);
    }

    #[Test]
    public function can_filter_sessions_by_status(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        Session::factory()->for($machine)->for($user)->create(['status' => 'running']);
        Session::factory()->for($machine)->for($user)->create(['status' => 'running']);
        Session::factory()->for($machine)->for($user)->completed()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}/sessions?status=running");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    #[Test]
    public function unauthenticated_user_cannot_access_sessions(): void
    {
        $machine = Machine::factory()->create();

        $response = $this->getJson("/api/machines/{$machine->id}/sessions");

        $response->assertStatus(401);
    }
}
