<?php

namespace Tests\Feature\Api;

use PHPUnit\Framework\Attributes\Test;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function user_can_list_their_projects(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $projects = SharedProject::factory()->count(3)->for($user)->for($machine)->create();

        // Other user's projects
        SharedProject::factory()->count(2)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/machines/{$machine->id}/projects");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id', 'name', 'project_path', 'summary',
                        'token_usage_percent', 'created_at',
                    ],
                ],
                'meta',
            ]);
    }

    #[Test]
    public function user_can_create_project(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects", [
                'name' => 'Test Project',
                'project_path' => '/home/user/projects/test',
                'summary' => 'A test project',
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'name', 'project_path'],
                'meta',
            ]);

        $this->assertDatabaseHas('shared_projects', [
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'name' => 'Test Project',
        ]);
    }

    #[Test]
    public function creating_project_with_context_seeds_rag_chunks(): void
    {
        // Embedding service unreachable: chunks must still be created (without vectors).
        Http::fake(['*' => Http::response([], 500)]);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects", [
                'name' => 'Context Project',
                'project_path' => '/home/user/projects/context',
                'summary' => 'A short summary of the app.',
                'architecture' => 'Laravel API + Vue SPA.',
                'conventions' => 'PSR-12, strict types.',
                'current_focus' => 'Shipping the v1 wizard.',
            ]);

        $response->assertStatus(201);
        $projectId = $response->json('data.id');

        $this->assertDatabaseCount('context_chunks', 4);

        foreach (['summary', 'architecture', 'conventions', 'current_focus'] as $type) {
            $this->assertDatabaseHas('context_chunks', [
                'project_id' => $projectId,
                'type' => $type,
                'importance_score' => 0.8,
            ]);
        }

        $this->assertSame(
            'A short summary of the app.',
            DB::table('context_chunks')
                ->where('project_id', $projectId)
                ->where('type', 'summary')
                ->value('content'),
        );
    }

    #[Test]
    public function creating_project_without_context_seeds_no_chunks(): void
    {
        Http::fake(['*' => Http::response([], 500)]);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects", [
                'name' => 'Bare Project',
                'project_path' => '/home/user/projects/bare',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseCount('context_chunks', 0);
    }

    #[Test]
    public function user_can_view_their_project(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $project->id,
                    'name' => $project->name,
                ],
            ]);
    }

    #[Test]
    public function user_cannot_view_other_users_project(): void
    {
        $user = User::factory()->create();
        $otherProject = SharedProject::factory()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$otherProject->id}");

        $response->assertStatus(403);
    }

    #[Test]
    public function user_can_update_their_project(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'summary' => 'Old summary',
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/api/projects/{$project->id}", [
                'summary' => 'New summary',
                'current_focus' => 'Building authentication',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'summary' => 'New summary',
                    'current_focus' => 'Building authentication',
                ],
            ]);

        $this->assertDatabaseHas('shared_projects', [
            'id' => $project->id,
            'summary' => 'New summary',
        ]);
    }

    #[Test]
    public function user_cannot_update_other_users_project(): void
    {
        $user = User::factory()->create();
        $otherProject = SharedProject::factory()->create();

        $response = $this->actingAs($user)
            ->patchJson("/api/projects/{$otherProject->id}", [
                'summary' => 'Hacked summary',
            ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function user_can_delete_their_project(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('shared_projects', [
            'id' => $project->id,
        ]);
    }

    #[Test]
    public function user_can_get_project_statistics(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/stats");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_tasks',
                    'context_chunks',
                    'active_instances',
                    'token_usage' => ['current', 'max', 'percent'],
                ],
                'meta',
            ]);
    }

    #[Test]
    public function project_stats_remaining_tasks_uses_scope_remaining(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        // A completed sprint: its still-open tasks are stranded and must NOT
        // count toward "remaining work" (mirrors SharedTask::scopeRemaining).
        $completedSprint = $project->sprints()->create([
            'name' => 'Completed sprint',
            'status' => 'completed',
            'sort_order' => 1,
        ]);
        // An active sprint: its open tasks DO count as remaining.
        $activeSprint = $project->sprints()->create([
            'name' => 'Active sprint',
            'status' => 'active',
            'sort_order' => 2,
        ]);

        // 1) Backlog (no sprint), not done -> remaining.
        SharedTask::factory()->for($project, 'project')->create(['status' => 'pending']);
        // 2) Done -> excluded by the status filter.
        SharedTask::factory()->for($project, 'project')->completed()->create();
        // 3) Pending but stranded in a completed sprint -> excluded.
        SharedTask::factory()->for($project, 'project')->create([
            'status' => 'pending',
            'sprint_id' => $completedSprint->id,
        ]);
        // 4) In progress in an active sprint -> remaining.
        SharedTask::factory()->for($project, 'project')->create([
            'status' => 'in_progress',
            'sprint_id' => $activeSprint->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/stats");

        $response->assertOk()
            ->assertJsonPath('data.total_tasks', 4)
            ->assertJsonPath('data.completed_tasks', 1)
            // Only the backlog (1) and the active-sprint (4) tasks remain;
            // the done task (2) and the closed-sprint task (3) are excluded.
            ->assertJsonPath('data.remaining_tasks', 2);
    }

    #[Test]
    public function user_can_broadcast_message_to_project_instances(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/broadcast", [
                'message' => 'Test broadcast message',
                'type' => 'info',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);
    }

    #[Test]
    public function user_can_get_project_activity_log(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/activity");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data',
                'meta',
            ]);
    }

    #[Test]
    public function unauthenticated_user_cannot_access_projects(): void
    {
        $machine = Machine::factory()->create();

        $response = $this->getJson("/api/machines/{$machine->id}/projects");

        $response->assertStatus(401);
    }

    #[Test]
    public function project_path_must_be_unique_per_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        SharedProject::factory()->for($user)->for($machine)->create([
            'project_path' => '/home/user/projects/test',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects", [
                'name' => 'Another Project',
                'project_path' => '/home/user/projects/test',
            ]);

        // store() rejects a duplicate path with a business VAL_001 error
        // (message-level, not a per-field validation error).
        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001');
    }
}
