<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
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

    /** @test */
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
                'data' => [
                    'session' => ['id', 'mode', 'status'],
                ],
                'meta',
            ]);

        $this->assertDatabaseHas('sessions', [
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'mode' => 'interactive',
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function session_creation_validates_mode(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'invalid-mode',
                'project_path' => '/home/user/projects/test',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('mode');
    }

    /** @test */
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

    /** @test */
    public function user_cannot_view_other_users_session(): void
    {
        $user = User::factory()->create();
        $otherSession = Session::factory()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/sessions/{$otherSession->id}");

        $response->assertStatus(403);
    }

    /** @test */
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

    /** @test */
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

    /** @test */
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

    /** @test */
    public function cannot_send_input_to_terminated_session(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create(['status' => 'terminated']);

        $response = $this->actingAs($user)
            ->postJson("/api/sessions/{$session->id}/input", [
                'data' => 'ls -la',
            ]);

        $response->assertStatus(400);
    }

    /** @test */
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

    /** @test */
    public function user_can_get_session_logs(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $session = Session::factory()->for($machine)->for($user)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/sessions/{$session->id}/logs");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => ['logs'],
                'meta',
            ]);
    }

    /** @test */
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

    /** @test */
    public function unauthenticated_user_cannot_access_sessions(): void
    {
        $machine = Machine::factory()->create();

        $response = $this->getJson("/api/machines/{$machine->id}/sessions");

        $response->assertStatus(401);
    }
}
