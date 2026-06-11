<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WsTicketTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function guest_cannot_request_a_ws_ticket(): void
    {
        $this->postJson('/api/auth/ws-ticket')->assertStatus(401);
    }

    #[Test]
    public function authenticated_user_receives_a_single_use_ticket(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/auth/ws-ticket');

        $response->assertOk()
            ->assertJsonPath('data.expires_in', 60)
            ->assertJsonStructure(['data' => ['ticket', 'expires_in']]);

        $ticket = $response->json('data.ticket');
        $this->assertSame(48, strlen($ticket));

        // The cache entry maps the hashed ticket to the user — and Cache::pull
        // (what AgentServe does on upgrade) consumes it atomically.
        $key = 'ws_ticket:' . hash('sha256', $ticket);
        $this->assertSame((string) $user->id, Cache::pull($key));
        $this->assertNull(Cache::get($key), 'Ticket must be single-use');
    }
}
