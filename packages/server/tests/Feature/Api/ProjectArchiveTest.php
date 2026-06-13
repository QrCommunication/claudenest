<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Events\ProjectArchived;
use App\Events\ProjectUnarchived;
use App\Models\ContextChunk;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature coverage for the reversible project archiving lifecycle
 * (ProjectController::archive / unarchive / recover + store's recoverable path).
 *
 * The archiving flow is the "free-unlimited" alternative to deletion: a project
 * vanishes from the active sidebar WITHOUT losing any data, and can be fully
 * recovered (context snapshot restored). This suite pins:
 *   1. archive() hides the project from the active flow but deletes nothing;
 *   2. unarchive() restores it to the active flow and recovers the context;
 *   3. recover() (same-path UI flow) restores the captured snapshot;
 *   4. store() returns a `recoverable` 409 when an ARCHIVED project owns the path
 *      (vs a hard 422 duplicate when an ACTIVE project owns it);
 *   5. the ProjectArchived / ProjectUnarchived broadcasts fire with scalar payloads;
 *   6. authorization + idempotence edge cases.
 */
class ProjectArchiveTest extends TestCase
{
    use RefreshDatabase;

    // ==================== ARCHIVE — nominal ====================

    #[Test]
    public function archive_hides_the_project_from_the_active_flow_without_deleting_it(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        // A sibling that must stay in the active list — proves archive scopes,
        // not nukes, the listing.
        $survivor = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/archive");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.is_archived', true)
            ->assertJsonPath('data.id', $project->id);

        // The row still exists (reversible — NOT a delete).
        $this->assertDatabaseHas('shared_projects', ['id' => $project->id]);
        $project->refresh();
        $this->assertNotNull($project->archived_at);

        // The default machine listing hides the archived project.
        $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}/projects")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $survivor->id)
            ->assertJsonMissing(['id' => $project->id]);

        // ?archived=true surfaces ONLY the archived project.
        $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}/projects?archived=true")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $project->id);
    }

    #[Test]
    public function archive_preserves_all_dependent_records(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        SharedTask::factory()->count(3)->for($project, 'project')->create();
        ContextChunk::factory()->count(2)->for($project, 'project')->create();

        // Insert the file lock at the schema level (DB::table) rather than via
        // the FileLock model: its booted() hook injects advanced-lock columns
        // (lock_type, metadata) whose migration is owned by a separate task and
        // is not guaranteed to be present here. We only need a real file_locks
        // row to prove archive cascades NOTHING — the base columns suffice.
        DB::table('file_locks')->insert([
            'id' => (string) Str::uuid(),
            'project_id' => $project->id,
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-archive-test',
            'reason' => 'pinned during archive test',
            'locked_at' => now(),
            'expires_at' => now()->addMinutes(30),
        ]);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/archive")
            ->assertOk();

        // Archiving deletes NOTHING — every child row survives so the project
        // can be fully recovered.
        $this->assertDatabaseCount('shared_tasks', 3);
        $this->assertDatabaseCount('context_chunks', 2);
        $this->assertDatabaseCount('file_locks', 1);
    }

    #[Test]
    public function archive_captures_a_context_snapshot(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create([
            'summary' => 'Original summary',
            'current_focus' => 'Original focus',
        ]);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/archive")
            ->assertOk()
            ->assertJsonPath('data.has_archived_context', true);

        $project->refresh();
        $this->assertSame('Original summary', $project->archived_context['summary']);
        $this->assertSame('Original focus', $project->archived_context['current_focus']);
    }

    #[Test]
    public function archive_dispatches_project_archived_with_scalar_payload(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'name' => 'Archivable Project',
        ]);

        Event::fake([ProjectArchived::class]);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/archive")
            ->assertOk();

        Event::assertDispatched(
            ProjectArchived::class,
            fn (ProjectArchived $event): bool => $event->projectId === $project->id
                && $event->machineId === $machine->id
                && $event->userId === $user->id
                && $event->name === 'Archivable Project'
                && $event->archivedAt !== null,
        );
    }

    // ==================== UNARCHIVE — nominal ====================

    #[Test]
    public function unarchive_restores_the_project_to_the_active_flow(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'archived_at' => now(),
            'archived_context' => ['summary' => 'snapshotted'],
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/unarchive");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.is_archived', false)
            ->assertJsonPath('data.has_archived_context', false);

        $project->refresh();
        $this->assertNull($project->archived_at);
        $this->assertNull($project->archived_context);

        // The project is back in the active machine listing.
        $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}/projects")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $project->id);
    }

    #[Test]
    public function unarchive_dispatches_project_unarchived_with_scalar_payload(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'name' => 'Restorable Project',
            'archived_at' => now(),
            'archived_context' => ['summary' => 'snapshotted'],
        ]);

        Event::fake([ProjectUnarchived::class]);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/unarchive")
            ->assertOk();

        Event::assertDispatched(
            ProjectUnarchived::class,
            fn (ProjectUnarchived $event): bool => $event->projectId === $project->id
                && $event->machineId === $machine->id
                && $event->userId === $user->id
                && $event->name === 'Restorable Project',
        );
    }

    // ==================== RECOVER (same-path flow) ====================

    #[Test]
    public function recover_restores_the_captured_context_snapshot(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create([
            'summary' => 'Pristine context',
            'current_focus' => 'Sprint 1',
        ]);

        // Archive captures the snapshot { summary: 'Pristine context', ... }.
        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/archive")
            ->assertOk();

        // Simulate drift while archived: the live fields are mutated. recover()
        // must restore the SNAPSHOT, not keep these mutated values — proving it
        // is a context recovery, not a mere flag flip.
        $project->refresh();
        $project->update(['summary' => 'Corrupted', 'current_focus' => 'Lost']);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/recover")
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('data.is_archived', false);

        $project->refresh();
        $this->assertSame('Pristine context', $project->summary);
        $this->assertSame('Sprint 1', $project->current_focus);
        $this->assertNull($project->archived_at);
    }

    // ==================== STORE — recoverable vs duplicate ====================

    #[Test]
    public function store_returns_recoverable_when_an_archived_project_owns_the_path(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $archived = SharedProject::factory()->for($user)->for($machine)->create([
            'name' => 'Archived At Path',
            'project_path' => '/home/user/projects/reused-path',
            'summary' => 'A meaningful summary that should preview.',
            'archived_at' => now(),
            'archived_context' => ['summary' => 'A meaningful summary that should preview.'],
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects", [
                'name' => 'New Project',
                'project_path' => '/home/user/projects/reused-path',
            ]);

        // 409 recoverable: the UI can offer to recover the archived project
        // instead of silently creating a duplicate at the same path.
        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'recoverable' => true,
            ])
            ->assertJsonPath('data.archived_project_id', $archived->id)
            ->assertJsonPath('data.name', 'Archived At Path');

        $response->assertJsonStructure([
            'data' => ['archived_project_id', 'name', 'archived_at', 'context_preview'],
        ]);

        // No duplicate was created — still exactly one project at this path.
        $this->assertDatabaseCount('shared_projects', 1);
    }

    #[Test]
    public function store_returns_a_hard_duplicate_error_when_an_active_project_owns_the_path(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/user/projects/active-path',
        ]);

        // An ACTIVE project at this path is a real duplicate, not recoverable.
        $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects", [
                'name' => 'New Project',
                'project_path' => '/home/user/projects/active-path',
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001');

        $this->assertDatabaseCount('shared_projects', 1);
    }

    // ==================== IDEMPOTENCE & AUTHORIZATION ====================

    #[Test]
    public function archiving_an_already_archived_project_keeps_the_original_snapshot(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create([
            'summary' => 'First snapshot',
        ]);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/archive")
            ->assertOk();

        $project->refresh();
        $firstArchivedAt = $project->archived_at;

        // Mutate the live summary then re-archive: idempotent archive() must NOT
        // overwrite the original snapshot.
        $project->update(['summary' => 'Drifted summary']);

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/archive")
            ->assertOk();

        $project->refresh();
        $this->assertSame('First snapshot', $project->archived_context['summary']);
        $this->assertEquals(
            $firstArchivedAt->toIso8601String(),
            $project->archived_at->toIso8601String(),
        );
    }

    #[Test]
    public function user_cannot_archive_another_users_project(): void
    {
        $user = User::factory()->create();
        $otherProject = SharedProject::factory()->create();

        Event::fake([ProjectArchived::class]);

        $this->actingAs($user)
            ->postJson("/api/projects/{$otherProject->id}/archive")
            ->assertStatus(403);

        $otherProject->refresh();
        $this->assertNull($otherProject->archived_at);
        Event::assertNotDispatched(ProjectArchived::class);
    }

    #[Test]
    public function user_cannot_unarchive_another_users_project(): void
    {
        $owner = User::factory()->create();
        $project = SharedProject::factory()->for($owner)->create([
            'archived_at' => now(),
            'archived_context' => ['summary' => 'snapshotted'],
        ]);

        $intruder = User::factory()->create();

        Event::fake([ProjectUnarchived::class]);

        $this->actingAs($intruder)
            ->postJson("/api/projects/{$project->id}/unarchive")
            ->assertStatus(403);

        $project->refresh();
        $this->assertNotNull($project->archived_at);
        Event::assertNotDispatched(ProjectUnarchived::class);
    }

    #[Test]
    public function archiving_a_missing_project_returns_404(): void
    {
        $user = User::factory()->create();
        $missingId = (string) Str::uuid();

        $this->actingAs($user)
            ->postJson("/api/projects/{$missingId}/archive")
            ->assertStatus(404);
    }

    #[Test]
    public function unauthenticated_user_cannot_archive_a_project(): void
    {
        $project = SharedProject::factory()->create();

        $this->postJson("/api/projects/{$project->id}/archive")
            ->assertStatus(401);

        $project->refresh();
        $this->assertNull($project->archived_at);
    }
}
