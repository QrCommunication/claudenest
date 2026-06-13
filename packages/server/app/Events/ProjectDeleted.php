<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a SharedProject is hard-deleted so connected clients can drop it
 * from the sidebar / close its open tab in real time, without a manual refresh.
 *
 * IMPORTANT: the payload is SCALAR-ONLY. The SharedProject row is already gone
 * by the time this event is (queued and) broadcast — hard delete + PostgreSQL
 * onDelete('cascade') purge every child row — so its identifiers MUST be
 * captured BEFORE delete() and passed to this constructor. A scalar payload
 * also keeps the Reverb frame slim and avoids the "Payload too large" failures
 * a serialized model graph would trigger.
 */
class ProjectDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $projectId,
        public string $machineId,
        public string $userId,
        public ?string $name = null,
    ) {}

    /**
     * Broadcast on the machine channel (the sidebar/list groups projects per
     * machine) and on the project channel (an open tab/workspace for this
     * project must close). Both channels are already authorized in
     * routes/channels.php.
     *
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('machines.' . $this->machineId),
            new PrivateChannel('projects.' . $this->projectId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'project.deleted';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->projectId,
            'machine_id' => $this->machineId,
            'name' => $this->name,
            'deleted_at' => now()->toIso8601String(),
        ];
    }
}
