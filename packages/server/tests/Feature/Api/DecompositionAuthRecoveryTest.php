<?php

namespace Tests\Feature\Api;

use App\Events\SessionNotification;
use App\Models\ClaudeCredential;
use App\Models\Machine;
use App\Models\PersonalAccessToken;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use App\Services\DecompositionSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Auth-401 recovery for the ephemeral PRD-decomposition session — the resume
 * mechanism mirroring WorkerPoolService::relaunchOnAuthError, exercised by
 * AgentServe::onSessionAuthError when a decompose session 401s ("Please run
 * /login" — a rotated OAuth token).
 */
class DecompositionAuthRecoveryTest extends TestCase
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
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create([
            'prd' => str_repeat('Build a thing. ', 5),
        ]);
    }

    private function makeOauthCredential(): ClaudeCredential
    {
        return ClaudeCredential::create([
            'user_id' => $this->user->id,
            'name' => 'oauth-cred',
            'auth_type' => 'oauth',
            'is_default' => true,
            'token_status' => 'active',
        ]);
    }

    private function makeSession(ClaudeCredential $credential, bool $orchestrated, array $abilities): Session
    {
        $session = Session::factory()->for($this->machine)->for($this->user)->create([
            'shared_project_id' => $this->project->id,
            'credential_id' => $credential->id,
            'status' => 'running',
            'orchestrated' => $orchestrated,
        ]);

        PersonalAccessToken::createForUser(
            $this->user->id,
            "mcp:{$session->id}",
            array_merge($abilities, ["project:{$this->project->id}"]),
        );

        return $session;
    }

    #[Test]
    public function it_recognises_a_decompose_session_by_its_token_ability(): void
    {
        $cred = $this->makeOauthCredential();
        $service = app(DecompositionSessionService::class);

        $decompose = $this->makeSession($cred, false, ['multiagent', DecompositionSessionService::DECOMPOSE_ABILITY]);
        $planning = $this->makeSession($cred, false, ['multiagent', 'planning']);
        $worker = $this->makeSession($cred, true, ['multiagent']);

        $this->assertTrue($service->isDecomposeSession($decompose));
        $this->assertFalse($service->isDecomposeSession($planning));
        $this->assertFalse($service->isDecomposeSession($worker));
    }

    #[Test]
    public function it_refreshes_credential_and_relaunches_a_decompose_session_on_auth_error(): void
    {
        $cred = $this->makeOauthCredential();
        $session = $this->makeSession($cred, false, ['multiagent', DecompositionSessionService::DECOMPOSE_ABILITY]);

        // CredentialService: refresh succeeds, env is usable.
        $this->mock(CredentialService::class, function ($mock) {
            $mock->shouldReceive('refreshOAuthToken')->once()->andReturn(['ok' => true]);
            $mock->shouldReceive('getSessionEnv')->andReturn(['CLAUDE_CODE_OAUTH_TOKEN' => 'fresh']);
        });

        // AgentGateway: expect a session:create (the relaunch) — and the
        // session:terminate of the stalled one.
        $sent = [];
        $this->mock(AgentGateway::class, function ($mock) use (&$sent) {
            $mock->shouldReceive('sendMessage')->andReturnUsing(function ($machineId, $type) use (&$sent) {
                $sent[] = $type;
            });
        });

        $result = app(DecompositionSessionService::class)->relaunchOnAuthError($session);

        $this->assertTrue($result['refreshed']);
        $this->assertTrue($result['relaunched']);
        $this->assertFalse($result['needs_login']);
        $this->assertArrayHasKey('new_session', $result);

        $this->assertContains('session:terminate', $sent);
        $this->assertContains('session:create', $sent);

        // Old session terminated; a fresh decompose session exists.
        $this->assertSame('terminated', $session->fresh()->status);
        $this->assertSame(
            2,
            Session::where('shared_project_id', $this->project->id)->count(),
        );
    }

    #[Test]
    public function it_notifies_relogin_when_oauth_refresh_fails(): void
    {
        Event::fake([SessionNotification::class]);

        $cred = $this->makeOauthCredential();
        $session = $this->makeSession($cred, false, ['multiagent', DecompositionSessionService::DECOMPOSE_ABILITY]);

        $this->mock(CredentialService::class, function ($mock) {
            $mock->shouldReceive('refreshOAuthToken')->once()->andThrow(new \RuntimeException('refresh token dead'));
        });

        // No relaunch → only the terminate of the stalled session may be sent.
        $sent = [];
        $this->mock(AgentGateway::class, function ($mock) use (&$sent) {
            $mock->shouldReceive('sendMessage')->andReturnUsing(function ($machineId, $type) use (&$sent) {
                $sent[] = $type;
            });
        });

        $result = app(DecompositionSessionService::class)->relaunchOnAuthError($session);

        $this->assertTrue($result['needs_login']);
        $this->assertFalse($result['relaunched']);
        $this->assertNotContains('session:create', $sent);
        Event::assertDispatched(SessionNotification::class);
    }

    #[Test]
    public function it_skips_relaunch_within_the_cooldown_window(): void
    {
        $cred = $this->makeOauthCredential();
        $session = $this->makeSession($cred, false, ['multiagent', DecompositionSessionService::DECOMPOSE_ABILITY]);

        // Pre-seed the cooldown key — a second auth error must be suppressed.
        Cache::add("claudenest:decompose:authrelaunch:{$this->project->id}", 1, 120);

        $this->mock(CredentialService::class, function ($mock) {
            $mock->shouldReceive('refreshOAuthToken')->never();
        });
        $this->mock(AgentGateway::class, function ($mock) {
            $mock->shouldReceive('sendMessage')->never();
        });

        $result = app(DecompositionSessionService::class)->relaunchOnAuthError($session);

        $this->assertFalse($result['relaunched']);
        $this->assertFalse($result['refreshed']);
        $this->assertSame('running', $session->fresh()->status);
    }
}
