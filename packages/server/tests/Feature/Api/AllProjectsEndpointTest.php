<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * GET /api/projects — the cross-machine "all projects" view: every active
 * project the authenticated user owns across all their machines, isolated from
 * other users; ?archived=true returns the archived set only.
 */
class AllProjectsEndpointTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    private function project(User $owner, ?string $archivedAt = null): SharedProject
    {
        $machine = Machine::factory()->for($owner)->create();
        $project = SharedProject::factory()->for($owner)->for($machine)->create();

        if ($archivedAt !== null) {
            $project->forceFill(['archived_at' => $archivedAt])->save();
        }

        return $project;
    }

    /**
     * @return list<string>
     */
    private function listIds(array $query = []): array
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/projects?'.http_build_query($query))
            ->assertOk();

        return array_column($response->json('data'), 'id');
    }

    #[Test]
    public function it_lists_active_projects_across_machines_isolated_per_user(): void
    {
        // Two active projects on two different machines of the same user.
        $a = $this->project($this->user);
        $b = $this->project($this->user);
        // An archived project (hidden by default) and another user's project.
        $archived = $this->project($this->user, archivedAt: (string) now());
        $other = $this->project(User::factory()->create());

        $ids = $this->listIds();

        $this->assertContains($a->id, $ids);
        $this->assertContains($b->id, $ids);
        $this->assertNotContains($archived->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    #[Test]
    public function it_lists_archived_projects_when_requested(): void
    {
        $active = $this->project($this->user);
        $archived = $this->project($this->user, archivedAt: (string) now());

        $ids = $this->listIds(['archived' => 'true']);

        $this->assertContains($archived->id, $ids);
        $this->assertNotContains($active->id, $ids);
    }

    #[Test]
    public function it_requires_authentication(): void
    {
        $this->getJson('/api/projects')->assertUnauthorized();
    }
}
