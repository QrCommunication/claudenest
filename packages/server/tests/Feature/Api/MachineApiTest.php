<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MachineApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_list_their_machines(): void
    {
        $user = User::factory()->create();
        $machines = Machine::factory()->count(3)->for($user)->create();
        Machine::factory()->count(2)->create(); // Other user's machines

        $response = $this->actingAs($user)
            ->getJson('/api/machines');

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id', 'name', 'platform', 'status', 'hostname',
                        'is_online', 'created_at', 'last_seen_at',
                    ],
                ],
                'meta' => [
                    'timestamp',
                    'request_id',
                    'pagination',
                ],
            ]);
    }

    /** @test */
    public function user_can_create_machine(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/machines', [
                'name' => 'test-machine',
                'platform' => 'linux',
                'hostname' => 'test-host',
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'machine' => ['id', 'name', 'platform', 'status'],
                    'token',
                ],
                'meta',
            ]);

        $this->assertDatabaseHas('machines', [
            'user_id' => $user->id,
            'name' => 'test-machine',
            'platform' => 'linux',
        ]);
    }

    /** @test */
    public function machine_creation_validates_platform(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/machines', [
                'name' => 'test-machine',
                'platform' => 'invalid-platform',
                'hostname' => 'test-host',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('platform');
    }

    /** @test */
    public function user_can_view_their_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $machine->id,
                    'name' => $machine->name,
                ],
            ]);
    }

    /** @test */
    public function user_cannot_view_other_users_machine(): void
    {
        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create(); // Different user

        $response = $this->actingAs($user)
            ->getJson("/api/machines/{$otherMachine->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function user_can_update_their_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create(['name' => 'old-name']);

        $response = $this->actingAs($user)
            ->patchJson("/api/machines/{$machine->id}", [
                'name' => 'new-name',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'new-name',
                ],
            ]);

        $this->assertDatabaseHas('machines', [
            'id' => $machine->id,
            'name' => 'new-name',
        ]);
    }

    /** @test */
    public function user_cannot_update_other_users_machine(): void
    {
        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create();

        $response = $this->actingAs($user)
            ->patchJson("/api/machines/{$otherMachine->id}", [
                'name' => 'hacked-name',
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function user_can_delete_their_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/machines/{$machine->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('machines', [
            'id' => $machine->id,
        ]);
    }

    /** @test */
    public function user_cannot_delete_other_users_machine(): void
    {
        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/machines/{$otherMachine->id}");

        $response->assertStatus(403);

        $this->assertDatabaseHas('machines', [
            'id' => $otherMachine->id,
        ]);
    }

    /** @test */
    public function user_can_regenerate_machine_token(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $oldTokenHash = $machine->token_hash;

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/regenerate-token");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => ['token'],
                'meta',
            ]);

        $machine->refresh();
        $this->assertNotEquals($oldTokenHash, $machine->token_hash);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_machines(): void
    {
        $response = $this->getJson('/api/machines');

        $response->assertStatus(401);
    }

    /** @test */
    public function can_filter_machines_by_status(): void
    {
        $user = User::factory()->create();
        Machine::factory()->for($user)->create(['status' => 'online']);
        Machine::factory()->for($user)->create(['status' => 'online']);
        Machine::factory()->for($user)->offline()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/machines?status=online');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
