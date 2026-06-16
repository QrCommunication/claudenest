<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Events\EpicUpdated;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * POST /api/epics/{id}/archive and /unarchive toggle the epic's archive state,
 * broadcast EpicUpdated, and are guarded by the project's update policy.
 */
class EpicArchiveEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create();
    }

    private function epic(?string $archivedAt = null): Epic
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Epic',
            'color' => Epic::DEFAULT_COLOR,
            'status' => 'open',
            'priority' => 'medium',
        ]);

        if ($archivedAt !== null) {
            $epic->forceFill(['archived_at' => $archivedAt])->save();
        }

        return $epic;
    }

    #[Test]
    public function it_archives_an_epic_and_broadcasts(): void
    {
        Event::fake([EpicUpdated::class]);
        $epic = $this->epic();

        $this->actingAs($this->user)
            ->postJson("/api/epics/{$epic->id}/archive")
            ->assertOk()
            ->assertJsonPath('data.is_archived', true);

        $this->assertNotNull($epic->refresh()->archived_at);
        Event::assertDispatched(
            EpicUpdated::class,
            fn (EpicUpdated $e) => $e->epic->id === $epic->id && $e->action === 'archived',
        );
    }

    #[Test]
    public function it_unarchives_an_epic_and_broadcasts(): void
    {
        Event::fake([EpicUpdated::class]);
        $epic = $this->epic(archivedAt: (string) now());

        $this->actingAs($this->user)
            ->postJson("/api/epics/{$epic->id}/unarchive")
            ->assertOk()
            ->assertJsonPath('data.is_archived', false);

        $this->assertNull($epic->refresh()->archived_at);
        Event::assertDispatched(
            EpicUpdated::class,
            fn (EpicUpdated $e) => $e->epic->id === $epic->id && $e->action === 'unarchived',
        );
    }

    #[Test]
    public function it_forbids_archiving_an_epic_of_another_users_project(): void
    {
        $epic = $this->epic();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->postJson("/api/epics/{$epic->id}/archive")
            ->assertForbidden();

        $this->assertNull($epic->refresh()->archived_at);
    }

    #[Test]
    public function it_forbids_unarchiving_an_epic_of_another_users_project(): void
    {
        // unarchive runs its own authorize() on a distinct code path — guard it
        // independently of archive so a regression on either is caught.
        $epic = $this->epic(archivedAt: (string) now());
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->postJson("/api/epics/{$epic->id}/unarchive")
            ->assertForbidden();

        // Still archived — the forbidden caller changed nothing.
        $this->assertNotNull($epic->refresh()->archived_at);
    }

    #[Test]
    public function it_returns_404_when_archiving_an_unknown_epic(): void
    {
        // findOrFail must surface as a clean 404, never a 500.
        $this->actingAs($this->user)
            ->postJson('/api/epics/'.\Illuminate\Support\Str::uuid().'/archive')
            ->assertNotFound();
    }
}
