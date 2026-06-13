<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Events\ProjectDeleted;
use App\Models\ContextChunk;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature coverage for project deletion (ProjectController::destroy + index).
 *
 * The "ghost project" bug (a deleted shared project still showing in the
 * sidebar/menu) is guarded here on three axes:
 *   1. destroy() actually removes the row and index() never returns it again;
 *   2. PostgreSQL onDelete('cascade') purges every dependent record;
 *   3. the ProjectDeleted broadcast fires so connected clients drop it live.
 *
 * destroy() is also idempotent: deleting an already-gone project returns
 * success (so the client always purges its store) without re-broadcasting.
 */
class ProjectControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function destroy_removes_the_project_and_index_no_longer_returns_it(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        // A sibling project that must survive — proves index() filters, not nukes.
        $survivor = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}");

        $response->assertOk()->assertJson(['success' => true]);

        // Row is physically gone (hard delete, no SoftDeletes).
        $this->assertDatabaseMissing('shared_projects', ['id' => $project->id]);

        // index() never surfaces the deleted project again, only the survivor.
        $index = $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}/projects");

        $index->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $survivor->id)
            ->assertJsonMissing(['id' => $project->id]);

        // show() on the deleted project is a clean 404.
        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}")
            ->assertStatus(404);
    }

    #[Test]
    public function destroy_cascades_to_dependent_records(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        SharedTask::factory()->count(3)->for($project, 'project')->create();
        ContextChunk::factory()->count(2)->for($project, 'project')->create();

        $this->assertDatabaseCount('shared_tasks', 3);
        $this->assertDatabaseCount('context_chunks', 2);

        $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}")
            ->assertOk();

        // PostgreSQL onDelete('cascade') purges every child row.
        $this->assertDatabaseMissing('shared_projects', ['id' => $project->id]);
        $this->assertDatabaseMissing('shared_tasks', ['project_id' => $project->id]);
        $this->assertDatabaseMissing('context_chunks', ['project_id' => $project->id]);
    }

    #[Test]
    public function destroy_dispatches_project_deleted_with_scalar_payload(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'name' => 'Doomed Project',
        ]);

        // Selective fake: only ProjectDeleted is intercepted, so the Eloquent
        // model lifecycle (creating/UUID/settings) above still ran normally.
        Event::fake([ProjectDeleted::class]);

        $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}")
            ->assertOk();

        Event::assertDispatched(
            ProjectDeleted::class,
            fn (ProjectDeleted $event): bool => $event->projectId === $project->id
                && $event->machineId === $machine->id
                && $event->userId === $user->id
                && $event->name === 'Doomed Project',
        );
    }

    #[Test]
    public function destroy_is_idempotent_for_a_missing_project(): void
    {
        $user = User::factory()->create();

        // A well-formed but non-existent id — never created.
        $missingId = (string) Str::uuid();

        Event::fake([ProjectDeleted::class]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/projects/{$missingId}");

        // Idempotent: an already-gone project returns success (200) so the
        // client always purges its store instead of getting stuck on a 404.
        $response->assertOk()->assertJson(['success' => true]);

        // Nothing to broadcast when there was nothing to delete.
        Event::assertNotDispatched(ProjectDeleted::class);
    }

    #[Test]
    public function user_cannot_delete_another_users_project(): void
    {
        $user = User::factory()->create();
        $otherProject = SharedProject::factory()->create();

        Event::fake([ProjectDeleted::class]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/projects/{$otherProject->id}");

        $response->assertStatus(403);

        // The project survives and no removal is broadcast.
        $this->assertDatabaseHas('shared_projects', ['id' => $otherProject->id]);
        Event::assertNotDispatched(ProjectDeleted::class);
    }

    #[Test]
    public function unauthenticated_user_cannot_delete_a_project(): void
    {
        $project = SharedProject::factory()->create();

        $this->deleteJson("/api/projects/{$project->id}")
            ->assertStatus(401);

        $this->assertDatabaseHas('shared_projects', ['id' => $project->id]);
    }
}
