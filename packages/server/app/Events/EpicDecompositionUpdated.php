<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Epic;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Real-time signal for an epic's AI decomposition lifecycle.
 *
 * Dedicated to the decomposition flow (separate from the general `.epic.updated`
 * status/progress broadcast): fired on every transition of
 * `decomposition_status` — pending → running → completed | failed — so the
 * dashboard can drive the board badge, the Show.vue toasts and refresh the
 * generated sprints/tasks on completion, without a refetch.
 *
 * `action` mirrors the canonical {@see Epic} status values
 * (pending|running|completed|failed) so consumers can branch without inferring
 * the transition from the status alone.
 */
class EpicDecompositionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Epic $epic,
        public string $action,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.'.$this->epic->project_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'epic.decomposition';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'epic_id' => $this->epic->id,
            'project_id' => $this->epic->project_id,
            'action' => $this->action,
            'decomposition_status' => $this->epic->decomposition_status,
            'decomposition_error' => $this->epic->decomposition_error,
            'decomposition_completed_at' => $this->epic->decomposition_completed_at?->toIso8601String(),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
