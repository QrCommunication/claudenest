<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\ActivityLog;
use App\Models\SharedProject;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature coverage for the public audit trail (AuditController@index → GET
 * /api/projects/{id}/audit).
 *
 * The audit trail is a first-class, free-unlimited feature: ANY authenticated
 * user with access to the project (the `view` policy = ownership) can read it,
 * with NO role/plan gating. This suite pins:
 *   1. access control (owner 200, intruder 403, missing 404, guest 401);
 *   2. pagination (default 25, per_page honoured + bounds, descending order);
 *   3. filters (type, instance_id, from inclusive, to exclusive);
 *   4. the AuditResource shape (derived message/icon/color, ISO + human dates).
 */
class AuditTrailTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Persist an activity_log row with a controlled created_at.
     *
     * ActivityLog has $timestamps = false and created_at is not fillable, so we
     * assign it directly; the model still backfills the UUID via its booted()
     * hook. Types are constrained by the chk_activity_log_type CHECK, so only
     * ActivityLog::TYPES values are used.
     */
    private function logEntry(
        SharedProject $project,
        string $type = 'task_claimed',
        array $details = [],
        ?string $instanceId = 'instance-1',
        ?CarbonInterface $createdAt = null,
    ): ActivityLog {
        $log = new ActivityLog([
            'project_id' => $project->id,
            'instance_id' => $instanceId,
            'type' => $type,
            'details' => $details,
        ]);

        if ($createdAt !== null) {
            $log->created_at = $createdAt;
        }

        $log->save();

        return $log;
    }

    // ==================== ACCESS CONTROL ====================

    #[Test]
    public function the_project_owner_can_read_the_audit_trail(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $this->logEntry($project, 'task_claimed', ['task_title' => 'Build API']);
        $this->logEntry($project, 'file_locked', ['path' => 'src/auth.ts']);

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'type', 'message', 'icon', 'color', 'instance_id', 'details', 'created_at', 'created_at_human'],
                ],
                'meta' => [
                    'timestamp',
                    'request_id',
                    'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                ],
            ]);
    }

    #[Test]
    public function the_audit_trail_has_no_plan_or_role_gating(): void
    {
        // Whatever the user's plan, the owner reads their own project's audit
        // trail. The free-unlimited model has no paid tier to gate on; this
        // asserts a community-plan owner is granted access (no 402/403).
        $user = User::factory()->create(['plan' => 'community']);
        $project = SharedProject::factory()->for($user)->create();
        $this->logEntry($project, 'broadcast', ['message' => 'hello team']);

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    #[Test]
    public function a_non_owner_cannot_read_the_audit_trail(): void
    {
        $owner = User::factory()->create();
        $project = SharedProject::factory()->for($owner)->create();
        $this->logEntry($project);

        $intruder = User::factory()->create();

        $this->actingAs($intruder)
            ->getJson("/api/projects/{$project->id}/audit")
            ->assertStatus(403);
    }

    #[Test]
    public function reading_a_missing_projects_audit_trail_returns_404(): void
    {
        $user = User::factory()->create();
        $missingId = (string) Str::uuid();

        $this->actingAs($user)
            ->getJson("/api/projects/{$missingId}/audit")
            ->assertStatus(404);
    }

    #[Test]
    public function an_unauthenticated_user_cannot_read_the_audit_trail(): void
    {
        $project = SharedProject::factory()->create();

        $this->getJson("/api/projects/{$project->id}/audit")
            ->assertStatus(401);
    }

    #[Test]
    public function the_audit_trail_is_scoped_to_its_own_project(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();
        $other = SharedProject::factory()->for($user)->create();

        $this->logEntry($project, 'task_claimed', ['task_title' => 'Mine']);
        $this->logEntry($other, 'task_claimed', ['task_title' => 'Not mine']);

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.message', "Task 'Mine' claimed");
    }

    // ==================== RESOURCE SHAPE ====================

    #[Test]
    public function each_entry_exposes_its_derived_message_icon_and_color(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();
        $this->logEntry($project, 'task_completed', ['task_title' => 'Ship it'], 'worker-7');

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit")
            ->assertOk()
            ->assertJsonPath('data.0.type', 'task_completed')
            ->assertJsonPath('data.0.message', "Task 'Ship it' completed")
            ->assertJsonPath('data.0.icon', '✅')
            ->assertJsonPath('data.0.color', '#22c55e')
            ->assertJsonPath('data.0.instance_id', 'worker-7')
            ->assertJsonPath('data.0.details.task_title', 'Ship it');
    }

    // ==================== ORDERING & PAGINATION ====================

    #[Test]
    public function entries_are_returned_newest_first(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $this->logEntry($project, 'task_claimed', ['task_title' => 'Oldest'], 'i', now()->subDays(2));
        $this->logEntry($project, 'task_claimed', ['task_title' => 'Newest'], 'i', now());
        $this->logEntry($project, 'task_claimed', ['task_title' => 'Middle'], 'i', now()->subDay());

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit")
            ->assertOk()
            ->assertJsonPath('data.0.message', "Task 'Newest' claimed")
            ->assertJsonPath('data.1.message', "Task 'Middle' claimed")
            ->assertJsonPath('data.2.message', "Task 'Oldest' claimed");
    }

    #[Test]
    public function per_page_controls_the_page_size_and_reports_pagination(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        for ($i = 0; $i < 7; $i++) {
            $this->logEntry($project, 'task_claimed', ['task_title' => "Task {$i}"], 'i', now()->subMinutes($i));
        }

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?per_page=3")
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.pagination.per_page', 3)
            ->assertJsonPath('meta.pagination.total', 7)
            ->assertJsonPath('meta.pagination.last_page', 3)
            ->assertJsonPath('meta.pagination.current_page', 1);
    }

    #[Test]
    public function the_default_page_size_is_25(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        for ($i = 0; $i < 30; $i++) {
            $this->logEntry($project, 'task_claimed', ['task_title' => "Task {$i}"], 'i', now()->subMinutes($i));
        }

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit")
            ->assertOk()
            ->assertJsonCount(25, 'data')
            ->assertJsonPath('meta.pagination.per_page', 25)
            ->assertJsonPath('meta.pagination.total', 30);
    }

    #[Test]
    public function per_page_above_the_max_is_rejected(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?per_page=500")
            ->assertStatus(422);
    }

    // ==================== FILTERS ====================

    #[Test]
    public function entries_can_be_filtered_by_type(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $this->logEntry($project, 'task_claimed', ['task_title' => 'A']);
        $this->logEntry($project, 'file_locked', ['path' => 'src/a.ts']);
        $this->logEntry($project, 'file_locked', ['path' => 'src/b.ts']);

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?type=file_locked")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.type', 'file_locked')
            ->assertJsonPath('data.1.type', 'file_locked');
    }

    #[Test]
    public function entries_can_be_filtered_by_instance_id(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $this->logEntry($project, 'task_claimed', ['task_title' => 'A'], 'worker-1');
        $this->logEntry($project, 'task_claimed', ['task_title' => 'B'], 'worker-2');
        $this->logEntry($project, 'task_completed', ['task_title' => 'A'], 'worker-1');

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?instance_id=worker-1")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.instance_id', 'worker-1')
            ->assertJsonPath('data.1.instance_id', 'worker-1');
    }

    #[Test]
    public function the_from_filter_is_inclusive(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $cutoff = Carbon::parse('2026-06-10 12:00:00');

        $this->logEntry($project, 'task_claimed', ['task_title' => 'Before'], 'i', $cutoff->copy()->subHour());
        $this->logEntry($project, 'task_claimed', ['task_title' => 'On cutoff'], 'i', $cutoff->copy());
        $this->logEntry($project, 'task_claimed', ['task_title' => 'After'], 'i', $cutoff->copy()->addHour());

        // urlencode the ISO8601 string: its "+00:00" offset would otherwise be
        // decoded as a space by the query parser → an invalid date → 422.
        $from = urlencode($cutoff->toIso8601String());

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?from={$from}")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // since() is >= so the on-cutoff entry is included; "Before" is excluded.
        $messages = collect($response->json('data'))->pluck('message')->all();
        $this->assertContains("Task 'On cutoff' claimed", $messages);
        $this->assertContains("Task 'After' claimed", $messages);
        $this->assertNotContains("Task 'Before' claimed", $messages);
    }

    #[Test]
    public function the_to_filter_is_exclusive(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $cutoff = Carbon::parse('2026-06-10 12:00:00');

        $this->logEntry($project, 'task_claimed', ['task_title' => 'Before'], 'i', $cutoff->copy()->subHour());
        $this->logEntry($project, 'task_claimed', ['task_title' => 'On cutoff'], 'i', $cutoff->copy());
        $this->logEntry($project, 'task_claimed', ['task_title' => 'After'], 'i', $cutoff->copy()->addHour());

        $to = urlencode($cutoff->toIso8601String());

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?to={$to}")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // before() is strictly < so only the "Before" entry remains.
        $this->assertSame("Task 'Before' claimed", $response->json('data.0.message'));
    }

    #[Test]
    public function the_from_and_to_filters_combine_into_a_window(): void
    {
        $user = User::factory()->create();
        $project = SharedProject::factory()->for($user)->create();

        $this->logEntry($project, 'task_claimed', ['task_title' => 'Day 1'], 'i', Carbon::parse('2026-06-01 09:00:00'));
        $this->logEntry($project, 'task_claimed', ['task_title' => 'Day 5'], 'i', Carbon::parse('2026-06-05 09:00:00'));
        $this->logEntry($project, 'task_claimed', ['task_title' => 'Day 9'], 'i', Carbon::parse('2026-06-09 09:00:00'));

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/audit?from=2026-06-03T00:00:00%2B00:00&to=2026-06-07T00:00:00%2B00:00")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.message', "Task 'Day 5' claimed");
    }
}
