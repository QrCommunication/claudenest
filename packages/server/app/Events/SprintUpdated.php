<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Sprint;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SprintUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Sprint $sprint;
    public string $action;

    /**
     * Create a new event instance.
     */
    public function __construct(Sprint $sprint, string $action = 'updated')
    {
        $this->sprint = $sprint;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.' . $this->sprint->project_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'sprint.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'sprint_id' => $this->sprint->id,
            'action' => $this->action,
            'name' => $this->sprint->name,
            'status' => $this->sprint->status,
            'progress_percentage' => $this->sprint->progress_percentage,
            'remaining_days' => $this->sprint->remaining_days,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
