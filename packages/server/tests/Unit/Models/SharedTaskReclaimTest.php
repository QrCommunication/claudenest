<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\ClaudeInstance;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\WorkerLoopService;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * SharedTask::reclaimOrphaned — "resume before new": tasks left in_progress by
 * a worker whose SESSION is dead return to the claimable pool and are claimed
 * first. Liveness is keyed off the session (resilient to transient agent WS
 * drops that flip instance.disconnected_at), never on disconnected_at.
 *
 * Anti-churn (Phase 1): a task is reclaimed ONLY once it has cleared the
 * post-claim grace (RECLAIM_GRACE_SECONDS) AND its session has been terminal
 * long enough (RECLAIM_DEAD_SESSION_SECONDS), so the sweep never races a
 * legitimate volunteer recycle/handoff.
 */
class SharedTaskReclaimTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    private Machine $machine;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create();
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create();
    }

    /**
     * @param  bool  $alive  whether the worker's session is still running
     * @param  CarbonInterface|null  $diedAt  when the session went terminal
     *                                        (only meaningful when $alive is false; defaults to "long ago")
     */
    private function makeInstance(string $suffix, bool $alive, $diedAt = null): ClaudeInstance
    {
        $session = Session::factory()->for($this->machine)->for($this->user)->create([
            'shared_project_id' => $this->project->id,
            'orchestrated' => true,
            'status' => $alive ? 'running' : 'terminated',
            'completed_at' => $alive
                ? null
                : ($diedAt ?? now()->subSeconds(WorkerLoopService::RECLAIM_DEAD_SESSION_SECONDS + 60)),
        ]);

        return ClaudeInstance::create([
            'id' => "inst-{$suffix}",
            'project_id' => $this->project->id,
            'machine_id' => $this->project->machine_id,
            'session_id' => $session->id,
            'status' => 'idle',
            'context_tokens' => 0,
            'max_context_tokens' => 200_000,
            'tasks_completed' => 0,
            'connected_at' => now(),
            // disconnected_at intentionally left null even for the dead one:
            // reclaim must key off session status, not this flag.
            'disconnected_at' => null,
        ]);
    }

    /**
     * Claimed past the anti-churn grace window — the default for a task held by
     * a worker that genuinely crashed (it was claimed a while ago).
     */
    private function staleClaimAt(): CarbonInterface
    {
        return now()->subSeconds(WorkerLoopService::RECLAIM_GRACE_SECONDS + 30);
    }

    #[Test]
    public function it_releases_in_progress_tasks_of_disconnected_workers(): void
    {
        $dead = $this->makeInstance('dead', alive: false);
        $alive = $this->makeInstance('alive', alive: true);

        $orphan = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $dead->id,
            'claimed_at' => $this->staleClaimAt(),
            'files' => [],
        ]);
        $stillWorked = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $alive->id,
            'claimed_at' => $this->staleClaimAt(),
            'files' => [],
        ]);

        $count = SharedTask::reclaimOrphaned($this->project->id);

        $this->assertSame(1, $count);

        // Orphan returned to the pool, claimed_at kept as resume marker.
        $orphan->refresh();
        $this->assertSame('pending', $orphan->status);
        $this->assertNull($orphan->assigned_to);
        $this->assertNotNull($orphan->claimed_at);

        // The live worker's task is untouched.
        $stillWorked->refresh();
        $this->assertSame('in_progress', $stillWorked->status);
        $this->assertSame($alive->id, $stillWorked->assigned_to);
    }

    #[Test]
    public function it_keeps_tasks_of_a_disconnected_instance_whose_session_is_still_running(): void
    {
        // Regression: a transient agent WS drop flips instance.disconnected_at
        // while the worker (session=running) keeps going. Its task MUST NOT be
        // reclaimed (that yanked work from live workers in prod).
        $session = Session::factory()->for($this->machine)->for($this->user)->create([
            'shared_project_id' => $this->project->id,
            'orchestrated' => true,
            'status' => 'running',
        ]);
        $instance = ClaudeInstance::create([
            'id' => 'inst-blipped',
            'project_id' => $this->project->id,
            'machine_id' => $this->project->machine_id,
            'session_id' => $session->id,
            'status' => 'busy',
            'context_tokens' => 0,
            'max_context_tokens' => 200_000,
            'tasks_completed' => 0,
            'connected_at' => now(),
            'disconnected_at' => now(), // flipped by a WS blip, but worker is alive
        ]);

        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $instance->id,
            'claimed_at' => $this->staleClaimAt(),
            'files' => [],
        ]);

        $count = SharedTask::reclaimOrphaned($this->project->id);

        $this->assertSame(0, $count);
        $task->refresh();
        $this->assertSame('in_progress', $task->status);
        $this->assertSame($instance->id, $task->assigned_to);
    }

    #[Test]
    public function it_does_not_reclaim_a_freshly_claimed_task_within_the_grace_window(): void
    {
        // Anti-churn core: a worker completes a task → is recycled (session
        // terminated) the instant it reports idle, but it had just re-claimed a
        // long task. The orphan sweep must NOT yank that task — the volunteer
        // teardown + handoff is still settling. Both guards block it here:
        // claimed_at is fresh AND the session died moments ago.
        $dead = $this->makeInstance('recycling', alive: false, diedAt: now()->subSeconds(5));

        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $dead->id,
            'claimed_at' => now()->subSeconds(5), // re-claimed seconds ago
            'files' => [],
        ]);

        $count = SharedTask::reclaimOrphaned($this->project->id);

        $this->assertSame(0, $count);
        $task->refresh();
        $this->assertSame('in_progress', $task->status);
        $this->assertSame($dead->id, $task->assigned_to);
    }

    #[Test]
    public function it_keeps_a_stale_task_behind_a_freshly_terminated_session(): void
    {
        // The session just flipped terminated (volunteer recycle in flight). Even
        // though the task itself was claimed long ago (grace cleared), the
        // dead-session guard alone keeps it: the worker is mid-handoff, not gone.
        $dead = $this->makeInstance('just-terminated', alive: false, diedAt: now()->subSeconds(5));

        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $dead->id,
            'claimed_at' => $this->staleClaimAt(), // claimed long ago…
            'files' => [],
        ]);

        $count = SharedTask::reclaimOrphaned($this->project->id);

        $this->assertSame(0, $count); // …but its session only just died.
        $task->refresh();
        $this->assertSame('in_progress', $task->status);
        $this->assertSame($dead->id, $task->assigned_to);
    }

    #[Test]
    public function it_reclaims_once_grace_and_dead_session_windows_have_both_elapsed(): void
    {
        // The worker is genuinely gone: its session has been terminal well past
        // RECLAIM_DEAD_SESSION_SECONDS and the task cleared the claim grace.
        $dead = $this->makeInstance(
            'gone',
            alive: false,
            diedAt: now()->subSeconds(WorkerLoopService::RECLAIM_DEAD_SESSION_SECONDS + 30),
        );

        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $dead->id,
            'claimed_at' => $this->staleClaimAt(),
            'files' => [],
        ]);

        $count = SharedTask::reclaimOrphaned($this->project->id);

        $this->assertSame(1, $count);
        $task->refresh();
        $this->assertSame('pending', $task->status);
        $this->assertNull($task->assigned_to);
        $this->assertNotNull($task->claimed_at); // resume marker preserved
    }

    #[Test]
    public function it_reclaims_a_stale_task_whose_assigned_instance_no_longer_exists(): void
    {
        // Worker row is gone entirely (cleaned up) — there is no session to date,
        // so the dead-session guard cannot pin it; the claim grace alone governs.
        $task = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => 'inst-vanished',
            'claimed_at' => $this->staleClaimAt(),
            'files' => [],
        ]);

        $count = SharedTask::reclaimOrphaned($this->project->id);

        $this->assertSame(1, $count);
        $task->refresh();
        $this->assertSame('pending', $task->status);
        $this->assertNull($task->assigned_to);
    }

    #[Test]
    public function reclaimed_task_is_claimed_before_fresh_pending_work(): void
    {
        $dead = $this->makeInstance('dead', alive: false);

        $fresh = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'pending',
            'priority' => 'critical',
            'claimed_at' => null,
            'files' => [],
        ]);
        $resumed = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'priority' => 'low',
            'assigned_to' => $dead->id,
            'claimed_at' => $this->staleClaimAt(),
            'files' => [],
        ]);

        SharedTask::reclaimOrphaned($this->project->id);

        // Even though $fresh is critical, the resumed task (lower priority but
        // already started) is surfaced first.
        $next = SharedTask::getNextAvailable($this->project->id);
        $this->assertSame($resumed->id, $next?->id);
        $this->assertNotSame($fresh->id, $next?->id);
    }
}
