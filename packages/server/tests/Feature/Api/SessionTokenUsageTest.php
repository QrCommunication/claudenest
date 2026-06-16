<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * POST /api/sessions/{id}/token-usage records a session's cumulative input/output
 * token counts (absolute), defaulting total to input + output, guarded by the
 * session owner (or its scoped token).
 */
class SessionTokenUsageTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create();
    }

    private function makeSession(): Session
    {
        return Session::factory()->for($this->machine)->for($this->user)->create([
            'status' => 'running',
        ]);
    }

    #[Test]
    public function the_owner_records_token_usage_and_total_defaults_to_input_plus_output(): void
    {
        $session = $this->makeSession();

        $this->actingAs($this->user)
            ->postJson("/api/sessions/{$session->id}/token-usage", [
                'input_tokens' => 1200,
                'output_tokens' => 340,
            ])
            ->assertOk()
            ->assertJsonPath('data.input_tokens', 1200)
            ->assertJsonPath('data.output_tokens', 340)
            ->assertJsonPath('data.total_tokens', 1540);

        $session->refresh();
        $this->assertSame(1200, $session->input_tokens);
        $this->assertSame(340, $session->output_tokens);
        $this->assertSame(1540, $session->total_tokens);
    }

    #[Test]
    public function an_explicit_total_tokens_is_honoured(): void
    {
        $session = $this->makeSession();

        $this->actingAs($this->user)
            ->postJson("/api/sessions/{$session->id}/token-usage", [
                'input_tokens' => 100,
                'output_tokens' => 50,
                'total_tokens' => 999, // e.g. includes cache tokens
            ])
            ->assertOk()
            ->assertJsonPath('data.total_tokens', 999);
    }

    #[Test]
    public function recording_is_idempotent_when_the_same_totals_are_replayed(): void
    {
        $session = $this->makeSession();
        $payload = ['input_tokens' => 10, 'output_tokens' => 5];

        $this->actingAs($this->user)->postJson("/api/sessions/{$session->id}/token-usage", $payload)->assertOk();
        $this->actingAs($this->user)->postJson("/api/sessions/{$session->id}/token-usage", $payload)->assertOk();

        $this->assertSame(10, $session->refresh()->input_tokens);
        $this->assertSame(15, $session->total_tokens);
    }

    #[Test]
    public function a_stranger_cannot_record_token_usage(): void
    {
        $session = $this->makeSession();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->postJson("/api/sessions/{$session->id}/token-usage", [
                'input_tokens' => 1,
                'output_tokens' => 1,
            ])
            ->assertForbidden();

        $this->assertSame(0, $session->refresh()->input_tokens);
    }

    #[Test]
    public function it_validates_required_non_negative_token_counts(): void
    {
        $session = $this->makeSession();

        $this->actingAs($this->user)
            ->postJson("/api/sessions/{$session->id}/token-usage", [
                'input_tokens' => -1,
            ])
            ->assertStatus(422);
    }
}
