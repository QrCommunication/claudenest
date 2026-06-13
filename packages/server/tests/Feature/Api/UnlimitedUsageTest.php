<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Pins the "free & unlimited" model: the per-plan concurrent agent cap that
 * once gated session creation (SessionController) and orchestrator start
 * (WorkerPoolService) with a 403 `PLAN_001` is GONE.
 *
 * Every test deliberately uses a plan='community' user — the OLD most
 * restrictive cap (3). If even a community user can:
 *   - create sessions far beyond 3 (with pre-existing running sessions), and
 *   - start the orchestrator with more workers than the old cap,
 * without ever receiving a 403 PLAN_001, then the caps are removed for ALL
 * plans (community being the floor). Machine availability (MCH_002) and
 * ownership remain the only gates.
 *
 * AgentGateway is spied so the real Redis session:create fan-out never runs.
 */
class UnlimitedUsageTest extends TestCase
{
    use RefreshDatabase;

    /** A user pinned to the OLD most-restrictive plan, to prove the cap is gone. */
    private function communityUser(): User
    {
        return User::factory()->create(['plan' => 'community']);
    }

    // ==================== SESSION CREATION — no PLAN_001 ====================

    #[Test]
    public function creating_a_session_beyond_the_old_community_cap_is_allowed(): void
    {
        $this->spy(AgentGateway::class);

        $user = $this->communityUser();
        $machine = Machine::factory()->for($user)->create(); // online by default

        // Pre-seed 5 RUNNING sessions — already well past the old community cap
        // of 3. Under the legacy rule the next create would have been a 403.
        Session::factory()->count(5)->for($machine)->for($user)->create([
            'status' => 'running',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
                'project_path' => '/home/user/projects/unlimited',
            ]);

        // 201, not 403 PLAN_001: the cap no longer gates creation.
        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonMissingPath('error.code');

        $this->assertDatabaseHas('claude_sessions', [
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'status' => 'created',
        ]);
    }

    #[Test]
    public function a_community_user_can_create_many_concurrent_sessions(): void
    {
        $this->spy(AgentGateway::class);

        $user = $this->communityUser();
        $machine = Machine::factory()->for($user)->create();

        // Create 6 sessions in a row (double the old community cap). Every one
        // must succeed — no PLAN_001 at any point in the sequence.
        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($user)
                ->postJson("/api/machines/{$machine->id}/sessions", [
                    'mode' => 'interactive',
                ])
                ->assertStatus(201)
                ->assertJsonMissingPath('error.code');
        }

        $this->assertSame(
            6,
            Session::where('user_id', $user->id)
                ->where('machine_id', $machine->id)
                ->count(),
        );
    }

    #[Test]
    public function machine_offline_is_still_the_only_creation_gate(): void
    {
        $this->spy(AgentGateway::class);

        $user = $this->communityUser();
        $machine = Machine::factory()->for($user)->offline()->create();

        // The cap is gone, but an offline machine is STILL a hard gate (MCH_002),
        // proving the relaxation is scoped to plan limits — not all guards.
        $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/sessions", [
                'mode' => 'interactive',
            ])
            ->assertStatus(400)
            ->assertJsonPath('error.code', 'MCH_002');
    }

    // ==================== ORCHESTRATOR START — no plan ceiling ====================

    #[Test]
    public function orchestrator_starts_with_more_workers_than_the_old_community_cap(): void
    {
        $this->spy(AgentGateway::class);

        $user = $this->communityUser();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/user/projects/orchestrated',
        ]);

        // 10 pending tasks so the spawn count is bounded by max_workers, not the
        // backlog: max(1, min(8, 10)) = 8 workers — far past the old cap of 3.
        SharedTask::factory()->count(10)->create([
            'project_id' => $project->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/orchestrator/start", [
                'max_workers' => 8,
            ]);

        // 200, not 403 PLAN_001: orchestration is bounded only by max_workers
        // and the backlog, never by the user's plan.
        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.status', 'running')
            ->assertJsonPath('data.active', true)
            ->assertJsonMissingPath('error.code');

        // 8 orchestrated workers actually spawned (well beyond community=3).
        $this->assertSame(
            8,
            Session::where('shared_project_id', $project->id)
                ->where('orchestrated', true)
                ->count(),
        );

        $project->refresh();
        $this->assertSame(8, $project->getSetting('orchestration')['max_workers']);
    }

    #[Test]
    public function orchestrator_start_is_only_blocked_by_an_offline_machine(): void
    {
        $this->spy(AgentGateway::class);

        $user = $this->communityUser();
        $machine = Machine::factory()->for($user)->offline()->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        SharedTask::factory()->count(5)->create([
            'project_id' => $project->id,
            'status' => 'pending',
        ]);

        // Offline machine → 422 (WorkerPoolException::machineOffline), NOT a
        // plan-cap 403: the surviving guard is availability, not the plan.
        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/orchestrator/start", [
                'max_workers' => 5,
            ]);

        $response->assertStatus(422);
        $this->assertNotSame('PLAN_001', $response->json('error.code'));

        $this->assertSame(
            0,
            Session::where('shared_project_id', $project->id)->count(),
        );
    }
}
