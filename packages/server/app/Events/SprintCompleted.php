<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Sprint;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SprintCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Sprint $sprint;

    /**
     * Create a new event instance.
     */
    public function __construct(Sprint $sprint)
    {
        $this->sprint = $sprint;
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
        return 'sprint.completed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'sprint_id' => $this->sprint->id,
            'name' => $this->sprint->name,
            'velocity' => $this->sprint->velocity,
            'completed_story_points' => $this->sprint->completed_story_points,
            'total_story_points' => $this->sprint->total_story_points,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
