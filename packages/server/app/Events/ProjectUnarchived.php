<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a SharedProject is unarchived (recovered) so connected clients can
 * move it back from the archived flow to the active sidebar list in real time,
 * without a manual refresh — the symmetric counterpart of ProjectArchived.
 *
 * Payload is SCALAR-ONLY (consistent with ProjectArchived / ProjectDeleted) to
 * keep the Reverb frame slim and avoid "Payload too large" failures.
 */
class ProjectUnarchived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $projectId,
        public string $machineId,
        public string $userId,
        public ?string $name = null,
    ) {}

    /**
     * Broadcast on the machine channel (the sidebar must restore the project to
     * the active flow) and on the project channel. Both channels are already
     * authorized in routes/channels.php.
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
        return 'project.unarchived';
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
            'archived' => false,
            'unarchived_at' => now()->toIso8601String(),
        ];
    }
}
