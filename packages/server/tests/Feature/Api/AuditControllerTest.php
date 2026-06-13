<?php

namespace Tests\Feature\Api;

use App\Models\ActivityLog;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Public audit trail: paginated, filterable activity_log for any user with
 * access to the project (no role/plan gating).
 */
class AuditControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeProject(User $user): SharedProject
    {
        $machine = Machine::factory()->for($user)->create();

        return SharedProject::factory()->for($user)->for($machine)->create();
    }

    private function log(SharedProject $project, string $type, ?string $instance, ?string $createdAt = null): ActivityLog
    {
        // Details mirror what the real producers populate (the message accessor
        // reads type-specific keys: task_title, path, message, description).
        $entry = ActivityLog::create([
            'project_id' => $project->id,
            'instance_id' => $instance,
            'type' => $type,
            'details' => [
                'task_title' => 'Sample task',
                'path' => 'src/sample.ts',
                'message' => "{$type} event",
                'description' => "{$type} event",
            ],
        ]);

        if ($createdAt !== null) {
            $entry->forceFill(['created_at' => $createdAt])->save();
        }

        return $entry;
    }

    #[Test]
    public function it_returns_paginated_audit_trail_for_the_project_owner(): void
    {
        $user = User::factory()->create();
        $project = $this->makeProject($user);

        foreach (range(1, 30) as $i) {
            $this->log($project, 'task_claimed', "inst-{$i}");
        }

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?per_page=10");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.pagination.total', 30)
            ->assertJsonPath('meta.pagination.per_page', 10)
            ->assertJsonPath('meta.pagination.last_page', 3)
            ->assertJsonStructure([
                'data' => [['id', 'type', 'message', 'icon', 'color', 'instance_id', 'details', 'created_at', 'created_at_human']],
            ]);
    }

    #[Test]
    public function it_filters_by_type(): void
    {
        $user = User::factory()->create();
        $project = $this->makeProject($user);

        $this->log($project, 'task_claimed', 'inst-a');
        $this->log($project, 'task_completed', 'inst-a');
        $this->log($project, 'file_locked', 'inst-b');

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?type=task_completed");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'task_completed');
    }

    #[Test]
    public function it_filters_by_instance_id(): void
    {
        $user = User::factory()->create();
        $project = $this->makeProject($user);

        $this->log($project, 'task_claimed', 'inst-a');
        $this->log($project, 'task_claimed', 'inst-b');
        $this->log($project, 'task_claimed', 'inst-b');

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?instance_id=inst-b");

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    #[Test]
    public function it_filters_by_date_range(): void
    {
        $user = User::factory()->create();
        $project = $this->makeProject($user);

        $this->log($project, 'task_claimed', 'inst-a', '2026-01-01 00:00:00');
        $this->log($project, 'task_claimed', 'inst-a', '2026-06-01 00:00:00');
        $this->log($project, 'task_claimed', 'inst-a', '2026-12-01 00:00:00');

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?from=2026-03-01&to=2026-09-01");

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    #[Test]
    public function it_forbids_access_to_a_project_the_user_does_not_own(): void
    {
        $owner = User::factory()->create();
        $project = $this->makeProject($owner);
        $this->log($project, 'task_claimed', 'inst-a');

        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->getJson("/api/projects/{$project->id}/audit")
            ->assertForbidden();
    }

    #[Test]
    public function it_requires_authentication(): void
    {
        $user = User::factory()->create();
        $project = $this->makeProject($user);

        $this->getJson("/api/projects/{$project->id}/audit")->assertUnauthorized();
    }
}
