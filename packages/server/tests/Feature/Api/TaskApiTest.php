<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_list_tasks_for_their_project(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $tasks = SharedTask::factory()->count(3)->for($project)->create();

        // Other project's tasks
        SharedTask::factory()->count(2)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/tasks");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id', 'title', 'description', 'priority', 'status',
                        'assigned_to', 'created_at',
                    ],
                ],
                'meta',
            ]);
    }

    /** @test */
    public function user_can_create_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/tasks", [
                'title' => 'Implement authentication',
                'description' => 'Build JWT authentication system',
                'priority' => 'high',
                'files' => ['src/auth.ts', 'src/middleware.ts'],
                'estimated_tokens' => 5000,
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'task' => ['id', 'title', 'status', 'priority'],
                ],
                'meta',
            ]);

        $this->assertDatabaseHas('shared_tasks', [
            'project_id' => $project->id,
            'title' => 'Implement authentication',
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function task_creation_validates_priority(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/tasks", [
                'title' => 'Test task',
                'priority' => 'invalid-priority',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('priority');
    }

    /** @test */
    public function user_can_view_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $task = SharedTask::factory()->for($project)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/tasks/{$task->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $task->id,
                    'title' => $task->title,
                ],
            ]);
    }

    /** @test */
    public function user_cannot_view_task_from_other_users_project(): void
    {
        $user = User::factory()->create();
        $otherTask = SharedTask::factory()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/tasks/{$otherTask->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function user_can_update_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $task = SharedTask::factory()->for($project)->create([
            'priority' => 'low',
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/api/tasks/{$task->id}", [
                'priority' => 'high',
                'description' => 'Updated description',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'priority' => 'high',
                    'description' => 'Updated description',
                ],
            ]);

        $this->assertDatabaseHas('shared_tasks', [
            'id' => $task->id,
            'priority' => 'high',
        ]);
    }

    /** @test */
    public function user_can_delete_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $task = SharedTask::factory()->for($project)->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/tasks/{$task->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('shared_tasks', [
            'id' => $task->id,
        ]);
    }

    /** @test */
    public function instance_can_claim_pending_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $task = SharedTask::factory()->for($project)->create(['status' => 'pending']);

        $response = $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/claim", [
                'instance_id' => 'instance-abc123',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'in_progress',
                    'assigned_to' => 'instance-abc123',
                ],
            ]);

        $task->refresh();
        $this->assertEquals('in_progress', $task->status);
        $this->assertEquals('instance-abc123', $task->assigned_to);
        $this->assertNotNull($task->claimed_at);
    }

    /** @test */
    public function cannot_claim_already_claimed_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $task = SharedTask::factory()->for($project)->claimed()->create();

        $response = $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/claim", [
                'instance_id' => 'instance-xyz789',
            ]);

        $response->assertStatus(409) // Conflict
            ->assertJson(['success' => false]);
    }

    /** @test */
    public function instance_can_release_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $task = SharedTask::factory()->for($project)->claimed()->create([
            'assigned_to' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/release", [
                'instance_id' => 'instance-abc123',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);

        $task->refresh();
        $this->assertEquals('pending', $task->status);
        $this->assertNull($task->assigned_to);
    }

    /** @test */
    public function instance_can_complete_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $task = SharedTask::factory()->for($project)->claimed()->create([
            'assigned_to' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/tasks/{$task->id}/complete", [
                'instance_id' => 'instance-abc123',
                'completion_summary' => 'Successfully implemented authentication',
                'files_modified' => ['src/auth.ts'],
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'done',
                ],
            ]);

        $task->refresh();
        $this->assertEquals('done', $task->status);
        $this->assertNotNull($task->completed_at);
    }

    /** @test */
    public function can_get_next_available_task(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        SharedTask::factory()->for($project)->create(['status' => 'pending', 'priority' => 'low']);
        $highPriorityTask = SharedTask::factory()->for($project)->create(['status' => 'pending', 'priority' => 'high']);

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/tasks/next-available");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $highPriorityTask->id,
                    'priority' => 'high',
                ],
            ]);
    }

    /** @test */
    public function can_filter_tasks_by_status(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        SharedTask::factory()->for($project)->create(['status' => 'pending']);
        SharedTask::factory()->for($project)->create(['status' => 'pending']);
        SharedTask::factory()->for($project)->completed()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/tasks?status=pending");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function unauthenticated_user_cannot_access_tasks(): void
    {
        $project = SharedProject::factory()->create();

        $response = $this->getJson("/api/projects/{$project->id}/tasks");

        $response->assertStatus(401);
    }
}
