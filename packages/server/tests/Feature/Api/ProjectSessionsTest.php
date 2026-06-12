<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectSessionsTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function user_can_list_sessions_of_their_project(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        Session::factory()->count(2)->create([
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'shared_project_id' => $project->id,
        ]);

        // Session on another project of the same user — must be excluded.
        $otherProject = SharedProject::factory()->for($user)->for($machine)->create();
        Session::factory()->create([
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'shared_project_id' => $otherProject->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/sessions");

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'machine_id', 'shared_project_id', 'status', 'orchestrated', 'is_running'],
                ],
                'meta',
            ]);

        foreach ($response->json('data') as $session) {
            $this->assertSame($project->id, $session['shared_project_id']);
        }
    }

    #[Test]
    public function sessions_can_be_filtered_by_status_csv(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create();

        $running = Session::factory()->create([
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'shared_project_id' => $project->id,
            'status' => 'running',
        ]);
        Session::factory()->completed()->create([
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'shared_project_id' => $project->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}/sessions?status=running,waiting_input");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $running->id)
            ->assertJsonPath('data.0.status', 'running');
    }

    #[Test]
    public function user_cannot_list_sessions_of_other_users_project(): void
    {
        $user = User::factory()->create();
        $otherProject = SharedProject::factory()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/projects/{$otherProject->id}/sessions");

        $response->assertStatus(403);
    }
}
