<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Indicates whether the default seeder should run before each test.
     */
    protected bool $seed = false;

    /**
     * Setup the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Disable broadcasting during tests
        $this->withoutBroadcasting();
    }

    /**
     * Create a user and authenticate.
     */
    protected function actingAsUser($user = null): static
    {
        $user = $user ?? \App\Models\User::factory()->create();
        return $this->actingAs($user);
    }

    /**
     * Assert JSON response has standard structure.
     */
    protected function assertStandardJsonStructure($response, array $additionalStructure = []): void
    {
        $response->assertJsonStructure(array_merge([
            'success',
            'meta' => [
                'timestamp',
                'request_id',
            ],
        ], $additionalStructure));
    }

    /**
     * Assert standard error response.
     */
    protected function assertErrorResponse($response, int $status, string $code = null): void
    {
        $response->assertStatus($status)
            ->assertJson(['success' => false])
            ->assertJsonStructure([
                'success',
                'error' => ['code', 'message'],
                'meta',
            ]);

        if ($code) {
            $response->assertJson(['error' => ['code' => $code]]);
        }
    }
}
