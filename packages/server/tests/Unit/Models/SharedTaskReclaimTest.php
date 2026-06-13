<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\ClaudeInstance;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * SharedTask::reclaimOrphaned — "resume before new": tasks left in_progress by
 * a disconnected worker return to the claimable pool and are claimed first.
 */
class SharedTaskReclaimTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $this->project = SharedProject::factory()->for($user)->for($machine)->create();
    }

    private function makeInstance(string $suffix, bool $connected): ClaudeInstance
    {
        return ClaudeInstance::create([
            'id' => "inst-{$suffix}",
            'project_id' => $this->project->id,
            'machine_id' => $this->project->machine_id,
            'status' => 'idle',
            'context_tokens' => 0,
            'max_context_tokens' => 200_000,
            'tasks_completed' => 0,
            'connected_at' => now(),
            'disconnected_at' => $connected ? null : now(),
        ]);
    }

    #[Test]
    public function it_releases_in_progress_tasks_of_disconnected_workers(): void
    {
        $dead = $this->makeInstance('dead', connected: false);
        $alive = $this->makeInstance('alive', connected: true);

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
    public function reclaimed_task_is_claimed_before_fresh_pending_work(): void
    {
        $dead = $this->makeInstance('dead', connected: false);

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
