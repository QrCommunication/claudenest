<?php

declare(strict_types=1);

namespace Tests\Feature\Services;

use App\Events\EpicDecompositionUpdated;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\User;
use App\Services\DecompositionSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Failure path of the epic decomposition flow: when a decomposition session
 * cannot produce/apply a plan, the linked epic must flip to `failed` (with a
 * reason) and broadcast so the dashboard reflects it. The status-guard keeps
 * the operation idempotent and prevents clobbering a successful (`ready`) run.
 */
class DecompositionEpicFailureTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Machine $machine;

    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->machine = Machine::factory()->for($this->user)->create(['status' => 'online']);
        $this->project = SharedProject::factory()->for($this->user)->for($this->machine)->create();
    }

    private function service(): DecompositionSessionService
    {
        return app(DecompositionSessionService::class);
    }

    private function decomposeSession(): Session
    {
        return Session::factory()->for($this->machine)->for($this->user)->create([
            'shared_project_id' => $this->project->id,
            'status' => 'running',
            'orchestrated' => false,
        ]);
    }

    private function epicLinkedTo(Session $session, string $decompositionStatus): Epic
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Decomposed epic',
            'color' => '#a855f7',
            'status' => 'open',
            'priority' => 'medium',
        ]);
        $epic->decomposition_session_id = $session->id;
        $epic->decomposition_status = $decompositionStatus;
        $epic->save();

        return $epic;
    }

    #[Test]
    public function it_marks_a_running_epic_failed_and_broadcasts(): void
    {
        Event::fake([EpicDecompositionUpdated::class]);

        $session = $this->decomposeSession();
        $epic = $this->epicLinkedTo($session, 'running');

        $returned = $this->service()->failEpicForSession($session, 'Master plan validation failed: empty wave.');

        $this->assertNotNull($returned);
        $epic->refresh();
        $this->assertSame('failed', $epic->decomposition_status);
        $this->assertStringContainsString('validation failed', (string) $epic->decomposition_error);

        Event::assertDispatched(
            EpicDecompositionUpdated::class,
            fn (EpicDecompositionUpdated $e) => $e->epic->id === $epic->id && $e->action === 'failed',
        );
    }

    #[Test]
    public function it_does_not_clobber_a_completed_epic(): void
    {
        Event::fake([EpicDecompositionUpdated::class]);

        $session = $this->decomposeSession();
        $epic = $this->epicLinkedTo($session, 'completed');

        $returned = $this->service()->failEpicForSession($session, 'too late');

        $this->assertNull($returned);
        $this->assertSame('completed', $epic->refresh()->decomposition_status);
        Event::assertNotDispatched(EpicDecompositionUpdated::class);
    }

    #[Test]
    public function it_is_a_no_op_for_a_null_or_unlinked_session(): void
    {
        Event::fake([EpicDecompositionUpdated::class]);

        // Null session.
        $this->assertNull($this->service()->failEpicForSession(null, 'nope'));

        // A session not linked to any epic.
        $orphan = $this->decomposeSession();
        $this->assertNull($this->service()->failEpicForSession($orphan, 'nope'));

        Event::assertNotDispatched(EpicDecompositionUpdated::class);
    }
}
