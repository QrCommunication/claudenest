<?php

namespace Tests\Feature\Api;

use App\Events\SessionNotification;
use App\Models\FileLock;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Event-driven coordinator (CoordinatorService): on incidents (task
 * thrashing, lock contention, sprint review) the server spawns an EPHEMERAL
 * interactive planning session — guarded by orchestration state, the
 * coordinator kill-switch, an hourly budget and a single-coordinator rule.
 */
class CoordinatorTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create(); // online by default
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create([
            'name' => 'Phoenix',
            'project_path' => '/home/user/projects/phoenix',
            'settings' => ['orchestration' => ['active' => true]],
        ]);
    }

    // ==================== TASK THRASHING ====================

    #[Test]
    public function second_release_of_same_task_spawns_a_coordinator_session(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        Event::fake([SessionNotification::class]);

        $task = SharedTask::factory()->for($this->project, 'project')->claimed()->create([
            'title' => 'Flaky auth task',
        ]);

        // 1st release — a single release is normal, no coordinator.
        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/release")->assertOk();
        $this->assertSame(0, Session::count());

        // Re-claim then 2nd release — thrashing threshold reached.
        $task->update(['assigned_to' => 'inst-retry', 'status' => 'in_progress', 'claimed_at' => now()]);
        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/release", ['reason' => 'context too large'])
            ->assertOk();

        $session = Session::query()->sole();
        $this->assertFalse($session->orchestrated);
        $this->assertSame('interactive', $session->mode);
        $this->assertSame($this->project->id, $session->shared_project_id);
        $this->assertSame($this->user->id, $session->user_id);
        $this->assertStringContainsString('Flaky auth task', $session->initial_prompt);
        $this->assertStringContainsString('context too large', $session->initial_prompt);

        // session:create payload — coordinator role prompt with the incident
        // type, planning ability on the scoped token env.
        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($session) {
                return $machineId === $this->machine->id
                    && $type === 'session:create'
                    && $payload['sessionId'] === $session->id
                    && $payload['permissionMode'] === 'bypassPermissions'
                    && $payload['mcpEnv']['CLAUDENEST_ABILITIES'] === 'multiagent,planning'
                    && str_contains($payload['appendSystemPrompt'], 'incident coordinator for project Phoenix')
                    && str_contains($payload['appendSystemPrompt'], 'task_thrashing')
                    && str_contains($payload['appendSystemPrompt'], 'You cannot spawn workers')
                    && str_contains($payload['appendSystemPrompt'], 'Do NOT edit project files');
            });

        Event::assertDispatched(SessionNotification::class, function (SessionNotification $event) use ($session) {
            return $event->title === 'Coordinator session started'
                && str_contains($event->message, 'task_thrashing')
                && str_contains($event->message, $session->id);
        });

        $this->assertDatabaseHas('activity_log', [
            'project_id' => $this->project->id,
            'type' => 'coordinator_spawned',
        ]);
    }

    #[Test]
    public function spawn_budget_blocks_a_second_coordinator_within_one_hour(): void
    {
        $this->spy(AgentGateway::class);
        Event::fake([SessionNotification::class]);

        // A coordinator was spawned less than an hour ago.
        Cache::put("claudenest:coordinator:{$this->project->id}:last_spawn", now()->timestamp, 3600);

        $task = SharedTask::factory()->for($this->project, 'project')->claimed()->create();

        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/release")->assertOk();
        $task->update(['assigned_to' => 'inst-retry', 'status' => 'in_progress', 'claimed_at' => now()]);
        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/release")->assertOk();

        $this->assertSame(0, Session::count());
        $this->assertDatabaseMissing('activity_log', ['type' => 'coordinator_spawned']);
        Event::assertNotDispatched(SessionNotification::class);
    }

    #[Test]
    public function no_spawn_when_orchestration_is_inactive(): void
    {
        $this->spy(AgentGateway::class);

        $this->project->setSetting('orchestration', ['active' => false]);

        $task = SharedTask::factory()->for($this->project, 'project')->claimed()->create();

        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/release")->assertOk();
        $task->update(['assigned_to' => 'inst-retry', 'status' => 'in_progress', 'claimed_at' => now()]);
        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/release")->assertOk();

        $this->assertSame(0, Session::count());
        $this->assertDatabaseMissing('activity_log', ['type' => 'coordinator_spawned']);
    }

    #[Test]
    public function no_spawn_when_coordinator_is_disabled(): void
    {
        $this->spy(AgentGateway::class);

        $this->project->setSetting('orchestration', ['active' => true, 'coordinator' => false]);

        $task = SharedTask::factory()->for($this->project, 'project')->claimed()->create();

        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/release")->assertOk();
        $task->update(['assigned_to' => 'inst-retry', 'status' => 'in_progress', 'claimed_at' => now()]);
        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/release")->assertOk();

        $this->assertSame(0, Session::count());
        $this->assertDatabaseMissing('activity_log', ['type' => 'coordinator_spawned']);
    }

    // ==================== LOCK CONTENTION ====================

    #[Test]
    public function three_lock_conflicts_on_same_path_spawn_a_coordinator_session(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        Event::fake([SessionNotification::class]);

        FileLock::acquire($this->project->id, 'src/auth.ts', 'inst-holder');

        // Conflicts 1 and 2: 409 but below the contention threshold.
        for ($i = 0; $i < 2; $i++) {
            $this->actingAs($this->user)
                ->postJson("/api/projects/{$this->project->id}/locks", [
                    'path' => 'src/auth.ts',
                    'instance_id' => 'inst-challenger',
                ])
                ->assertStatus(409);
        }
        $this->assertSame(0, Session::count());

        // Conflict 3: contention confirmed → coordinator spawned.
        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/locks", [
                'path' => 'src/auth.ts',
                'instance_id' => 'inst-challenger',
            ])
            ->assertStatus(409);

        $session = Session::query()->sole();
        $this->assertFalse($session->orchestrated);
        $this->assertStringContainsString('src/auth.ts', $session->initial_prompt);
        $this->assertStringContainsString('inst-holder', $session->initial_prompt);

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(fn (string $machineId, string $type, array $payload) => $type === 'session:create'
                && str_contains($payload['appendSystemPrompt'], 'lock_contention'));

        Event::assertDispatched(SessionNotification::class, fn (SessionNotification $event) => $event->title === 'Coordinator session started'
            && str_contains($event->message, 'lock_contention'));

        $this->assertDatabaseHas('activity_log', [
            'project_id' => $this->project->id,
            'type' => 'coordinator_spawned',
        ]);
    }

    // ==================== SPRINT REVIEW ====================

    #[Test]
    public function sprint_completion_spawns_coordinator_outside_orchestration_when_opted_in(): void
    {
        $gateway = $this->spy(AgentGateway::class);
        Event::fake([SessionNotification::class]);

        $this->project->setSetting('orchestration', ['active' => false]);
        $this->project->setSetting('coordinator', ['on_sprint_review' => true]);

        $sprint = $this->project->sprints()->create([
            'name' => 'Sprint 7',
            'status' => 'active',
            'velocity' => 21,
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/sprints/{$sprint->id}/complete")
            ->assertOk();

        $session = Session::query()->sole();
        $this->assertFalse($session->orchestrated);
        $this->assertStringContainsString('Sprint 7', $session->initial_prompt);
        $this->assertStringContainsString('21', $session->initial_prompt);

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(fn (string $machineId, string $type, array $payload) => $type === 'session:create'
                && str_contains($payload['appendSystemPrompt'], 'sprint_review'));

        Event::assertDispatched(SessionNotification::class, fn (SessionNotification $event) => $event->title === 'Coordinator session started');
    }

    #[Test]
    public function sprint_completion_does_not_spawn_outside_orchestration_by_default(): void
    {
        $this->spy(AgentGateway::class);

        $this->project->setSetting('orchestration', ['active' => false]);

        $sprint = $this->project->sprints()->create([
            'name' => 'Sprint 8',
            'status' => 'active',
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/sprints/{$sprint->id}/complete")
            ->assertOk();

        $this->assertSame(0, Session::count());
        $this->assertDatabaseMissing('activity_log', ['type' => 'coordinator_spawned']);
    }

    // ==================== INFRASTRUCTURE ====================

    #[Test]
    public function activity_log_accepts_the_coordinator_spawned_type(): void
    {
        // Exercises the chk_activity_log_type CHECK constraint on PostgreSQL
        // (2026_06_12_000001 migration) — a 23514 violation fails this test.
        $log = $this->project->logActivity('coordinator_spawned', null, [
            'session_id' => 'session-test',
            'incident_type' => 'task_thrashing',
        ]);

        $this->assertDatabaseHas('activity_log', [
            'id' => $log->id,
            'project_id' => $this->project->id,
            'type' => 'coordinator_spawned',
        ]);
    }

    #[Test]
    public function orchestrator_start_accepts_and_persists_the_coordinator_flag(): void
    {
        $this->spy(AgentGateway::class);

        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/orchestrator/start", [
                'max_workers' => 1,
                'coordinator' => false,
            ])
            ->assertOk();

        $orchestration = (array) $this->project->fresh()->getSetting('orchestration');
        $this->assertTrue($orchestration['active']);
        $this->assertFalse($orchestration['coordinator']);

        // Omitted → defaults to enabled.
        $this->actingAs($this->user)
            ->postJson("/api/projects/{$this->project->id}/orchestrator/start", [
                'max_workers' => 1,
            ])
            ->assertOk();

        $this->assertTrue((bool) $this->project->fresh()->getSetting('orchestration')['coordinator']);
    }
}
