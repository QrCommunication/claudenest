<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\ContextSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * ContextSessionService spawns a background context-generation session, but
 * must skip (never throw, never create a Session row) when there is nothing to
 * do — no usable credential, or the project is already onboarded.
 */
class ContextSessionServiceTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function launch_skips_when_owner_has_no_credential(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'summary' => '',
            'architecture' => '',
            'conventions' => '',
        ]);

        $result = app(ContextSessionService::class)->launch($project);

        $this->assertNull($result);
        $this->assertDatabaseCount('claude_sessions', 0);
    }

    #[Test]
    public function launch_skips_when_project_already_has_context(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create([
            'summary' => 'Already summarized',
            'architecture' => 'Layered',
            'conventions' => 'PSR-12',
        ]);

        $result = app(ContextSessionService::class)->launch($project);

        $this->assertNull($result);
        $this->assertDatabaseCount('claude_sessions', 0);
    }
}
