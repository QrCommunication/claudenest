<?php

namespace App\Events;

use App\Models\FileLock;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FileLocked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public FileLock $lock;

    /**
     * Create a new event instance.
     */
    public function __construct(FileLock $lock)
    {
        $this->lock = $lock;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.' . $this->lock->project_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'file.locked';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'lock_id' => $this->lock->id,
            'project_id' => $this->lock->project_id,
            'path' => $this->lock->path,
            'locked_by' => $this->lock->locked_by,
            'reason' => $this->lock->reason,
            'expires_at' => $this->lock->expires_at->toIso8601String(),
        ];
    }
}
