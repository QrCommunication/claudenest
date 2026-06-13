<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a SharedProject is archived so connected clients can move it from
 * the active sidebar list to the archived flow in real time, without a manual
 * refresh — the symmetric counterpart of ProjectDeleted for the reversible
 * archive lifecycle (the project row still exists; it is NOT deleted).
 *
 * Payload is SCALAR-ONLY (consistent with ProjectDeleted): it keeps the Reverb
 * frame slim and avoids "Payload too large" failures a serialized model graph
 * would trigger. Capture the identifiers from the project before/at archive.
 */
class ProjectArchived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $projectId,
        public string $machineId,
        public string $userId,
        public ?string $name = null,
        public ?string $archivedAt = null,
    ) {}

    /**
     * Broadcast on the machine channel (the sidebar/list groups projects per
     * machine, so it must drop the project from the active flow) and on the
     * project channel (an open tab/workspace can react). Both channels are
     * already authorized in routes/channels.php.
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
        return 'project.archived';
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
            'archived' => true,
            'archived_at' => $this->archivedAt ?? now()->toIso8601String(),
        ];
    }
}
