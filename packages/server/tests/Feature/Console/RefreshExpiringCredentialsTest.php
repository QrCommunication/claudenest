<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use App\Models\ClaudeCredential;
use App\Models\Machine;
use App\Models\Session;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RefreshExpiringCredentialsTest extends TestCase
{
    use RefreshDatabase;

    private function oauthCredential(User $user, CarbonInterface $expiresAt): ClaudeCredential
    {
        return ClaudeCredential::create([
            'user_id' => $user->id,
            'name' => 'oauth-cred-' . uniqid(),
            'auth_type' => 'oauth',
            'access_token_enc' => Crypt::encryptString('old-access'),
            'refresh_token_enc' => Crypt::encryptString('old-refresh'),
            'expires_at' => $expiresAt,
        ]);
    }

    #[Test]
    public function it_refreshes_credentials_expiring_within_24h(): void
    {
        Http::fake([
            'platform.claude.com/*' => Http::response([
                'access_token' => 'new-access',
                'refresh_token' => 'new-refresh',
                'expires_in' => 3600,
            ], 200),
        ]);

        $user = User::factory()->create();
        $credential = $this->oauthCredential($user, now()->addHours(2));

        $this->artisan('claudenest:refresh-credentials')->assertSuccessful();

        $credential->refresh();
        $this->assertSame('new-access', Crypt::decryptString($credential->access_token_enc));
    }

    #[Test]
    public function it_skips_credentials_expiring_after_the_window(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $credential = $this->oauthCredential($user, now()->addHours(48));

        $this->artisan('claudenest:refresh-credentials')->assertSuccessful();

        Http::assertNothingSent();
        $credential->refresh();
        $this->assertSame('old-access', Crypt::decryptString($credential->access_token_enc));
    }

    #[Test]
    public function it_notifies_agents_of_active_sessions_on_refreshed_credentials(): void
    {
        Http::fake([
            'platform.claude.com/*' => Http::response([
                'access_token' => 'new-access',
                'expires_in' => 3600,
            ], 200),
        ]);
        Redis::spy();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $credential = $this->oauthCredential($user, now()->addHour());
        Session::factory()->create([
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'credential_id' => $credential->id,
            'status' => 'running',
        ]);

        $this->artisan('claudenest:refresh-credentials')->assertSuccessful();

        // AgentGateway::send pushes a `credential:refreshed` message onto the
        // machine's Redis queue.
        Redis::shouldHaveReceived('rpush')->atLeast()->once();
    }

    #[Test]
    public function dry_run_lists_without_refreshing(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $this->oauthCredential($user, now()->addHours(2));

        $this->artisan('claudenest:refresh-credentials --dry-run')->assertSuccessful();

        Http::assertNothingSent();
    }
}
