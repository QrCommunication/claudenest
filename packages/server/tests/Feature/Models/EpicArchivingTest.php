<?php

declare(strict_types=1);

namespace Tests\Feature\Models;

use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Epic archiving model support: archive()/unarchive() helpers, the
 * isArchived accessor and the active/archived scopes.
 */
class EpicArchivingTest extends TestCase
{
    use RefreshDatabase;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        // Self-sufficient: the archived_at column ships in a sibling migration;
        // create it here if absent so this model test validates regardless of
        // migration ordering.
        if (! Schema::hasColumn('epics', 'archived_at')) {
            Schema::table('epics', function ($table) {
                $table->timestamp('archived_at')->nullable();
            });
        }

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $this->project = SharedProject::factory()->for($user)->for($machine)->create();
    }

    private function epic(): Epic
    {
        return Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Epic',
            'color' => '#a855f7',
            'status' => 'open',
            'priority' => 'medium',
        ]);
    }

    #[Test]
    public function archive_and_unarchive_toggle_the_timestamp_and_accessor(): void
    {
        $epic = $this->epic();
        $this->assertFalse($epic->is_archived);
        $this->assertNull($epic->archived_at);

        $epic->archive();
        $epic->refresh();
        $this->assertNotNull($epic->archived_at);
        $this->assertTrue($epic->is_archived);

        $epic->unarchive();
        $epic->refresh();
        $this->assertNull($epic->archived_at);
        $this->assertFalse($epic->is_archived);
    }

    #[Test]
    public function active_and_archived_scopes_partition_the_epics(): void
    {
        $active = $this->epic();
        $archived = $this->epic();
        $archived->archive();

        $activeIds = Epic::forProject($this->project->id)->active()->pluck('id')->all();
        $archivedIds = Epic::forProject($this->project->id)->archived()->pluck('id')->all();

        $this->assertContains($active->id, $activeIds);
        $this->assertNotContains($archived->id, $activeIds);

        $this->assertContains($archived->id, $archivedIds);
        $this->assertNotContains($active->id, $archivedIds);
    }
}
