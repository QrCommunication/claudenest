<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\ClaudeInstance;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * SharedTask::reclaimOrphaned — "resume before new": tasks left in_progress by
 * a worker whose SESSION is dead return to the claimable pool and are claimed
 * first. Liveness is keyed off the session (resilient to transient agent WS
 * drops that flip instance.disconnected_at), never on disconnected_at.
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
     */
    private function makeInstance(string $suffix, bool $alive): ClaudeInstance
    {
        $session = Session::factory()->for($this->machine)->for($this->user)->create([
            'shared_project_id' => $this->project->id,
            'orchestrated' => true,
            'status' => $alive ? 'running' : 'terminated',
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

    #[Test]
    public function it_releases_in_progress_tasks_of_disconnected_workers(): void
    {
        $dead = $this->makeInstance('dead', alive: false);
        $alive = $this->makeInstance('alive', alive: true);

        $orphan = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $dead->id,
            'claimed_at' => now(),
            'files' => [],
        ]);
        $stillWorked = SharedTask::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'assigned_to' => $alive->id,
            'claimed_at' => now(),
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
            'claimed_at' => now(),
            'files' => [],
        ]);

        $count = SharedTask::reclaimOrphaned($this->project->id);

        $this->assertSame(0, $count);
        $task->refresh();
        $this->assertSame('in_progress', $task->status);
        $this->assertSame($instance->id, $task->assigned_to);
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
            'claimed_at' => now()->subMinutes(5),
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
