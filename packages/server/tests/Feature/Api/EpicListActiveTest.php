<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * GET /api/projects/{project}/epics defaults to the active (non-archived) set;
 * `?archived=true` returns the archived epics only.
 */
class EpicListActiveTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    private Epic $active;

    private Epic $archived;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create();

        $this->active = $this->epic('Active epic');
        $this->archived = $this->epic('Archived epic');
        $this->archived->archive();
    }

    private function epic(string $title): Epic
    {
        return Epic::create([
            'project_id' => $this->project->id,
            'title' => $title,
            'color' => Epic::DEFAULT_COLOR,
            'status' => 'open',
            'priority' => 'medium',
        ]);
    }

    /**
     * @return list<string>
     */
    private function listIds(array $query = []): array
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/projects/'.$this->project->id.'/epics?'.http_build_query($query))
            ->assertOk();

        return array_column($response->json('data'), 'id');
    }

    #[Test]
    public function it_lists_only_active_epics_by_default(): void
    {
        $ids = $this->listIds();

        $this->assertContains($this->active->id, $ids);
        $this->assertNotContains($this->archived->id, $ids);
    }

    #[Test]
    public function it_lists_only_archived_epics_when_requested(): void
    {
        $ids = $this->listIds(['archived' => 'true']);

        $this->assertContains($this->archived->id, $ids);
        $this->assertNotContains($this->active->id, $ids);
    }
}
