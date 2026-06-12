<?php

namespace App\Events;

use App\Models\ClaudeInstance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InstanceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ClaudeInstance $instance;

    /**
     * Create a new event instance.
     */
    public function __construct(ClaudeInstance $instance)
    {
        $this->instance = $instance;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.' . $this->instance->project_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'instance.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->instance->id,
            'status' => $this->instance->status,
            'current_task_id' => $this->instance->current_task_id,
            'session_id' => $this->instance->session_id,
        ];
    }
}
