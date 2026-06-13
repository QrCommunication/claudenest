<?php

namespace Tests\Feature\Api;

use App\Events\SessionNotification;
use App\Models\ClaudeInstance;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\AgentGateway;
use App\Services\WorkerLoopService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Server-driven worker loop (Stop hook → idle heartbeat): nudge, human-input
 * suspension, no-progress pause, recycle and scale-down behaviors.
 */
class WorkerLoopTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    private Session $session;

    private ClaudeInstance $instance;

    /**
     * Build an orchestrated worker (session + instance) on a project with
     * active orchestration settings.
     */
    private function makeWorker(array $sessionAttributes = [], array $instanceAttributes = []): void
    {
        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create();
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create();
        $this->project->setSetting('orchestration', [
            'active' => true,
            'max_workers' => 3,
            'permission_mode' => 'acceptEdits',
            'started_at' => now()->toIso8601String(),
        ]);

        $this->session = Session::factory()->for($this->machine)->for($this->user)->create(array_merge([
            'shared_project_id' => $this->project->id,
            'orchestrated' => true,
            'status' => 'running',
        ], $sessionAttributes));

        $this->instance = ClaudeInstance::create(array_merge([
            'id' => "inst-{$this->session->id}",
            'project_id' => $this->project->id,
            'machine_id' => $this->machine->id,
            'session_id' => $this->session->id,
            'status' => 'busy',
            'context_tokens' => 0,
            'max_context_tokens' => 200_000,
            'tasks_completed' => 0,
            'connected_at' => now(),
            'last_activity_at' => now(),
        ], $instanceAttributes));
    }

    private function heartbeatIdle(): void
    {
        $this->actingAs($this->user)
            ->postJson("/api/instances/{$this->instance->id}/heartbeat", ['status' => 'idle'])
            ->assertOk();
    }

    #[Test]
    public function idle_heartbeat_nudges_worker_to_claim_next_task(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $this->heartbeatIdle();

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) {
                return $machineId === $this->machine->id
                    && $type === 'session:input'
                    && $payload['sessionId'] === $this->session->id
                    && str_contains($payload['data'], 'task_claim_next')
                    && str_ends_with($payload['data'], "\r");
            })
            ->once();

        $this->assertSame(1, (int) Cache::get(WorkerLoopService::nudgesKey($this->instance->id)));
    }

    #[Test]
    public function idle_heartbeat_nudges_worker_to_finish_its_in_progress_task(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => "inst-{$this->session->id}",
            'claimed_at' => now(),
            'title' => 'Implement the API contract',
        ]);
        $this->instance->update(['current_task_id' => $task->id]);

        $this->heartbeatIdle();

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) {
                return $type === 'session:input'
                    && $payload['sessionId'] === $this->session->id
                    && str_contains($payload['data'], 'Implement the API contract')
                    && str_contains($payload['data'], 'task_complete');
            })
            ->once();
    }

    #[Test]
    public function loop_is_suspended_after_recent_human_input(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        WorkerLoopService::markHumanInput($this->session->id);

        $this->heartbeatIdle();

        $gateway->shouldNotHaveReceived('sendMessage');
    }

    #[Test]
    public function http_session_input_marks_the_human_suspension_timestamp(): void
    {
        $this->spy(AgentGateway::class);

        $this->makeWorker();

        $this->actingAs($this->user)
            ->postJson("/api/sessions/{$this->session->id}/input", ['data' => 'ls -la'])
            ->assertOk();

        $this->assertNotNull(Cache::get(WorkerLoopService::humanInputKey($this->session->id)));
    }

    #[Test]
    public function nudge_budget_exhausted_cools_down_the_worker_and_notifies_instead(): void
    {
        Event::fake([SessionNotification::class]);
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        // The budget (MAX_NUDGES_BEFORE_PAUSE) minus one already spent: the next
        // nudge tips it over into a cool-down.
        Cache::put(
            WorkerLoopService::nudgesKey($this->instance->id),
            WorkerLoopService::MAX_NUDGES_BEFORE_PAUSE - 1,
            3600,
        );

        $this->heartbeatIdle();

        // Cooled down instead of nudged.
        $gateway->shouldNotHaveReceived('sendMessage');
        $this->assertTrue((bool) Cache::get(WorkerLoopService::pausedKey($this->instance->id)));
        // Counter cleared so the dispatcher resumes with a fresh budget.
        $this->assertNull(Cache::get(WorkerLoopService::nudgesKey($this->instance->id)));

        Event::assertDispatched(SessionNotification::class, function (SessionNotification $event) {
            return $event->session->id === $this->session->id
                && $event->title === 'Worker cooling down'
                && $event->notificationType === 'warning';
        });
    }

    #[Test]
    public function paused_worker_is_not_nudged(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        Cache::put(WorkerLoopService::pausedKey($this->instance->id), true, 3600);

        $this->heartbeatIdle();

        $gateway->shouldNotHaveReceived('sendMessage');
    }

    #[Test]
    public function task_complete_resets_the_no_progress_state(): void
    {
        $this->spy(AgentGateway::class);

        $this->makeWorker();
        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $this->instance->id,
            'claimed_at' => now(),
            'files' => [],
        ]);

        Cache::put(WorkerLoopService::nudgesKey($this->instance->id), 2, 3600);
        Cache::put(WorkerLoopService::pausedKey($this->instance->id), true, 3600);

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/complete", [
                'summary' => 'Done end to end.',
                'instance_id' => $this->instance->id,
            ])
            ->assertOk();

        $this->assertNull(Cache::get(WorkerLoopService::nudgesKey($this->instance->id)));
        $this->assertNull(Cache::get(WorkerLoopService::pausedKey($this->instance->id)));
    }

    #[Test]
    public function task_claim_resets_the_no_progress_state(): void
    {
        $this->spy(AgentGateway::class);

        $this->makeWorker();
        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'pending',
            'files' => [],
        ]);

        Cache::put(WorkerLoopService::nudgesKey($this->instance->id), 2, 3600);

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/claim", [
                'instance_id' => $this->instance->id,
            ])
            ->assertOk();

        $this->assertNull(Cache::get(WorkerLoopService::nudgesKey($this->instance->id)));
    }

    #[Test]
    public function worker_is_recycled_after_five_completed_tasks(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker(instanceAttributes: ['tasks_completed' => 5]);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $this->heartbeatIdle();

        // Old worker terminated…
        $this->assertSame('terminated', $this->session->fresh()->status);
        $gateway->shouldHaveReceived('sendMessage')
            ->with($this->machine->id, 'session:terminate', ['sessionId' => $this->session->id]);

        // …and replaced by a fresh orchestrated session
        $replacement = Session::where('shared_project_id', $this->project->id)
            ->where('orchestrated', true)
            ->where('id', '!=', $this->session->id)
            ->first();
        $this->assertNotNull($replacement);
        $this->assertSame('created', $replacement->status);
        $this->assertDatabaseHas('claude_instances', ['id' => "inst-{$replacement->id}"]);

        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) use ($replacement) {
                return $type === 'session:create'
                    && $payload['sessionId'] === $replacement->id
                    && ($payload['permissionMode'] ?? null) === 'acceptEdits';
            })
            ->once();
    }

    #[Test]
    public function worker_is_recycled_after_two_hours_of_session_lifetime(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker(sessionAttributes: ['started_at' => now()->subHours(3)]);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $this->heartbeatIdle();

        $this->assertSame('terminated', $this->session->fresh()->status);
        $gateway->shouldHaveReceived('sendMessage')
            ->with($this->machine->id, 'session:terminate', ['sessionId' => $this->session->id]);
    }

    #[Test]
    public function worker_scales_down_when_all_tasks_are_done(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        SharedTask::factory()->completed()->create(['project_id' => $this->project->id]);

        $this->heartbeatIdle();

        $this->assertSame('terminated', $this->session->fresh()->status);
        $this->assertSame('disconnected', $this->instance->fresh()->status);

        $gateway->shouldHaveReceived('sendMessage')
            ->with($this->machine->id, 'session:terminate', ['sessionId' => $this->session->id]);

        // No replacement is spawned on scale-down
        $this->assertSame(
            0,
            Session::where('shared_project_id', $this->project->id)
                ->where('orchestrated', true)
                ->active()
                ->count(),
        );
    }

    #[Test]
    public function worker_stays_warm_when_remaining_tasks_are_claimed_elsewhere(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        // No pending task, but one still in progress on another instance
        SharedTask::factory()->claimed()->create(['project_id' => $this->project->id]);

        $this->heartbeatIdle();

        $gateway->shouldNotHaveReceived('sendMessage');
        $this->assertSame('running', $this->session->fresh()->status);
    }

    #[Test]
    public function non_orchestrated_session_is_never_nudged(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker(sessionAttributes: ['orchestrated' => false]);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $this->heartbeatIdle();

        $gateway->shouldNotHaveReceived('sendMessage');
    }

    #[Test]
    public function idle_heartbeat_does_nothing_without_active_orchestration(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker();
        $this->project->setSetting('orchestration', ['active' => false]);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $this->heartbeatIdle();

        $gateway->shouldNotHaveReceived('sendMessage');
    }

    #[Test]
    public function dispatch_project_nudges_idle_worker_without_any_heartbeat(): void
    {
        // Proactive safety net: the worker never sent an idle heartbeat (its
        // status is the initial 'idle' from attach) yet must still be kicked.
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker(instanceAttributes: ['status' => 'idle']);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $ticked = app(WorkerLoopService::class)->dispatchProject($this->project->fresh());

        $this->assertSame(1, $ticked);
        $gateway->shouldHaveReceived('sendMessage')
            ->withArgs(function (string $machineId, string $type, array $payload) {
                return $type === 'session:input'
                    && $payload['sessionId'] === $this->session->id
                    && str_contains($payload['data'], 'task_claim_next');
            })
            ->once();
    }

    #[Test]
    public function dispatch_project_is_noop_without_active_orchestration(): void
    {
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker(instanceAttributes: ['status' => 'idle']);
        $this->project->setSetting('orchestration', ['active' => false]);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $ticked = app(WorkerLoopService::class)->dispatchProject($this->project->fresh());

        $this->assertSame(0, $ticked);
        $gateway->shouldNotHaveReceived('sendMessage');
    }

    #[Test]
    public function dispatch_project_skips_busy_workers(): void
    {
        // A worker actively coding (status busy) must not be interrupted.
        $gateway = $this->spy(AgentGateway::class);

        $this->makeWorker(instanceAttributes: ['status' => 'busy']);
        SharedTask::factory()->create(['project_id' => $this->project->id, 'status' => 'pending', 'files' => []]);

        $ticked = app(WorkerLoopService::class)->dispatchProject($this->project->fresh());

        $this->assertSame(0, $ticked);
        $gateway->shouldNotHaveReceived('sendMessage');
    }
}
