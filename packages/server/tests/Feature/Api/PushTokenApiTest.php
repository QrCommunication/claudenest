<?php

namespace Tests\Feature\Api;

use App\Models\PushToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PushTokenApiTest extends TestCase
{
    use RefreshDatabase;

    private const VALID_TOKEN = 'ExponentPushToken[AbCdEfGhIjKlMnOpQrStUv]';

    #[Test]
    public function user_can_register_a_push_token(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
            'platform' => 'ios',
            'device_name' => 'iPhone de Rony',
        ]);

        $response->assertCreated()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'platform', 'device_name', 'last_used_at', 'created_at'],
                'meta' => ['timestamp', 'request_id'],
            ])
            ->assertJsonPath('data.platform', 'ios')
            ->assertJsonPath('data.device_name', 'iPhone de Rony');

        $this->assertDatabaseHas('push_tokens', [
            'user_id' => $user->id,
            'token' => self::VALID_TOKEN,
            'platform' => 'ios',
        ]);
    }

    #[Test]
    public function user_can_register_a_push_token_without_platform(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
        ]);

        $response->assertCreated()->assertJsonPath('data.platform', null);

        $this->assertSame(1, PushToken::forUser($user->id)->count());
    }

    #[Test]
    public function re_registering_the_same_token_upserts_without_duplicate(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
            'platform' => 'ios',
        ])->assertCreated();

        $response = $this->actingAs($user)->postJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
            'platform' => 'android',
            'device_name' => 'Pixel',
        ]);

        $response->assertOk()->assertJsonPath('data.platform', 'android');

        $this->assertSame(1, PushToken::where('token', self::VALID_TOKEN)->count());
        $this->assertSame('android', PushToken::where('token', self::VALID_TOKEN)->first()->platform);
    }

    #[Test]
    public function registering_a_token_owned_by_another_user_reassigns_it(): void
    {
        $previousOwner = User::factory()->create();
        $newOwner = User::factory()->create();

        PushToken::factory()->create([
            'user_id' => $previousOwner->id,
            'token' => self::VALID_TOKEN,
        ]);

        $this->actingAs($newOwner)->postJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
            'platform' => 'android',
        ])->assertCreated();

        $this->assertSame(1, PushToken::where('token', self::VALID_TOKEN)->count());
        $this->assertDatabaseHas('push_tokens', [
            'token' => self::VALID_TOKEN,
            'user_id' => $newOwner->id,
        ]);
        $this->assertDatabaseMissing('push_tokens', [
            'token' => self::VALID_TOKEN,
            'user_id' => $previousOwner->id,
        ]);
    }

    #[Test]
    public function register_rejects_invalid_token_format(): void
    {
        $user = User::factory()->create();

        // Custom validation error envelope (error.code = VAL_001, error.details).
        $this->actingAs($user)->postJson('/api/push-tokens', [
            'token' => 'not-an-expo-token',
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure(['error' => ['details' => ['token']]]);
    }

    #[Test]
    public function register_rejects_unknown_platform(): void
    {
        $user = User::factory()->create();

        // Custom validation error envelope (error.code = VAL_001, error.details).
        $this->actingAs($user)->postJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
            'platform' => 'windows',
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'VAL_001')
            ->assertJsonStructure(['error' => ['details' => ['platform']]]);
    }

    #[Test]
    public function register_requires_authentication(): void
    {
        $this->postJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
        ])->assertUnauthorized();
    }

    #[Test]
    public function user_can_delete_their_push_token(): void
    {
        $user = User::factory()->create();
        PushToken::factory()->create([
            'user_id' => $user->id,
            'token' => self::VALID_TOKEN,
        ]);

        $response = $this->actingAs($user)->deleteJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
        ]);

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.deleted', true);

        $this->assertDatabaseMissing('push_tokens', ['token' => self::VALID_TOKEN]);
    }

    #[Test]
    public function delete_is_idempotent_for_unknown_token(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->deleteJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
        ])
            ->assertOk()
            ->assertJsonPath('data.deleted', false);
    }

    #[Test]
    public function user_cannot_delete_another_users_token(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();

        PushToken::factory()->create([
            'user_id' => $owner->id,
            'token' => self::VALID_TOKEN,
        ]);

        $this->actingAs($attacker)->deleteJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
        ])
            ->assertOk()
            ->assertJsonPath('data.deleted', false);

        $this->assertDatabaseHas('push_tokens', [
            'token' => self::VALID_TOKEN,
            'user_id' => $owner->id,
        ]);
    }

    #[Test]
    public function delete_requires_authentication(): void
    {
        $this->deleteJson('/api/push-tokens', [
            'token' => self::VALID_TOKEN,
        ])->assertUnauthorized();
    }
}
