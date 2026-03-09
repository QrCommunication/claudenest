<?php

namespace Tests\Feature\Api;

use App\Models\FileLock;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FileLockApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_list_locks_for_their_project(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        $locks = FileLock::factory()->count(3)->for($project)->create();

        // Other project's locks
        FileLock::factory()->count(2)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/locks");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id', 'path', 'locked_by', 'reason',
                        'locked_at', 'expires_at',
                    ],
                ],
                'meta',
            ]);
    }

    /** @test */
    public function instance_can_lock_file(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks", [
                'path' => 'src/auth.ts',
                'instance_id' => 'instance-abc123',
                'reason' => 'Implementing authentication',
                'duration' => 30, // minutes
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'lock' => ['id', 'path', 'locked_by'],
                ],
                'meta',
            ]);

        $this->assertDatabaseHas('file_locks', [
            'project_id' => $project->id,
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
        ]);
    }

    /** @test */
    public function cannot_lock_already_locked_file(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        FileLock::factory()->for($project)->create([
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks", [
                'path' => 'src/auth.ts',
                'instance_id' => 'instance-xyz789',
            ]);

        $response->assertStatus(409) // Conflict
            ->assertJson(['success' => false]);
    }

    /** @test */
    public function can_lock_expired_file_lock(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        FileLock::factory()->for($project)->expired()->create([
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks", [
                'path' => 'src/auth.ts',
                'instance_id' => 'instance-xyz789',
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function instance_can_check_if_file_is_locked(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        FileLock::factory()->for($project)->create([
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks/check", [
                'path' => 'src/auth.ts',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'is_locked' => true,
                    'locked_by' => 'instance-abc123',
                ],
            ]);
    }

    /** @test */
    public function instance_can_extend_lock_duration(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->create();
        
        $lock = FileLock::factory()->for($project)->create([
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
            'expires_at' => now()->addMinutes(10),
        ]);

        $oldExpiresAt = $lock->expires_at;

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks/extend", [
                'path' => 'src/auth.ts',
                'instance_id' => 'instance-abc123',
                'duration' => 30,
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);

        $lock->refresh();
        $this->assertTrue($lock->expires_at->greaterThan($oldExpiresAt));
    }

    /** @test */
    public function instance_can_release_lock(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        $lock = FileLock::factory()->for($project)->create([
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks/release", [
                'path' => 'src/auth.ts',
                'instance_id' => 'instance-abc123',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('file_locks', [
            'id' => $lock->id,
        ]);
    }

    /** @test */
    public function cannot_release_lock_held_by_another_instance(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        FileLock::factory()->for($project)->create([
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks/release", [
                'path' => 'src/auth.ts',
                'instance_id' => 'instance-xyz789',
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function user_can_force_release_lock(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        $lock = FileLock::factory()->for($project)->create([
            'path' => 'src/auth.ts',
            'locked_by' => 'instance-abc123',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks/force-release", [
                'path' => 'src/auth.ts',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('file_locks', [
            'id' => $lock->id,
        ]);
    }

    /** @test */
    public function instance_can_lock_multiple_files(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks/bulk", [
                'paths' => ['src/auth.ts', 'src/middleware.ts', 'src/utils.ts'],
                'instance_id' => 'instance-abc123',
                'reason' => 'Refactoring authentication',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'locked' => [],
                    'failed' => [],
                ],
            ]);

        $this->assertDatabaseCount('file_locks', 3);
    }

    /** @test */
    public function instance_can_release_all_its_locks(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();
        
        FileLock::factory()->count(3)->for($project)->create([
            'locked_by' => 'instance-abc123',
        ]);

        // Another instance's lock
        FileLock::factory()->for($project)->create([
            'locked_by' => 'instance-xyz789',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/locks/release-by-instance", [
                'instance_id' => 'instance-abc123',
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);

        // Only the other instance's lock should remain
        $this->assertDatabaseCount('file_locks', 1);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_locks(): void
    {
        $project = SharedProject::factory()->create();

        $response = $this->getJson("/api/projects/{$project->id}/locks");

        $response->assertStatus(401);
    }
}
