<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Events\EpicUpdated;
use App\Events\SprintCompleted;
use App\Events\SprintUpdated;
use App\Models\Epic;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use App\Services\AgentGateway;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Real-time broadcast contracts for the planning/orchestration events.
 *
 * Each task/sprint/epic mutation must dispatch exactly one broadcast event on
 * the project's private channel (`private-projects.{id}`) carrying a purely
 * scalar payload (no Eloquent models — see each event's broadcastWith()), so the
 * SPA/mobile stores can apply it without a refetch.
 *
 * The controllers emit via `broadcast(new X)->toOthers()`; the helper builds a
 * PendingBroadcast that dispatches through the (faked here) event dispatcher on
 * destruct, so Event::fake() captures them exactly like a plain ::dispatch().
 *
 * Note on SprintCompleted: the event class exists and is ShouldBroadcast, but no
 * HTTP action currently dispatches it — sprint completion broadcasts
 * SprintUpdated('completed') instead. We therefore assert the real action
 * (SprintUpdated) AND guard SprintCompleted's broadcast contract as a unit so it
 * stays correct if/when it gets wired up.
 */
class PlanningBroadcastTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private SharedProject $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create();
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create();

        // Neutralise the agent side-effects of sprint completion (auto-PR /
        // coordinator dispatch) so the broadcast is exercised in isolation.
        $this->spy(AgentGateway::class);
    }

    #[Test]
    public function claiming_a_task_broadcasts_task_claimed_once_on_the_project_channel(): void
    {
        $task = SharedTask::factory()->for($this->project, 'project')->create(['status' => 'pending']);

        Event::fake([\App\Events\TaskClaimed::class]);

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/claim", ['instance_id' => 'instance-abc123'])
            ->assertOk();

        Event::assertDispatchedTimes(\App\Events\TaskClaimed::class, 1);
        Event::assertDispatched(
            \App\Events\TaskClaimed::class,
            function (\App\Events\TaskClaimed $event) use ($task): bool {
                $this->assertSame($task->id, $event->task->id);
                $this->assertSame('task.claimed', $event->broadcastAs());
                $this->assertBroadcastsOnProjectChannel($event);
                $this->assertScalarPayload($event->broadcastWith());

                return true;
            },
        );
    }

    #[Test]
    public function completing_a_task_broadcasts_task_completed_once_on_the_project_channel(): void
    {
        // No epic_id → isolate the TaskCompleted broadcast from the epic cascade.
        $task = SharedTask::factory()->for($this->project, 'project')->claimed()->create([
            'epic_id' => null,
        ]);

        Event::fake([\App\Events\TaskCompleted::class]);

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/complete", [
                'summary' => 'Done the thing.',
                'files_modified' => ['app/Foo.php'],
                'instance_id' => 'instance-abc123',
            ])
            ->assertOk();

        Event::assertDispatchedTimes(\App\Events\TaskCompleted::class, 1);
        Event::assertDispatched(
            \App\Events\TaskCompleted::class,
            function (\App\Events\TaskCompleted $event) use ($task): bool {
                $this->assertSame($task->id, $event->task->id);
                $this->assertSame('task.completed', $event->broadcastAs());
                $this->assertBroadcastsOnProjectChannel($event);
                $this->assertScalarPayload($event->broadcastWith());

                return true;
            },
        );
    }

    #[Test]
    public function completing_a_sprint_broadcasts_sprint_updated_completed_once_on_the_project_channel(): void
    {
        // An active sprint with no epic-linked tasks → isolate the sprint
        // broadcast from the epic completion cascade.
        $sprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 1',
            'status' => 'active',
            'sort_order' => 0,
        ]);

        Event::fake([SprintUpdated::class, EpicUpdated::class]);

        $this->actingAs($this->user)
            ->postJson("/api/sprints/{$sprint->id}/complete")
            ->assertOk();

        // The real "sprint completed" broadcast is SprintUpdated('completed').
        Event::assertDispatchedTimes(SprintUpdated::class, 1);
        Event::assertDispatched(
            SprintUpdated::class,
            function (SprintUpdated $event) use ($sprint): bool {
                $this->assertSame($sprint->id, $event->sprint->id);
                $this->assertSame('completed', $event->action);
                $this->assertSame('sprint.updated', $event->broadcastAs());
                $this->assertBroadcastsOnProjectChannel($event);
                $this->assertScalarPayload($event->broadcastWith());

                return true;
            },
        );

        // No epic-linked work → no epic cascade broadcast.
        Event::assertNotDispatched(EpicUpdated::class);
    }

    #[Test]
    public function updating_an_epic_broadcasts_epic_updated_once_on_the_project_channel(): void
    {
        $epic = Epic::create([
            'project_id' => $this->project->id,
            'title' => 'Auth epic',
            'color' => '#a855f7',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        Event::fake([EpicUpdated::class]);

        $this->actingAs($this->user)
            ->patchJson("/api/epics/{$epic->id}", ['status' => 'in_progress'])
            ->assertOk();

        Event::assertDispatchedTimes(EpicUpdated::class, 1);
        Event::assertDispatched(
            EpicUpdated::class,
            function (EpicUpdated $event) use ($epic): bool {
                $this->assertSame($epic->id, $event->epic->id);
                $this->assertSame('updated', $event->action);
                $this->assertSame('epic.updated', $event->broadcastAs());
                $this->assertBroadcastsOnProjectChannel($event);
                $this->assertScalarPayload($event->broadcastWith());

                return true;
            },
        );
    }

    #[Test]
    public function sprint_completed_event_broadcast_contract_is_scalar_on_the_project_channel(): void
    {
        // SprintCompleted is a defined ShouldBroadcast event but is NOT wired to
        // any HTTP action today (sprint completion uses SprintUpdated('completed')
        // — see the test above). This guards its broadcast contract directly so
        // the channel + scalar payload hold the day it is dispatched for real.
        $sprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 1',
            'status' => 'completed',
            'sort_order' => 0,
        ]);

        $event = new SprintCompleted($sprint);

        $this->assertSame('sprint.completed', $event->broadcastAs());
        $this->assertBroadcastsOnProjectChannel($event);
        $this->assertScalarPayload($event->broadcastWith());
    }

    /**
     * Assert the event broadcasts on exactly the project's private channel.
     */
    private function assertBroadcastsOnProjectChannel(object $event): void
    {
        $channels = $event->broadcastOn();

        $this->assertCount(1, $channels, 'Event must broadcast on a single channel.');
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertSame('private-projects.' . $this->project->id, $channels[0]->name);
    }

    /**
     * Assert every leaf of the broadcast payload is a scalar (or null) — never an
     * Eloquent model or other object, which would not survive JSON broadcasting.
     */
    private function assertScalarPayload(array $payload): void
    {
        $this->assertNotEmpty($payload, 'Broadcast payload must not be empty.');

        array_walk_recursive($payload, function ($value, $key): void {
            $this->assertTrue(
                $value === null || is_scalar($value),
                "Broadcast payload key [{$key}] must be scalar/null, got " . get_debug_type($value),
            );
        });
    }
}
