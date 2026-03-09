<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
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
                        'total_tokens', 'max_tokens', 'created_at',
                    ],
                ],
                'meta',
            ]);
    }

    /** @test */
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
                'data' => [
                    'project' => ['id', 'name', 'project_path'],
                ],
                'meta',
            ]);

        $this->assertDatabaseHas('shared_projects', [
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'name' => 'Test Project',
        ]);
    }

    /** @test */
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

    /** @test */
    public function user_cannot_view_other_users_project(): void
    {
        $user = User::factory()->create();
        $otherProject = SharedProject::factory()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$otherProject->id}");

        $response->assertStatus(403);
    }

    /** @test */
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

    /** @test */
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

    /** @test */
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

    /** @test */
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
                    'total_tokens',
                    'context_chunks_count',
                    'active_instances_count',
                    'tasks_count',
                ],
                'meta',
            ]);
    }

    /** @test */
    public function user_can_broadcast_message_to_project_instances(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/broadcast", [
                'message' => 'Test broadcast message',
                'type' => 'notification',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);
    }

    /** @test */
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
                'data' => ['activities'],
                'meta',
            ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_projects(): void
    {
        $machine = Machine::factory()->create();

        $response = $this->getJson("/api/machines/{$machine->id}/projects");

        $response->assertStatus(401);
    }

    /** @test */
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

        $response->assertStatus(422)
            ->assertJsonValidationErrors('project_path');
    }
}
